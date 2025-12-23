import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter for Vercel Edge
const rateLimit = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
  requests: 20,        // requests per window
  windowMs: 60000,     // 1 minute window
}

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

/**
 * Rate limiter middleware
 */
export function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const ip = getClientIp(request)
  const now = Date.now()

  const limit = rateLimit.get(ip)

  // No previous record or window expired
  if (!limit || now > limit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs })
    return NextResponse.next()
  }

  // Rate limit exceeded
  if (limit.count >= RATE_LIMIT.requests) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil((limit.resetTime - now) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((limit.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT.requests),
          'X-RateLimit-Window': String(RATE_LIMIT.windowMs),
        },
      }
    )
  }

  // Increment counter
  limit.count++
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
