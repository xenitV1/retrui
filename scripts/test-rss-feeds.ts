import Parser from 'rss-parser'
import fs from 'fs/promises'
import path from 'path'

// User agents to try (different parameters as requested)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Googlebot/2.1 (+http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; RSS-Reader/1.0; +https://example.com/rss-reader)',
  'FeedBurner/1.0 (http://www.FeedBurner.com)',
  'curl/7.68.0',
]

// Different timeout values to try
const TIMEOUTS = [10000, 20000, 30000]

interface TestResult {
  name: string
  url: string
  category: string
  works: boolean
  method?: string
  userAgent?: string
  error?: string
  itemCount?: number
  responseTime?: number
}

async function testFeedWithParser(url: string, userAgent?: string, timeout?: number): Promise<{ success: boolean; items?: any[]; error?: string; responseTime?: number }> {
  const startTime = Date.now()

  try {
    const parser = new Parser({
      timeout: timeout || 15000,
      headers: userAgent ? { 'User-Agent': userAgent } : undefined,
    })

    const feed = await parser.parseURL(url)
    const responseTime = Date.now() - startTime

    return {
      success: true,
      items: feed.items || [],
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      responseTime,
    }
  }
}

async function testFeedWithFetch(url: string, userAgent?: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent || 'Mozilla/5.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        responseTime: Date.now() - startTime,
      }
    }

    const text = await response.text()
    if (text.includes('<rss') || text.includes('<feed') || text.includes('<entry')) {
      return {
        success: true,
        responseTime: Date.now() - startTime,
      }
    }

    return {
      success: false,
      error: 'Invalid RSS format',
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      responseTime,
    }
  }
}

async function testFeed(feed: any): Promise<TestResult> {
  process.stdout.write(`\r  Testing: ${feed.name}...`)

  // Try different User-Agents with parser
  for (const userAgent of USER_AGENTS) {
    const result = await testFeedWithParser(feed.url, userAgent, 20000)
    if (result.success) {
      console.log(`\r  ✓ ${feed.name} (${result.responseTime}ms, ${result.items?.length} items) [${userAgent.substring(0, 20)}...]`)
      return {
        name: feed.name,
        url: feed.url,
        category: feed.category,
        works: true,
        method: 'rss-parser',
        userAgent: userAgent,
        itemCount: result.items?.length,
        responseTime: result.responseTime,
      }
    }
  }

  // Try with fetch as fallback
  const fetchResult = await testFeedWithFetch(feed.url, USER_AGENTS[0])
  if (fetchResult.success) {
    console.log(`\r  ✓ ${feed.name} (fetch, ${fetchResult.responseTime}ms)`)
    return {
      name: feed.name,
      url: feed.url,
      category: feed.category,
      works: true,
      method: 'fetch',
      userAgent: USER_AGENTS[0],
      responseTime: fetchResult.responseTime,
    }
  }

  const errMsg = fetchResult.error || 'Unknown error'
  const shortErr = errMsg.length > 50 ? errMsg.substring(0, 47) + '...' : errMsg
  console.log(`\r  ✗ ${feed.name} - ${shortErr}`)
  return {
    name: feed.name,
    url: feed.url,
    category: feed.category,
    works: false,
    error: fetchResult.error,
  }
}

async function main() {
  // Import RSS feeds
  const { RSS_FEEDS } = await import('../src/lib/rss-feeds.js')

  console.log(`\n🔍 Testing ${RSS_FEEDS.length} RSS feeds...\n`)
  console.log(`  Trying ${USER_AGENTS.length} different User-Agents per feed`)
  console.log(`  Batch size: 5, with 1s delay between batches\n`)

  const results: TestResult[] = []

  // Test feeds in batches to avoid overwhelming servers
  const BATCH_SIZE = 5
  for (let i = 0; i < RSS_FEEDS.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(RSS_FEEDS.length / BATCH_SIZE)
    console.log(`\n[Batch ${batchNum}/${totalBatches}]`)

    const batch = RSS_FEEDS.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(batch.map(testFeed))
    results.push(...batchResults)

    // Small delay between batches
    if (i + BATCH_SIZE < RSS_FEEDS.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Separate working and non-working feeds
  const workingFeeds = results.filter(r => r.works)
  const failedFeeds = results.filter(r => !r.works)

  // Calculate stats
  const avgResponseTime = workingFeeds.length > 0
    ? Math.round(workingFeeds.reduce((sum, r) => sum + (r.responseTime || 0), 0) / workingFeeds.length)
    : 0

  console.log(`\n\n${'='.repeat(60)}`)
  console.log(`📊 RESULTS:`)
  console.log(`${'='.repeat(60)}`)
  console.log(`  ✅ Working:  ${workingFeeds.length}`)
  console.log(`  ❌ Failed:   ${failedFeeds.length}`)
  console.log(`  📈 Success Rate: ${((workingFeeds.length / results.length) * 100).toFixed(1)}%`)
  console.log(`  ⏱️  Avg Response: ${avgResponseTime}ms`)
  console.log(`${'='.repeat(60)}\n`)

  // Save detailed results
  await fs.mkdir('scripts/results', { recursive: true })

  await fs.writeFile(
    'scripts/results/test-results.json',
    JSON.stringify(results, null, 2)
  )

  await fs.writeFile(
    'scripts/results/working-feeds.json',
    JSON.stringify(workingFeeds, null, 2)
  )

  await fs.writeFile(
    'scripts/results/failed-feeds.json',
    JSON.stringify(failedFeeds, null, 2)
  )

  // Generate working RSS_FEEDS array
  const workingFeedList = RSS_FEEDS.filter(feed =>
    workingFeeds.some(w => w.url === feed.url)
  )

  // Generate TypeScript file with working feeds
  const workingFeedsContent = `/**
 * WORKING RSS FEEDS
 * Auto-generated by scripts/test-rss-feeds.ts
 * Generated: ${new Date().toISOString()}
 *
 * Total: ${workingFeeds.length} working feeds out of ${RSS_FEEDS.length} tested
 * Success Rate: ${((workingFeeds.length / RSS_FEEDS.length) * 100).toFixed(1)}%
 */

export interface RssFeed {
  name: string
  url: string
  category: string
  subcategory?: string
  region?: string
  language?: string
}

export const WORKING_RSS_FEEDS: RssFeed[] = ${JSON.stringify(workingFeedList, null, 2)}

export const FAILED_FEED_URLS = ${JSON.stringify(failedFeeds.map(f => ({ url: f.url, error: f.error })), null, 2)}
`

  await fs.writeFile(
    'src/lib/working-rss-feeds.ts',
    workingFeedsContent
  )

  console.log(`📁 Generated files:`)
  console.log(`  - scripts/results/test-results.json (all results)`)
  console.log(`  - scripts/results/working-feeds.json (working only)`)
  console.log(`  - scripts/results/failed-feeds.json (failed only)`)
  console.log(`  - src/lib/working-rss-feeds.ts (TypeScript exports)\n`)

  // Show some failed feeds summary
  if (failedFeeds.length > 0) {
    console.log(`❌ Sample of failed feeds (first 10):`)
    failedFeeds.slice(0, 10).forEach(f => {
      const err = f.error || 'Unknown error'
      console.log(`  - ${f.name}: ${err.substring(0, 60)}${err.length > 60 ? '...' : ''}`)
    })
    if (failedFeeds.length > 10) {
      console.log(`  ... and ${failedFeeds.length - 10} more (see failed-feeds.json for details)`)
    }
  }

  console.log(`\n✨ Done! Run 'npm run dev' to use the working feeds.\n`)
}

main().catch(console.error)
