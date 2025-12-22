'use client'

import { useState, useEffect } from 'react'
import { Search, Clock, X, RefreshCw, ChevronLeft, ChevronRight, Filter, ExternalLink, ArrowRight, Trash2, ChevronDown, Twitter, Github, Info, Plus } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { storage, STORAGE_KEYS } from '@/lib/indexeddb'

interface NewsItem {
  id: string
  title: string
  description: string
  content: string
  fullContent?: string
  author: string
  publishedAt: string
  source: string
  category: string
  url: string
  isFetchingFullContent?: boolean
}

interface CustomFeed {
  name: string
  url: string
  category: string
}

const NEWS_PER_PAGE = 20

// Technology categories - will be organized under "Technology" dropdown
const TECHNOLOGY_CATEGORIES = [
  { name: 'All', value: 'All' },
  { name: 'Technology', value: 'Technology' },
  { name: 'Startups', value: 'Startups' },
  { name: 'AI', value: 'AI' },
  { name: 'Hardware', value: 'Hardware' },
  { name: 'Gadgets', value: 'Gadgets' },
  { name: 'Enterprise', value: 'Enterprise' },
  { name: 'Science', value: 'Science' },
  { name: 'Apple', value: 'Apple' },
  { name: 'Google', value: 'Google' },
  { name: 'Android', value: 'Android' },
  { name: 'Innovation', value: 'Innovation' },
  { name: 'Consumer Tech', value: 'Consumer Tech' }
]

const CATEGORIES = TECHNOLOGY_CATEGORIES.map(c => c.value)

// RSS Feeds - Client-side
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

interface NewsClientProps {
  initialNews: NewsItem[]
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
    // Try to get from cache first
    const cacheKey = `rss_${feed.name}`
    const cached = await storage.get<{ data: NewsItem[], timestamp: number }>(cacheKey)

    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return cached.data
    }

    // Fetch RSS feed through backend API (to avoid CORS issues)
    const response = await fetch('/api/fetch-rss', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: feed.url }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success || !result.data) {
      throw new Error('Invalid RSS feed response')
    }

    const feedData = result.data as RSSFeed

    const news = (feedData.items || []).slice(0, 15).map((item) => ({
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

    // Cache the results
    await storage.set(cacheKey, { data: news, timestamp: Date.now() })

    return news
  } catch (error) {
    console.error(`Error fetching RSS feed from ${feed.name}:`, error)
    return []
  }
}

async function fetchAllNews(customFeeds: CustomFeed[] = []): Promise<NewsItem[]> {
  try {
    // Try to get from IndexedDB cache
    const cachedNews = await storage.get<{ data: NewsItem[], timestamp: number }>(STORAGE_KEYS.CACHE)
    if (cachedNews && Date.now() - cachedNews.timestamp < 2 * 60 * 1000) { // 2 minutes cache
      return cachedNews.data
    }

    // Combine default feeds with custom feeds
    const allFeeds = [...RSS_FEEDS, ...customFeeds]

    // Fetch from all RSS feeds in parallel
    const allNewsPromises = allFeeds.map(feed => fetchRSSFeed(feed))
    const allNewsArrays = await Promise.all(allNewsPromises)
    const allNews = allNewsArrays.flat()

    // Sort by publication date (newest first)
    allNews.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    // Return up to 100 news items maximum
    const result = allNews.slice(0, 100)

    // Cache the results
    await storage.set(STORAGE_KEYS.CACHE, { data: result, timestamp: Date.now() })

    return result
  } catch (error) {
    console.error('Error in fetchAllNews:', error)
    return []
  }
}

export default function NewsClient({ initialNews }: NewsClientProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews)
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>(initialNews)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isAnimating, setIsAnimating] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [darkMode, setDarkMode] = useState(false)

  // Custom feeds state
  const [customFeeds, setCustomFeeds] = useState<CustomFeed[]>([])
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false)
  const [newFeedName, setNewFeedName] = useState('')
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [newFeedCategory, setNewFeedCategory] = useState('Technology')
  const [isAddingFeed, setIsAddingFeed] = useState(false)

  // Load custom feeds from IndexedDB on mount
  useEffect(() => {
    const loadCustomFeeds = async () => {
      try {
        const savedFeeds = await storage.get<CustomFeed[]>(STORAGE_KEYS.CUSTOM_FEEDS)
        if (savedFeeds) {
          setCustomFeeds(savedFeeds)
        }
      } catch (error) {
        console.error('Failed to load custom feeds:', error)
      }
    }
    loadCustomFeeds()
  }, [])

  // Effect to sync drawer loading with selected news content
  useEffect(() => {
    if (selectedNews) {
      // Check if content exists in the current selectedNews or in the news array
      const newsWithContent = news.find(n => n.id === selectedNews.id && n.fullContent)
      if (newsWithContent?.fullContent) {
        setDrawerLoading(false)
      } else if (!selectedNews.fullContent && !selectedNews.isFetchingFullContent) {
        setDrawerLoading(true)
      }
    } else {
      setDrawerLoading(false)
    }
  }, [selectedNews?.id, selectedNews?.fullContent, selectedNews?.isFetchingFullContent, news])

  useEffect(() => {
    // Opening animation
    setTimeout(() => {
      setIsAnimating(false)
    }, 500)

    // Auto-refresh every 1 minute
    const refreshInterval = setInterval(() => {
      fetchNews(false)
    }, 60000)

    return () => clearInterval(refreshInterval)
  }, [])

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    let filtered = news

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Filter by search
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.fullContent && item.fullContent.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredNews(filtered)
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, news])

  const fetchNews = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      else setIsRefreshing(true)

      const data = await fetchAllNews(customFeeds)
      setNews(data)
      setFilteredNews(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Add custom feed
  const addCustomFeed = async () => {
    if (!newFeedName.trim() || !newFeedUrl.trim()) return

    setIsAddingFeed(true)
    try {
      // Validate URL format
      new URL(newFeedUrl)

      const newFeed: CustomFeed = {
        name: newFeedName.trim(),
        url: newFeedUrl.trim(),
        category: newFeedCategory
      }

      // Check if feed already exists
      if (customFeeds.some(f => f.url === newFeed.url)) {
        alert('This feed URL already exists!')
        return
      }

      const updatedFeeds = [...customFeeds, newFeed]
      setCustomFeeds(updatedFeeds)
      await storage.set(STORAGE_KEYS.CUSTOM_FEEDS, updatedFeeds)

      // Clear form and close dialog
      setNewFeedName('')
      setNewFeedUrl('')
      setNewFeedCategory('Technology')
      setShowAddFeedDialog(false)

      // Clear cache and refresh news to include new feed
      await storage.remove(STORAGE_KEYS.CACHE)
      await fetchNews(true)
    } catch (error) {
      console.error('Failed to add custom feed:', error)
      alert('Invalid URL format!')
    } finally {
      setIsAddingFeed(false)
    }
  }

  // Remove custom feed
  const removeCustomFeed = async (url: string) => {
    const updatedFeeds = customFeeds.filter(f => f.url !== url)
    setCustomFeeds(updatedFeeds)
    await storage.set(STORAGE_KEYS.CUSTOM_FEEDS, updatedFeeds)

    // Clear cache and refresh
    await storage.remove(STORAGE_KEYS.CACHE)
    await fetchNews(true)
  }

  const clearCache = async () => {
    try {
      await storage.clear()
      await fetchNews(true)
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const fetchFullContent = async (newsItem: NewsItem) => {
    try {
      setNews(prev => prev.map(item =>
        item.id === newsItem.id
          ? { ...item, isFetchingFullContent: true }
          : item
      ))

      // Check cached content in IndexedDB first
      const cacheKey = `content_${newsItem.id}`
      const cached = await storage.get<{ text: string; timestamp: number }>(cacheKey)

      // Use cached content if available and not too old (24 hours)
      if (cached && cached.text && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        const content = cached.text
        updateNewsItemWithContent(newsItem.id, content, false)
        return
      }

      // Fetch full content from backend API
      const response = await fetch('/api/fetch-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newsItem.url }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        const content = result.data.text || result.data.html || newsItem.content || newsItem.description

        // Cache the content
        await storage.set(cacheKey, { text: content, timestamp: Date.now() })

        updateNewsItemWithContent(newsItem.id, content, false)
      } else {
        // Fall back to RSS content if fetching fails
        const fallbackContent = newsItem.content || newsItem.description
        updateNewsItemWithContent(newsItem.id, fallbackContent, false)
      }
    } catch (error) {
      console.error('Failed to fetch full content:', error)
      // Fall back to RSS content on error
      const fallbackContent = newsItem.content || newsItem.description
      updateNewsItemWithContent(newsItem.id, fallbackContent, false)
    }
  }

  const updateNewsItemWithContent = (id: string, content: string, isFetching: boolean) => {
    setNews(prev => prev.map(item =>
      item.id === id
        ? { ...item, fullContent: content, isFetchingFullContent: isFetching }
        : item
    ))

    setFilteredNews(prev => prev.map(item =>
      item.id === id
        ? { ...item, fullContent: content, isFetchingFullContent: isFetching }
        : item
    ))

    // Stop drawer loading when content is loaded
    if (!isFetching) {
      setDrawerLoading(false)
    }

    // Update selected news if it's currently open
    setSelectedNews(prev => {
      if (prev && prev.id === id) {
        return {
          ...prev,
          fullContent: content,
          isFetchingFullContent: isFetching
        }
      }
      return prev
    })
  }

  const openNews = (item: NewsItem) => {
    setSelectedNews(item)

    // Only fetch if content doesn't exist
    if (!item.fullContent) {
      fetchFullContent(item)
    }
  }

  const closeDrawer = () => {
    setSelectedNews(null)
    setDrawerLoading(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    }
    if (diffInSeconds < 172800) return 'Yesterday'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTimeSinceLastUpdate = () => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    }
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredNews.length / NEWS_PER_PAGE)
  const startIndex = (currentPage - 1) * NEWS_PER_PAGE
  const endIndex = startIndex + NEWS_PER_PAGE
  const currentNews = filteredNews.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isAnimating) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center retro-initial-loading px-4">
        <div className="text-center space-y-3 sm:space-y-4 animate-fade-in retro-loading-container">
          {/* Retro Logo */}
          <div className="inline-block w-16 h-16 sm:w-24 sm:h-24 border-4 sm:border-8 border-double border-black bg-black flex items-center justify-center retro-initial-logo animate-pulse">
            <span className="text-white font-black font-mono text-3xl sm:text-5xl">R</span>
          </div>

          {/* Retro Title */}
          <h1 className="text-3xl sm:text-5xl font-black font-mono text-black tracking-widest retro-initial-title animate-slide-up">
            RETRUI
          </h1>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest animate-slide-up" style={{ animationDelay: '0.1s' }}>
            News Portal
          </p>

          {/* Retro Loading Indicator */}
          <div className="mt-6 sm:mt-8 retro-initial-loader">
            <div className="text-sm font-mono font-bold text-black animate-blink">LOADING_</div>
            <div className="space-y-1 mt-2">
              <div className="h-1.5 sm:h-2 bg-black animate-loading-bar" style={{ animationDelay: '0s' }}></div>
              <div className="h-1.5 sm:h-2 bg-black animate-loading-bar" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-1.5 sm:h-2 bg-black animate-loading-bar" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} flex`}>
      {/* Sidebar - Category Filters - Retro Style */}
      <aside className={`sidebar-filters fixed left-0 top-0 bottom-0 w-48 border-r-4 ${darkMode ? 'border-gray-600 bg-gray-900' : 'border-black bg-white'} z-40 retro-sidebar`}>
        <div className="h-full flex flex-col justify-between p-4 retro-panel">
          <div>
            {/* Retro Header */}
            <div className={`mb-4 p-2 border-4 border-double flex items-center justify-center retro-selected-box ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-black'}`}>
              <p className={`text-xs font-bold font-mono tracking-widest ${darkMode ? 'text-white' : 'text-white'}`}>SYSTEM</p>
            </div>

            {/* Technology Category with Dropdown - Retro Style */}
            <div className="mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-xs font-bold font-mono uppercase tracking-widest px-3 py-2 border-2 transition-all retro-button ${darkMode ? 'text-white hover:bg-white hover:text-black border-gray-600 bg-gray-800' : 'text-black hover:bg-black hover:text-white border-black bg-white'}`}
                  >
                    <span>[ TECHNOLOGY ]</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={`w-48 retro-dropdown ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-white'}`} align="start">
                  {TECHNOLOGY_CATEGORIES.map(category => (
                    <DropdownMenuItem
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`text-xs font-mono ${selectedCategory === category.value ? (darkMode ? 'bg-white text-gray-900' : 'bg-black text-white') : (darkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200')}`}
                    >
                      {selectedCategory === category.value ? '▸ ' : '  '}{category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Current selected category - Retro Style */}
            <div className={`mb-4 p-3 border-4 border-double text-center retro-selected-box ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-black'}`}>
              <p className={`text-xs font-mono uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>[SELECTED]</p>
              <p className={`text-sm font-bold font-mono tracking-wider ${darkMode ? 'text-white' : 'text-white'}`}>
                {selectedCategory}
              </p>
            </div>

            {/* Stats - Retro Style */}
            <div className={`mb-4 p-2 border-2 retro-stats ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-gray-100'}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-mono uppercase ${darkMode ? 'text-white' : 'text-black'}`}>Articles:</p>
                <p className={`text-xs font-bold font-mono ${darkMode ? 'text-white' : 'text-black'}`}>{filteredNews.length}</p>
              </div>
            </div>

            {/* Add Feed Dialog */}
            <Dialog open={showAddFeedDialog} onOpenChange={setShowAddFeedDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full mb-4 text-xs font-bold font-mono uppercase border-2 px-3 py-2 transition-all ${darkMode ? 'text-white hover:bg-white hover:text-black border-gray-600 bg-gray-800' : 'text-black hover:bg-black hover:text-white border-black bg-white'}`}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  ADD FEED
                </Button>
              </DialogTrigger>
              <DialogContent className={`${darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-black text-black'} border-4`}>
                <DialogHeader>
                  <DialogTitle className="font-mono text-lg">[ ADD CUSTOM RSS FEED ]</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase">Feed Name</Label>
                    <Input
                      value={newFeedName}
                      onChange={(e) => setNewFeedName(e.target.value)}
                      placeholder="My Custom Feed"
                      className={`font-mono border-2 rounded-none ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase">Feed URL</Label>
                    <Input
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                      placeholder="https://example.com/rss.xml"
                      className={`font-mono border-2 rounded-none ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase">Category</Label>
                    <Select value={newFeedCategory} onValueChange={setNewFeedCategory}>
                      <SelectTrigger className={`font-mono border-2 rounded-none ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'}`}>
                        {TECHNOLOGY_CATEGORIES.filter(c => c.value !== 'All').map(category => (
                          <SelectItem key={category.value} value={category.value} className="font-mono">
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={addCustomFeed}
                      disabled={isAddingFeed || !newFeedName.trim() || !newFeedUrl.trim()}
                      className={`flex-1 font-mono text-xs uppercase border-2 ${darkMode ? 'bg-white text-black hover:bg-gray-200 border-white' : 'bg-black text-white hover:bg-gray-800 border-black'}`}
                    >
                      {isAddingFeed ? 'ADDING...' : 'ADD FEED'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddFeedDialog(false)}
                      className={`flex-1 font-mono text-xs uppercase border-2 ${darkMode ? 'text-white border-gray-600 hover:bg-gray-800' : 'text-black border-black hover:bg-gray-100'}`}
                    >
                      CANCEL
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Custom Feeds List */}
            {customFeeds.length > 0 && (
              <div className={`mb-4 p-2 border-2 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-gray-100'}`}>
                <p className={`text-xs font-mono uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>MY FEEDS:</p>
                <div className="space-y-1">
                  {customFeeds.map(feed => (
                    <div key={feed.url} className="flex items-center justify-between group">
                      <span className={`text-xs font-mono truncate flex-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                        {feed.name}
                      </span>
                      <button
                        onClick={() => removeCustomFeed(feed.url)}
                        className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'}`}
                        title="Remove feed"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`text-xs font-mono text-center retro-footer p-2 border-2 border-t-0 ${darkMode ? 'text-white border-gray-600' : 'text-black border-black'}`}>
            <p>UPDATED</p>
            <p className="font-bold">{formatTimeSinceLastUpdate()}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-48">
        {/* Header - Retro Style */}
        <header className={`sticky top-0 z-30 px-2 sm:px-4 py-2 sm:py-3 border-b-4 retro-header ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-black'}`}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Retro Logo */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 border-2 sm:border-4 flex items-center justify-center retro-logo ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-black'}`}>
                    <span className={`font-bold font-mono text-base sm:text-xl ${darkMode ? 'text-white' : 'text-white'}`}>R</span>
                  </div>
                  <div className="hidden sm:block">
                    <span className={`text-xl sm:text-2xl font-black tracking-wider font-mono retro-title ${darkMode ? 'text-white' : 'text-black'}`}>RETRUI</span>
                    <span className={`block text-xs font-mono tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>NEWS PORTAL</span>
                  </div>
                </div>

                {/* Mobile Category Dropdown - Retro */}
                <div className="lg:hidden ml-2 sm:ml-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs font-bold font-mono uppercase border-2 sm:border-4 sm:border-double px-2 sm:px-3 py-1.5 sm:py-2 retro-mobile-filter hover:bg-white hover:text-black transition-all ${darkMode ? 'text-white border-gray-600 bg-gray-800' : 'text-black border-black bg-white'}`}
                      >
                        <span className="flex items-center gap-2">
                          [{selectedCategory}]
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={`w-48 retro-dropdown ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-white'}`} align="start">
                      {TECHNOLOGY_CATEGORIES.map(category => (
                        <DropdownMenuItem
                          key={category.value}
                          onClick={() => setSelectedCategory(category.value)}
                          className={`text-xs font-mono ${selectedCategory === category.value ? (darkMode ? 'bg-white text-gray-900' : 'bg-black text-white') : (darkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200')}`}
                        >
                          {selectedCategory === category.value ? '▸ ' : '  '}{category.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* Dark Mode Toggle - Retro */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`text-xs font-bold font-mono uppercase border-2 px-2 sm:px-3 py-1.5 sm:py-2 retro-header-button transition-all ${darkMode ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black' : 'text-black border-black bg-white hover:bg-black hover:text-white'}`}
                  title="Toggle dark mode"
                >
                  <span className="sm:hidden">{darkMode ? '☀' : '☾'}</span>
                  <span className="hidden sm:inline">{darkMode ? '☀ LIGHT' : '☾ DARK'}</span>
                </Button>

                {/* Refresh Button - Retro */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNews(true)}
                  disabled={isRefreshing}
                  className={`text-xs font-bold font-mono uppercase border-2 px-2 sm:px-3 py-1.5 sm:py-2 retro-header-button transition-all ${darkMode ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black' : 'text-black border-black bg-white hover:bg-black hover:text-white'}`}
                  title="Refresh news"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline ml-1">REFRESH</span>
                </Button>

                {/* Clear Cache Button - Retro */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCache}
                  className={`text-xs font-bold font-mono uppercase border-2 px-2 sm:px-3 py-1.5 sm:py-2 retro-header-button transition-all hidden sm:flex ${darkMode ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black' : 'text-black border-black bg-white hover:bg-black hover:text-white'}`}
                  title="Clear cache"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1">CLEAR</span>
                </Button>

                {/* Search - Retro */}
                <div className="relative">
                  {showSearch ? (
                    <div className="flex items-center gap-1 sm:gap-2 retro-search-box">
                      <Input
                        type="text"
                        placeholder="SEARCH..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-32 sm:w-48 md:w-64 border-2 sm:border-4 sm:border-double rounded-none px-2 sm:px-3 py-1.5 sm:py-2 focus-visible:ring-0 text-black font-mono text-xs sm:text-sm retro-input ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-black text-black'}`}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowSearch(false)
                          setSearchQuery('')
                        }}
                        className={`text-xs font-bold font-mono uppercase border-2 px-2 sm:px-3 py-1.5 sm:py-2 retro-header-button transition-all ${darkMode ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black' : 'text-black border-black bg-white hover:bg-black hover:text-white'}`}
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSearch(true)}
                      className={`text-xs font-bold font-mono uppercase border-2 px-2 sm:px-3 py-1.5 sm:py-2 retro-header-button transition-all ${darkMode ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black' : 'text-black border-black bg-white hover:bg-black hover:text-white'}`}
                    >
                      <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline ml-1">SEARCH</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* News List */}
        <main className="px-3 sm:px-4 py-4 sm:py-6 pb-40 sm:pb-32">
          <div className="max-w-3xl mx-auto w-full">
            {loading ? (
              // Loading Skeleton - Retro Style
              Array.from({ length: 6 }).map((_, i) => (
                <article key={i} className={`py-4 px-4 border-b-2 retro-skeleton-item ${darkMode ? 'border-gray-700' : 'border-black'}`}>
                  <div className="space-y-2 animate-pulse retro-skeleton">
                    <div className={`h-4 w-32 retro-skeleton-bar ${darkMode ? 'bg-gray-700' : 'bg-black bg-opacity-20'}`}></div>
                    <div className={`h-6 w-full retro-skeleton-bar ${darkMode ? 'bg-gray-600' : 'bg-black bg-opacity-30'}`}></div>
                    <div className={`h-4 w-full retro-skeleton-bar ${darkMode ? 'bg-gray-700' : 'bg-black bg-opacity-10'}`}></div>
                    <div className={`h-4 w-2/3 retro-skeleton-bar ${darkMode ? 'bg-gray-700' : 'bg-black bg-opacity-10'}`}></div>
                    <div className={`h-4 w-48 retro-skeleton-bar ${darkMode ? 'bg-gray-600' : 'bg-black bg-opacity-15'}`}></div>
                  </div>
                </article>
              ))
            ) : filteredNews.length === 0 ? (
              // Empty State - Retro Style
              <div className="py-24 text-center retro-empty-state">
                <div className="inline-block p-8 border-4 border-double bg-white retro-empty-box">
                  <p className={`text-lg font-bold font-mono uppercase mb-2 retro-empty-box ${darkMode ? 'text-white border-gray-600 bg-gray-800' : 'text-black border-black bg-white'}`}>[ NO RESULTS ]</p>
                  <p className={`text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try different filters</p>
                </div>
              </div>
            ) : (
              <>
                {/* News List - Retro Style */}
                <div className="space-y-1 retro-news-list">
                  {currentNews.map((item, index) => (
                    <article
                      key={item.id}
                      className={`py-3 px-3 sm:py-4 sm:px-4 border-b-2 cursor-pointer hover:bg-black hover:text-white transition-all animate-fade-in retro-news-item ${darkMode ? 'border-gray-700' : 'border-black'}`}
                      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                      onClick={() => openNews(item)}
                    >
                      <div className="space-y-2">
                        {/* Category and Time - Retro */}
                        <div className="flex items-center justify-between retro-meta">
                          <span className={`text-xs font-bold font-mono uppercase tracking-widest retro-category hover:text-white ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            [{item.category}]
                          </span>
                          <div className={`flex items-center gap-1 text-xs font-mono hover:text-gray-300 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                            <Clock className="w-3 h-3" />
                            <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
                          </div>
                        </div>

                        {/* Title - Retro */}
                        <h2 className={`text-base sm:text-lg font-bold leading-tight hover:text-white transition-colors retro-title font-mono ${darkMode ? 'text-white' : 'text-black'}`}>
                          {item.title}
                        </h2>

                        {/* Description - Retro */}
                        <p className={`text-sm leading-relaxed line-clamp-2 hover:text-gray-200 retro-description ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {item.description}
                        </p>

                        {/* Source - Retro */}
                        <span className={`text-xs font-mono hover:text-gray-300 retro-source ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                          SOURCE: {item.source.toUpperCase()}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination - Retro Style */}
                {totalPages > 1 && (
                  <nav aria-label="News pagination" className={`mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-4 retro-pagination ${darkMode ? 'border-gray-600' : 'border-black'}`}>
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`text-xs font-bold font-mono uppercase border-2 px-2 sm:px-3 py-1.5 sm:py-2 retro-pagination-button transition-all disabled:opacity-30 disabled:cursor-not-allowed ${darkMode ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black' : 'text-black border-black bg-white hover:bg-black hover:text-white'}`}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline ml-1">PREV</span>
                      </Button>

                      {/* Page numbers - CSS hides extra numbers on mobile */}
                      <div className="flex items-center gap-0.5 sm:gap-1 retro-page-numbers">
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                          const maxPages = 5
                          let pageNum
                          if (totalPages <= maxPages) {
                            pageNum = i + 1
                          } else if (currentPage <= Math.floor(maxPages / 2)) {
                            pageNum = i < maxPages - 2 ? i + 1 : (i === maxPages - 2 ? -1 : totalPages)
                          } else if (currentPage >= totalPages - Math.floor(maxPages / 2) + 1) {
                            pageNum = i < 2 ? i + 1 : (i === 2 ? -1 : totalPages - maxPages + 1 + i)
                          } else {
                            pageNum = i === 0 ? 1 : (i === 1 ? -1 : (i === maxPages - 1 ? totalPages : currentPage - Math.floor(maxPages / 2) + i))
                          }

                          if (pageNum === -1) {
                            return (
                              <span key={i} className={`px-1.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono font-bold retro-ellipsis ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                ...
                              </span>
                            )
                          }

                          return (
                            <Button
                              key={i}
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={`min-w-[32px] sm:min-w-[40px] text-xs font-bold font-mono border-2 py-1.5 sm:py-2 retro-page-number ${currentPage === pageNum
                                ? darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
                                : darkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border-gray-600' : 'bg-white text-black hover:bg-gray-200 border-black'
                                }`}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`text-xs font-bold font-mono uppercase border-2 px-2 sm:px-3 py-1.5 sm:py-2 retro-pagination-button transition-all disabled:opacity-30 disabled:cursor-not-allowed ${darkMode ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black' : 'text-black border-black bg-white hover:bg-black hover:text-white'}`}
                        aria-label="Next page"
                      >
                        <span className="hidden sm:inline mr-1">NEXT</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>

                    <div className={`mt-3 sm:mt-4 text-center text-xs font-mono border-2 py-1.5 sm:py-2 retro-pagination-info ${darkMode ? 'text-white border-gray-600 bg-gray-800' : 'text-black border-black bg-gray-50'}`}>
                      <span className="hidden sm:inline">[ PAGE {currentPage} OF {totalPages} ] • [ {filteredNews.length} ARTICLES ]</span>
                      <span className="sm:hidden">{currentPage}/{totalPages} • {filteredNews.length}</span>
                    </div>
                  </nav>
                )}
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className={`fixed bottom-0 left-0 right-0 z-30 border-t-4 ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-black'}`}>
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4">
              {/* Left - Developer Credits */}
              <div className={`flex items-center gap-2 sm:gap-4 text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="hidden sm:inline">DEVELOPED BY</span>
                <a
                  href="https://x.com/xenit_v0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 hover:underline transition-all ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}
                >
                  <Twitter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="font-bold">@xenit_v0</span>
                </a>
              </div>

              {/* Center - Links */}
              <div className={`flex items-center gap-3 sm:gap-4 text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Link
                  href="/about"
                  className={`flex items-center gap-1 hover:underline transition-all ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}
                >
                  <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>ABOUT</span>
                </Link>
                <a
                  href="https://github.com/xenitV1/retrui"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 hover:underline transition-all ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}
                >
                  <Github className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>GITHUB</span>
                </a>
              </div>

              {/* Right - Copyright & AI Credit */}
              <div className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <span>© 2024 RETRUI</span>
                <span className="hidden sm:inline">•</span>
                <span>Built with GLM 4.7 | Thanks to <a href="https://z.ai" target="_blank" rel="noopener noreferrer" className={`hover:underline ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}>z.ai</a></span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Right Drawer - Blog Reading Mode */}
      {selectedNews && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeDrawer}
          />

          {/* Drawer - Retro Style */}
          <aside className={`fixed right-0 top-0 bottom-0 w-full lg:w-[600px] border-l-4 z-50 overflow-y-auto transform transition-transform duration-300 animate-slide-in-right retro-drawer ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-black'}`}>
            <div className="max-w-2xl mx-auto p-6 blog-reading-mode retro-drawer-content">
              {/* Header - Retro */}
              <div className={`sticky top-0 border-b-4 border-double py-4 mb-8 flex items-center justify-between retro-drawer-header ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-black'}`}>
                <div className="flex-1 min-w-0 mr-4 retro-meta-info">
                  <span className={`text-xs font-bold font-mono uppercase tracking-widest block mb-1 retro-category ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    [{selectedNews.category}]
                  </span>
                  <div className={`text-xs font-mono retro-source-date ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    SOURCE: {selectedNews.source.toUpperCase()} • DATE: {formatDate(selectedNews.publishedAt)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeDrawer}
                  className={`text-xs font-bold font-mono uppercase border-2 px-3 py-2 retro-close-button transition-all flex-shrink-0 ${darkMode ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black' : 'text-black border-black bg-white hover:bg-black hover:text-white'}`}
                >
                  <X className="w-4 h-4" />
                  <span className="ml-1">CLOSE</span>
                </Button>
              </div>

              {/* Content - Retro */}
              <article className="prose prose-lg max-w-none blog-content retro-article">
                <h1 className={`text-2xl sm:text-3xl font-black font-mono mb-6 retro-article-title leading-tight ${darkMode ? 'text-white' : 'text-black'}`}>
                  {selectedNews.title}
                </h1>

                {!selectedNews.fullContent || selectedNews.isFetchingFullContent || drawerLoading ? (
                  <div className="space-y-4 retro-loading">
                    {/* Retro Loading Indicator */}
                    <div className={`text-center py-12 border-4 border-double retro-loader-box ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-gray-50'}`}>
                      <div className="inline-block retro-loader">
                        <div className={`text-2xl font-mono font-bold mb-4 tracking-widest animate-pulse ${darkMode ? 'text-yellow-400' : 'text-black'}`}>
                          LOADING
                        </div>
                        <div className="space-y-2">
                          <div className={`h-1 animate-loading-bar ${darkMode ? 'bg-yellow-400' : 'bg-black'}`} style={{ animationDelay: '0s' }}></div>
                          <div className={`h-1 animate-loading-bar ${darkMode ? 'bg-yellow-400' : 'bg-black'}`} style={{ animationDelay: '0.1s' }}></div>
                          <div className={`h-1 animate-loading-bar ${darkMode ? 'bg-yellow-400' : 'bg-black'}`} style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                      <p className={`text-sm font-mono mt-4 ${darkMode ? 'text-yellow-300' : 'text-gray-500'}`}>
                        {selectedNews.isFetchingFullContent ? 'Fetching full content...' : 'Preparing content...'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={`leading-relaxed whitespace-pre-wrap blog-text retro-blog-text ${darkMode ? 'text-white' : 'text-black'}`}>
                    {selectedNews.fullContent}
                  </div>
                )}
              </article>

              {/* Footer Actions - Retro */}
              <div className={`mt-12 pt-8 border-t-4 border-double retro-drawer-footer ${darkMode ? 'border-gray-600' : 'border-black'}`}>
                <div className={`p-4 border-2 retro-author-box mb-6 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-gray-50'}`}>
                  <div className={`text-xs font-mono retro-author-label ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>AUTHOR: {selectedNews.author.toUpperCase()}</p>
                    <p>PUBLISHED: {formatDate(selectedNews.publishedAt)}</p>
                  </div>
                </div>

                <Button
                  onClick={() => window.open(selectedNews.url, '_blank')}
                  className={`text-xs font-bold font-mono uppercase border-4 border-double transition-all px-8 py-4 w-full sm:w-auto retro-read-button ${darkMode ? 'text-white border-gray-600 bg-gray-700 hover:bg-gray-600' : 'text-white border-black bg-black hover:bg-gray-800'}`}
                >
                  [ READ ORIGINAL ARTICLE ]
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes loading-bar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes blink {
          0%, 50%, 100% {
            opacity: 1;
          }
          25%, 75% {
            opacity: 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        /* Blog Reading Mode */
        .blog-reading-mode {
          font-family: Georgia, 'Times New Roman', Times, serif;
        }

        .blog-content {
          font-family: Georgia, 'Times New Roman', Times, serif;
          font-size: 18px;
          line-height: 1.8;
        }

        .blog-text {
          font-family: Georgia, 'Times New Roman', Times, serif;
          font-size: 18px;
          line-height: 1.8;
        }

        .blog-text p {
          margin-bottom: 1.5em;
        }

        /* Sidebar filters - responsive */
        .sidebar-filters {
          display: block;
          box-shadow: 4px 0 0 #000;
        }

        @media (max-width: 1024px) {
          .sidebar-filters {
            display: none;
          }
        }

        /* Retro Sidebar Styles */
        .retro-panel {
          font-family: 'Courier New', Courier, monospace;
          background-image: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.02) 0px,
            rgba(0, 0, 0, 0.02) 1px,
            transparent 1px,
            transparent 2px
          );
        }

        .retro-button {
          box-shadow: 3px 3px 0 #000;
          transition: all 0.1s;
        }

        .retro-button:hover {
          box-shadow: 1px 1px 0 #000;
          transform: translate(2px, 2px);
        }

        .retro-button:active {
          box-shadow: none;
          transform: translate(3px, 3px);
        }

        .retro-dropdown {
          border: 4px double #000;
          background: #fff;
          box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.2);
        }

        .dark .retro-dropdown {
          border-color: #4b5563;
          background: #1f2937;
          box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.4);
        }

        .retro-selected-box {
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
        }

        .retro-stats {
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
        }

        .retro-footer {
          background-image: repeating-linear-gradient(
            90deg,
            #000 0px,
            #000 1px,
            transparent 1px,
            transparent 4px
          );
        }

        /* Retro Header Styles */
        .retro-header {
          box-shadow: 0 4px 0 #000;
        }

        .retro-logo {
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
        }

        .retro-title {
          text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
        }

        .retro-mobile-filter {
          box-shadow: 3px 3px 0 #000;
        }

        .retro-mobile-filter:hover {
          box-shadow: 1px 1px 0 #000;
          transform: translate(2px, 2px);
        }

        .retro-header-button {
          box-shadow: 3px 3px 0 #000;
          transition: all 0.1s;
        }

        .retro-header-button:hover {
          box-shadow: 1px 1px 0 #000;
          transform: translate(2px, 2px);
        }

        .retro-header-button:active {
          box-shadow: none;
          transform: translate(3px, 3px);
        }

        .retro-search-box {
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
        }

        .retro-input {
          box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .retro-input:focus {
          box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 4px rgba(0, 0, 0, 0.1);
        }

        /* Retro News List */
        .retro-news-list {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-news-item {
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .retro-news-item:hover {
          box-shadow: 4px 4px 0 #000;
          transform: translate(-2px, -2px);
        }

        .retro-meta {
          border-bottom: 1px dotted rgba(0, 0, 0, 0.2);
          padding-bottom: 4px;
        }

        .retro-category {
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 6px;
        }

        .retro-title {
          font-family: 'Courier New', Courier, monospace;
          text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.1);
        }

        .retro-description {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-source {
          background: rgba(0, 0, 0, 0.03);
          padding: 2px 6px;
          display: inline-block;
        }

        /* Retro Skeleton */
        .retro-skeleton-item {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-skeleton {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.05) 75%);
          background-size: 200% 100%;
          animation: loading-bar 1.5s ease-in-out infinite;
        }

        .retro-skeleton-bar {
          border-radius: 2px;
        }

        /* Retro Pagination */
        .retro-pagination {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-pagination-button {
          box-shadow: 3px 3px 0 #000;
          transition: all 0.1s;
        }

        .retro-pagination-button:hover:not(:disabled) {
          box-shadow: 1px 1px 0 #000;
          transform: translate(2px, 2px);
        }

        .retro-pagination-button:active:not(:disabled) {
          box-shadow: none;
          transform: translate(3px, 3px);
        }

        .retro-page-numbers {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-page-number {
          box-shadow: 2px 2px 0 #000;
          transition: all 0.1s;
        }

        .retro-page-number:hover {
          box-shadow: 1px 1px 0 #000;
          transform: translate(1px, 1px);
        }

        .retro-ellipsis {
          background: rgba(0, 0, 0, 0.05);
        }

        .retro-pagination-info {
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
        }

        /* Retro Drawer */
        .retro-drawer {
          box-shadow: -4px 0 0 #000;
        }

        .retro-drawer-content {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-drawer-header {
          box-shadow: 0 4px 0 #000;
        }

        .retro-meta-info {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-close-button {
          box-shadow: 3px 3px 0 #000;
          transition: all 0.1s;
        }

        .retro-close-button:hover {
          box-shadow: 1px 1px 0 #000;
          transform: translate(2px, 2px);
        }

        .retro-article {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-article-title {
          border-bottom: 4px double #000;
          padding-bottom: 16px;
          text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
        }

        .retro-blog-text {
          font-family: 'Courier New', Courier, monospace;
          background: transparent;
          padding: 20px;
          border: 2px solid #000;
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
          font-weight: 500;
          color: black;
        }

        .dark .retro-blog-text {
          border-color: #4b5563;
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4);
          color: white;
        }

        .retro-drawer-footer {
          box-shadow: 0 -4px 0 #000;
        }

        .retro-author-box {
          box-shadow: 2px 2px 0 #000;
        }

        .retro-author-label {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-read-button {
          box-shadow: 4px 4px 0 #000;
          transition: all 0.1s;
        }

        .retro-read-button:hover {
          box-shadow: 2px 2px 0 #000;
          transform: translate(2px, 2px);
        }

        .retro-read-button:active {
          box-shadow: none;
          transform: translate(4px, 4px);
        }

        /* Retro Loading */
        .retro-loading {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-loader {
          border: 4px double #000;
          padding: 2rem;
          box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
          background: #fff;
        }

        .retro-loader-box {
          box-shadow: 4px 4px 0 #000;
        }

        /* Retro Empty State */
        .retro-empty-state {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-empty-box {
          box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
        }

        /* Retro Initial Loading */
        .retro-initial-loading {
          font-family: 'Courier New', Courier, monospace;
          background-image: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.01) 0px,
            rgba(0, 0, 0, 0.01) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        .retro-loading-container {
          font-family: 'Courier New', Courier, monospace;
        }

        .retro-initial-logo {
          box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.3);
        }

        .retro-initial-title {
          text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
        }

        .retro-initial-loader {
          font-family: 'Courier New', Courier, monospace;
        }

        /* Minimal scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: white;
          border-left: 2px solid black;
        }

        ::-webkit-scrollbar-thumb {
          background: black;
          border: 2px solid white;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #333;
        }

        /* Line clamp utilities */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
