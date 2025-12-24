import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { RSS_FEEDS } from '@/lib/rss-feeds'
import Parser from 'rss-parser'

const parser = new Parser()

export const dynamic = 'force-dynamic'

/**
 * Delay helper for rate limiting
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Process feeds in batches with rate limiting
 */
async function processFeedsInBatches(
    feeds: typeof RSS_FEEDS,
    batchSize: number = 5,
    delayBetweenBatches: number = 2000
) {
    let syncedCount = 0
    let errorCount = 0
    const results: Array<{ success: boolean; feed: string; count?: number; error?: unknown }> = []

    // Split feeds into batches
    for (let i = 0; i < feeds.length; i += batchSize) {
        const batch = feeds.slice(i, i + batchSize)
        console.log(`[Sync] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(feeds.length / batchSize)}`)

        // Process batch in parallel
        const batchPromises = batch.map(async (feedConfig) => {
            try {
                const feed = await parser.parseURL(feedConfig.url)
                let feedSyncCount = 0

                for (const item of feed.items) {
                    if (!item.link || !item.title) continue

                    const slug = generateSlug(item.title || 'news', item.link)

                    await prisma.news.upsert({
                        where: { url: item.link },
                        update: {
                            title: item.title,
                            slug: slug,
                            description: item.contentSnippet || item.content?.substring(0, 200) || null,
                            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                        },
                        create: {
                            title: item.title,
                            slug: slug,
                            url: item.link,
                            description: item.contentSnippet || item.content?.substring(0, 200) || null,
                            content: item.content || null,
                            source: feedConfig.name,
                            category: feedConfig.category,
                            subcategory: feedConfig.subcategory || null,
                            language: feedConfig.language || 'en',
                            region: feedConfig.region || null,
                            author: item.creator || item.author || null,
                            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                        }
                    })
                    feedSyncCount++
                }

                return { success: true, feed: feedConfig.name, count: feedSyncCount }
            } catch (err) {
                console.error(`[Sync] Error syncing feed ${feedConfig.name}:`, err)
                return { success: false, feed: feedConfig.name, error: err }
            }
        })

        const batchResults = await Promise.all(batchPromises)

        // Count results
        batchResults.forEach(result => {
            if (result.success) {
                syncedCount += result.count || 0
            } else {
                errorCount++
            }
            results.push(result)
        })

        // Rate limiting: wait between batches (except for the last batch)
        if (i + batchSize < feeds.length) {
            console.log(`[Sync] Waiting ${delayBetweenBatches}ms before next batch...`)
            await delay(delayBetweenBatches)
        }
    }

    return { syncedCount, errorCount, results }
}

export async function GET(request: Request) {
    // Basic security check for CRON job
    const authHeader = request.headers.get('Authorization')
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    // Optional security check (Supports both URL param and Vercel's Bearer token)
    if (process.env.CRON_SECRET) {
        const isAuthorized = token === process.env.CRON_SECRET ||
            authHeader === `Bearer ${process.env.CRON_SECRET}`

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    try {
        console.log('[Sync] Starting news synchronization...')
        const startTime = Date.now()

        // 1. Clean up old news (older than 5 days)
        const fiveDaysAgo = new Date()
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

        const deletedCount = await prisma.news.deleteMany({
            where: {
                createdAt: {
                    lt: fiveDaysAgo
                }
            }
        })
        console.log(`[Sync] Cleaned up ${deletedCount.count} old news items.`)

        // 2. Determine which feeds to sync based on rotation
        // Instead of syncing all feeds at once, we rotate through them
        const batchParam = searchParams.get('batch') // e.g., ?batch=0, ?batch=1, etc.
        const batchIndex = batchParam ? parseInt(batchParam) : 0
        const FEEDS_PER_RUN = 30 // Sync 30 feeds per cron run (optimized for single cron job)

        const startIndex = (batchIndex * FEEDS_PER_RUN) % RSS_FEEDS.length
        const endIndex = Math.min(startIndex + FEEDS_PER_RUN, RSS_FEEDS.length)

        let feedsToSync = RSS_FEEDS.slice(startIndex, endIndex)

        // If we wrapped around, get remaining feeds from the start
        if (feedsToSync.length < FEEDS_PER_RUN && endIndex < RSS_FEEDS.length) {
            const remaining = FEEDS_PER_RUN - feedsToSync.length
            feedsToSync = [...feedsToSync, ...RSS_FEEDS.slice(0, remaining)]
        }

        console.log(`[Sync] Syncing feeds ${startIndex}-${startIndex + feedsToSync.length} of ${RSS_FEEDS.length}`)

        // 3. Process feeds in batches with rate limiting
        const { syncedCount, errorCount, results } = await processFeedsInBatches(
            feedsToSync,
            5, // 5 feeds per batch
            2000 // 2 second delay between batches
        )

        const duration = Date.now() - startTime

        return NextResponse.json({
            success: true,
            syncedCount,
            deletedOldCount: deletedCount.count,
            errorCount,
            feedsProcessed: feedsToSync.length,
            batchIndex,
            duration: `${(duration / 1000).toFixed(2)}s`,
            message: 'Synchronization completed successfully'
        })

    } catch (error) {
        console.error('[Sync] Fatal error:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

function generateSlug(title: string, url: string): string {
    const base = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')

    // Use a simple hash of the URL to ensure same item always gets same slug
    let hash = 0
    for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash) + url.charCodeAt(i)
        hash |= 0 // Convert to 32bit integer
    }
    const hashStr = Math.abs(hash).toString(36).substring(0, 5)
    return `${base}-${hashStr}`
}

