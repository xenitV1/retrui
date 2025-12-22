import { extract } from '@extractus/article-extractor'

export interface ExtractedContent {
  title: string
  text: string
  html: string
  author?: string
  publishedTime?: string
  url: string
}

/**
 * Clean up extracted text - remove excessive whitespace and format properly
 */
function cleanText(text: string): string {
  return text
    // Replace multiple newlines with double newline (paragraph break)
    .replace(/\n{3,}/g, '\n\n')
    // Replace multiple spaces with single space
    .replace(/[ \t]+/g, ' ')
    // Clean up lines that only have whitespace
    .replace(/^\s+$/gm, '')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final cleanup of multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Extract article content using @extractus/article-extractor
 * This library provides intelligent content extraction similar to Mozilla Readability
 */
export async function extractContent(url: string): Promise<ExtractedContent> {
  try {
    // Validate URL
    new URL(url)

    // Extract article using the smart extractor
    const article = await extract(url)

    if (!article) {
      console.error('Article extraction returned null')
      return {
        title: 'Unable to extract content',
        text: 'Could not extract article content. Please visit the original page.',
        html: '',
        url
      }
    }

    // Clean up the content text
    const cleanedText = article.content
      ? cleanText(article.content.replace(/<[^>]*>/g, ' ')) // Strip HTML tags and clean
      : ''

    return {
      title: article.title || 'Untitled',
      text: cleanedText,
      html: article.content || '',
      author: article.author || undefined,
      publishedTime: article.published || undefined,
      url: article.url || url
    }
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
