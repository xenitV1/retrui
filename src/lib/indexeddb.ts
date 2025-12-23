// IndexedDB storage utility
// Replaces localStorage for better performance and larger storage capacity

interface StorageData<T = any> {
  data: T;
  timestamp: number;
}

class IndexedDBStorage {
  private dbName = 'tech_news_db';
  private storeName = 'storage';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.initPromise;
  }

  async get<T>(key: string): Promise<StorageData<T> | null> {
    try {
      await this.init();

      if (!this.db) {
        return null;
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => {
          console.error(`Error reading from IndexedDB key "${key}":`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result || null);
        };
      });
    } catch (error) {
      console.error(`Error in get for key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, data: StorageData<T>): Promise<void> {
    try {
      await this.init();

      if (!this.db) {
        return;
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(data, key);

        request.onerror = () => {
          console.error(`Error writing to IndexedDB key "${key}":`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error(`Error in set for key "${key}":`, error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.init();

      if (!this.db) {
        return;
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => {
          console.error(`Error removing from IndexedDB key "${key}":`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error(`Error in remove for key "${key}":`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.init();

      if (!this.db) {
        return;
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => {
          console.error('Error clearing IndexedDB:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Error in clear:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const result = await this.get(key);
      return result !== null;
    } catch (error) {
      console.error(`Error in has for key "${key}":`, error);
      return false;
    }
  }

  async keys(): Promise<string[]> {
    try {
      await this.init();

      if (!this.db) {
        return [];
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();

        request.onerror = () => {
          console.error('Error getting keys from IndexedDB:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result as string[]);
        };
      });
    } catch (error) {
      console.error('Error in keys:', error);
      return [];
    }
  }

  async getOldData(maxAge: number): Promise<{ key: string; data: any }[]> {
    try {
      const allKeys = await this.keys();
      const oldData: { key: string; data: any }[] = [];
      const now = Date.now();

      for (const key of allKeys) {
        const result = await this.get(key);
        if (result && (now - result.timestamp > maxAge)) {
          oldData.push({ key, data: result });
        }
      }

      return oldData;
    } catch (error) {
      console.error('Error in getOldData:', error);
      return [];
    }
  }
}

// Singleton instance
export const idbStorage = new IndexedDBStorage();

// Convenience wrapper that matches storage API
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const result = await idbStorage.get<StorageData<T>>(key);
    return (result?.data as T) ?? null;
  },

  async set<T>(key: string, value: T): Promise<void> {
    await idbStorage.set(key, { data: value, timestamp: Date.now() } as StorageData<T>);
  },

  async remove(key: string): Promise<void> {
    await idbStorage.remove(key);
  },

  async clear(): Promise<void> {
    await idbStorage.clear();
  },

  async has(key: string): Promise<boolean> {
    return await idbStorage.has(key);
  },

  async keys(): Promise<string[]> {
    return await idbStorage.keys();
  }
};

// Storage keys - centralize storage key management
export const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  PREFERENCES: 'user_preferences',
  THEME: 'theme',
  CACHE: 'cache_data',
  CUSTOM_FEEDS: 'custom_feeds',
  FEED_PREFERENCES: 'feed_preferences',
} as const;

