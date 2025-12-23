import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { getCorsHeaders, validateUrlSecurity } from '@/lib/api-security'

// Force dynamic rendering - required for POST handlers in Vercel
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Create parser with timeout and custom headers
const parser = new Parser({
  customFields: {
    item: ['creator', 'author']
  },
  timeout: 45000, // 45 second timeout - increased for slow feeds
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  }
})

/**
 * Fetch RSS feed with retry logic
 */
async function fetchWithRetry(url: string, maxRetries = 2): Promise<any> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await parser.parseURL(url)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on certain errors
      const errorMsg = lastError.message.toLowerCase()
      if (errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('invalid url')) {
        throw lastError
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  throw lastError
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'RSS feed URL is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Security validation using shared module
    const validation = validateUrlSecurity(url)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error?.includes('internal') ? 403 : 400, headers: corsHeaders }
      )
    }

    // Fetch RSS feed server-side with retry logic (no CORS issues)
    const feed = await fetchWithRetry(url)

    return NextResponse.json({
      success: true,
      data: feed
    }, { headers: corsHeaders })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch RSS feed'
    console.error('Error fetching RSS feed:', error)

    // Return appropriate status code based on error type
    let statusCode = 500
    const errorMsg = errorMessage.toLowerCase()

    if (errorMsg.includes('timeout') || errorMsg.includes('etimedout')) {
      statusCode = 504 // Gateway Timeout
    } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
      statusCode = 404
    } else if (errorMsg.includes('invalid') || errorMsg.includes('xml')) {
      statusCode = 400 // Bad Request for invalid feeds
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: statusCode, headers: corsHeaders }
    )
  }
}
