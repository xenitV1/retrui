/**
 * Server-Side News Fetching for SEO
 * 
 * This module fetches news from top RSS feeds on the server side
 * to ensure Google can crawl and index the content.
 * 
 * Features:
 * - Fetches from top 10 popular feeds per language
 * - Returns 20-30 news items for initial render
 * - Uses ISR (Incremental Static Regeneration) for caching
 * - Fallback to empty array on error (graceful degradation)
 */

import Parser from 'rss-parser'
import { type Locale } from '@/i18n/config'

// News item interface matching client-side structure
export interface ServerNewsItem {
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

// Top English feeds from all categories - used for SEO
// Only reliable feeds that respond quickly (tested working)
const TOP_FEEDS: Array<{ name: string; url: string; category: string }> = [
    // Technology (7 reliable feeds)
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Technology' },
    { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'Technology' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'Technology' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Technology' },
    { name: 'CNET', url: 'https://www.cnet.com/rss/news/', category: 'Technology' },
    { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', category: 'Technology' },

    // News (6 reliable feeds)
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'News' },
    { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'News' },
    { name: 'France 24 World', url: 'https://www.france24.com/en/rss', category: 'News' },
    { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/world.xml', category: 'News' },
    { name: 'Independent UK', url: 'https://www.independent.co.uk/news/world/rss', category: 'News' },
    { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', category: 'News' },

    // Business & Finance (5 reliable feeds)
    { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'Business' },
    { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'Business' },
    { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories', category: 'Business' },
    { name: 'Forbes', url: 'https://www.forbes.com/business/feed/', category: 'Business' },
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'Business' },

    // Science (3 reliable feeds)
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'Science' },
    { name: 'Phys.org', url: 'https://phys.org/rss-feed/', category: 'Science' },
    { name: 'Ars Technica Science', url: 'https://feeds.arstechnica.com/arstechnica/science', category: 'Science' },

    // Entertainment (3 reliable feeds)
    { name: 'Variety', url: 'https://variety.com/feed/', category: 'Entertainment' },
    { name: 'Rolling Stone', url: 'https://www.rollingstone.com/feed', category: 'Entertainment' },
    { name: 'Deadline', url: 'https://deadline.com/feed/', category: 'Entertainment' },
]

// Parser configuration with timeout
const parser = new Parser({
    customFields: {
        item: ['creator', 'author']
    },
    timeout: 10000, // 10 second timeout
    maxRedirects: 3,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Retrui/1.0; +https://retrui.vercel.app)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
    }
})

/**
 * Generate unique ID for news item
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clean HTML tags and entities from description
 */
function cleanDescription(description: string): string {
    return description
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
        .substring(0, 300)
}

/**
 * Fetch a single RSS feed with error handling
 */
async function fetchSingleFeed(feed: { name: string; url: string; category: string }): Promise<ServerNewsItem[]> {
    try {
        const result = await parser.parseURL(feed.url)

        if (!result || !result.items) {
            return []
        }

        // Get items from last 24 hours only
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)

        return result.items
            .slice(0, 5) // Max 5 items per feed for server-side
            .map((item) => ({
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
            .filter(item => {
                const publishedTime = new Date(item.publishedAt).getTime()
                // Include if date parsing fails (fallback)
                if (isNaN(publishedTime)) return true
                return publishedTime >= twentyFourHoursAgo
            })
    } catch (error) {
        // Silent fail for individual feeds - don't break the whole page
        console.error(`[Server] Failed to fetch ${feed.name}:`, error instanceof Error ? error.message : 'Unknown error')
        return []
    }
}

import prisma from './prisma'

// ... existing interfaces ...

/**
 * Fetch initial news for server-side rendering
 * Now pulls from DB for better SEO and performance
 */
export async function fetchInitialNews(locale: Locale): Promise<ServerNewsItem[]> {
    try {
        // 1. Try to fetch from DB first (Last 24-48 hours news)
        const newsFromDb = await prisma.news.findMany({
            where: {
                language: locale === 'tr' ? 'tr' : 'en', // Match locale
            },
            orderBy: { publishedAt: 'desc' },
            take: 30
        })

        if (newsFromDb.length > 0) {
            console.log(`[Server] Found ${newsFromDb.length} news in DB for locale ${locale}`)
            return newsFromDb.map(news => ({
                id: news.id,
                title: news.title,
                slug: news.slug, // Added slug
                description: news.description || '',
                content: news.content || '',
                author: news.author || news.source,
                publishedAt: news.publishedAt.toISOString(),
                source: news.source,
                category: news.category,
                url: news.url
            }))
        }

        // 2. Fallback to RSS if DB is empty
        console.log(`[Server] DB empty for ${locale}, falling back to RSS feeds...`)
        const feeds = TOP_FEEDS
        const results = await Promise.all(feeds.map(feed => fetchSingleFeed(feed)))
        const allNews = results
            .flat()
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

        return allNews.slice(0, 25)
    } catch (error) {
        console.error('[Server] Failed to fetch initial news:', error)
        return []
    }
}

/**
 * Revalidate interval for ISR (in seconds)
 * News should be refreshed every 5 minutes
 */
export const NEWS_REVALIDATE_INTERVAL = 300 // 5 minutes
