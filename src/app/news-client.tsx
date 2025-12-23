'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Search, Clock, X, RefreshCw, ChevronLeft, ChevronRight, Filter, ExternalLink, ArrowRight, Trash2, ChevronDown, Twitter, Github, Info, Plus, Settings, LayoutTemplate, Menu, Globe } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { storage, STORAGE_KEYS } from '@/lib/indexeddb'
import { RSS_FEEDS, MAIN_CATEGORIES, type RssFeed } from '@/lib/rss-feeds'
import {
  getFeedPreferences,
  filterEnabledFeeds,
  type FeedPreferences
} from '@/lib/feed-preferences'
import { FeedSettingsPanel } from '@/components/feed-settings-panel'
import { ColumnSettingsPanel } from '@/components/column-settings-panel'
import {
  getActiveLayout,
  getFeedsForColumn,
  type ColumnLayout,
  type Column
} from '@/lib/column-layouts'
import {
  recordFeedSuccess,
  recordFeedFailure,
  filterAvailableFeeds,
  isFeedAvailable
} from '@/lib/feed-health'
import { LanguageSwitcher } from '@/components/language-switcher'
import { type Locale } from '@/i18n/config'
import { useTranslations } from '@/i18n/use-translations'


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
const REFRESH_INTERVAL_SECONDS = 300 // 5 minutes

// Batching configuration for feed fetching
const BATCH_SIZE = 10        // Fetch 10 feeds at a time
const BATCH_DELAY = 50       // 50ms delay between batches

// Category definitions - imported from @/lib/rss-feeds
// MAIN_CATEGORIES: ['All', 'News', 'Business', 'Technology', 'Science', 'Sports', 'Entertainment', 'Lifestyle', 'Opinion']

// Convert MAIN_CATEGORIES to object format with name/value
const CATEGORY_OPTIONS = MAIN_CATEGORIES.map(cat => ({ name: cat, value: cat }))

// RSS_FEEDS - imported from @/lib/rss-feeds (180+ feeds across 8 main categories)

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
  currentLocale: Locale
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
    // Check if feed is available (not disabled by circuit breaker)
    const isAvailable = await isFeedAvailable(feed.url)
    if (!isAvailable) {
      // Development mode logging only
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FeedHealth] Skipping disabled feed: ${feed.name}`)
      }
      return []
    }

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
      // Get detailed error from response if available
      let errorMessage = response.statusText
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response is not JSON, use status text
      }

      // Map status codes to user-friendly messages
      const statusMessages: Record<number, string> = {
        400: 'Bad Request',
        404: 'Not Found',
        422: 'Invalid Feed Format',
        504: 'Timeout',
        500: 'Server Error'
      }

      const message = statusMessages[response.status] || 'Error'

      // Record failure in health tracking
      await recordFeedFailure(feed.url, `${response.status}: ${errorMessage}`)

      // Development mode logging only
      if (process.env.NODE_ENV === 'development') {
        console.warn(`RSS feed ${feed.name} returned ${response.status} (${message}): ${errorMessage}`)
      }
      return []
    }

    const result = await response.json()

    if (!result.success || !result.data) {
      // Record failure in health tracking
      await recordFeedFailure(feed.url, result.error || 'Unknown error')

      // Development mode logging only
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Invalid RSS feed response from ${feed.name}: ${result.error || 'Unknown error'}`)
      }
      return []
    }

    const feedData = result.data as RSSFeed

    // 24-hour filter: Only include news from the last 24 hours
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)

    const news = (feedData.items || [])
      .slice(0, 15)
      .map((item) => ({
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
      // Filter: only news from last 24 hours
      .filter(item => {
        const publishedTime = new Date(item.publishedAt).getTime()
        // If date parsing fails, include the item (fallback)
        if (isNaN(publishedTime)) return true
        return publishedTime >= twentyFourHoursAgo
      })

    // Cache the results
    await storage.set(cacheKey, { data: news, timestamp: Date.now() })

    // Record success in health tracking
    await recordFeedSuccess(feed.url)

    return news
  } catch (error) {
    // Record failure in health tracking
    const errorMessage = error instanceof Error ? error.message : String(error)
    await recordFeedFailure(feed.url, errorMessage)

    // Development mode logging only
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Error fetching RSS feed from ${feed.name}:`, error)
    }
    return []
  }
}

// Fetch DEFAULT feeds only (Left Column) - with feed preferences
// Returns a callback that updates state as each feed completes
async function fetchDefaultNewsIncremental(
  feedPreferences: FeedPreferences | undefined,
  onUpdate: (items: NewsItem[]) => void,
  onProgress?: () => void,
  language?: string,
  signal?: AbortSignal
): Promise<void> {
  try {
    // Check if aborted
    if (signal?.aborted) return

    // Cache key depends ONLY on RSS language filter (not UI locale)
    const cacheKey = feedPreferences
      ? `default_news_cache_${JSON.stringify(feedPreferences)}_${language || 'all'}`
      : `default_news_cache_${language || 'all'}`

    const cached = await storage.get<{ data: NewsItem[], timestamp: number }>(cacheKey)

    if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) { // 2 minutes cache
      onUpdate(cached.data)
      return
    }

    // Filter feeds based on user preferences
    let feedsToFetch = feedPreferences
      ? filterEnabledFeeds(RSS_FEEDS, feedPreferences)
      : RSS_FEEDS

    // Filter by language if specified
    if (language && language !== 'All') {
      feedsToFetch = feedsToFetch.filter(feed => feed.language === language)
    }

    // Filter out disabled feeds using circuit breaker
    const { available } = await filterAvailableFeeds(feedsToFetch)

    const allNews: NewsItem[] = []

    // Fetch feeds in batches to reduce server load
    for (let i = 0; i < available.length; i += BATCH_SIZE) {
      // Check if aborted before each batch
      if (signal?.aborted) return

      const batch = available.slice(i, i + BATCH_SIZE)

      // Fetch all feeds in this batch in parallel
      const batchResults = await Promise.all(
        batch.map(feed => fetchRSSFeed(feed))
      )

      // Add results to allNews
      for (const items of batchResults) {
        allNews.push(...items)
      }

      // Sort by publication date (newest first)
      allNews.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )

      // Update state with current progress
      onUpdate(allNews.slice(0, 100))

      // Call progress callback for each feed in batch
      if (onProgress) {
        for (let j = 0; j < batch.length; j++) {
          onProgress()
        }
      }

      // Add delay between batches (except after last batch)
      if (i + BATCH_SIZE < available.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
      }
    }

    // Check if aborted before caching
    if (signal?.aborted) return

    // Cache the final results
    await storage.set(cacheKey, { data: allNews.slice(0, 100), timestamp: Date.now() })
  } catch (error) {
    // Only log if not aborted
    if (signal?.aborted) return
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in fetchDefaultNewsIncremental:', error)
    }
  }
}

// Fetch CUSTOM feeds only (Right Column) - incremental
async function fetchCustomNewsIncremental(
  customFeeds: CustomFeed[],
  onUpdate: (items: NewsItem[]) => void,
  onProgress?: () => void,
  signal?: AbortSignal
): Promise<void> {
  if (customFeeds.length === 0) return

  try {
    // Check if aborted
    if (signal?.aborted) return

    const cacheKey = 'custom_news_cache'
    const cached = await storage.get<{ data: NewsItem[], timestamp: number }>(cacheKey)

    if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) { // 2 minutes cache
      onUpdate(cached.data)
      return
    }

    // Filter out disabled feeds using circuit breaker
    const { available } = await filterAvailableFeeds(customFeeds)

    const allNews: NewsItem[] = []

    // Fetch feeds in batches to reduce server load
    for (let i = 0; i < available.length; i += BATCH_SIZE) {
      // Check if aborted before each batch
      if (signal?.aborted) return

      const batch = available.slice(i, i + BATCH_SIZE)

      // Fetch all feeds in this batch in parallel
      const batchResults = await Promise.all(
        batch.map(feed => fetchRSSFeed(feed))
      )

      // Add results to allNews
      for (const items of batchResults) {
        allNews.push(...items)
      }

      // Sort by publication date (newest first)
      allNews.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )

      // Update state with current progress
      onUpdate(allNews.slice(0, 100))

      // Call progress callback for each feed in batch
      if (onProgress) {
        for (let j = 0; j < batch.length; j++) {
          onProgress()
        }
      }

      // Add delay between batches (except after last batch)
      if (i + BATCH_SIZE < available.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
      }
    }

    // Check if aborted before caching
    if (signal?.aborted) return

    // Cache the final results
    await storage.set(cacheKey, { data: allNews.slice(0, 100), timestamp: Date.now() })
  } catch (error) {
    // Only log if not aborted
    if (signal?.aborted) return
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in fetchCustomNewsIncremental:', error)
    }
  }
}

// Fetch DEFAULT feeds only (Left Column) - with feed preferences (legacy, kept for compatibility)
async function fetchDefaultNews(feedPreferences?: FeedPreferences): Promise<NewsItem[]> {
  try {
    const cacheKey = feedPreferences ? `default_news_cache_${JSON.stringify(feedPreferences)}` : 'default_news_cache'
    const cached = await storage.get<{ data: NewsItem[], timestamp: number }>(cacheKey)

    if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) { // 2 minutes cache
      return cached.data
    }

    // Filter feeds based on user preferences
    const feedsToFetch = feedPreferences
      ? filterEnabledFeeds(RSS_FEEDS, feedPreferences)
      : RSS_FEEDS

    // Fetch from DEFAULT RSS feeds only
    const allNewsPromises = feedsToFetch.map(feed => fetchRSSFeed(feed))
    const allNewsArrays = await Promise.all(allNewsPromises)
    const allNews = allNewsArrays.flat()

    // Sort by publication date (newest first)
    allNews.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    // Return up to 100 news items maximum
    const result = allNews.slice(0, 100)

    // Cache the results
    await storage.set(cacheKey, { data: result, timestamp: Date.now() })

    return result
  } catch (error) {
    console.error('Error in fetchDefaultNews:', error)
    return []
  }
}

// Fetch CUSTOM feeds only (Right Column) (legacy, kept for compatibility)
async function fetchCustomNews(customFeeds: CustomFeed[]): Promise<NewsItem[]> {
  if (customFeeds.length === 0) return []

  try {
    const cacheKey = 'custom_news_cache'
    const cached = await storage.get<{ data: NewsItem[], timestamp: number }>(cacheKey)

    if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) { // 2 minutes cache
      return cached.data
    }

    // Fetch from CUSTOM RSS feeds only
    const allNewsPromises = customFeeds.map(feed => fetchRSSFeed(feed))
    const allNewsArrays = await Promise.all(allNewsPromises)
    const allNews = allNewsArrays.flat()

    // Sort by publication date (newest first)
    allNews.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    // Return up to 100 news items maximum
    const result = allNews.slice(0, 100)

    // Cache the results
    await storage.set(cacheKey, { data: result, timestamp: Date.now() })

    return result
  } catch (error) {
    console.error('Error in fetchCustomNews:', error)
    return []
  }
}

export default function NewsClient({ initialNews, currentLocale }: NewsClientProps) {
  // Get translations for current locale
  const { t } = useTranslations(currentLocale)

  // Mobile detection for responsive layout
  const isMobile = useIsMobile()

  // Multi-column layout state
  const [activeLayout, setActiveLayout] = useState<ColumnLayout | null>(null)
  const [columnNewsData, setColumnNewsData] = useState<Record<string, NewsItem[]>>({})
  const [columnFilters, setColumnFilters] = useState<Record<string, { search: string }>>({})
  const [columnPages, setColumnPages] = useState<Record<string, number>>({})

  // Legacy state (kept for backward compatibility during transition)
  const [defaultNews, setDefaultNews] = useState<NewsItem[]>([])
  const [filteredDefaultNews, setFilteredDefaultNews] = useState<NewsItem[]>([])
  const [defaultSearch, setDefaultSearch] = useState('')
  const [defaultCategory, setDefaultCategory] = useState('All')
  const [defaultCurrentPage, setDefaultCurrentPage] = useState(1)
  const [defaultLanguage, setDefaultLanguage] = useState<string>(currentLocale)

  // Wrapper for setDefaultLanguage
  const handleLanguageChange = (newLanguage: string) => {
    if (newLanguage === defaultLanguage) return
    setDefaultLanguage(newLanguage)
  }

  // RIGHT COLUMN (Custom Feeds)
  const [customNews, setCustomNews] = useState<NewsItem[]>([])
  const [filteredCustomNews, setFilteredCustomNews] = useState<NewsItem[]>([])
  const [customSearch, setCustomSearch] = useState('')
  const [customCategory, setCustomCategory] = useState('All')
  const [customCurrentPage, setCustomCurrentPage] = useState(1)

  // Shared state
  const [loading, setLoading] = useState(false)
  const [loadingFeedsCount, setLoadingFeedsCount] = useState({ total: 0, loaded: 0 })
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isAnimating, setIsAnimating] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [timeLeft, setTimeLeft] = useState(REFRESH_INTERVAL_SECONDS)

  // Custom feeds state
  const [customFeeds, setCustomFeeds] = useState<CustomFeed[]>([])
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false)
  const [newFeedName, setNewFeedName] = useState('')
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [newFeedCategory, setNewFeedCategory] = useState('All')
  const [isAddingFeed, setIsAddingFeed] = useState(false)

  // Feed preferences state
  const [feedPreferences, setFeedPreferences] = useState<FeedPreferences | null>(null)
  // Track whether feed preferences have been loaded to prevent infinite loop
  const feedPreferencesLoadedRef = useRef(false)
  // AbortController for cancelling pending fetches
  const abortControllerRef = useRef<AbortController | null>(null)
  const [showFeedSettings, setShowFeedSettings] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Content language filter for RSS feeds
  const [contentLanguage, setContentLanguage] = useState<string>('all')

  // NOTE: RSS feed language (defaultLanguage) is INDEPENDENT from UI locale (currentLocale)
  // User can change RSS language from sidebar menu without affecting UI language
  // Initial value is set from currentLocale in useState above, but subsequent changes are user-driven

  // Fetch all news with useCallback - uses AbortController to cancel previous fetches
  const fetchAllNews = useCallback(async (showLoading = true) => {
    // Cancel any pending fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this fetch
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    const signal = abortController.signal

    try {
      if (showLoading) setLoading(true)
      else setIsRefreshing(true)

      // Reset countdown timer on every refresh
      setTimeLeft(REFRESH_INTERVAL_SECONDS)

      // Calculate total feeds to fetch (after filtering disabled feeds and language)
      let defaultFeedsToFetch = feedPreferences
        ? filterEnabledFeeds(RSS_FEEDS, feedPreferences)
        : RSS_FEEDS

      // Filter by language if specified
      if (defaultLanguage !== 'All') {
        defaultFeedsToFetch = defaultFeedsToFetch.filter(feed => feed.language === defaultLanguage)
      }

      // Filter available feeds to get accurate count
      const { available: availableDefault } = await filterAvailableFeeds(defaultFeedsToFetch)
      const { available: availableCustom } = await filterAvailableFeeds(customFeeds)

      const totalFeeds = availableDefault.length + availableCustom.length

      // Initialize loading counter
      setLoadingFeedsCount({ total: totalFeeds, loaded: 0 })

      // Initialize empty arrays
      setDefaultNews([])
      setFilteredDefaultNews([])
      setCustomNews([])
      setFilteredCustomNews([])

      // Create a counter callback for progress updates
      let loadedCount = 0
      const updateProgress = () => {
        loadedCount++
        setLoadingFeedsCount({ total: totalFeeds, loaded: loadedCount })
      }

      // Fetch default and custom news incrementally in parallel
      await Promise.all([
        fetchDefaultNewsIncremental(feedPreferences || undefined, (items) => {
          setDefaultNews(items)
          setFilteredDefaultNews(items)
        }, updateProgress, defaultLanguage, signal),
        fetchCustomNewsIncremental(customFeeds, (items) => {
          setCustomNews(items)
          setFilteredCustomNews(items)
        }, updateProgress, signal)
      ])

      // Only update if not aborted
      if (!signal.aborted) {
        setLastUpdate(new Date())
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch news:', error)
      }
    } finally {
      // Only clear loading state if not aborted
      if (!signal.aborted) {
        setLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [customFeeds, feedPreferences, defaultLanguage])

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

  // Load feed preferences from IndexedDB on mount
  useEffect(() => {
    const loadFeedPreferences = async () => {
      try {
        const prefs = await getFeedPreferences()
        setFeedPreferences(prefs)
        // Mark as loaded to allow fetchAllNews to use preferences
        feedPreferencesLoadedRef.current = true
      } catch (error) {
        console.error('Failed to load feed preferences:', error)
      }
    }
    loadFeedPreferences()
  }, [])

  // Load active column layout on mount
  useEffect(() => {
    const loadColumnLayout = async () => {
      try {
        const layout = await getActiveLayout()
        setActiveLayout(layout)

        // Initialize column filters and pages
        if (layout) {
          const filters: Record<string, { search: string }> = {}
          const pages: Record<string, number> = {}
          layout.columns.forEach(col => {
            filters[col.id] = { search: '' }
            pages[col.id] = 1
          })
          setColumnFilters(filters)
          setColumnPages(pages)
        }
      } catch (error) {
        console.error('Failed to load column layout:', error)
      }
    }
    loadColumnLayout()
  }, [])

  // Fetch news for each column based on layout - incremental updates
  useEffect(() => {
    const fetchColumnNews = async () => {
      if (!activeLayout || !feedPreferences) return

      // Check if any column has a language filter - if so, skip defaultLanguage filter
      const hasLanguageFilterColumn = activeLayout.columns.some(col => col.filter.type === 'language')

      // Use defaultLanguage from sidebar for language filtering
      let feedsToFetch = filterEnabledFeeds(RSS_FEEDS, feedPreferences)

      // Apply language filter from sidebar (defaultLanguage) unless column has its own language filter
      if (!hasLanguageFilterColumn && defaultLanguage !== 'All') {
        feedsToFetch = feedsToFetch.filter(feed => feed.language === defaultLanguage)
      }

      for (const column of activeLayout.columns) {
        const columnFeeds = getFeedsForColumn(feedsToFetch, customFeeds, column)

        // Filter out disabled feeds using circuit breaker
        const { available } = await filterAvailableFeeds(columnFeeds)

        // Initialize empty array for this column
        setColumnNewsData(prev => ({ ...prev, [column.id]: [] }))

        const columnItems: NewsItem[] = []

        // Fetch feeds in batches to reduce server load
        for (let i = 0; i < available.length; i += BATCH_SIZE) {
          const batch = available.slice(i, i + BATCH_SIZE)

          // Fetch all feeds in this batch in parallel
          const batchResults = await Promise.all(
            batch.map(feed => fetchRSSFeed(feed))
          )

          // Add results to columnItems
          for (const items of batchResults) {
            columnItems.push(...items)
          }

          // Sort by publication date
          columnItems.sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          )

          // Update state with current progress
          setColumnNewsData(prev => ({
            ...prev,
            [column.id]: columnItems.slice(0, 100)
          }))

          // Add delay between batches (except after last batch)
          if (i + BATCH_SIZE < available.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
          }
        }

        setLastUpdate(new Date())
      }
    }

    fetchColumnNews()
  }, [activeLayout, customFeeds, feedPreferences, defaultLanguage])

  // Track if initial fetch has completed to avoid double fetch on mount
  const initialFetchDoneRef = useRef(false)

  // Fetch news when defaultLanguage changes (user selects language from sidebar)
  // This ensures RSS feed filter works correctly
  useEffect(() => {
    // Skip on initial mount - let the mount useEffect handle first fetch
    if (!initialFetchDoneRef.current) {
      return
    }

    const timeoutId = setTimeout(() => {
      fetchAllNews(false)
    }, 100) // Small debounce to prevent rapid calls

    return () => clearTimeout(timeoutId)
  }, [defaultLanguage])

  // Initialize with initialNews prop from server-side rendering
  useEffect(() => {
    // Always fetch from API on mount for latest news
    // If initialNews is provided, show it immediately while fetching
    if (initialNews && initialNews.length > 0) {
      // Separate default and custom news from initial data
      const defaultFeedNames = new Set(RSS_FEEDS.map(f => f.name))
      const defaultNewsData = initialNews.filter(item => defaultFeedNames.has(item.source))
      const customNewsData = initialNews.filter(item => !defaultFeedNames.has(item.source))

      setDefaultNews(defaultNewsData)
      setFilteredDefaultNews(defaultNewsData)
      setCustomNews(customNewsData)
      setFilteredCustomNews(customNewsData)
    }

    // Always fetch fresh data from API
    fetchAllNews(true)

    // Mark initial fetch as complete
    initialFetchDoneRef.current = true
  }, [])

  // Effect to sync drawer loading with selected news content
  useEffect(() => {
    if (selectedNews) {
      const allNews = [...defaultNews, ...customNews]
      const newsWithContent = allNews.find(n => n.id === selectedNews.id && n.fullContent)
      if (newsWithContent?.fullContent) {
        setDrawerLoading(false)
      } else if (!selectedNews.fullContent && !selectedNews.isFetchingFullContent) {
        setDrawerLoading(true)
      }
    } else {
      setDrawerLoading(false)
    }
  }, [selectedNews, defaultNews, customNews])

  // Opening animation and auto-refresh setup
  useEffect(() => {
    // Opening animation
    setTimeout(() => {
      setIsAnimating(false)
    }, 500)

    // Countdown ticker - run every 1 second
    const ticker = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Trigger refresh when timer hits 0
          fetchAllNews(false)
          return REFRESH_INTERVAL_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(ticker)
  }, [fetchAllNews])

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Filter DEFAULT news (Left Column)
  // NOTE: Language filtering is already done in fetchAllNews, so we don't filter by language here
  // This useEffect only handles category and search filtering on the already language-filtered data
  useEffect(() => {
    let filtered = defaultNews

    // Filter by category
    if (defaultCategory !== 'All') {
      filtered = filtered.filter(item => item.category === defaultCategory)
    }

    // NOTE: Language filtering removed - it's handled in fetchAllNews
    // The news items are already filtered by language when fetched

    // Filter by search
    if (defaultSearch.trim()) {
      const searchLower = defaultSearch.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        (item.fullContent && item.fullContent.toLowerCase().includes(searchLower))
      )
    }

    setFilteredDefaultNews(filtered)
    setDefaultCurrentPage(1)
  }, [defaultSearch, defaultCategory, defaultNews])

  // Filter CUSTOM news (Right Column)
  useEffect(() => {
    let filtered = customNews

    if (customCategory !== 'All') {
      filtered = filtered.filter(item => item.category === customCategory)
    }

    if (customSearch.trim()) {
      const searchLower = customSearch.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        (item.fullContent && item.fullContent.toLowerCase().includes(searchLower))
      )
    }

    setFilteredCustomNews(filtered)
    setCustomCurrentPage(1)
  }, [customSearch, customCategory, customNews])

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
      await storage.remove('custom_news_cache')
      await fetchAllNews(true)
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
    await storage.remove('custom_news_cache')
    await fetchAllNews(true)
  }

  const clearCache = async () => {
    try {
      await storage.clear()
      await fetchAllNews(true)
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const fetchFullContent = async (newsItem: NewsItem) => {
    try {
      // Update both default and custom news arrays
      const updateArray = (items: NewsItem[]) =>
        items.map(item =>
          item.id === newsItem.id
            ? { ...item, isFetchingFullContent: true }
            : item
        )

      setDefaultNews(updateArray(defaultNews))
      setCustomNews(updateArray(customNews))

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
    const updateFunc = (items: NewsItem[]) =>
      items.map(item =>
        item.id === id
          ? { ...item, fullContent: content, isFetchingFullContent: isFetching }
          : item
      )

    setDefaultNews(updateFunc(defaultNews))
    setCustomNews(updateFunc(customNews))
    setFilteredDefaultNews(updateFunc(filteredDefaultNews))
    setFilteredCustomNews(updateFunc(filteredCustomNews))

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

    // Validate date
    if (isNaN(date.getTime())) return 'Invalid date'

    // Prevent negative differences (future dates)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // If date is in the future, show "Just now"
    if (diffInSeconds < 0) return 'Just now'

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
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Pagination calculations for DEFAULT news
  const defaultTotalPages = Math.ceil(filteredDefaultNews.length / NEWS_PER_PAGE)
  const defaultStartIndex = (defaultCurrentPage - 1) * NEWS_PER_PAGE
  const defaultEndIndex = defaultStartIndex + NEWS_PER_PAGE
  const currentDefaultNews = filteredDefaultNews.slice(defaultStartIndex, defaultEndIndex)

  // Pagination calculations for CUSTOM news
  const customTotalPages = Math.ceil(filteredCustomNews.length / NEWS_PER_PAGE)
  const customStartIndex = (customCurrentPage - 1) * NEWS_PER_PAGE
  const customEndIndex = customStartIndex + NEWS_PER_PAGE
  const currentCustomNews = filteredCustomNews.slice(customStartIndex, customEndIndex)

  const handleDefaultPageChange = (page: number) => {
    setDefaultCurrentPage(page)
  }

  const handleCustomPageChange = (page: number) => {
    setCustomCurrentPage(page)
  }

  // Handle category change - updates both columns simultaneously
  const handleCategoryChange = (category: string) => {
    setDefaultCategory(category)
    setCustomCategory(category)
  }

  // Handle page change for a specific column
  const handleColumnPageChange = (columnId: string, page: number) => {
    setColumnPages(prev => ({ ...prev, [columnId]: page }))
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
              <p className={`text-xs font-bold font-mono tracking-widest ${darkMode ? 'text-white' : 'text-white'}`}>{t('sidebar.system')}</p>
            </div>

            {/* Category Dropdown - Retro Style */}
            <div className="mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-xs font-bold font-mono uppercase tracking-widest px-3 py-2 border-2 transition-all retro-button ${darkMode ? 'text-white hover:bg-white hover:text-black border-gray-600 bg-gray-800' : 'text-black hover:bg-black hover:text-white border-black bg-white'}`}
                  >
                    <span>[ {t('sidebar.category')} ]</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={`w-48 retro-dropdown ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-white'}`} align="start">
                  {CATEGORY_OPTIONS.map(category => (
                    <DropdownMenuItem
                      key={category.value}
                      onClick={() => handleCategoryChange(category.value)}
                      className={`text-xs font-mono ${(defaultCategory === category.value) ? (darkMode ? 'bg-white text-gray-900' : 'bg-black text-white') : (darkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200')}`}
                    >
                      {(defaultCategory === category.value) ? '▸ ' : '  '}{category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Language Filter - Retro Style */}
            <div className="mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-xs font-bold font-mono uppercase tracking-widest px-3 py-2 border-2 transition-all retro-button ${darkMode ? 'text-white hover:bg-white hover:text-black border-gray-600 bg-gray-800' : 'text-black hover:bg-black hover:text-white border-black bg-white'}`}
                  >
                    <span>[ {t('sidebar.language')} ]</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={`w-48 retro-dropdown ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-white'}`} align="start">
                  {[
                    { name: t('sidebar.allLanguages'), value: 'All' },
                    { name: 'English', value: 'en' },
                    { name: 'Türkçe', value: 'tr' },
                    { name: 'Deutsch', value: 'de' },
                    { name: 'Français', value: 'fr' },
                    { name: 'Español', value: 'es' },
                    { name: '中文', value: 'zh' },
                    { name: 'हिन्दी', value: 'hi' },
                  ].map(lang => (
                    <DropdownMenuItem
                      key={lang.value}
                      onClick={() => handleLanguageChange(lang.value)}
                      className={`text-xs font-mono ${(defaultLanguage === lang.value) ? (darkMode ? 'bg-white text-gray-900' : 'bg-black text-white') : (darkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200')}`}
                    >
                      {(defaultLanguage === lang.value) ? '▸ ' : '  '}{lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Current selected category - Retro Style */}
            <div className={`mb-4 p-3 border-4 border-double text-center retro-selected-box ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-black'}`}>
              <p className={`text-xs font-mono uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>[{t('sidebar.selected')}]</p>
              <p className={`text-sm font-bold font-mono tracking-wider ${darkMode ? 'text-white' : 'text-white'}`}>
                {defaultCategory}
              </p>
              <p className={`text-xs font-mono tracking-wider mt-1 ${defaultLanguage === 'All' ? (darkMode ? 'text-gray-400' : 'text-gray-500') : (darkMode ? 'text-white' : 'text-white')}`}>
                {defaultLanguage === 'All' ? t('sidebar.allLanguages') :
                  defaultLanguage === 'tr' ? 'Türkçe' :
                    defaultLanguage === 'de' ? 'Deutsch' :
                      defaultLanguage === 'fr' ? 'Français' :
                        defaultLanguage === 'es' ? 'Español' :
                          defaultLanguage === 'zh' ? '中文' :
                            defaultLanguage === 'hi' ? 'हिन्दी' :
                              'English'}
              </p>
            </div>

            {/* Stats - Retro Style */}
            <div className={`mb-4 p-2 border-2 retro-stats ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-gray-100'}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-mono uppercase ${darkMode ? 'text-white' : 'text-black'}`}>{t('sidebar.default')}:</p>
                <p className={`text-xs font-bold font-mono ${darkMode ? 'text-white' : 'text-black'}`}>{filteredDefaultNews.length}</p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs font-mono uppercase ${darkMode ? 'text-white' : 'text-black'}`}>{t('sidebar.custom')}:</p>
                <p className={`text-xs font-bold font-mono ${darkMode ? 'text-white' : 'text-black'}`}>{filteredCustomNews.length}</p>
              </div>

              {/* Loading Progress */}
              {loading && loadingFeedsCount.total > 0 && (
                <div className="mt-2 pt-2 border-t-2" style={{ borderColor: darkMode ? '#4b5563' : '#000' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-mono uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('sidebar.loading')}:</p>
                    <p className={`text-xs font-bold font-mono ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {loadingFeedsCount.loaded}/{loadingFeedsCount.total}
                    </p>
                  </div>
                  <div className={`h-1.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${(loadingFeedsCount.loaded / loadingFeedsCount.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Add Feed Dialog */}
            <Dialog open={showAddFeedDialog} onOpenChange={setShowAddFeedDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full mb-2 text-xs font-bold font-mono uppercase border-2 px-3 py-2 transition-all ${darkMode ? 'text-white hover:bg-white hover:text-black border-gray-600 bg-gray-800' : 'text-black hover:bg-black hover:text-white border-black bg-white'}`}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('sidebar.addFeed')}
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
                        {CATEGORY_OPTIONS.filter(c => c.value !== 'All').map(category => (
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

            {/* Feed Settings Button */}
            <Button
              variant="ghost"
              onClick={() => setShowFeedSettings(true)}
              className={`w-full mb-2 text-xs font-bold font-mono uppercase border-2 px-3 py-2 transition-all ${darkMode ? 'text-white hover:bg-white hover:text-black border-gray-600 bg-gray-800' : 'text-black hover:bg-black hover:text-white border-black bg-white'}`}
            >
              <Settings className="w-3 h-3 mr-1" />
              {t('sidebar.feedSettings')}
            </Button>

            {/* Column Layout Button */}
            <Button
              variant="ghost"
              onClick={() => setShowColumnSettings(true)}
              className={`w-full mb-4 text-xs font-bold font-mono uppercase border-2 px-3 py-2 transition-all ${darkMode ? 'text-white hover:bg-white hover:text-black border-gray-600 bg-gray-800' : 'text-black hover:bg-black hover:text-white border-black bg-white'}`}
            >
              <LayoutTemplate className="w-3 h-3 mr-1" />
              {t('sidebar.columnLayout')}
            </Button>

            {/* Custom Feeds List */}
            {customFeeds.length > 0 && (
              <div className={`mb-4 p-2 border-2 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-gray-100'}`}>
                <p className={`text-xs font-mono uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('sidebar.myFeeds')}:</p>
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

          <div className={`text-xs font-mono text-center retro-footer p-2 border-2 border-t-0 animate-pulse-slow ${darkMode ? 'text-white border-gray-600' : 'text-black border-black'}`}>
            <p>{t('sidebar.nextRefresh') || 'NEXT REFRESH'}</p>
            <p className="font-bold text-lg">{formatTimeSinceLastUpdate()}</p>
          </div>
        </div>
      </aside>

      {/* Main Content - TWO COLUMN LAYOUT */}
      <div className="flex-1 ml-0 lg:ml-48">
        {/* Header - Retro Style */}
        <header className={`sticky top-0 z-30 px-2 sm:px-4 py-2 sm:py-3 border-b-4 retro-header ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-black'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mobile Hamburger Menu */}
                {isMobile && (
                  <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`border-2 p-2 ${darkMode ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-black border-black hover:bg-gray-100'}`}
                      >
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className={`w-[280px] ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-black'}`}>
                      <SheetHeader>
                        <SheetTitle className={`text-left font-mono font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                          [MENU]
                        </SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-4">
                        {/* Feed Settings */}
                        <Button
                          variant="ghost"
                          onClick={() => { setShowMobileMenu(false); setShowFeedSettings(true) }}
                          className={`w-full justify-start font-mono text-sm border-2 ${darkMode ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-black border-black hover:bg-gray-100'}`}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          FEED SETTINGS
                        </Button>
                        {/* Layout Settings */}
                        <Button
                          variant="ghost"
                          onClick={() => { setShowMobileMenu(false); setShowColumnSettings(true) }}
                          className={`w-full justify-start font-mono text-sm border-2 ${darkMode ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-black border-black hover:bg-gray-100'}`}
                        >
                          <LayoutTemplate className="w-4 h-4 mr-2" />
                          LAYOUT SETTINGS
                        </Button>
                        {/* Add Feed */}
                        <Button
                          variant="ghost"
                          onClick={() => { setShowMobileMenu(false); setShowAddFeedDialog(true) }}
                          className={`w-full justify-start font-mono text-sm border-2 ${darkMode ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-black border-black hover:bg-gray-100'}`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          ADD CUSTOM FEED
                        </Button>
                        {/* Content Language Selector */}
                        <div className={`p-3 border-2 ${darkMode ? 'border-gray-600' : 'border-black'}`}>
                          <div className={`font-mono text-xs font-bold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                            <Globe className="w-3 h-3 inline mr-1" /> CONTENT LANGUAGE
                          </div>
                          <Select value={contentLanguage} onValueChange={setContentLanguage}>
                            <SelectTrigger className={`border-2 font-mono text-xs ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-black text-black'}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="font-mono text-xs">
                              <SelectItem value="all">🌍 All Languages</SelectItem>
                              <SelectItem value="en">🇬🇧 English</SelectItem>
                              <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                              <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                              <SelectItem value="fr">🇫🇷 Français</SelectItem>
                              <SelectItem value="es">🇪🇸 Español</SelectItem>
                              <SelectItem value="zh">🇨🇳 中文</SelectItem>
                              <SelectItem value="hi">🇮🇳 हिन्दी</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Dark Mode */}
                        <Button
                          variant="ghost"
                          onClick={() => setDarkMode(!darkMode)}
                          className={`w-full justify-start font-mono text-sm border-2 ${darkMode ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-black border-black hover:bg-gray-100'}`}
                        >
                          <span className="mr-2">{darkMode ? '☀' : '☾'}</span>
                          {darkMode ? 'LIGHT MODE' : 'DARK MODE'}
                        </Button>
                        <Link
                          href="/about"
                          onClick={() => setShowMobileMenu(false)}
                          className={`flex items-center w-full font-mono text-sm border-2 px-4 py-2 ${darkMode ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-black border-black hover:bg-gray-100'}`}
                        >
                          <Info className="w-4 h-4 mr-2" />
                          ABOUT
                        </Link>
                        {/* UI Language Selection */}
                        <div className={`p-3 border-2 ${darkMode ? 'border-gray-600' : 'border-black'}`}>
                          <div className={`font-mono text-xs font-bold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                            🌐 UI LANGUAGE
                          </div>
                          <LanguageSwitcher currentLocale={currentLocale} darkMode={darkMode} />
                        </div>
                        {/* Refresh */}
                        <Button
                          variant="ghost"
                          onClick={() => { setShowMobileMenu(false); fetchAllNews(true) }}
                          disabled={loading || isRefreshing}
                          className={`w-full justify-start font-mono text-sm border-2 ${darkMode ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-black border-black hover:bg-gray-100'}`}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                          REFRESH NEWS
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}

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
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* UI Language Switcher - Desktop */}
                <div className="hidden sm:block">
                  <LanguageSwitcher currentLocale={currentLocale} darkMode={darkMode} />
                </div>

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
                  onClick={() => fetchAllNews(true)}
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
              </div>
            </div>
          </div>
        </header>

        {/* MULTI-COLUMN NEWS LAYOUT (TweetDeck Style) */}
        <main className="px-2 sm:px-4 py-4 sm:py-6 pb-40 sm:pb-32">
          <div className="max-w-full mx-auto">
            {/* Layout Info */}
            {activeLayout && (
              <div className={`mb-4 p-3 border-2 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-black bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-bold font-mono uppercase ${darkMode ? 'text-white' : 'text-black'}`}>
                      [{activeLayout.name}]
                    </h2>
                    <p className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {activeLayout.columns.length} columns
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowColumnSettings(true)}
                    className={`text-xs font-mono border-2 ${darkMode ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black' : 'text-black border-black bg-white hover:bg-black hover:text-white'}`}
                  >
                    <LayoutTemplate className="w-3 h-3 mr-1" />
                    EDIT LAYOUT
                  </Button>
                </div>
              </div>
            )}

            {/* Dynamic Columns - Split screen on mobile (50vh each), grid on desktop */}
            {activeLayout && (
              <div
                className={`gap-0 ${isMobile
                  ? 'flex flex-col h-[calc(100vh-180px)]'
                  : 'grid gap-4'
                  }`}
                style={isMobile ? {} : {
                  gridTemplateColumns: activeLayout.columns.map(c => `${c.width}%`).join(' ')
                }}
              >
                {activeLayout.columns
                  .sort((a, b) => a.order - b.order)
                  .map((column) => {
                    const columnNews = columnNewsData[column.id] || []
                    const searchQuery = columnFilters[column.id]?.search || ''
                    const currentPage = columnPages[column.id] || 1

                    // Filter by search
                    const filteredNews = searchQuery.trim()
                      ? columnNews.filter(item =>
                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      : columnNews

                    const totalPages = Math.ceil(filteredNews.length / NEWS_PER_PAGE)
                    const startIndex = (currentPage - 1) * NEWS_PER_PAGE
                    const endIndex = startIndex + NEWS_PER_PAGE
                    const paginatedNews = filteredNews.slice(startIndex, endIndex)

                    return (
                      <div
                        key={column.id}
                        className={`border-2 ${darkMode ? 'border-gray-600' : 'border-black'} p-3 flex flex-col min-w-0 ${isMobile ? 'flex-1 min-h-0 overflow-hidden' : ''
                          }`}
                        style={isMobile ? {} : { minWidth: column.collapsed ? '60px' : '300px' }}
                      >
                        {/* Column Header */}
                        <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${darkMode ? 'border-gray-600' : 'border-black'}`}>
                          {!column.collapsed && (
                            <>
                              <h2 className={`text-sm font-bold font-mono uppercase ${darkMode ? 'text-white' : 'text-black'}`}>
                                [{column.title}]
                              </h2>
                              <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {filteredNews.length} articles
                              </span>
                            </>
                          )}
                          <button
                            onClick={() => {
                              // Toggle collapse (would need to implement)
                            }}
                            className={`p-1 ${darkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200'}`}
                          >
                            {column.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {!column.collapsed && (
                          <>
                            {/* Search */}
                            <div className="mb-3">
                              <Input
                                type="text"
                                placeholder={`SEARCH ${column.title.toUpperCase()}...`}
                                value={searchQuery}
                                onChange={(e) => {
                                  setColumnFilters(prev => ({
                                    ...prev,
                                    [column.id]: { search: e.target.value }
                                  }))
                                  // Reset to page 1 when search changes
                                  setColumnPages(prev => ({ ...prev, [column.id]: 1 }))
                                }}
                                className={`border-2 rounded-none px-3 py-2 focus-visible:ring-0 font-mono text-xs ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-black text-black'}`}
                              />
                            </div>

                            {/* News List (scrollable on mobile) */}
                            <div className={`space-y-1 flex-1 ${isMobile ? 'overflow-y-auto min-h-0' : ''
                              }`}>
                              {filteredNews.length === 0 ? (
                                <div className="py-12 text-center">
                                  <p className={`text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    [ NO NEWS ]
                                  </p>
                                </div>
                              ) : (
                                paginatedNews.map((item) => (
                                  <article
                                    key={item.id}
                                    className={`py-3 px-3 border-b cursor-pointer hover:bg-black hover:text-white transition-all ${darkMode ? 'border-gray-700' : 'border-black'}`}
                                    onClick={() => openNews(item)}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span
                                          className="text-xs font-bold font-mono uppercase text-muted-foreground"
                                        >
                                          [{item.category}]
                                        </span>
                                        <div className={`flex items-center gap-1 text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                                          <Clock className="w-3 h-3" />
                                          <time>{formatDate(item.publishedAt)}</time>
                                        </div>
                                      </div>
                                      <h2 className={`text-sm font-bold leading-tight font-mono ${darkMode ? 'text-white' : 'text-black'}`}>
                                        {item.title}
                                      </h2>
                                      <p className={`text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {item.description}
                                      </p>
                                      <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                                        SOURCE: {item.source.toUpperCase()}
                                      </span>
                                    </div>
                                  </article>
                                ))
                              )}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                              <div className={`mt-4 pt-3 border-t-2 flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleColumnPageChange(column.id, currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-1 border-2 transition-all ${currentPage === 1
                                      ? `opacity-50 cursor-not-allowed ${darkMode ? 'border-gray-700 text-gray-600' : 'border-gray-300 text-gray-400'}`
                                      : `${darkMode ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-black text-black hover:bg-gray-200'}`
                                      }`}
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleColumnPageChange(column.id, currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-1 border-2 transition-all ${currentPage === totalPages
                                      ? `opacity-50 cursor-not-allowed ${darkMode ? 'border-gray-700 text-gray-600' : 'border-gray-300 text-gray-400'}`
                                      : `${darkMode ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-black text-black hover:bg-gray-200'}`
                                      }`}
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className={`fixed bottom-0 left-0 right-0 z-30 border-t-4 ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-black'}`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
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
                  <span
                    className="text-xs font-bold font-mono uppercase tracking-widest block mb-1 retro-category text-muted-foreground"
                  >
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

      {/* Feed Settings Panel */}
      <FeedSettingsPanel
        open={showFeedSettings}
        onOpenChange={setShowFeedSettings}
        onPreferencesChange={() => {
          // Reload preferences and fetch news
          getFeedPreferences().then(setFeedPreferences)
          fetchAllNews(false)
        }}
      />

      {/* Column Settings Panel */}
      <ColumnSettingsPanel
        open={showColumnSettings}
        onOpenChange={setShowColumnSettings}
        onLayoutChange={async () => {
          // Reload layout
          const layout = await getActiveLayout()
          setActiveLayout(layout)
        }}
      />
    </div>
  )
}
