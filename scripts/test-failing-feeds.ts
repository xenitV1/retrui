
import Parser from 'rss-parser'

const FAILING_FEEDS = [
    { name: 'Yeşil Gazete', url: 'https://yesilgazete.org/feed/' },
    { name: 'Yurt Gazetesi', url: 'https://www.yurtgazetesi.com.tr/service/rss.php' },
    { name: 'Gazete Duvar', url: 'https://www.gazeteduvar.com.tr/export/rss' },
    { name: 'Telegraph', url: 'https://www.telegraph.co.uk/news/rss.xml' },
    { name: 'PCWorld', url: 'https://www.pcworld.com/index.rss' },
    { name: 'Beetekno', url: 'https://www.beetekno.com/feed/posts' },
    { name: 'PC Hocası', url: 'https://pchocasi.com.tr/feed/' },
    { name: 'Megabayt Bilim ve Teknoloji', url: 'https://www.megabayt.com/rss/categorynews/bilim-ve-teknoloji' },
    { name: 'NASA News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
    { name: 'Evrim Ağacı', url: 'https://evrimagaci.org/rss.xml' },
    { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
    { name: 'TMZ', url: 'https://www.tmz.com/rss.xml' },
    { name: 'Rolling Stone', url: 'https://www.rollingstone.com/feed' },
    { name: 'BBC Culture', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
    { name: 'The Guardian Opinion', url: 'https://www.theguardian.com/opinion/rss' },
    { name: 'Mother Jones', url: 'https://www.motherjones.com/rss' },
    { name: 'National Review', url: 'https://www.nationalreview.com/feed' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_flash.xml' },
]

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function testFeeds() {
    const parser = new Parser({
        timeout: 20000,
        headers: { 'User-Agent': USER_AGENT },
    })

    console.log('Testing failing feeds...\n')

    for (const feed of FAILING_FEEDS) {
        try {
            const result = await parser.parseURL(feed.url)
            console.log(`✓ ${feed.name}: Success (${result.items?.length} items)`)
        } catch (error) {
            console.log(`✗ ${feed.name}: Failed - ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}

testFeeds()
