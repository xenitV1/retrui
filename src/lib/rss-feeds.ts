/**
 * RSS Feed Catalog
 * Contains only verified working RSS feeds (178 out of 286 tested)
 * Last updated: 2025-12-23
 * Test results: 62.2% success rate
 */

export interface RssFeed {
  name: string
  url: string
  category: string
  subcategory?: string
  region?: string
  language?: string
}

// ============================================================================
// NEWS & POLITICS (51 working feeds)
// ============================================================================

const NEWS_POLITICS: RssFeed[] = [
  // International - World
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'News', subcategory: 'World', region: 'UK', language: 'en' },
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss', category: 'News', subcategory: 'World', region: 'US', language: 'en' },
  { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'News', subcategory: 'World', region: 'QA', language: 'en' },
  { name: 'France 24 World', url: 'https://www.france24.com/en/rss', category: 'News', subcategory: 'World', region: 'FR', language: 'en' },

  // International - US Politics
  { name: 'Fox News Politics', url: 'https://feeds.foxnews.com/foxnews/politics', category: 'News', subcategory: 'Politics', region: 'US', language: 'en' },
  { name: 'Politico', url: 'https://rss.politico.com/politics-news.xml', category: 'News', subcategory: 'Politics', region: 'US', language: 'en' },
  { name: 'The Hill', url: 'https://thehill.com/rss/feed/', category: 'News', subcategory: 'Politics', region: 'US', language: 'en' },

  // Turkish News - General
  { name: 'NTV Haber', url: 'https://www.ntv.com.tr/gundem.rss', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'NTV Son Dakika', url: 'https://www.ntv.com.tr/son-dakika.rss', category: 'News', subcategory: 'Breaking', region: 'TR', language: 'tr' },
  { name: 'AA Son Dakika', url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel', category: 'News', subcategory: 'Breaking', region: 'TR', language: 'tr' },
  { name: 'Anadolu Ajansı Haber', url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sabah Son Dakika', url: 'https://www.sabah.com.tr/rss/son-dakika.xml', category: 'News', subcategory: 'Breaking', region: 'TR', language: 'tr' },
  { name: 'Sözcü Haber', url: 'https://www.sozcu.com.tr/rss/rss.xml?category=son-dakika', category: 'News', subcategory: 'Breaking', region: 'TR', language: 'tr' },
  { name: 'Bloomberg HT News', url: 'https://www.bloomberght.com/rss', category: 'News', subcategory: 'Business', region: 'TR', language: 'tr' },

  // Turkish News - Politics
  { name: 'AA Siyaset', url: 'https://www.aa.com.tr/tr/rss/default?cat=siyaset', category: 'News', subcategory: 'Politics', region: 'TR', language: 'tr' },

  // Turkish News - International
  { name: 'BBC Türkçe', url: 'https://feeds.bbci.co.uk/turkce/rss.xml', category: 'News', subcategory: 'World', region: 'TR', language: 'tr' },
  { name: 'CNN Türk', url: 'https://www.cnnturk.com/feed/rss/all/news', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'DW Türkçe', url: 'https://rss.dw.com/rdf/rss-tur-all', category: 'News', subcategory: 'World', region: 'TR', language: 'tr' },
  { name: 'T24', url: 'https://t24.com.tr/rss', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sözcü', url: 'https://www.sozcu.com.tr/feeds-rss-category-sozcu', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sözcü Son Dakika', url: 'https://www.sozcu.com.tr/feeds-son-dakika', category: 'News', subcategory: 'Breaking', region: 'TR', language: 'tr' },
  { name: 'OdaTV', url: 'https://www.odatv.com/rss.xml', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Tele1', url: 'https://www.tele1.com.tr/rss', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Kısa Dalga', url: 'https://kisadalga.net/service/rss.php', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Yeşil Gazete', url: 'https://yesilgazete.org/feed/', category: 'News', subcategory: 'Environment', region: 'TR', language: 'tr' },
  { name: 'Diken', url: 'https://www.diken.com.tr/feed/', category: 'News', subcategory: 'Opinion', region: 'TR', language: 'tr' },
  { name: 'Yurt Gazetesi', url: 'https://www.yurtgazetesi.com.tr/service/rss.php', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Gazete Duvar', url: 'https://www.gazeteduvar.com.tr/export/rss', category: 'News', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Teyit', url: 'https://teyit.org/feed?lang=tr', category: 'News', subcategory: 'FactCheck', region: 'TR', language: 'tr' },

  // European News
  { name: 'The Guardian UK', url: 'https://www.theguardian.com/uk/rss', category: 'News', subcategory: 'UK', region: 'UK', language: 'en' },
  { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', category: 'News', subcategory: 'World', region: 'UK', language: 'en' },
  { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/world.xml', category: 'News', subcategory: 'World', region: 'UK', language: 'en' },
  { name: 'Independent UK', url: 'https://www.independent.co.uk/news/world/rss', category: 'News', subcategory: 'World', region: 'UK', language: 'en' },
  { name: 'Daily Mail', url: 'https://www.dailymail.co.uk/news/index.rss', category: 'News', subcategory: 'UK', region: 'UK', language: 'en' },
  { name: 'Telegraph', url: 'https://www.telegraph.co.uk/news/rss.xml', category: 'News', subcategory: 'UK', region: 'UK', language: 'en' },
  { name: 'Spiegel International', url: 'https://www.spiegel.de/international/index.rss', category: 'News', subcategory: 'Germany', region: 'DE', language: 'en' },

  // Asian News
  { name: 'NHK World', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', category: 'News', subcategory: 'Japan', region: 'JP', language: 'en' },
  { name: 'Asahi Shimbun', url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf', category: 'News', subcategory: 'Japan', region: 'JP', language: 'ja' },
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', category: 'News', subcategory: 'India', region: 'IN', language: 'en' },
  { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/top-news/rssfeed.xml', category: 'News', subcategory: 'India', region: 'IN', language: 'en' },
  { name: 'The Economic Times', url: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms', category: 'News', subcategory: 'India', region: 'IN', language: 'en' },
  { name: 'China Daily', url: 'https://www.chinadaily.com.cn/rss/china_rss.xml', category: 'News', subcategory: 'China', region: 'CN', language: 'en' },
  { name: 'Sydney Morning Herald', url: 'https://www.smh.com.au/rss/feed.xml', category: 'News', subcategory: 'Australia', region: 'AU', language: 'en' },
  { name: 'ABC Australia', url: 'https://www.abc.net.au/news/feed/51120/rss.xml', category: 'News', subcategory: 'Australia', region: 'AU', language: 'en' },
  { name: 'Haaretz', url: 'https://www.haaretz.com/srv/haaretz-latest-headlines', category: 'News', subcategory: 'Israel', region: 'IL', language: 'en' },
]

// ============================================================================
// BUSINESS & FINANCE (22 working feeds)
// ============================================================================

const BUSINESS_FINANCE: RssFeed[] = [
  // International Business
  { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'Business', subcategory: 'Markets', region: 'Intl', language: 'en' },
  { name: 'WSJ Business', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'Business', subcategory: 'Markets', region: 'US', language: 'en' },
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'Business', subcategory: 'Markets', region: 'US', language: 'en' },
  { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories', category: 'Business', subcategory: 'Markets', region: 'US', language: 'en' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', category: 'Business', subcategory: 'Markets', region: 'US', language: 'en' },
  { name: 'Business Insider', url: 'https://www.businessinsider.com/rss', category: 'Business', subcategory: 'News', region: 'US', language: 'en' },
  { name: 'Forbes', url: 'https://www.forbes.com/business/feed/', category: 'Business', subcategory: 'News', region: 'US', language: 'en' },
  { name: 'Fortune', url: 'https://fortune.com/feed/', category: 'Business', subcategory: 'News', region: 'US', language: 'en' },
  { name: 'Inc.', url: 'https://www.inc.com/rss', category: 'Business', subcategory: 'Entrepreneurship', region: 'US', language: 'en' },
  { name: 'Entrepreneur', url: 'https://www.entrepreneur.com/latest.rss', category: 'Business', subcategory: 'Entrepreneurship', region: 'US', language: 'en' },

  // Turkish Business
  { name: 'Bloomberg HT Markets', url: 'https://www.bloomberght.com/rss', category: 'Business', subcategory: 'Markets', region: 'TR', language: 'tr' },
  { name: 'AA Ekonomi', url: 'https://www.aa.com.tr/tr/rss/default?cat=ekonomi', category: 'Business', subcategory: 'News', region: 'TR', language: 'tr' },
  { name: 'NTV Ekonomi', url: 'https://www.ntv.com.tr/ekonomi.rss', category: 'Business', subcategory: 'News', region: 'TR', language: 'tr' },
  { name: 'Döviz', url: 'https://www.doviz.com/news/rss', category: 'Business', subcategory: 'Finance', region: 'TR', language: 'tr' },
  { name: 'Ekonomi Gazetesi', url: 'https://www.ekonomigazetesi.com/rss.xml', category: 'Business', subcategory: 'News', region: 'TR', language: 'tr' },
  { name: 'Forbes Türkiye', url: 'https://www.forbes.com.tr/rss', category: 'Business', subcategory: 'News', region: 'TR', language: 'tr' },
  { name: 'Foreks', url: 'https://www.foreks.com/rss', category: 'Business', subcategory: 'Trading', region: 'TR', language: 'tr' },
  { name: 'Investing Türkiye', url: 'https://tr.investing.com/rss/news.rss', category: 'Business', subcategory: 'Markets', region: 'TR', language: 'tr' },

  // Crypto & Blockchain
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'Business', subcategory: 'Crypto', region: 'Intl', language: 'en' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', category: 'Business', subcategory: 'Crypto', region: 'Intl', language: 'en' },
  { name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/', category: 'Business', subcategory: 'Crypto', region: 'Intl', language: 'en' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed', category: 'Business', subcategory: 'Crypto', region: 'Intl', language: 'en' },
  { name: 'The Block', url: 'https://www.theblockcrypto.com/rss.xml', category: 'Business', subcategory: 'Crypto', region: 'Intl', language: 'en' },
]

// ============================================================================
// TECHNOLOGY (44 working feeds)
// ============================================================================

const TECHNOLOGY: RssFeed[] = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology', subcategory: 'Startups', region: 'US', language: 'en' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Technology', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Technology', subcategory: 'Science', region: 'US', language: 'en' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'Technology', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: 'Technology', subcategory: 'Gadgets', region: 'US', language: 'en' },
  { name: 'TechRadar', url: 'https://www.techradar.com/rss', category: 'Technology', subcategory: 'Gadgets', region: 'UK', language: 'en' },
  { name: 'CNET', url: 'https://www.cnet.com/rss/news/', category: 'Technology', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', category: 'Technology', subcategory: 'Enterprise', region: 'US', language: 'en' },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', category: 'Technology', subcategory: 'AI', region: 'US', language: 'en' },
  { name: 'Mashable Tech', url: 'https://mashable.com/feeds/rss/tech', category: 'Technology', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'Technology', subcategory: 'General', region: 'UK', language: 'en' },
  { name: 'MIT Technology Review Tech', url: 'https://www.technologyreview.com/feed/', category: 'Technology', subcategory: 'Innovation', region: 'US', language: 'en' },
  { name: 'PCWorld', url: 'https://www.pcworld.com/index.rss', category: 'Technology', subcategory: 'Hardware', region: 'US', language: 'en' },
  { name: 'The Next Web', url: 'https://thenextweb.com/rss/', category: 'Technology', subcategory: 'General', region: 'NL', language: 'en' },
  { name: 'Digital Trends', url: 'https://www.digitaltrends.com/feed/', category: 'Technology', subcategory: 'Consumer', region: 'US', language: 'en' },
  { name: '9to5Mac', url: 'https://9to5mac.com/feed/', category: 'Technology', subcategory: 'Apple', region: 'US', language: 'en' },
  { name: '9to5Google', url: 'https://9to5google.com/feed/', category: 'Technology', subcategory: 'Google', region: 'US', language: 'en' },
  { name: 'Android Authority', url: 'https://www.androidauthority.com/feed/', category: 'Technology', subcategory: 'Android', region: 'US', language: 'en' },
  { name: 'The Register', url: 'https://www.theregister.com/headlines.atom', category: 'Technology', subcategory: 'Enterprise', region: 'UK', language: 'en' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'Technology', subcategory: 'Hacker', region: 'Intl', language: 'en' },
  { name: 'Slashdot', url: 'https://rss.slashdot.org/Slashdot/slashdotMain', category: 'Technology', subcategory: 'Hacker', region: 'US', language: 'en' },
  { name: 'Gizmodo', url: 'https://gizmodo.com/rss', category: 'Technology', subcategory: 'Gadgets', region: 'US', language: 'en' },
  { name: 'Tom\'s Hardware', url: 'https://www.tomshardware.com/feeds/rss', category: 'Technology', subcategory: 'Hardware', region: 'US', language: 'en' },
  { name: 'The Verge Tech', url: 'https://www.theverge.com/rss/tech/index.xml', category: 'Technology', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'Wired Tech Science', url: 'https://www.wired.com/feed/category/science/latest/rss', category: 'Technology', subcategory: 'Science', region: 'US', language: 'en' },
  { name: 'Recode', url: 'https://www.vox.com/rss/technology/index.xml', category: 'Technology', subcategory: 'Industry', region: 'US', language: 'en' },

  // Turkish Tech
  { name: 'ShiftDelete.Net', url: 'https://shiftdelete.net/feed', category: 'Technology', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Chip Online TR', url: 'https://www.chip.com.tr/rss', category: 'Technology', subcategory: 'Hardware', region: 'TR', language: 'tr' },
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
]

// ============================================================================
// SCIENCE (17 working feeds)
// ============================================================================

const SCIENCE: RssFeed[] = [
  { name: 'Science Magazine', url: 'https://www.science.org/rss/news_current.xml', category: 'Science', subcategory: 'General', region: 'Intl', language: 'en' },
  { name: 'NASA News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'Science', subcategory: 'Space', region: 'US', language: 'en' },
  { name: 'Space.com', url: 'https://www.space.com/feeds/all', category: 'Science', subcategory: 'Space', region: 'US', language: 'en' },
  { name: 'Phys.org', url: 'https://phys.org/rss-feed/', category: 'Science', subcategory: 'General', region: 'Intl', language: 'en' },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'Science', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'New Scientist', url: 'https://www.newscientist.com/feed/home', category: 'Science', subcategory: 'General', region: 'UK', language: 'en' },
  { name: 'Live Science', url: 'https://www.livescience.com/feeds/all', category: 'Science', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'Ars Technica Science', url: 'https://feeds.arstechnica.com/arstechnica/science', category: 'Science', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'Wired Science', url: 'https://www.wired.com/feed/category/science/latest/rss', category: 'Science', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'Science Friday', url: 'https://www.sciencefriday.com/feed/', category: 'Science', subcategory: 'Podcast', region: 'US', language: 'en' },
  { name: 'AA Bilim', url: 'https://www.aa.com.tr/tr/rss/default?cat=bilim', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },

  // Turkish Science
  { name: 'Evrim Ağacı', url: 'https://evrimagaci.org/rss.xml', category: 'Science', subcategory: 'Biology', region: 'TR', language: 'tr' },
  { name: 'Bilim Günlüğü', url: 'https://www.bilimgunlugu.com/feed/', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Popular Science TR', url: 'https://popsci.com.tr/feed/', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Bilimup', url: 'https://www.bilimup.com/rss.xml', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Gerçek Bilim', url: 'https://www.gercekbilim.com/feed/', category: 'Science', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Tarihli Bilim', url: 'https://www.tarihlibilim.com/feed/', category: 'Science', subcategory: 'History', region: 'TR', language: 'tr' },
  { name: 'Sözcü Bilim Teknoloji', url: 'https://www.sozcu.com.tr/feeds-rss-category-bilim-teknoloji', category: 'Science', subcategory: 'Technology', region: 'TR', language: 'tr' },
]

// ============================================================================
// SPORTS (6 working feeds)
// ============================================================================

const SPORTS: RssFeed[] = [
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', category: 'Sports', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', category: 'Sports', subcategory: 'General', region: 'UK', language: 'en' },
  { name: 'The Athletic', url: 'https://theathletic.com/rss/news/', category: 'Sports', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines', category: 'Sports', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'AA Spor', url: 'https://www.aa.com.tr/tr/rss/default?cat=spor', category: 'Sports', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sabah Spor', url: 'https://www.sabah.com.tr/rss/spor.xml', category: 'Sports', subcategory: 'General', region: 'TR', language: 'tr' },
]

// ============================================================================
// ENTERTAINMENT & ARTS (19 working feeds)
// ============================================================================

const ENTERTAINMENT_ARTS: RssFeed[] = [
  // Movies & TV
  { name: 'Entertainment Tonight', url: 'https://www.etonline.com/news/rss', category: 'Entertainment', subcategory: 'TV', region: 'US', language: 'en' },
  { name: 'Variety', url: 'https://variety.com/feed/', category: 'Entertainment', subcategory: 'Industry', region: 'US', language: 'en' },
  { name: 'Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed', category: 'Entertainment', subcategory: 'Industry', region: 'US', language: 'en' },
  { name: 'Deadline', url: 'https://deadline.com/feed/', category: 'Entertainment', subcategory: 'Industry', region: 'US', language: 'en' },
  { name: 'TMZ', url: 'https://www.tmz.com/rss.xml', category: 'Entertainment', subcategory: 'Celebrity', region: 'US', language: 'en' },
  { name: 'Rolling Stone', url: 'https://www.rollingstone.com/feed', category: 'Entertainment', subcategory: 'Music', region: 'US', language: 'en' },
  { name: 'Billboard', url: 'https://www.billboard.com/feed/', category: 'Entertainment', subcategory: 'Music', region: 'US', language: 'en' },

  // Gaming
  { name: 'IGN', url: 'https://feeds.ign.com/ign/all', category: 'Entertainment', subcategory: 'Gaming', region: 'US', language: 'en' },
  { name: 'Polygon', url: 'https://www.polygon.com/rss/index.xml', category: 'Entertainment', subcategory: 'Gaming', region: 'US', language: 'en' },
  { name: 'Kotaku', url: 'https://kotaku.com/rss', category: 'Entertainment', subcategory: 'Gaming', region: 'US', language: 'en' },
  { name: 'GameSpot', url: 'https://www.gamespot.com/feeds/mashup/', category: 'Entertainment', subcategory: 'Gaming', region: 'US', language: 'en' },
  { name: 'PC Gamer', url: 'https://www.pcgamer.com/rss/', category: 'Entertainment', subcategory: 'Gaming', region: 'UK', language: 'en' },
  { name: 'Destructoid', url: 'https://www.destructoid.com/rss', category: 'Entertainment', subcategory: 'Gaming', region: 'US', language: 'en' },

  // Arts & Culture
  { name: 'Hyperallergic', url: 'https://hyperallergic.com/feed/', category: 'Entertainment', subcategory: 'Art', region: 'US', language: 'en' },
  { name: 'BBC Culture', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', category: 'Entertainment', subcategory: 'Culture', region: 'UK', language: 'en' },
  { name: 'AA Kültür Sanat', url: 'https://www.aa.com.tr/tr/rss/default?cat=kultursanat', category: 'Entertainment', subcategory: 'Culture', region: 'TR', language: 'tr' },

  // Turkish Entertainment
  { name: 'Onedio', url: 'https://onedio.com/Publisher/publisher-daily.rss', category: 'Entertainment', subcategory: 'General', region: 'TR', language: 'tr' },
]

// ============================================================================
// LIFESTYLE (7 working feeds)
// ============================================================================

const LIFESTYLE: RssFeed[] = [
  { name: 'Men\'s Health', url: 'https://www.menshealth.com/rss', category: 'Lifestyle', subcategory: 'Health', region: 'US', language: 'en' },
  { name: 'Dezeen', url: 'https://www.dezeen.com/feed/', category: 'Lifestyle', subcategory: 'Design', region: 'UK', language: 'en' },
  { name: 'Design Milk', url: 'https://design-milk.com/feed', category: 'Lifestyle', subcategory: 'Design', region: 'US', language: 'en' },
  { name: 'AA Yaşam', url: 'https://www.aa.com.tr/tr/rss/default?cat=yasam', category: 'Lifestyle', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'NTV Yaşam', url: 'https://www.ntv.com.tr/yasam.rss', category: 'Lifestyle', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sofos Blog', url: 'https://blog.sofos.com.tr/feed/', category: 'Lifestyle', subcategory: 'Blog', region: 'TR', language: 'tr' },
  { name: 'Martı Dergisi', url: 'https://www.martidergisi.com/feed/', category: 'Lifestyle', subcategory: 'Food', region: 'TR', language: 'tr' },
]

// ============================================================================
// OPINION & ANALYSIS (18 working feeds)
// ============================================================================

const OPINION_ANALYSIS: RssFeed[] = [
  // International Opinion
  { name: 'Washington Post Opinions', url: 'https://feeds.washingtonpost.com/rss/opinions', category: 'Opinion', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'The Guardian Opinion', url: 'https://www.theguardian.com/opinion/rss', category: 'Opinion', subcategory: 'General', region: 'UK', language: 'en' },
  { name: 'The Atlantic', url: 'https://www.theatlantic.com/feed/all/', category: 'Opinion', subcategory: 'Analysis', region: 'US', language: 'en' },
  { name: 'New Yorker', url: 'https://www.newyorker.com/feed/rss', category: 'Opinion', subcategory: 'Culture', region: 'US', language: 'en' },
  { name: 'Harper\'s Magazine', url: 'https://harpers.org/feed/', category: 'Opinion', subcategory: 'Analysis', region: 'US', language: 'en' },
  { name: 'Time Magazine', url: 'https://time.com/feed', category: 'Opinion', subcategory: 'General', region: 'US', language: 'en' },
  { name: 'Vox', url: 'https://www.vox.com/rss/index.xml', category: 'Opinion', subcategory: 'Analysis', region: 'US', language: 'en' },
  { name: 'The Week', url: 'https://www.theweek.com/rss', category: 'Opinion', subcategory: 'Digest', region: 'US', language: 'en' },
  { name: 'Reason', url: 'https://reason.com/rss', category: 'Opinion', subcategory: 'Libertarian', region: 'US', language: 'en' },
  { name: 'The American Conservative', url: 'https://www.theamericanconservative.com/feed/', category: 'Opinion', subcategory: 'Conservative', region: 'US', language: 'en' },
  { name: 'The Nation', url: 'https://www.thenation.com/feed/', category: 'Opinion', subcategory: 'Progressive', region: 'US', language: 'en' },
  { name: 'Mother Jones', url: 'https://www.motherjones.com/rss', category: 'Opinion', subcategory: 'Progressive', region: 'US', language: 'en' },
  { name: 'National Review', url: 'https://www.nationalreview.com/feed', category: 'Opinion', subcategory: 'Conservative', region: 'US', language: 'en' },
  { name: 'The Intercept', url: 'https://theintercept.com/feed/', category: 'Opinion', subcategory: 'Investigative', region: 'US', language: 'en' },
  { name: 'Spiegel Commentary', url: 'https://www.spiegel.de/international/index.rss', category: 'Opinion', subcategory: 'Germany', region: 'DE', language: 'en' },
  { name: 'AA Yorum', url: 'https://www.aa.com.tr/tr/rss/default?cat=yorum', category: 'Opinion', subcategory: 'General', region: 'TR', language: 'tr' },
  { name: 'Sabah Yazarlar', url: 'https://www.sabah.com.tr/rss/yazarlar.xml', category: 'Opinion', subcategory: 'Columnists', region: 'TR', language: 'tr' },
]

// ============================================================================
// INTERNATIONAL LANGUAGES (New: de, fr, es, zh, hi)
// Verified working feeds - tested 2025-12-23
// ============================================================================

const INTERNATIONAL_LANGUAGES: RssFeed[] = [
  // German (de) - 4 verified feeds
  { name: 'Tagesschau', url: 'https://www.tagesschau.de/xml/rss2/', category: 'News', subcategory: 'General', region: 'DE', language: 'de' },
  { name: 'Spiegel', url: 'https://www.spiegel.de/international/index.rss', category: 'News', subcategory: 'General', region: 'DE', language: 'de' },
  { name: 'Zeit Online', url: 'https://newsfeed.zeit.de/index', category: 'News', subcategory: 'General', region: 'DE', language: 'de' },
  { name: 'Heise Online', url: 'https://www.heise.de/rss/heise.rdf', category: 'Technology', subcategory: 'General', region: 'DE', language: 'de' },

  // French (fr) - 4 verified feeds
  { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', category: 'News', subcategory: 'General', region: 'FR', language: 'fr' },
  { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_flash.xml', category: 'News', subcategory: 'Breaking', region: 'FR', language: 'fr' },
  { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', category: 'News', subcategory: 'General', region: 'FR', language: 'fr' },
  { name: '20 Minutes FR', url: 'https://www.20minutes.fr/feeds/rss-une.xml', category: 'News', subcategory: 'General', region: 'FR', language: 'fr' },

  // Spanish (es) - 4 verified feeds
  { name: 'El Pais', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', category: 'News', subcategory: 'General', region: 'ES', language: 'es' },
  { name: 'El Mundo', url: 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml', category: 'News', subcategory: 'General', region: 'ES', language: 'es' },
  { name: 'ABC Spain', url: 'https://www.abc.es/rss/2.0/portada/', category: 'News', subcategory: 'General', region: 'ES', language: 'es' },
  { name: '20 Minutos ES', url: 'https://www.20minutos.es/rss/', category: 'News', subcategory: 'General', region: 'ES', language: 'es' },

  // Chinese (zh) - 4 verified feeds
  { name: 'BBC Chinese', url: 'http://www.bbc.co.uk/zhongwen/simp/index.xml', category: 'News', subcategory: 'World', region: 'CN', language: 'zh' },
  { name: 'China News Scroll', url: 'https://www.chinanews.com.cn/rss/scroll-news.xml', category: 'News', subcategory: 'Breaking', region: 'CN', language: 'zh' },
  { name: 'China News Headlines', url: 'https://www.chinanews.com.cn/rss/importnews.xml', category: 'News', subcategory: 'Headlines', region: 'CN', language: 'zh' },
  { name: 'Sina News', url: 'http://rss.sina.com.cn/news/marquee/ddt.xml', category: 'News', subcategory: 'General', region: 'CN', language: 'zh' },

  // Hindi (hi) - 2 verified feeds
  { name: 'BBC Hindi', url: 'https://feeds.bbci.co.uk/hindi/rss.xml', category: 'News', subcategory: 'General', region: 'IN', language: 'hi' },
  { name: 'Dainik Bhaskar Tech', url: 'https://www.bhaskar.com/rss-v1--category-1740.xml', category: 'Technology', subcategory: 'General', region: 'IN', language: 'hi' },
]

// ============================================================================
// COMPLETE FEED CATALOG
// ============================================================================

export const RSS_FEEDS: RssFeed[] = [
  ...NEWS_POLITICS,
  ...BUSINESS_FINANCE,
  ...TECHNOLOGY,
  ...SCIENCE,
  ...SPORTS,
  ...ENTERTAINMENT_ARTS,
  ...LIFESTYLE,
  ...OPINION_ANALYSIS,
  ...INTERNATIONAL_LANGUAGES,
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const MAIN_CATEGORIES = [
  'All',
  'News',
  'Business',
  'Technology',
  'Science',
  'Sports',
  'Entertainment',
  'Lifestyle',
  'Opinion',
] as const

export type MainCategory = typeof MAIN_CATEGORIES[number]

export function getFeedsByCategory(category: string): RssFeed[] {
  if (category === 'All') return RSS_FEEDS
  return RSS_FEEDS.filter(feed => feed.category === category)
}

export function getFeedsByRegion(region: string): RssFeed[] {
  return RSS_FEEDS.filter(feed => feed.region === region)
}

export function getFeedsByLanguage(language: string): RssFeed[] {
  return RSS_FEEDS.filter(feed => feed.language === language)
}

export function getTurkishFeeds(): RssFeed[] {
  return getFeedsByRegion('TR')
}

export function getEnglishFeeds(): RssFeed[] {
  return getFeedsByLanguage('en')
}

export function getAllSubcategories(): string[] {
  const subcats = new Set<string>()
  RSS_FEEDS.forEach(feed => {
    if (feed.subcategory) subcats.add(feed.subcategory)
  })
  return Array.from(subcats).sort()
}

export function getAllRegions(): string[] {
  const regions = new Set<string>()
  RSS_FEEDS.forEach(feed => {
    if (feed.region) regions.add(feed.region)
  })
  return Array.from(regions).sort()
}
