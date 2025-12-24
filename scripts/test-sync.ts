import prisma from '../src/lib/prisma'
import { RSS_FEEDS } from '../src/lib/rss-feeds'
import Parser from 'rss-parser'

const parser = new Parser()

async function testSync() {
    console.log('--- Starting Sync Test ---')

    const feedConfig = RSS_FEEDS.find(f => f.name === 'TechCrunch')
    if (!feedConfig) {
        console.error('Feed not found')
        return
    }

    try {
        console.log(`Fetching ${feedConfig.name}...`)
        const feed = await parser.parseURL(feedConfig.url)

        console.log(`Found ${feed.items.length} items. Syncing first 3...`)

        for (const item of feed.items.slice(0, 3)) {
            if (!item.link || !item.title) continue

            const slug = `${item.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')}-${Math.random().toString(36).substring(2, 7)}`

            const result = await prisma.news.upsert({
                where: { url: item.link },
                update: { title: item.title },
                create: {
                    title: item.title,
                    slug: slug,
                    url: item.link,
                    description: item.contentSnippet || null,
                    source: feedConfig.name,
                    category: feedConfig.category,
                    language: feedConfig.language || 'en',
                    region: feedConfig.region || null,
                    publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                }
            })
            console.log(`Synced: ${result.title} (Slug: ${result.slug})`)
        }

        const count = await prisma.news.count()
        console.log(`Total news in DB: ${count}`)

    } catch (err) {
        console.error('Test failed:', err)
    } finally {
        await prisma.$disconnect()
    }
}

testSync()
