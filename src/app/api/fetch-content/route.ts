import { NextRequest, NextResponse } from 'next/server'
import { extractContent } from '@/lib/content-extractor'

// Force dynamic rendering - required for POST handlers in Vercel
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Extract content using advanced extractor (Mozilla Readability with fallback)
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
    })

  } catch (error: any) {
    console.error('Error fetching page content:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch page content'
      },
      { status: 500 }
    )
  }
}
