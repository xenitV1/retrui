// Client-side storage utility using localStorage

type StorageKey = string;

export const storage = {
  // Get item from localStorage
  get<T>(key: StorageKey): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  },

  // Set item in localStorage
  set<T>(key: StorageKey, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  // Remove item from localStorage
  remove(key: StorageKey): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
    }
  },

  // Clear all items from localStorage
  clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  // Check if key exists
  has(key: StorageKey): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.localStorage.getItem(key) !== null;
  },

  // Get all keys
  keys(): StorageKey[] {
    if (typeof window === 'undefined') return [];
    
    return Object.keys(window.localStorage);
  }
};

// Storage keys - centralize storage key management
export const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  PREFERENCES: 'user_preferences',
  THEME: 'theme',
  CACHE: 'cache_data',
} as const;

