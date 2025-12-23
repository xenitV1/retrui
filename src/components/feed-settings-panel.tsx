'use client'

import { useState, useEffect } from 'react'
import { X, Search, Check, XCircle, Star, Filter, TrendingUp, Globe, Shield, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  RSS_FEEDS,
  MAIN_CATEGORIES,
  getTurkishFeeds,
  getEnglishFeeds,
  getAllRegions,
} from '@/lib/rss-feeds'
import {
  getFeedPreferences,
  saveFeedPreferences,
  enableFeed,
  disableFeed,
  blockFeed,
  unblockFeed,
  toggleFavorite,
  enableCategory,
  disableCategory,
  getFeedStats,
  isFeedEnabled,
  isFeedBlocked,
  isFeedFavorite,
  setFeedColor,
  removeFeedColor,
  resetAllFeedColors,
  RETRO_COLORS,
  DEFAULT_CATEGORY_COLORS,
  type FeedPreferences,
} from '@/lib/feed-preferences'

interface FeedSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPreferencesChange?: () => void
}

export function FeedSettingsPanel({ open, onOpenChange, onPreferencesChange }: FeedSettingsPanelProps) {
  const [preferences, setPreferences] = useState<FeedPreferences | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedRegion, setSelectedRegion] = useState<string>('All')
  const [loading, setLoading] = useState(false)

  // Load preferences when panel opens
  useEffect(() => {
    if (open) {
      loadPreferences()
    }
  }, [open])

  const loadPreferences = async () => {
    setLoading(true)
    try {
      const prefs = await getFeedPreferences()
      setPreferences(prefs)
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshPreferences = async () => {
    const prefs = await getFeedPreferences()
    setPreferences(prefs)
    onPreferencesChange?.()
  }

  const handleToggleFeed = async (feedName: string) => {
    if (!preferences) return

    const isEnabled = isFeedEnabled({ name: feedName } as any, preferences)

    if (isEnabled) {
      await disableFeed(feedName)
    } else {
      await enableFeed(feedName)
    }

    await refreshPreferences()
  }

  const handleBlockFeed = async (feedName: string) => {
    if (!preferences) return

    const isBlocked = preferences.blockedFeeds.includes(feedName)

    if (isBlocked) {
      await unblockFeed(feedName)
    } else {
      await blockFeed(feedName)
    }

    await refreshPreferences()
  }

  const handleToggleFavorite = async (feedName: string) => {
    await toggleFavorite(feedName)
    await refreshPreferences()
  }

  const handleToggleCategory = async (category: string) => {
    if (!preferences) return

    // Count enabled/blocked feeds in this category
    const categoryFeeds = RSS_FEEDS.filter(f => f.category === category)
    const enabledCount = categoryFeeds.filter(f => isFeedEnabled(f, preferences)).length
    const blockedCount = categoryFeeds.filter(f => isFeedBlocked(f, preferences)).length

    if (enabledCount === 0) {
      // Enable all feeds in this category
      await enableCategory(category, RSS_FEEDS)
    } else {
      // Disable all feeds in this category
      await disableCategory(category, RSS_FEEDS)
    }

    await refreshPreferences()
  }

  // Filter feeds based on search, category, and region
  const getFilteredFeeds = () => {
    let filtered = [...RSS_FEEDS]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(f => f.category === selectedCategory)
    }

    // Region filter
    if (selectedRegion !== 'All') {
      filtered = filtered.filter(f => f.region === selectedRegion)
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }

  const filteredFeeds = getFilteredFeeds()
  const stats = preferences ? getFeedStats(RSS_FEEDS, preferences) : null
  const allRegions = ['All', ...getAllRegions()]

  if (loading || !preferences) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <div className="flex items-center justify-center py-12">
            <p className="text-sm font-mono">Loading feed preferences...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono text-lg">[ FEED SETTINGS ]</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="feeds" className="w-full">
          <div className="border-b px-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="feeds" className="font-mono text-xs">
                <Filter className="w-3 h-3 mr-1" />
                FEEDS
              </TabsTrigger>
              <TabsTrigger value="favorites" className="font-mono text-xs">
                <Star className="w-3 h-3 mr-1" />
                FAVORITES
              </TabsTrigger>
              <TabsTrigger value="blocked" className="font-mono text-xs">
                <Shield className="w-3 h-3 mr-1" />
                BLOCKED
              </TabsTrigger>
              <TabsTrigger value="categories" className="font-mono text-xs">
                <Globe className="w-3 h-3 mr-1" />
                CATEGORIES
              </TabsTrigger>
              <TabsTrigger value="colors" className="font-mono text-xs">
                <Palette className="w-3 h-3 mr-1" />
                COLORS
              </TabsTrigger>
              <TabsTrigger value="stats" className="font-mono text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                STATS
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ALL FEEDS TAB */}
          <TabsContent value="feeds" className="p-4">
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
                  <Input
                    placeholder="Search feeds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 font-mono text-sm"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border-2 rounded font-mono text-sm bg-background"
                >
                  {MAIN_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-3 py-2 border-2 rounded font-mono text-sm bg-background"
                >
                  {allRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Feed count */}
              <div className="text-xs font-mono text-muted-foreground">
                Showing {filteredFeeds.length} of {RSS_FEEDS.length} feeds
              </div>

              {/* Feed list */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-1">
                  {filteredFeeds.map(feed => {
                    const enabled = isFeedEnabled(feed, preferences)
                    const blocked = isFeedBlocked(feed, preferences)
                    const favorite = isFeedFavorite(feed, preferences)

                    return (
                      <div
                        key={feed.name}
                        className={`flex items-center justify-between p-2 border rounded-sm hover:bg-accent/50 transition-colors ${blocked ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleFeed(feed.name)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${enabled ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                          >
                            {enabled && <Check className="w-3 h-3 text-primary-foreground" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium truncate">{feed.name}</span>
                              <Badge variant="outline" className="text-xs font-mono h-5">
                                {feed.category}
                              </Badge>
                              {feed.region && (
                                <Badge variant="secondary" className="text-xs font-mono h-5">
                                  {feed.region}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFavorite(feed.name)}
                            className={`p-1 rounded transition-colors ${favorite ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                          >
                            <Star className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleBlockFeed(feed.name)}
                            className={`p-1 rounded transition-colors ${blocked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                          >
                            <XCircle className={`w-4 h-4 ${blocked ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* FAVORITES TAB */}
          <TabsContent value="favorites" className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold">
                  {preferences.favoriteFeeds.length} Favorite Feeds
                </h3>
              </div>

              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-2">
                  {preferences.favoriteFeeds.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground font-mono text-sm">
                      No favorite feeds yet. Click the star icon on any feed to add it here.
                    </div>
                  ) : (
                    preferences.favoriteFeeds.map(feedName => {
                      const feed = RSS_FEEDS.find(f => f.name === feedName)
                      if (!feed) return null

                      return (
                        <div
                          key={feedName}
                          className="flex items-center justify-between p-3 border rounded-sm"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleFavorite(feedName)}
                              className="text-yellow-500"
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                            <div>
                              <div className="font-mono text-sm font-medium">{feed.name}</div>
                              <div className="text-xs text-muted-foreground">{feed.category}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(feedName)}
                            className="h-7 text-xs font-mono"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* BLOCKED TAB */}
          <TabsContent value="blocked" className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold">
                  {preferences.blockedFeeds.length} Blocked Feeds
                </h3>
              </div>

              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-2">
                  {preferences.blockedFeeds.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground font-mono text-sm">
                      No blocked feeds. Click the X icon on any feed to block it.
                    </div>
                  ) : (
                    preferences.blockedFeeds.map(feedName => {
                      const feed = RSS_FEEDS.find(f => f.name === feedName)
                      if (!feed) return null

                      return (
                        <div
                          key={feedName}
                          className="flex items-center justify-between p-3 border rounded-sm bg-destructive/10"
                        >
                          <div className="flex items-center gap-3">
                            <XCircle className="w-4 h-4 text-destructive" />
                            <div>
                              <div className="font-mono text-sm font-medium">{feed.name}</div>
                              <div className="text-xs text-muted-foreground">{feed.category}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBlockFeed(feedName)}
                            className="h-7 text-xs font-mono"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Unblock
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="p-4">
            <div className="space-y-4">
              <div className="text-xs font-mono text-muted-foreground">
                Enable or disable entire categories at once
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MAIN_CATEGORIES.filter(c => c !== 'All').map(category => {
                  const categoryFeeds = RSS_FEEDS.filter(f => f.category === category)
                  const enabledCount = categoryFeeds.filter(f => isFeedEnabled(f, preferences)).length
                  const totalCount = categoryFeeds.length
                  const isFullyEnabled = enabledCount === totalCount
                  const isPartiallyEnabled = enabledCount > 0 && enabledCount < totalCount

                  return (
                    <button
                      key={category}
                      onClick={() => handleToggleCategory(category)}
                      className={`p-4 border-2 rounded-sm text-left transition-all hover:shadow-md ${
                        isFullyEnabled ? 'bg-primary/10 border-primary' :
                        isPartiallyEnabled ? 'bg-primary/5 border-primary/50' :
                        'bg-muted/30 border-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-bold">{category}</span>
                        {isFullyEnabled && <Check className="w-4 h-4 text-primary" />}
                        {isPartiallyEnabled && <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {enabledCount} / {totalCount} feeds enabled
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* STATS TAB */}
          <TabsContent value="stats" className="p-4">
            <div className="space-y-6">
              {stats && (
                <>
                  {/* Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-sm">
                      <div className="text-2xl font-bold font-mono">{stats.total}</div>
                      <div className="text-xs text-muted-foreground font-mono">Total Feeds</div>
                    </div>
                    <div className="p-4 border rounded-sm">
                      <div className="text-2xl font-bold font-mono text-green-600">{stats.enabled}</div>
                      <div className="text-xs text-muted-foreground font-mono">Enabled</div>
                    </div>
                    <div className="p-4 border rounded-sm">
                      <div className="text-2xl font-bold font-mono text-red-600">{stats.blocked}</div>
                      <div className="text-xs text-muted-foreground font-mono">Blocked</div>
                    </div>
                    <div className="p-4 border rounded-sm">
                      <div className="text-2xl font-bold font-mono text-yellow-600">{stats.favorites}</div>
                      <div className="text-xs text-muted-foreground font-mono">Favorites</div>
                    </div>
                  </div>

                  {/* By Category */}
                  <div>
                    <h3 className="font-mono text-sm font-bold mb-3">Feeds by Category</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(stats.byCategory).map(([cat, data]) => (
                        <div key={cat} className="p-3 border rounded-sm">
                          <div className="font-mono text-sm font-medium mb-1">{cat}</div>
                          <div className="text-xs text-muted-foreground">
                            {data.enabled} / {data.total} enabled
                          </div>
                          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(data.enabled / data.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
