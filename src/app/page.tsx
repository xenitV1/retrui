import Parser from 'rss-parser'

const parser = new Parser({
  customFields: {
    item: ['creator', 'author']
  }
})

// Popular tech news RSS feeds (working sources)
const RSS_FEEDS = [
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'Startups'
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'Technology'
  },
  {
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'Science'
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: 'Technology'
  },
  {
    name: 'Engadget',
    url: 'https://www.engadget.com/rss.xml',
    category: 'Gadgets'
  },
  {
    name: 'TechRadar',
    url: 'https://www.techradar.com/rss',
    category: 'Gadgets'
  },
  {
    name: 'CNET',
    url: 'https://www.cnet.com/rss/news/',
    category: 'Technology'
  },
  {
    name: 'ZDNet',
    url: 'https://www.zdnet.com/news/rss.xml',
    category: 'Enterprise'
  },
  {
    name: 'VentureBeat',
    url: 'https://venturebeat.com/feed/',
    category: 'AI'
  },
  {
    name: 'Mashable Tech',
    url: 'https://mashable.com/feeds/rss/tech',
    category: 'Technology'
  },
  {
    name: 'BBC Technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    category: 'Technology'
  },
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'Innovation'
  },
  {
    name: 'PCWorld',
    url: 'https://www.pcworld.com/index.rss',
    category: 'Hardware'
  },
  {
    name: 'The Next Web',
    url: 'https://thenextweb.com/rss/',
    category: 'Technology'
  },
  {
    name: 'Digital Trends',
    url: 'https://www.digitaltrends.com/feed/',
    category: 'Consumer Tech'
  },
  {
    name: '9to5Mac',
    url: 'https://9to5mac.com/feed/',
    category: 'Apple'
  },
  {
    name: '9to5Google',
    url: 'https://9to5google.com/feed/',
    category: 'Google'
  },
  {
    name: 'Android Authority',
    url: 'https://www.androidauthority.com/feed/',
    category: 'Android'
  },
  {
    name: 'The Register',
    url: 'https://www.theregister.com/headlines.atom',
    category: 'Enterprise'
  },
  {
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    category: 'Technology'
  },
  {
    name: 'Slashdot',
    url: 'https://rss.slashdot.org/Slashdot/slashdotMain',
    category: 'Technology'
  }
]

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
