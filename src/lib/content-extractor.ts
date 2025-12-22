import * as cheerio from 'cheerio'
import { htmlToText } from 'html-to-text'

export interface ExtractedContent {
  title: string
  text: string
  html: string
  author?: string
  publishedTime?: string
  url: string
}

/**
 * Fetch page HTML with proper headers
 */
async function fetchPageHTML(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000) // 25 second timeout

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Extract content using Cheerio (serverless-compatible)
 */
function extractWithCheerio(html: string, url: string): ExtractedContent | null {
  try {
    const $ = cheerio.load(html)

    // Remove unwanted elements
    const elementsToRemove = [
      'script', 'style', 'noscript',
      'nav', 'aside', 'footer', 'header',
      'iframe', 'video', 'audio',
      '.ad', '.ads', '.advertisement', '.sponsored',
      '.sidebar', '.related', '.comments', '.comment',
      '.social', '.share', '.newsletter',
      '[class*="ad-"]', '[id*="ad-"]',
      '[class*="advertisement"]', '[id*="advertisement"]',
      '.cookie', '.cookie-banner', '.popup',
      'nav[class*="menu"]', 'nav[class*="navigation"]',
      '.related-posts', '.recommended'
    ]

    elementsToRemove.forEach(selector => {
      try {
        $(selector).remove()
      } catch {
        // Ignore invalid selectors
      }
    })

    // Try to find main content area
    let mainContent = $('article').first()
    if (!mainContent.length) mainContent = $('main').first()
    if (!mainContent.length) mainContent = $('.content').first()
    if (!mainContent.length) mainContent = $('.article').first()
    if (!mainContent.length) mainContent = $('[role="main"]').first()
    if (!mainContent.length) mainContent = $('body')

    if (!mainContent.length) {
      return null
    }

    // Extract title
    const title = $('h1').first().text().trim() ||
      $('title').text().trim() ||
      'Untitled'

    // Extract author
    const author = $('[rel="author"]').first().text().trim() ||
      $('.author').first().text().trim() ||
      $('.byline').first().text().trim() ||
      undefined

    // Extract published time
    const publishedTime = $('time').attr('datetime') ||
      $('[property="article:published_time"]').attr('content') ||
      undefined

    // Get the main content HTML
    const contentHtml = mainContent.html() || ''

    // Convert to clean text using html-to-text
    const text = htmlToText(contentHtml, {
      wordwrap: false,
      preserveNewlines: true,
      selectors: [
        {
          selector: 'h1,h2,h3,h4,h5,h6',
          format: 'block',
          options: { uppercase: false }
        },
        {
          selector: 'p',
          format: 'block'
        },
        {
          selector: 'a',
          options: { ignoreHref: true }
        },
        {
          selector: 'img',
          format: 'skip'
        }
      ]
    })

    // Clean HTML
    const cleanHTML = contentHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')

    return {
      title,
      text: text.trim(),
      html: cleanHTML,
      author,
      publishedTime,
      url
    }
  } catch (error) {
    console.error('Cheerio extraction failed:', error)
    return null
  }
}

/**
 * Main extraction function
 */
export async function extractContent(url: string): Promise<ExtractedContent> {
  try {
    // Validate URL
    new URL(url)

    // Fetch HTML
    const html = await fetchPageHTML(url)

    // Extract content with Cheerio
    const result = extractWithCheerio(html, url)

    // If extraction fails, return minimal result
    if (!result) {
      console.error('Content extraction failed')
      return {
        title: 'Unable to extract content',
        text: 'Could not extract article content. Please visit the original page.',
        html: '',
        url
      }
    }

    return result
  } catch (error) {
    console.error('Content extraction error:', error)
    return {
      title: 'Error',
      text: `Failed to fetch content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      html: '',
      url
    }
  }
}
