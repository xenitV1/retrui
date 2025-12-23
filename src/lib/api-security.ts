/**
 * Shared API security utilities
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://retrui.vercel.app',
    ]

/**
 * Get CORS headers based on request origin
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  }

  // For development, allow any localhost port
  const isDev = process.env.NODE_ENV === 'development'
  const isLocalhost = origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || origin.startsWith('http://[::1]:'))

  // Set allowed origin if it matches whitelist or is localhost in dev
  if (origin && (isLocalhost || ALLOWED_ORIGINS.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Vary'] = 'Origin'
  }

  return headers
}

/**
 * SSRF Protection - Block private/internal IP ranges and cloud metadata endpoints
 */
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^fd/i,
]

// Cloud metadata endpoints - CRITICAL to block
const CLOUD_METADATA_HOSTS = [
  'metadata.google.internal',
  '169.254.169.254',
  'metadata.azure.com',
]

// Blocked internal service ports
const BLOCKED_PORTS = [
  '22',    // SSH
  '23',    // Telnet
  '25',    // SMTP
  '53',    // DNS
  '135',   // Windows RPC
  '137',   // NetBIOS
  '138',   // NetBIOS
  '139',   // NetBIOS
  '445',   // SMB
  '3306',  // MySQL
  '3389',  // RDP
  '5432',  // PostgreSQL
  '6379',  // Redis
  '27017', // MongoDB
  '27018', // MongoDB
]

/**
 * Check if hostname is blocked (SSRF protection)
 */
export function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()

  // Check cloud metadata endpoints first (critical)
  if (CLOUD_METADATA_HOSTS.some(host => lower === host)) {
    return true
  }

  // Check IP patterns
  if (BLOCKED_PATTERNS.some(pattern => pattern.test(lower))) {
    return true
  }

  return false
}

/**
 * Check if port is blocked
 */
export function isBlockedPort(port: string): boolean {
  return BLOCKED_PORTS.includes(port)
}

/**
 * Validate URL for security
 */
export function validateUrlSecurity(urlString: string): {
  valid: boolean
  error?: string
  parsedUrl?: URL
} {
  let parsedUrl: URL

  // Parse URL
  try {
    parsedUrl = new URL(urlString)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  // Protocol check
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' }
  }

  // SSRF protection
  if (isBlockedHost(parsedUrl.hostname)) {
    return { valid: false, error: 'Access to internal resources is not allowed' }
  }

  // Port blocking
  if (parsedUrl.port && isBlockedPort(parsedUrl.port)) {
    return { valid: false, error: 'Access to this port is not allowed' }
  }

  return { valid: true, parsedUrl }
}
