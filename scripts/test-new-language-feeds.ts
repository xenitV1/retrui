/**
 * Test RSS feeds for new languages (de, fr, es, zh, hi)
 * Run: npx tsx scripts/test-new-language-feeds.ts
 */

import Parser from 'rss-parser'

const NEW_LANGUAGE_FEEDS = [
    // German (de)
    { name: 'Tagesschau', url: 'https://www.tagesschau.de/xml/rss2/', language: 'de', category: 'News' },
    { name: 'Spiegel International', url: 'https://www.spiegel.de/international/index.rss', language: 'de', category: 'News' },
    { name: 'Zeit Online', url: 'https://newsfeed.zeit.de/index', language: 'de', category: 'News' },
    { name: 'Heise Online', url: 'https://www.heise.de/rss/heise.rdf', language: 'de', category: 'Technology' },
    { name: 'Focus Online', url: 'https://rss.focus.de/fol/XML/rss_folnews.xml', language: 'de', category: 'News' },
    { name: 'DW German', url: 'https://rss.dw.com/rdf/rss-de-all', language: 'de', category: 'News' },

    // French (fr)
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', language: 'fr', category: 'News' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_flash.xml', language: 'fr', category: 'News' },
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', language: 'fr', category: 'News' },
    { name: 'Liberation', url: 'https://www.liberation.fr/arc/outboundfeeds/rss/', language: 'fr', category: 'News' },
    { name: '20 Minutes FR', url: 'https://www.20minutes.fr/feeds/rss-une.xml', language: 'fr', category: 'News' },
    { name: 'DW French', url: 'https://rss.dw.com/rdf/rss-fr-all', language: 'fr', category: 'News' },

    // Spanish (es)
    { name: 'El Pais', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', language: 'es', category: 'News' },
    { name: 'El Mundo', url: 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml', language: 'es', category: 'News' },
    { name: 'ABC Spain', url: 'https://www.abc.es/rss/2.0/portada/', language: 'es', category: 'News' },
    { name: 'La Vanguardia', url: 'https://www.lavanguardia.com/rss/home.xml', language: 'es', category: 'News' },
    { name: '20 Minutos ES', url: 'https://www.20minutos.es/rss/', language: 'es', category: 'News' },
    { name: 'DW Spanish', url: 'https://rss.dw.com/rdf/rss-es-all', language: 'es', category: 'News' },

    // Chinese (zh)
    { name: 'BBC Chinese', url: 'http://www.bbc.co.uk/zhongwen/simp/index.xml', language: 'zh', category: 'News' },
    { name: 'DW Chinese', url: 'https://rss.dw.com/rdf/rss-chi-all', language: 'zh', category: 'News' },
    { name: 'China News Scroll', url: 'https://www.chinanews.com.cn/rss/scroll-news.xml', language: 'zh', category: 'News' },
    { name: 'China News Headlines', url: 'https://www.chinanews.com.cn/rss/importnews.xml', language: 'zh', category: 'News' },
    { name: 'Sina News', url: 'http://rss.sina.com.cn/news/marquee/ddt.xml', language: 'zh', category: 'News' },

    // Hindi (hi)
    { name: 'BBC Hindi', url: 'https://feeds.bbci.co.uk/hindi/rss.xml', language: 'hi', category: 'News' },
    { name: 'DW Hindi', url: 'https://rss.dw.com/rdf/rss-hin-all', language: 'hi', category: 'News' },
    { name: 'NDTV Hindi', url: 'https://feeds.feedburner.com/ndtvkhabar', language: 'hi', category: 'News' },
    { name: 'Aaj Tak', url: 'https://www.aajtak.in/rss/tech.xml', language: 'hi', category: 'Technology' },
    { name: 'Dainik Bhaskar Tech', url: 'https://www.bhaskar.com/rss-v1--category-1740.xml', language: 'hi', category: 'Technology' },
]

interface TestResult {
    name: string
    url: string
    language: string
    category: string
    works: boolean
    itemCount?: number
    error?: string
    responseTime?: number
}

async function testFeed(feed: typeof NEW_LANGUAGE_FEEDS[0]): Promise<TestResult> {
    const startTime = Date.now()

    try {
        const parser = new Parser({
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
        })

        const result = await parser.parseURL(feed.url)
        const responseTime = Date.now() - startTime

        console.log(`✅ ${feed.name} (${feed.language}) - ${result.items?.length || 0} items, ${responseTime}ms`)

        return {
            ...feed,
            works: true,
            itemCount: result.items?.length || 0,
            responseTime
        }
    } catch (error) {
        const responseTime = Date.now() - startTime
        const errMsg = error instanceof Error ? error.message : String(error)

        console.log(`❌ ${feed.name} (${feed.language}) - ${errMsg.substring(0, 50)}...`)

        return {
            ...feed,
            works: false,
            error: errMsg,
            responseTime
        }
    }
}

async function main() {
    console.log(`\n🔍 Testing ${NEW_LANGUAGE_FEEDS.length} new language RSS feeds...\n`)

    const results: TestResult[] = []

    // Test in batches of 3
    for (let i = 0; i < NEW_LANGUAGE_FEEDS.length; i += 3) {
        const batch = NEW_LANGUAGE_FEEDS.slice(i, i + 3)
        const batchResults = await Promise.all(batch.map(testFeed))
        results.push(...batchResults)

        if (i + 3 < NEW_LANGUAGE_FEEDS.length) {
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    // Summary by language
    const languages = ['de', 'fr', 'es', 'zh', 'hi']

    console.log(`\n${'='.repeat(60)}`)
    console.log(`📊 RESULTS BY LANGUAGE:`)
    console.log(`${'='.repeat(60)}`)

    for (const lang of languages) {
        const langResults = results.filter(r => r.language === lang)
        const working = langResults.filter(r => r.works)
        console.log(`  ${lang.toUpperCase()}: ${working.length}/${langResults.length} working`)
    }

    const workingFeeds = results.filter(r => r.works)
    const failedFeeds = results.filter(r => !r.works)

    console.log(`\n  TOTAL: ${workingFeeds.length}/${results.length} working (${((workingFeeds.length / results.length) * 100).toFixed(1)}%)`)
    console.log(`${'='.repeat(60)}\n`)

    // Output working feeds as TypeScript
    console.log(`\n📝 Working feeds (copy to rss-feeds.ts):\n`)

    for (const lang of languages) {
        const langWorking = workingFeeds.filter(r => r.language === lang)
        if (langWorking.length > 0) {
            console.log(`// ${lang.toUpperCase()} feeds`)
            langWorking.forEach(f => {
                console.log(`  { name: '${f.name}', url: '${f.url}', category: '${f.category}', language: '${f.language}' },`)
            })
            console.log('')
        }
    }

    // Show failed feeds
    if (failedFeeds.length > 0) {
        console.log(`\n❌ Failed feeds:`)
        failedFeeds.forEach(f => {
            console.log(`  - ${f.name}: ${f.error?.substring(0, 60)}`)
        })
    }
}

main().catch(console.error)
