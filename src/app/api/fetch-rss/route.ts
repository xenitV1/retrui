import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

// Force dynamic rendering - required for POST handlers in Vercel
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Security: Block private/internal IP ranges to prevent SSRF attacks
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^fd/i,
]

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(hostname))
}

const parser = new Parser({
  customFields: {
    item: ['creator', 'author']
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'RSS feed URL is required' },
        { status: 400 }
      )
    }

    // Security: Validate URL format and protocol
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Security: Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are allowed' },
        { status: 400 }
      )
    }

    // Security: Block internal/private IP addresses (SSRF protection)
    if (isBlockedHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'Access to internal resources is not allowed' },
        { status: 403 }
      )
    }

    // Security: Block requests to common internal ports
    const blockedPorts = ['22', '23', '25', '3306', '5432', '6379', '27017']
    if (parsedUrl.port && blockedPorts.includes(parsedUrl.port)) {
      return NextResponse.json(
        { error: 'Access to this port is not allowed' },
        { status: 403 }
      )
    }

    // Fetch RSS feed server-side (no CORS issues)
    const feed = await parser.parseURL(url)

    return NextResponse.json({
      success: true,
      data: feed
    })

  } catch (error: any) {
    console.error('Error fetching RSS feed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch RSS feed'
      },
      { status: 500 }
    )
  }
}

