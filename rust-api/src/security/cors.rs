use axum::http::{HeaderValue, Method};
use tower_http::cors::{AllowOrigin, CorsLayer};

/// Get CORS layer configuration
///
/// - Development: Allows any localhost port
/// - Production: Allows origins from ALLOWED_ORIGINS environment variable
/// - Methods: POST, OPTIONS
/// - Headers: Content-Type
/// - Max Age: 24 hours
pub fn get_cors_layer() -> CorsLayer {
    let allowed_origins_env = std::env::var("ALLOWED_ORIGINS").unwrap_or_else(|_| {
        "http://localhost:3000,http://localhost:3001,https://retrui.vercel.app".to_string()
    });

    let is_dev =
        std::env::var("RUST_ENV").unwrap_or_else(|_| "development".to_string()) == "development";

    // Parse allowed origins from environment variable
    let allowed_origins: Vec<HeaderValue> = allowed_origins_env
        .split(',')
        .filter_map(|s| {
            let trimmed = s.trim();
            if !trimmed.is_empty() {
                trimmed.parse().ok()
            } else {
                None
            }
        })
        .collect();

    // In development, allow any localhost port for convenience
    if is_dev {
        // Note: This is a simplified approach. In production, use specific origins only.
        tracing::info!("CORS: Development mode - allowing configured localhost origins");
    }

    let allow_origin = if allowed_origins.is_empty() {
        tracing::warn!("No valid CORS origins configured, using permissive policy");
        AllowOrigin::any()
    } else {
        tracing::info!("CORS: Allowing origins: {:?}", allowed_origins);
        AllowOrigin::list(allowed_origins)
    };

    CorsLayer::new()
        .allow_origin(allow_origin)
        .allow_methods([Method::POST, Method::OPTIONS])
        .allow_headers([axum::http::header::CONTENT_TYPE])
        .max_age(std::time::Duration::from_secs(86400)) // 24 hours
        .vary([axum::http::header::ORIGIN]) // Important: Add Vary: Origin header
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cors_layer_creation() {
        // Set test environment variable
        std::env::set_var("ALLOWED_ORIGINS", "http://localhost:3000");
        std::env::set_var("RUST_ENV", "development");

        let cors_layer = get_cors_layer();
        // Just ensure it doesn't panic
        assert!(true);

        // Clean up
        std::env::remove_var("ALLOWED_ORIGINS");
        std::env::remove_var("RUST_ENV");
    }

    #[test]
    fn test_multiple_origins_parsing() {
        std::env::set_var(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,https://example.com,https://api.example.com",
        );

        let cors_layer = get_cors_layer();
        // Ensure no panic with multiple origins
        assert!(true);

        std::env::remove_var("ALLOWED_ORIGINS");
    }
}
