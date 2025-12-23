/**
 * Simple in-memory cache for chat responses and embeddings
 * Reduces API calls and improves response time
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class Cache {
  private store: Map<string, CacheEntry<any>>
  private maxSize: number

  constructor(maxSize: number = 1000) {
    this.store = new Map()
    this.maxSize = maxSize
  }

  /**
   * Generate cache key from query and model
   */
  private generateKey(query: string, modelId: string): string {
    // Normalize query: lowercase, trim, remove extra spaces
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ')
    return `${modelId}:${normalized}`
  }

  /**
   * Set cache entry
   */
  set<T>(query: string, modelId: string, data: T, ttl: number = 3600000): void {
    // TTL default: 1 hour (3600000 ms)
    
    // If cache is full, remove oldest entry
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value
      this.store.delete(oldestKey)
    }

    const key = this.generateKey(query, modelId)
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Get cache entry
   */
  get<T>(query: string, modelId: string): T | null {
    const key = this.generateKey(query, modelId)
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.store.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Check if cache has entry
   */
  has(query: string, modelId: string): boolean {
    return this.get(query, modelId) !== null
  }

  /**
   * Clear cache for a specific model
   */
  clearModel(modelId: string): void {
    for (const [key] of this.store) {
      if (key.startsWith(`${modelId}:`)) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Track hits/misses
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now - entry.timestamp > entry.ttl) {
        this.store.delete(key)
      }
    }
  }
}

// Singleton instance
export const chatCache = new Cache(1000)
export const embeddingCache = new Cache(500)
export const contextCache = new Cache(500)

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  // Only run on server
  setInterval(() => {
    chatCache.cleanup()
    embeddingCache.cleanup()
    contextCache.cleanup()
  }, 5 * 60 * 1000)
}

export default Cache
