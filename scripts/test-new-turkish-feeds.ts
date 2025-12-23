import Parser from 'rss-parser'
import fs from 'fs/promises'

// New Turkish RSS feeds to test - from research
const NEW_TURKISH_FEEDS = [
  // Bilim (Science)
  { name: 'Evrim Ağacı', url: 'https://evrimagaci.org/rss.xml', category: 'Science', subcategory: 'Biology', region: 'TR', language: 'tr' },
  { name: 'Bilim Günlüğü', url: 'https://www.bilimgunlugu.com/feed/', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Popular Science TR', url: 'https://popsci.com.tr/feed/', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Bilimup', url: 'https://www.bilimup.com/rss.xml', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Gerçek Bilim', url: 'https://www.gercekbilim.com/feed/', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Tarihli Bilim', url: 'https://www.tarihlibilim.com/feed/', category: 'Science', subcategory: 'History', region: 'TR', language: 'tr' },

  // Teknoloji (Technology)
  { name: 'Donanım Haber', url: 'https://www.donanimhaber.com/rss/tum/', category: 'Technology', subcategory: 'Hardware', region: 'TR', language: 'tr' },
  { name: 'Technopat', url: 'https://www.technopat.net/feed/', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Teknolojioku', url: 'https://www.teknolojioku.com/export/rss', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Beetekno', url: 'https://www.beetekno.com/feed/posts', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Log.com.tr', url: 'https://www.log.com.tr/feed/', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sordum', url: 'https://www.sordum.net/feed/', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'PC Hocası', url: 'https://pchocasi.com.tr/feed/', category: 'Technology', subcategory: 'Hardware', region: 'TR', language: 'tr' },
  { name: 'Tam İndir', url: 'https://feeds.feedburner.com/tamindir/stream', category: 'Technology', subcategory: 'Downloads', region: 'TR', language: 'tr' },
  { name: 'Webrazzi', url: 'https://webrazzi.com/feed/', category: 'Technology', subcategory: 'Web', region: 'TR', language: 'tr' },
  { name: 'Hardware Plus', url: 'https://hwp.com.tr/feed/', category: 'Technology', subcategory: 'Hardware', region: 'TR', language: 'tr' },
  { name: 'Megabayt Teknoloji', url: 'https://www.megabayt.com/rss/categorynews/teknoloji', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Megabayt Bilim ve Teknoloji', url: 'https://www.megabayt.com/rss/categorynews/bilim-ve-teknoloji', category: 'Technology', subcategory: 'Science', region: 'TR', language: 'tr' },
  { name: 'Megabayt Siber Güvenlik', url: 'https://www.megabayt.com/rss/categorynews/siber-guvenlik', category: 'Technology', subcategory: 'Security', region: 'TR', language: 'tr' },
  { name: 'Megabayt Yazılım', url: 'https://www.megabayt.com/rss/categorynews/yazilim', category: 'Technology', subcategory: 'Software', region: 'TR', language: 'tr' },
  { name: 'Megabayt Bilgisayar', url: 'https://www.megabayt.com/rss/categorynews/bilgisayar', category: 'Technology', subcategory: 'Computing', region: 'TR', language: 'tr' },

  // Haber/Gündem (News)
  { name: 'BBC Türkçe', url: 'https://feeds.bbci.co.uk/turkce/rss.xml', category: 'News', subcategory: 'World', region: 'TR', language: 'tr' },
  { name: 'CNN Türk', url: 'https://www.cnnturk.com/feed/rss/all/news', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'DW Türkçe', url: 'https://rss.dw.com/rdf/rss-tur-all', category: 'News', subcategory: 'World', region: 'TR', language: 'tr' },
  { name: 'T24', url: 'https://t24.com.tr/rss', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sözcü', url: 'https://www.sozcu.com.tr/feeds-rss-category-sozcu', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sözcü Bilim Teknoloji', url: 'https://www.sozcu.com.tr/feeds-rss-category-bilim-teknoloji', category: 'Science', subcategory: 'Technology', region: 'TR', language: 'tr' },
  { name: 'Sözcü Son Dakika', url: 'https://www.sozcu.com.tr/feeds-son-dakika', category: 'News', subcategory: 'Breaking', region: 'TR', language: 'tr' },
  { name: 'OdaTV', url: 'https://www.odatv.com/rss.xml', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Tele1', url: 'https://www.tele1.com.tr/rss', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Kısa Dalga', url: 'https://kisadalga.net/service/rss.php', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Yeşil Gazete', url: 'https://yesilgazete.org/feed/', category: 'News', subcategory: 'Environment', region: 'TR', language: 'tr' },
  { name: 'Diken', url: 'https://www.diken.com.tr/feed/', category: 'News', subcategory: 'Opinion', region: 'TR', language: 'tr' },
  { name: 'Yurt Gazetesi', url: 'https://www.yurtgazetesi.com.tr/service/rss.php', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Gazete Duvar', url: 'https://www.gazeteduvar.com.tr/export/rss', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Teyit', url: 'https://teyit.org/feed?lang=tr', category: 'News', subcategory: 'FactCheck', region: 'TR', language: 'tr' },
  { name: 'Haber7 Teknoloji', url: 'https://i12.haber7.net/teknoloji/feed', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Haberler Teknoloji', url: 'https://rss.haberler.com/technology', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'STAR Teknoloji', url: 'https://www.star.com.tr/teknoloji/feed', category: 'Technology', subcategory: 'Science', region: 'TR', language: 'tr' },
  { name: 'Vatan Bilim Teknoloji', url: 'https://www.gazetevatan.com/bilim-teknoloji/feed', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Ege Haber Teknoloji', url: 'https://egehaber.com/teknoloji/feed', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },

  // Ekonomi (Business)
  { name: 'Döviz', url: 'https://www.doviz.com/news/rss', category: 'Business', subcategory: 'Finance', region: 'TR', language: 'tr' },
  { name: 'Ekonomi Gazetesi', url: 'https://www.ekonomigazetesi.com/rss.xml', category: 'Business', subcategory: 'News', region: 'TR', language: 'tr' },
  { name: 'Forbes Türkiye', url: 'https://www.forbes.com.tr/rss', category: 'Business', subcategory: 'News', region: 'TR', language: 'tr' },
  { name: 'Bigpara', url: 'https://bigpara.hurriyet.com.tr/rss', category: 'Business', subcategory: 'Personal Finance', region: 'TR', language: 'tr' },
  { name: 'Foreks', url: 'https://www.foreks.com/rss', category: 'Business', subcategory: 'Trading', region: 'TR', language: 'tr' },
  { name: 'Investing Türkiye', url: 'https://tr.investing.com/rss/news.rss', category: 'Business', subcategory: 'Markets', region: 'TR', language: 'tr' },

  // Blog/Medya
  { name: 'Onedio', url: 'https://onedio.com/Publisher/publisher-daily.rss', category: 'Entertainment', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sofos Blog', url: 'https://blog.sofos.com.tr/feed/', category: 'Lifestyle', subcategory: 'Blog', region: 'TR', 'language': 'tr' },
  { name: 'Martı Dergisi', url: 'https://www.martidergisi.com/feed/', category: 'Lifestyle', subcategory: 'Food', region: 'TR', language: 'tr' },
]

interface TestResult {
  name: string
  url: string
  category: string
  works: boolean
  error?: string
  itemCount?: number
  responseTime?: number
}

async function testFeed(feed: any): Promise<TestResult> {
  process.stdout.write(`  Testing: ${feed.name}...`)

  const startTime = Date.now()

  try {
    const parser = new Parser({
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })

    const result = await parser.parseURL(feed.url)
    const responseTime = Date.now() - startTime

    console.log(`\r  ✓ ${feed.name} (${responseTime}ms, ${result.items?.length || 0} items)`)

    return {
      name: feed.name,
      url: feed.url,
      category: feed.category,
      works: true,
      itemCount: result.items?.length || 0,
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errMsg = error instanceof Error ? error.message : String(error)
    const shortErr = errMsg.length > 60 ? errMsg.substring(0, 57) + '...' : errMsg
    console.log(`\r  ✗ ${feed.name} - ${shortErr}`)

    return {
      name: feed.name,
      url: feed.url,
      category: feed.category,
      works: false,
      error: errMsg,
      responseTime,
    }
  }
}

async function main() {
  console.log(`\n🔍 Testing ${NEW_TURKISH_FEEDS.length} new Turkish RSS feeds...\n`)

  const results: TestResult[] = []

  // Test in batches of 5
  const BATCH_SIZE = 5
  for (let i = 0; i < NEW_TURKISH_FEEDS.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(NEW_TURKISH_FEEDS.length / BATCH_SIZE)

    const batch = NEW_TURKISH_FEEDS.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(batch.map(testFeed))
    results.push(...batchResults)

    // Small delay between batches
    if (i + BATCH_SIZE < NEW_TURKISH_FEEDS.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const workingFeeds = results.filter(r => r.works)
  const failedFeeds = results.filter(r => !r.works)

  console.log(`\n\n${'='.repeat(60)}`)
  console.log(`📊 RESULTS:`)
  console.log(`${'='.repeat(60)}`)
  console.log(`  ✅ Working:  ${workingFeeds.length}`)
  console.log(`  ❌ Failed:   ${failedFeeds.length}`)
  console.log(`  📈 Success Rate: ${((workingFeeds.length / results.length) * 100).toFixed(1)}%\n`)

  // Save results
  await fs.mkdir('scripts/results', { recursive: true })

  await fs.writeFile(
    'scripts/results/new-turkish-feeds-test.json',
    JSON.stringify(results, null, 2)
  )

  await fs.writeFile(
    'scripts/results/new-turkish-working.json',
    JSON.stringify(workingFeeds, null, 2)
  )

  console.log(`\n📁 Generated files:`)
  console.log(`  - scripts/results/new-turkish-feeds-test.json (all results)`)
  console.log(`  - scripts/results/new-turkish-working.json (working only)\n`)

  // Show failed feeds
  if (failedFeeds.length > 0) {
    console.log(`❌ Failed feeds:`)
    failedFeeds.forEach(f => {
      const err = f.error || 'Unknown error'
      console.log(`  - ${f.name}: ${err}`)
    })
  }

  console.log(`\n✨ Done! Check the results above.\n`)
}

main().catch(console.error)
