import { NextRequest, NextResponse } from 'next/server'
import { extractContent } from '@/lib/content-extractor'
import { getCorsHeaders, validateUrlSecurity } from '@/lib/api-security'

// Force dynamic rendering - required for POST handlers in Vercel
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

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
        { error: 'URL is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Security validation using shared module (includes SSRF + cloud metadata protection)
    const validation = validateUrlSecurity(url)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error?.includes('internal') ? 403 : 400, headers: corsHeaders }
      )
    }

    // Extract content using advanced extractor
    const result = await extractContent(url)

    // Calculate approximate character count as token usage estimate
    const characterCount = result.text.length
    const tokensUsed = Math.ceil(characterCount / 4) // Rough estimate: 4 chars per token

    return NextResponse.json({
      success: true,
      data: {
        title: result.title,
        url: result.url,
        html: result.html,
        text: result.text,
        publishedTime: result.publishedTime || null,
        author: result.author || null,
        tokensUsed
      }
    }, { headers: corsHeaders })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch page content'
    console.error('Error fetching page content:', error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
