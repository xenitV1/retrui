import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

// Force dynamic rendering - required for POST handlers in Vercel
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
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

    // Validate URL format
    try {
      const parsedUrl = new URL(url)
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json(
          { error: 'Only HTTP and HTTPS URLs are allowed' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
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

