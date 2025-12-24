use crate::models::errors::ApiError;
use ipnet::IpNet;
use std::net::IpAddr;
use url::Url;

/// Blocked hostnames for SSRF protection
const BLOCKED_HOSTS: &[&str] = &[
    "localhost",
    "metadata.google.internal",
    "169.254.169.254",
    "metadata.azure.com",
];

/// Blocked ports for internal services
const BLOCKED_PORTS: &[u16] = &[
    22,    // SSH
    23,    // Telnet
    25,    // SMTP
    53,    // DNS
    135,   // Windows RPC
    137,   // NetBIOS
    138,   // NetBIOS
    139,   // NetBIOS
    445,   // SMB
    3306,  // MySQL
    3389,  // RDP
    5432,  // PostgreSQL
    6379,  // Redis
    27017, // MongoDB
    27018, // MongoDB
];

lazy_static::lazy_static! {
    /// Private IP ranges that must be blocked
    static ref PRIVATE_IP_RANGES: Vec<IpNet> = vec![
        "127.0.0.0/8".parse().unwrap(),    // Loopback
        "0.0.0.0/8".parse().unwrap(),      // Current network
        "10.0.0.0/8".parse().unwrap(),     // Private Class A
        "172.16.0.0/12".parse().unwrap(),  // Private Class B
        "192.168.0.0/16".parse().unwrap(), // Private Class C
        "169.254.0.0/16".parse().unwrap(), // Link-local
        "::1/128".parse().unwrap(),        // IPv6 loopback
        "fc00::/7".parse().unwrap(),       // IPv6 unique local
        "fe80::/10".parse().unwrap(),      // IPv6 link-local
    ];
}

/// Check if hostname is blocked (case-insensitive)
fn is_blocked_host(hostname: &str) -> bool {
    let lower = hostname.to_lowercase();
    BLOCKED_HOSTS
        .iter()
        .any(|&blocked| lower.eq_ignore_ascii_case(blocked))
}

/// Check if IP address is in private ranges
fn is_private_ip(ip: &IpAddr) -> bool {
    PRIVATE_IP_RANGES.iter().any(|range| range.contains(ip))
}

/// Check if port is blocked
fn is_blocked_port(port: u16) -> bool {
    BLOCKED_PORTS.contains(&port)
}

/// Validate URL for security (SSRF protection)
///
/// This function checks:
/// - Valid URL format
/// - Protocol (only http/https allowed)
/// - Blocked hostnames (cloud metadata endpoints)
/// - Private IP addresses
/// - Blocked ports
pub fn validate_url(url_str: &str) -> Result<Url, ApiError> {
    // Parse URL
    let url = Url::parse(url_str).map_err(|_| ApiError::InvalidUrl)?;

    // Protocol check - only HTTP/HTTPS allowed
    if !["http", "https"].contains(&url.scheme()) {
        return Err(ApiError::InvalidUrl);
    }

    // Check blocked hostnames (critical for cloud metadata protection)
    if let Some(host) = url.host_str() {
        if is_blocked_host(host) {
            tracing::warn!("Blocked SSRF attempt: hostname {}", host);
            return Err(ApiError::SsrfBlocked);
        }
    }

    // Check for IP addresses in private ranges
    if let Some(host) = url.host() {
        let ip_addr = match host {
            url::Host::Ipv4(ipv4) => Some(IpAddr::V4(ipv4)),
            url::Host::Ipv6(ipv6) => Some(IpAddr::V6(ipv6)),
            url::Host::Domain(_) => None,
        };

        if let Some(ip) = ip_addr {
            if is_private_ip(&ip) {
                tracing::warn!("Blocked SSRF attempt: private IP {}", ip);
                return Err(ApiError::SsrfBlocked);
            }
        }
    }

    // Port blocking
    if let Some(port) = url.port() {
        if is_blocked_port(port) {
            tracing::warn!("Blocked SSRF attempt: port {}", port);
            return Err(ApiError::SsrfBlocked);
        }
    }

    Ok(url)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blocks_localhost() {
        assert!(validate_url("http://localhost/test").is_err());
        assert!(validate_url("http://LOCALHOST/test").is_err());
    }

    #[test]
    fn test_blocks_private_ipv4() {
        assert!(validate_url("http://127.0.0.1/").is_err());
        assert!(validate_url("http://192.168.1.1/").is_err());
        assert!(validate_url("http://10.0.0.1/").is_err());
        assert!(validate_url("http://172.16.0.1/").is_err());
        assert!(validate_url("http://169.254.169.254/").is_err());
    }

    #[test]
    fn test_blocks_cloud_metadata() {
        assert!(validate_url("http://metadata.google.internal/").is_err());
        assert!(validate_url("http://metadata.azure.com/").is_err());
    }

    #[test]
    fn test_blocks_dangerous_ports() {
        assert!(validate_url("http://example.com:22/").is_err());
        assert!(validate_url("http://example.com:3306/").is_err());
        assert!(validate_url("http://example.com:6379/").is_err());
    }

    #[test]
    fn test_allows_public_urls() {
        assert!(validate_url("https://example.com").is_ok());
        assert!(validate_url("http://google.com/feed").is_ok());
        assert!(validate_url("https://api.github.com/").is_ok());
    }

    #[test]
    fn test_blocks_invalid_protocols() {
        assert!(validate_url("file:///etc/passwd").is_err());
        assert!(validate_url("ftp://example.com/").is_err());
        assert!(validate_url("javascript:alert(1)").is_err());
    }

    #[test]
    fn test_blocks_ipv6_localhost() {
        assert!(validate_url("http://[::1]/").is_err());
    }

    #[test]
    fn test_blocks_ipv6_private() {
        assert!(validate_url("http://[fc00::1]/").is_err());
        assert!(validate_url("http://[fe80::1]/").is_err());
    }
}
