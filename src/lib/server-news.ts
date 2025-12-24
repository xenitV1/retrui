/**
 * Server-Side News Fetching for SEO
 * 
 * This module fetches news from Rust API on the server side
 * to ensure Google can crawl and index the content.
 * 
 * Features:
 * - Fetches from Rust backend API
 * - Returns 20-30 news items for initial render
 * - Uses ISR (Incremental Static Regeneration) for caching
 * - Fallback to empty array on error (graceful degradation)
 */

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

// Top feeds for SEO - these will be fetched via Rust API
const TOP_FEEDS: Array<{ name: string; url: string; category: string }> = [
    // Technology
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Technology' },
    { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'Technology' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'Technology' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Technology' },

    // News
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'News' },
    { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'News' },
    { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', category: 'News' },

    // Business
    { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'Business' },
    { name: 'Forbes', url: 'https://www.forbes.com/business/feed/', category: 'Business' },
]

// Rust API URL (internal during build, or localhost for dev)
const RUST_API_URL = process.env.RUST_API_URL || 'http://localhost:8080'

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
 * Fetch a single RSS feed via Rust API
 */
async function fetchSingleFeed(feed: { name: string; url: string; category: string }): Promise<ServerNewsItem[]> {
    try {
        const response = await fetch(`${RUST_API_URL}/api/fetch-rss`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: feed.url }),
            // 15 second timeout for server-side fetching
            signal: AbortSignal.timeout(15000),
        })

        if (!response.ok) {
            console.error(`[Server] Rust API error for ${feed.name}: ${response.status}`)
            return []
        }

        const result = await response.json()

        if (!result.success || !result.data?.items) {
            return []
        }

        // Get items from last 24 hours only
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)

        return result.data.items
            .slice(0, 5) // Max 5 items per feed for server-side
            .map((item: {
                title?: string
                content_snippet?: string
                content?: string
                creator?: string
                author?: string
                pub_date?: string
                link?: string
            }) => ({
                id: generateId(),
                title: item.title || 'Untitled',
                description: cleanDescription(item.content_snippet || item.content || ''),
                content: cleanDescription(item.content || item.content_snippet || ''),
                author: (item.creator || item.author || feed.name) as string,
                publishedAt: item.pub_date || new Date().toISOString(),
                source: feed.name,
                category: feed.category,
                url: item.link || '#'
            }))
            .filter((item: ServerNewsItem) => {
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

/**
 * Fetch initial news for server-side rendering
 * Uses Rust API for all feed fetching
 * 
 * @param _locale - Current locale (unused, kept for API compatibility)
 * @returns Array of news items for initial render
 */
export async function fetchInitialNews(_locale: Locale): Promise<ServerNewsItem[]> {
    try {
        // Fetch all feeds in parallel via Rust API
        const results = await Promise.all(
            TOP_FEEDS.map(feed => fetchSingleFeed(feed))
        )

        // Flatten and sort by date (newest first)
        const allNews = results
            .flat()
            .sort((a, b) =>
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            )

        // Return top 25 news items for initial render
        return allNews.slice(0, 25)
    } catch (error) {
        console.error('[Server] Failed to fetch initial news:', error)
        // Return empty array on error - client will fetch fresh data
        return []
    }
}

/**
 * Revalidate interval for ISR (in seconds)
 * News should be refreshed every 5 minutes
 */
export const NEWS_REVALIDATE_INTERVAL = 300 // 5 minutes
