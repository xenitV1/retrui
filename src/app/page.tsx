import Parser from 'rss-parser'
import { RSS_FEEDS } from '@/lib/rss-feeds'

const parser = new Parser({
  customFields: {
    item: ['creator', 'author']
  }
})

interface NewsItem {
  id: string
  title: string
  description: string
  content: string
  author: string
  publishedAt: string
  source: string
  category: string
  url: string
}

interface RSSItem {
  title?: string
  contentSnippet?: string
  content?: string
  creator?: string
  author?: string
  pubDate?: string
  link?: string
}

interface RSSFeed {
  items: RSSItem[]
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function cleanDescription(description: string): string {
  return description
    .replace(/<[^>]*>/g, '')
    .replace(/ /g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .trim()
    .substring(0, 300)
}

async function fetchRSSFeed(feed: { name: string; url: string; category: string }): Promise<NewsItem[]> {
  try {
    const feedData = await parser.parseURL(feed.url) as RSSFeed

    return (feedData.items || []).slice(0, 15).map((item) => ({
      id: generateId(),
      title: item.title || 'Untitled',
      description: cleanDescription(item.contentSnippet || item.content || ''),
      content: cleanDescription(item.content || item.contentSnippet || ''),
      author: (item.creator || item.author || feed.name) as string,
      publishedAt: item.pubDate || new Date().toISOString(),
      source: feed.name,
      category: feed.category,
      url: item.link || '#'
    }))
  } catch (error) {
    console.error(`Error fetching RSS feed from ${feed.name}:`, error)
    return []
  }
}

// Server-side fetch news
async function getServerNews(): Promise<NewsItem[]> {
  try {
    // Fetch news from all RSS feeds in parallel
    const allNewsPromises = RSS_FEEDS.map(feed => fetchRSSFeed(feed))
    const allNewsArrays = await Promise.all(allNewsPromises)
    const allNews = allNewsArrays.flat()

    // Sort by publication date (newest first)
    allNews.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    // Return up to 100 news items maximum
    return allNews.slice(0, 100)
  } catch (error) {
    console.error('Error in getServerNews:', error)
    return []
  }
}

export default async function Home() {
  // Fetch news on server side
  const initialNews = await getServerNews()
  
  // Import client component
  const NewsClient = (await import('./news-client')).default
  
  return <NewsClient initialNews={initialNews} />
}
