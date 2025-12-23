import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { getCorsHeaders, validateUrlSecurity } from '@/lib/api-security'

// Force dynamic rendering - required for POST handlers in Vercel
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Retry configuration
const MAX_RETRIES = 4
const TIMEOUTS = [15000, 30000, 45000, 60000]  // Progressive timeouts: 15s, 30s, 45s, 60s
const BASE_DELAYS = [1000, 2000, 4000]  // Base delays: 1s, 2s, 4s
const JITTER_MS = 200  // Random jitter to prevent thundering herd

/**
 * Add random jitter to delay
 */
function addJitter(baseDelay: number): number {
  const jitter = Math.random() * JITTER_MS * 2 - JITTER_MS  // ±200ms
  return Math.max(0, baseDelay + jitter)
}

/**
 * Create parser with custom timeout
 */
function createParser(timeout: number) {
  return new Parser({
    customFields: {
      item: ['creator', 'author']
    },
    timeout,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      // NOTE: Do NOT include Accept-Encoding header - rss-parser doesn't auto-decompress gzip
      // Removing it allows servers to return uncompressed XML which parses correctly
    }
  })
}


/**
 * Fetch RSS feed with retry logic and detailed error handling
 * - Progressive timeouts (15s → 30s → 45s → 60s)
 * - Exponential backoff with jitter
 * - Smart error handling (no retries for permanent failures)
 */
async function fetchWithRetry(url: string, maxRetries = MAX_RETRIES): Promise<any> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use progressive timeout based on attempt
      const timeout = TIMEOUTS[Math.min(attempt, TIMEOUTS.length - 1)]
      const parser = createParser(timeout)

      const result = await parser.parseURL(url)

      // Validate the result has required fields
      if (!result) {
        throw new Error('Empty response from RSS feed')
      }

      if (!result.items || !Array.isArray(result.items)) {
        throw new Error('Invalid RSS feed format: missing or invalid items array')
      }

      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Log detailed error for debugging (only in development or for critical errors)
      if (process.env.NODE_ENV === 'development' || attempt === maxRetries) {
        console.error(`RSS fetch error for ${url} (attempt ${attempt + 1}/${maxRetries + 1}):`, {
          message: lastError.message,
          name: lastError.name
        })
      }

      // Don't retry on certain permanent errors
      const errorMsg = lastError.message.toLowerCase()
      if (errorMsg.includes('not found') ||
        errorMsg.includes('404') ||
        errorMsg.includes('invalid url') ||
        errorMsg.includes('unsupported protocol') ||
        errorMsg.includes('enotfound')) {
        throw lastError
      }

      // Wait before retry (exponential backoff with jitter)
      if (attempt < maxRetries) {
        const baseDelay = BASE_DELAYS[Math.min(attempt, BASE_DELAYS.length - 1)]
        const delayWithJitter = addJitter(baseDelay)
        await new Promise(resolve => setTimeout(resolve, delayWithJitter))
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

  // Parse body outside try block so it's available in catch
  let body: { url: string } | null = null
  let url: string | undefined

  try {
    body = await request.json()
    url = body?.url

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

    // Detailed error logging for debugging
    console.error('Error fetching RSS feed:', {
      url: url,
      error: errorMessage,
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })

    // Return appropriate status code based on error type
    let statusCode = 500
    const errorMsg = errorMessage.toLowerCase()

    if (errorMsg.includes('timeout') || errorMsg.includes('etimedout')) {
      statusCode = 504 // Gateway Timeout
    } else if (errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('enotfound')) {
      statusCode = 404
    } else if (errorMsg.includes('invalid') || errorMsg.includes('xml') || errorMsg.includes('parse')) {
      statusCode = 422 // Unprocessable Entity for malformed feeds
    } else if (errorMsg.includes('unsupported protocol') || errorMsg.includes('invalid url')) {
      statusCode = 400 // Bad Request
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        statusCode
      },
      { status: statusCode, headers: corsHeaders }
    )
  }
}
