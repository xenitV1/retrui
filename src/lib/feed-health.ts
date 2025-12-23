/**
 * Feed Health Tracking System
 *
 * Tracks RSS feed success/failure rates and implements circuit breaker pattern
 * to temporarily disable feeds that consistently fail.
 */

import { storage } from './indexeddb'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Health status for a single RSS feed
 */
export interface FeedHealthEntry {
  url: string                    // Feed URL (unique identifier)
  successCount: number           // Total successful fetches
  failureCount: number           // Total failed fetches
  lastFailure: number            // Timestamp of last failure
  lastSuccess: number            // Timestamp of last success
  consecutiveFailures: number    // Current streak of failures
  isDisabled: boolean            // Whether feed is temporarily disabled
  disabledUntil?: number         // Timestamp when disabled period ends
}

/**
 * Health statistics for UI display
 */
export interface FeedHealthStats {
  totalFeeds: number
  healthyFeeds: number           // Feeds with <50% failure rate
  unhealthyFeeds: number         // Feeds with >=50% failure rate
  disabledFeeds: number          // Currently disabled feeds
  overallSuccessRate: number     // Percentage
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FEED_HEALTH_STORAGE_KEY = 'feed_health'
const CIRCUIT_BREAKER_THRESHOLD = 5      // Disable after 5 consecutive failures
const CIRCUIT_BREAKER_COOLDOWN = 60 * 60 * 1000  // 1 hour cooldown
const UNHEALTHY_THRESHOLD = 0.5          // 50% failure rate = unhealthy

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

/**
 * Get all feed health entries from storage
 */
async function getAllHealthEntries(): Promise<Map<string, FeedHealthEntry>> {
  try {
    const entries = await storage.get<FeedHealthEntry[]>(FEED_HEALTH_STORAGE_KEY)
    if (!entries) {
      return new Map()
    }
    return new Map(entries.map(entry => [entry.url, entry]))
  } catch (error) {
    console.error('Error loading feed health entries:', error)
    return new Map()
  }
}

/**
 * Save all feed health entries to storage
 */
async function saveHealthEntries(entries: Map<string, FeedHealthEntry>): Promise<void> {
  try {
    const array = Array.from(entries.values())
    await storage.set(FEED_HEALTH_STORAGE_KEY, array)
  } catch (error) {
    console.error('Error saving feed health entries:', error)
  }
}

/**
 * Get or create health entry for a specific feed URL
 */
async function getOrCreateEntry(url: string): Promise<FeedHealthEntry> {
  const entries = await getAllHealthEntries()
  const existing = entries.get(url)

  if (existing) {
    // Check if disabled period has expired
    if (existing.isDisabled && existing.disabledUntil) {
      const now = Date.now()
      if (now >= existing.disabledUntil) {
        // Re-enable the feed
        const reEnabled = {
          ...existing,
          isDisabled: false,
          disabledUntil: undefined,
          consecutiveFailures: 0
        }
        entries.set(url, reEnabled)
        await saveHealthEntries(entries)
        return reEnabled
      }
    }
    return existing
  }

  // Create new entry
  const newEntry: FeedHealthEntry = {
    url,
    successCount: 0,
    failureCount: 0,
    lastFailure: 0,
    lastSuccess: 0,
    consecutiveFailures: 0,
    isDisabled: false
  }

  entries.set(url, newEntry)
  await saveHealthEntries(entries)
  return newEntry
}

// ============================================================================
// HEALTH TRACKING FUNCTIONS
// ============================================================================

/**
 * Record a successful feed fetch
 */
export async function recordFeedSuccess(url: string): Promise<void> {
  const entry = await getOrCreateEntry(url)
  const entries = await getAllHealthEntries()

  const updated: FeedHealthEntry = {
    ...entry,
    successCount: entry.successCount + 1,
    lastSuccess: Date.now(),
    consecutiveFailures: 0,
    isDisabled: false,
    disabledUntil: undefined
  }

  entries.set(url, updated)
  await saveHealthEntries(entries)
}

/**
 * Record a failed feed fetch
 */
export async function recordFeedFailure(url: string, error?: string): Promise<void> {
  const entry = await getOrCreateEntry(url)
  const entries = await getAllHealthEntries()

  const consecutiveFailures = entry.consecutiveFailures + 1
  const shouldDisable = consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD

  const updated: FeedHealthEntry = {
    ...entry,
    failureCount: entry.failureCount + 1,
    lastFailure: Date.now(),
    consecutiveFailures,
    isDisabled: shouldDisable,
    disabledUntil: shouldDisable ? Date.now() + CIRCUIT_BREAKER_COOLDOWN : undefined
  }

  entries.set(url, updated)
  await saveHealthEntries(entries)

  // Log when feed is disabled
  if (shouldDisable && process.env.NODE_ENV === 'development') {
    console.warn(
      `[FeedHealth] Feed disabled after ${CIRCUIT_BREAKER_THRESHOLD} consecutive failures: ${url}`,
      { error, willReenableAt: new Date(updated.disabledUntil!).toISOString() }
    )
  }
}

/**
 * Check if a feed is available for fetching
 */
export async function isFeedAvailable(url: string): Promise<boolean> {
  const entry = await getOrCreateEntry(url)
  return !entry.isDisabled
}

/**
 * Get health status for a specific feed
 */
export async function getFeedHealth(url: string): Promise<FeedHealthEntry | null> {
  const entries = await getAllHealthEntries()
  return entries.get(url) || null
}

/**
 * Get all disabled feed URLs
 */
export async function getDisabledFeeds(): Promise<string[]> {
  const entries = await getAllHealthEntries()
  const disabled: string[] = []

  for (const [url, entry] of entries.entries()) {
    if (entry.isDisabled) {
      // Check if cooldown has expired
      if (entry.disabledUntil && Date.now() >= entry.disabledUntil) {
        // Re-enable and don't include in disabled list
        await recordFeedSuccess(url) // Reset on re-enable
      } else {
        disabled.push(url)
      }
    }
  }

  return disabled
}

/**
 * Manually re-enable a disabled feed
 */
export async function reEnableFeed(url: string): Promise<boolean> {
  const entries = await getAllHealthEntries()
  const entry = entries.get(url)

  if (!entry) {
    return false
  }

  const updated: FeedHealthEntry = {
    ...entry,
    isDisabled: false,
    disabledUntil: undefined,
    consecutiveFailures: 0
  }

  entries.set(url, updated)
  await saveHealthEntries(entries)
  return true
}

/**
 * Get overall health statistics
 */
export async function getFeedHealthStats(): Promise<FeedHealthStats> {
  const entries = await getAllHealthEntries()

  if (entries.size === 0) {
    return {
      totalFeeds: 0,
      healthyFeeds: 0,
      unhealthyFeeds: 0,
      disabledFeeds: 0,
      overallSuccessRate: 100
    }
  }

  let healthyFeeds = 0
  let unhealthyFeeds = 0
  let disabledFeeds = 0
  let totalSuccesses = 0
  let totalAttempts = 0

  for (const entry of entries.values()) {
    const total = entry.successCount + entry.failureCount
    if (total === 0) continue

    totalSuccesses += entry.successCount
    totalAttempts += total

    const failureRate = entry.failureCount / total

    if (entry.isDisabled) {
      disabledFeeds++
    } else if (failureRate >= UNHEALTHY_THRESHOLD) {
      unhealthyFeeds++
    } else {
      healthyFeeds++
    }
  }

  return {
    totalFeeds: entries.size,
    healthyFeeds,
    unhealthyFeeds,
    disabledFeeds,
    overallSuccessRate: totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 100
  }
}

/**
 * Clear all feed health data (useful for testing)
 */
export async function clearFeedHealth(): Promise<void> {
  try {
    await storage.remove(FEED_HEALTH_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing feed health data:', error)
  }
}

/**
 * Get feeds that should be skipped (disabled)
 * Accepts full feed objects and returns them filtered by circuit breaker status
 */
export async function filterAvailableFeeds<T extends { url: string }>(feeds: T[]): Promise<{
  available: T[]
  skipped: Array<{ url: string; reason: string }>
}> {
  const disabledUrls = await getDisabledFeeds()
  const disabledSet = new Set(disabledUrls)

  const available: T[] = []
  const skipped: Array<{ url: string; reason: string }> = []

  for (const feed of feeds) {
    if (disabledSet.has(feed.url)) {
      skipped.push({ url: feed.url, reason: 'Temporarily disabled due to repeated failures' })
    } else {
      available.push(feed)
    }
  }

  return { available, skipped }
}
