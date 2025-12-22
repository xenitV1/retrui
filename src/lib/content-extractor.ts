import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
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
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return await response.text()
}

/**
 * Method 1: Mozilla Readability - Extracts clean article content
 * Removes ads, sidebars, footers, comments automatically
 */
function extractWithReadability(html: string, url: string): ExtractedContent | null {
  try {
    const doc = new JSDOM(html, { url })
    const reader = new Readability(doc.window.document)
    const article = reader.parse()

    if (!article) {
      return null
    }

    return {
      title: article.title || 'Untitled',
      text: article.textContent || '',
      html: article.content || '',
      author: article.byline || undefined,
      publishedTime: article.publishedTime || undefined,
      url
    }
  } catch (error) {
    console.error('Mozilla Readability failed:', error)
    return null
  }
}

/**
 * Method 2: Fallback Parser - Simple HTML to text conversion
 * Removes scripts, styles, ads, navigation, sidebars, footers
 */
function extractWithFallback(html: string, url: string): ExtractedContent | null {
  try {
    const doc = new JSDOM(html)

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

    const document = doc.window.document

    // Remove elements by tag
    elementsToRemove.slice(0, 9).forEach(tag => {
      document.querySelectorAll(tag).forEach(el => el.remove())
    })

    // Remove elements by selector
    elementsToRemove.slice(9).forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => el.remove())
      } catch {
        // Ignore invalid selectors
      }
    })

    // Try to extract main content area
    const mainContent = document.querySelector('article') ||
                       document.querySelector('main') ||
                       document.querySelector('.content') ||
                       document.querySelector('.article') ||
                       document.querySelector('[role="main"]') ||
                       document.body

    if (!mainContent) {
      return null
    }

    // Extract title
    const title = document.querySelector('h1')?.textContent?.trim() ||
                  document.querySelector('title')?.textContent?.trim() ||
                  'Untitled'

    // Extract author
    const author = document.querySelector('[rel="author"]')?.textContent?.trim() ||
                   document.querySelector('.author')?.textContent?.trim() ||
                   document.querySelector('.byline')?.textContent?.trim() ||
                   undefined

    // Extract published time
    const publishedTime = document.querySelector('time')?.getAttribute('datetime') ||
                          document.querySelector('[property="article:published_time"]')?.getAttribute('content') ||
                          undefined

    // Convert to clean text using html-to-text
    const text = htmlToText(mainContent.innerHTML, {
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

    // Get cleaned HTML
    const cleanHTML = mainContent.innerHTML
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
    console.error('Fallback extraction failed:', error)
    return null
  }
}

/**
 * Main extraction function with multiple fallback methods
 */
export async function extractContent(url: string): Promise<ExtractedContent> {
  try {
    // Validate URL
    new URL(url)

    // Fetch HTML
    const html = await fetchPageHTML(url)

    // Try Mozilla Readability first (best results)
    let result = extractWithReadability(html, url)

    // If Readability fails, try fallback parser
    if (!result) {
      console.log('Readability failed, trying fallback parser')
      result = extractWithFallback(html, url)
    }

    // If all methods fail, return minimal result
    if (!result) {
      console.error('All extraction methods failed')
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

