/**
 * Feed Preference System
 *
 * Allows users to:
 * - Enable/disable feeds
 * - Block specific feeds
 * - Filter by category, region, language
 * - Persist preferences to IndexedDB
 */

import { storage, STORAGE_KEYS } from './indexeddb'
import type { RssFeed } from './rss-feeds'

export interface FeedPreferences {
  enabledFeeds: string[]      // Feed names that are enabled
  blockedFeeds: string[]      // Feed names that are blocked
  favoriteFeeds: string[]     // Feed names marked as favorites
  hiddenCategories: string[]  // Categories to hide
}

const DEFAULT_PREFERENCES: FeedPreferences = {
  enabledFeeds: [],           // Empty = all feeds enabled
  blockedFeeds: [],
  favoriteFeeds: [],
  hiddenCategories: [],
}

/**
 * Get user feed preferences from IndexedDB
 */
export async function getFeedPreferences(): Promise<FeedPreferences> {
  try {
    const prefs = await storage.get<FeedPreferences>(STORAGE_KEYS.FEED_PREFERENCES)
    return prefs || { ...DEFAULT_PREFERENCES }
  } catch (error) {
    console.error('Error loading feed preferences:', error)
    return { ...DEFAULT_PREFERENCES }
  }
}

/**
 * Save user feed preferences to IndexedDB
 */
export async function saveFeedPreferences(preferences: FeedPreferences): Promise<void> {
  try {
    await storage.set(STORAGE_KEYS.FEED_PREFERENCES, preferences)
  } catch (error) {
    console.error('Error saving feed preferences:', error)
  }
}

/**
 * Check if a feed is enabled
 * Feed is enabled if:
 * - It's not in blocked list
 * - If enabledFeeds is non-empty, it must be in enabled list
 */
export function isFeedEnabled(feed: RssFeed, preferences: FeedPreferences): boolean {
  // Blocked feeds are never enabled
  if (preferences.blockedFeeds.includes(feed.name)) {
    return false
  }

  // If no specific enabled list, all non-blocked feeds are enabled
  if (preferences.enabledFeeds.length === 0) {
    return true
  }

  // Otherwise, feed must be in enabled list
  return preferences.enabledFeeds.includes(feed.name)
}

/**
 * Check if a feed is blocked
 */
export function isFeedBlocked(feed: RssFeed, preferences: FeedPreferences): boolean {
  return preferences.blockedFeeds.includes(feed.name)
}

/**
 * Check if a feed is a favorite
 */
export function isFeedFavorite(feed: RssFeed, preferences: FeedPreferences): boolean {
  return preferences.favoriteFeeds.includes(feed.name)
}

/**
 * Enable a feed
 */
export async function enableFeed(feedName: string): Promise<FeedPreferences> {
  const prefs = await getFeedPreferences()

  // Remove from blocked if present
  prefs.blockedFeeds = prefs.blockedFeeds.filter(name => name !== feedName)

  // Add to enabled list
  if (!prefs.enabledFeeds.includes(feedName)) {
    prefs.enabledFeeds.push(feedName)
  }

  await saveFeedPreferences(prefs)
  return prefs
}

/**
 * Disable a feed
 */
export async function disableFeed(feedName: string): Promise<FeedPreferences> {
  const prefs = await getFeedPreferences()

  // Remove from enabled list
  prefs.enabledFeeds = prefs.enabledFeeds.filter(name => name !== feedName)

  await saveFeedPreferences(prefs)
  return prefs
}

/**
 * Block a feed
 */
export async function blockFeed(feedName: string): Promise<FeedPreferences> {
  const prefs = await getFeedPreferences()

  // Add to blocked if not already there
  if (!prefs.blockedFeeds.includes(feedName)) {
    prefs.blockedFeeds.push(feedName)
  }

  // Remove from enabled list
  prefs.enabledFeeds = prefs.enabledFeeds.filter(name => name !== feedName)

  // Remove from favorites
  prefs.favoriteFeeds = prefs.favoriteFeeds.filter(name => name !== feedName)

  await saveFeedPreferences(prefs)
  return prefs
}

/**
 * Unblock a feed
 */
export async function unblockFeed(feedName: string): Promise<FeedPreferences> {
  const prefs = await getFeedPreferences()

  // Remove from blocked
  prefs.blockedFeeds = prefs.blockedFeeds.filter(name => name !== feedName)

  await saveFeedPreferences(prefs)
  return prefs
}

/**
 * Toggle feed as favorite
 */
export async function toggleFavorite(feedName: string): Promise<FeedPreferences> {
  const prefs = await getFeedPreferences()

  const index = prefs.favoriteFeeds.indexOf(feedName)
  if (index >= 0) {
    prefs.favoriteFeeds.splice(index, 1)
  } else {
    prefs.favoriteFeeds.push(feedName)
  }

  await saveFeedPreferences(prefs)
  return prefs
}

/**
 * Enable all feeds in a category
 */
export async function enableCategory(category: string, allFeeds: RssFeed[]): Promise<FeedPreferences> {
  const prefs = await getFeedPreferences()

  // Get all feeds in this category
  const categoryFeeds = allFeeds.filter(f => f.category === category)

  // Add to enabled list
  for (const feed of categoryFeeds) {
    if (!prefs.enabledFeeds.includes(feed.name)) {
      prefs.enabledFeeds.push(feed.name)
    }
    // Remove from blocked
    prefs.blockedFeeds = prefs.blockedFeeds.filter(name => name !== feed.name)
  }

  await saveFeedPreferences(prefs)
  return prefs
}

/**
 * Disable all feeds in a category
 */
export async function disableCategory(category: string, allFeeds: RssFeed[]): Promise<FeedPreferences> {
  const prefs = await getFeedPreferences()

  // Get all feeds in this category
  const categoryFeeds = allFeeds.filter(f => f.category === category)

  // Remove from enabled list
  for (const feed of categoryFeeds) {
    prefs.enabledFeeds = prefs.enabledFeeds.filter(name => name !== feed.name)
  }

  await saveFeedPreferences(prefs)
  return prefs
}

/**
 * Filter feeds based on user preferences
 */
export function filterEnabledFeeds(feeds: RssFeed[], preferences: FeedPreferences): RssFeed[] {
  return feeds.filter(feed => isFeedEnabled(feed, preferences))
}

/**
 * Get only favorite feeds
 */
export function getFavoriteFeeds(feeds: RssFeed[], preferences: FeedPreferences): RssFeed[] {
  return feeds.filter(feed => preferences.favoriteFeeds.includes(feed.name))
}

/**
 * Get blocked feeds
 */
export function getBlockedFeeds(feeds: RssFeed[], preferences: FeedPreferences): RssFeed[] {
  return feeds.filter(feed => preferences.blockedFeeds.includes(feed.name))
}

/**
 * Reset all preferences to default
 */
export async function resetPreferences(): Promise<FeedPreferences> {
  const defaults = { ...DEFAULT_PREFERENCES }
  await saveFeedPreferences(defaults)
  return defaults
}

/**
 * Get feed statistics
 */
export function getFeedStats(feeds: RssFeed[], preferences: FeedPreferences): {
  total: number
  enabled: number
  blocked: number
  favorites: number
  byCategory: Record<string, { total: number; enabled: number }>
} {
  const stats = {
    total: feeds.length,
    enabled: 0,
    blocked: preferences.blockedFeeds.length,
    favorites: preferences.favoriteFeeds.length,
    byCategory: {} as Record<string, { total: number; enabled: number }>,
  }

  for (const feed of feeds) {
    if (!stats.byCategory[feed.category]) {
      stats.byCategory[feed.category] = { total: 0, enabled: 0 }
    }
    stats.byCategory[feed.category].total++

    if (isFeedEnabled(feed, preferences)) {
      stats.enabled++
      stats.byCategory[feed.category].enabled++
    }
  }

  return stats
}
