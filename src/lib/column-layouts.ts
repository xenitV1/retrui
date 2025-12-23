/**
 * Column Layout System
 *
 * TweetDeck-style multi-column layout management.
 * Users can add/remove/reorder columns, each with customizable feed sources.
 */

import { storage, STORAGE_KEYS } from './indexeddb'
import type { RssFeed } from './rss-feeds'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Column types determine what feeds a column displays
 */
export type ColumnType =
  | 'all'          // All feeds from all categories
  | 'category'     // Feeds from a specific category
  | 'language'     // Feeds from a specific language (en, tr, etc.)
  | 'feeds'        // Specific selected feeds
  | 'favorites'    // User's favorite feeds
  | 'custom'       // User's custom feeds only

/**
 * Filter configuration for a column
 */
export interface ColumnFilter {
  type: ColumnType

  // For 'category' type
  category?: string

  // For 'language' type
  language?: string

  // For 'feeds' type - specific feed names
  feedNames?: string[]

  // Additional search filter (optional)
  searchQuery?: string
}

/**
 * A single column configuration
 */
export interface Column {
  id: string                    // Unique column ID
  title: string                 // Display title (e.g., "Turkish News", "Tech")
  filter: ColumnFilter          // What feeds to show
  width: number                 // Column width percentage (default: 50 for 2 columns)
  order: number                 // Display order (0, 1, 2, ...)
  collapsed: boolean            // Whether column is collapsed
}

/**
 * Complete layout configuration
 */
export interface ColumnLayout {
  id: string                    // Layout ID
  name: string                  // Layout name (e.g., "My Layout")
  columns: Column[]             // All columns in this layout
  createdAt: number             // Timestamp
  updatedAt: number             // Timestamp
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const LAYOUTS_STORAGE_KEY = 'column_layouts'
const ACTIVE_LAYOUT_KEY = 'active_column_layout'

// ============================================================================
// DEFAULT LAYOUTS
// ============================================================================

/**
 * Default layouts for new users
 */
export const DEFAULT_LAYOUTS: ColumnLayout[] = [
  {
    id: 'default-two-column',
    name: 'Default (2 Columns)',
    columns: [
      {
        id: 'col-default',
        title: 'All Feeds',
        filter: { type: 'all' },
        width: 50,
        order: 0,
        collapsed: false
      },
      {
        id: 'col-custom',
        title: 'Custom Feeds',
        filter: { type: 'custom' },
        width: 50,
        order: 1,
        collapsed: false
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'language-split',
    name: 'Language Split (EN/TR)',
    columns: [
      {
        id: 'col-english',
        title: 'English',
        filter: { type: 'language', language: 'en' },
        width: 50,
        order: 0,
        collapsed: false
      },
      {
        id: 'col-turkish',
        title: 'Türkçe',
        filter: { type: 'language', language: 'tr' },
        width: 50,
        order: 1,
        collapsed: false
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'intl-split-4',
    name: 'International Split (4)',
    columns: [
      {
        id: 'col-int-en',
        title: '🇬🇧 English',
        filter: { type: 'language', language: 'en' },
        width: 25,
        order: 0,
        collapsed: false
      },
      {
        id: 'col-int-tr',
        title: '🇹🇷 Türkçe',
        filter: { type: 'language', language: 'tr' },
        width: 25,
        order: 1,
        collapsed: false
      },
      {
        id: 'col-int-de',
        title: '🇩🇪 Deutsch',
        filter: { type: 'language', language: 'de' },
        width: 25,
        order: 2,
        collapsed: false
      },
      {
        id: 'col-int-fr',
        title: '🇫🇷 Français',
        filter: { type: 'language', language: 'fr' },
        width: 25,
        order: 3,
        collapsed: false
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'multi-language',
    name: 'Multi-Language (7)',
    columns: [
      {
        id: 'col-en',
        title: '🇬🇧 English',
        filter: { type: 'language', language: 'en' },
        width: 14.28,
        order: 0,
        collapsed: false
      },
      {
        id: 'col-tr',
        title: '🇹🇷 Türkçe',
        filter: { type: 'language', language: 'tr' },
        width: 14.28,
        order: 1,
        collapsed: false
      },
      {
        id: 'col-de',
        title: '🇩🇪 Deutsch',
        filter: { type: 'language', language: 'de' },
        width: 14.28,
        order: 2,
        collapsed: false
      },
      {
        id: 'col-fr',
        title: '🇫🇷 Français',
        filter: { type: 'language', language: 'fr' },
        width: 14.28,
        order: 3,
        collapsed: false
      },
      {
        id: 'col-es',
        title: '🇪🇸 Español',
        filter: { type: 'language', language: 'es' },
        width: 14.28,
        order: 4,
        collapsed: false
      },
      {
        id: 'col-zh',
        title: '🇨🇳 中文',
        filter: { type: 'language', language: 'zh' },
        width: 14.28,
        order: 5,
        collapsed: false
      },
      {
        id: 'col-hi',
        title: '🇮🇳 हिन्दी',
        filter: { type: 'language', language: 'hi' },
        width: 14.32,
        order: 6,
        collapsed: false
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'category-focused',
    name: 'Tech & Business',
    columns: [
      {
        id: 'col-tech',
        title: 'Technology',
        filter: { type: 'category', category: 'Technology' },
        width: 50,
        order: 0,
        collapsed: false
      },
      {
        id: 'col-business',
        title: 'Business',
        filter: { type: 'category', category: 'Business' },
        width: 50,
        order: 1,
        collapsed: false
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'three-column',
    name: 'Three Column',
    columns: [
      {
        id: 'col-news',
        title: 'News',
        filter: { type: 'category', category: 'News' },
        width: 33.33,
        order: 0,
        collapsed: false
      },
      {
        id: 'col-tech',
        title: 'Technology',
        filter: { type: 'category', category: 'Technology' },
        width: 33.33,
        order: 1,
        collapsed: false
      },
      {
        id: 'col-custom',
        title: 'Custom',
        filter: { type: 'custom' },
        width: 33.34,
        order: 2,
        collapsed: false
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
]

// ============================================================================
// COLUMN MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all saved layouts
 */
export async function getLayouts(): Promise<ColumnLayout[]> {
  try {
    const layouts = await storage.get<ColumnLayout[]>(LAYOUTS_STORAGE_KEY)
    return layouts || DEFAULT_LAYOUTS
  } catch (error) {
    console.error('Error loading layouts:', error)
    return DEFAULT_LAYOUTS
  }
}

/**
 * Get the active layout
 */
export async function getActiveLayout(): Promise<ColumnLayout | null> {
  try {
    const activeId = await storage.get<string>(ACTIVE_LAYOUT_KEY)
    if (!activeId) {
      // Return first default layout if none active
      const layouts = await getLayouts()
      return layouts[0] || null
    }

    const layouts = await getLayouts()
    return layouts.find(l => l.id === activeId) || layouts[0] || null
  } catch (error) {
    console.error('Error loading active layout:', error)
    return null
  }
}

/**
 * Save a layout (create or update)
 */
export async function saveLayout(layout: ColumnLayout): Promise<void> {
  try {
    const layouts = await getLayouts()
    const existingIndex = layouts.findIndex(l => l.id === layout.id)

    const updatedLayout = {
      ...layout,
      updatedAt: Date.now()
    }

    if (existingIndex >= 0) {
      layouts[existingIndex] = updatedLayout
    } else {
      layouts.push(updatedLayout)
    }

    await storage.set(LAYOUTS_STORAGE_KEY, layouts)
  } catch (error) {
    console.error('Error saving layout:', error)
    throw error
  }
}

/**
 * Set the active layout
 */
export async function setActiveLayout(layoutId: string): Promise<void> {
  try {
    await storage.set(ACTIVE_LAYOUT_KEY, layoutId)
  } catch (error) {
    console.error('Error setting active layout:', error)
    throw error
  }
}

/**
 * Delete a layout
 */
export async function deleteLayout(layoutId: string): Promise<void> {
  try {
    const layouts = await getLayouts()
    const filtered = layouts.filter(l => l.id !== layoutId)

    if (filtered.length === 0) {
      // Keep at least one layout
      return
    }

    await storage.set(LAYOUTS_STORAGE_KEY, filtered)

    // If deleted layout was active, set a new active layout
    const activeId = await storage.get<string>(ACTIVE_LAYOUT_KEY)
    if (activeId === layoutId) {
      await storage.set(ACTIVE_LAYOUT_KEY, filtered[0].id)
    }
  } catch (error) {
    console.error('Error deleting layout:', error)
    throw error
  }
}

// ============================================================================
// COLUMN MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Add a new column to a layout
 */
export async function addColumn(layoutId: string, column: Omit<Column, 'id' | 'order'>): Promise<ColumnLayout> {
  const layouts = await getLayouts()
  const layout = layouts.find(l => l.id === layoutId)

  if (!layout) {
    throw new Error('Layout not found')
  }

  const newColumn: Column = {
    ...column,
    id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    order: layout.columns.length
  }

  // Recalculate widths
  const totalColumns = layout.columns.length + 1
  const newWidth = 100 / totalColumns

  const updatedColumns = [
    ...layout.columns.map(col => ({ ...col, width: newWidth })),
    newColumn
  ]

  const updatedLayout = {
    ...layout,
    columns: updatedColumns,
    updatedAt: Date.now()
  }

  await saveLayout(updatedLayout)
  return updatedLayout
}

/**
 * Remove a column from a layout
 */
export async function removeColumn(layoutId: string, columnId: string): Promise<ColumnLayout> {
  const layouts = await getLayouts()
  const layout = layouts.find(l => l.id === layoutId)

  if (!layout) {
    throw new Error('Layout not found')
  }

  if (layout.columns.length <= 1) {
    throw new Error('Cannot remove the last column')
  }

  const filteredColumns = layout.columns.filter(col => col.id !== columnId)

  // Recalculate widths and reorder
  const newWidth = 100 / filteredColumns.length
  const updatedColumns = filteredColumns
    .map((col, index) => ({
      ...col,
      width: newWidth,
      order: index
    }))

  const updatedLayout = {
    ...layout,
    columns: updatedColumns,
    updatedAt: Date.now()
  }

  await saveLayout(updatedLayout)
  return updatedLayout
}

/**
 * Reorder columns in a layout
 */
export async function reorderColumns(
  layoutId: string,
  columnIds: string[]  // New order of column IDs
): Promise<ColumnLayout> {
  const layouts = await getLayouts()
  const layout = layouts.find(l => l.id === layoutId)

  if (!layout) {
    throw new Error('Layout not found')
  }

  const columnMap = new Map(layout.columns.map(col => [col.id, col]))
  const reorderedColumns = columnIds
    .map(id => columnMap.get(id))
    .filter((col): col is Column => col !== undefined)
    .map((col, index) => ({ ...col, order: index }))

  const updatedLayout = {
    ...layout,
    columns: reorderedColumns,
    updatedAt: Date.now()
  }

  await saveLayout(updatedLayout)
  return updatedLayout
}

/**
 * Update a column's configuration
 */
export async function updateColumn(
  layoutId: string,
  columnId: string,
  updates: Partial<Column>
): Promise<ColumnLayout> {
  const layouts = await getLayouts()
  const layout = layouts.find(l => l.id === layoutId)

  if (!layout) {
    throw new Error('Layout not found')
  }

  const updatedColumns = layout.columns.map(col =>
    col.id === columnId ? { ...col, ...updates } : col
  )

  const updatedLayout = {
    ...layout,
    columns: updatedColumns,
    updatedAt: Date.now()
  }

  await saveLayout(updatedLayout)
  return updatedLayout
}

/**
 * Toggle column collapsed state
 */
export async function toggleColumnCollapse(
  layoutId: string,
  columnId: string
): Promise<ColumnLayout> {
  const layouts = await getLayouts()
  const layout = layouts.find(l => l.id === layoutId)

  if (!layout) {
    throw new Error('Layout not found')
  }

  const updatedColumns = layout.columns.map(col =>
    col.id === columnId
      ? { ...col, collapsed: !col.collapsed }
      : col
  )

  const updatedLayout = {
    ...layout,
    columns: updatedColumns,
    updatedAt: Date.now()
  }

  await saveLayout(updatedLayout)
  return updatedLayout
}

// ============================================================================
// FEED FILTERING FUNCTIONS
// ============================================================================

/**
 * Get feeds that match a column's filter
 */
export function getFeedsForColumn(
  allFeeds: RssFeed[],
  customFeeds: Array<{ name: string; url: string; category: string }>,
  column: Column
): RssFeed[] {
  const { filter } = column

  switch (filter.type) {
    case 'all':
      return allFeeds

    case 'category':
      return filter.category
        ? allFeeds.filter(feed => feed.category === filter.category)
        : allFeeds

    case 'language':
      return filter.language
        ? allFeeds.filter(feed => feed.language === filter.language)
        : allFeeds

    case 'feeds':
      return filter.feedNames
        ? allFeeds.filter(feed => filter.feedNames!.includes(feed.name))
        : []

    case 'favorites':
      // This will be handled by feed preferences
      return allFeeds

    case 'custom':
      // Return custom feeds as RssFeed format
      return customFeeds.map(feed => ({
        name: feed.name,
        url: feed.url,
        category: feed.category
      }))

    default:
      return allFeeds
  }
}

/**
 * Create a new blank layout
 */
export function createBlankLayout(name: string): ColumnLayout {
  return {
    id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    columns: [
      {
        id: `col-${Date.now()}`,
        title: 'All Feeds',
        filter: { type: 'all' },
        width: 100,
        order: 0,
        collapsed: false
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

/**
 * Duplicate a layout
 */
export async function duplicateLayout(layoutId: string, newName: string): Promise<ColumnLayout> {
  const layouts = await getLayouts()
  const layout = layouts.find(l => l.id === layoutId)

  if (!layout) {
    throw new Error('Layout not found')
  }

  const duplicated: ColumnLayout = {
    ...layout,
    id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: newName,
    columns: layout.columns.map(col => ({
      ...col,
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })),
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  await saveLayout(duplicated)
  return duplicated
}
