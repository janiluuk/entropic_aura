// Audio caching service using IndexedDB
class AudioCacheService {
  constructor() {
    this.dbName = 'entropic-aura-cache'
    this.storeName = 'audio-cache'
    this.version = 1
    this.db = null
    this.maxCacheSize = 100 * 1024 * 1024 // 100MB
    this.maxCacheAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  }

  /**
   * Initialize the IndexedDB database
   */
  async init() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
          objectStore.createIndex('size', 'size', { unique: false })
        }
      }
    })
  }

  /**
   * Generate cache key from audio parameters
   */
  generateKey(params) {
    const { text, mood } = params
    return `audio_${mood}_${this._hashString(text)}`
  }

  /**
   * Simple hash function for strings
   */
  _hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get cached audio blob
   */
  async get(params) {
    await this.init()
    
    const key = this.generateKey(params)
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.get(key)

      request.onsuccess = () => {
        const result = request.result
        
        if (!result) {
          resolve(null)
          return
        }

        // Check if cache entry is still valid
        const now = Date.now()
        if (now - result.timestamp > this.maxCacheAge) {
          // Cache expired, delete it
          this.delete(key)
          resolve(null)
          return
        }

        resolve(result.blob)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Store audio blob in cache
   */
  async set(params, blob) {
    await this.init()
    
    const key = this.generateKey(params)
    const size = blob.size

    // Check if we need to clear space
    await this._ensureSpace(size)

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      
      const entry = {
        key,
        blob,
        timestamp: Date.now(),
        size,
        params
      }

      const request = objectStore.put(entry)

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete a cache entry
   */
  async delete(key) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.delete(key)

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get total cache size
   */
  async getTotalSize() {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const entries = request.result
        const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0)
        resolve(totalSize)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Ensure there's enough space for a new entry
   */
  async _ensureSpace(requiredSize) {
    const totalSize = await this.getTotalSize()
    
    if (totalSize + requiredSize <= this.maxCacheSize) {
      return true
    }

    // Need to clear some space - delete oldest entries
    await this._clearOldestEntries(requiredSize)
  }

  /**
   * Clear oldest cache entries to make space
   */
  async _clearOldestEntries(requiredSpace) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      const index = objectStore.index('timestamp')
      const request = index.openCursor()

      let freedSpace = 0
      const keysToDelete = []

      request.onsuccess = (event) => {
        const cursor = event.target.result
        
        if (cursor && freedSpace < requiredSpace) {
          keysToDelete.push(cursor.primaryKey)
          freedSpace += cursor.value.size || 0
          cursor.continue()
        } else {
          // Delete collected keys
          keysToDelete.forEach(key => objectStore.delete(key))
          resolve(freedSpace)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all cache
   */
  async clear() {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.clear()

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const entries = request.result
        const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0)
        const count = entries.length

        resolve({
          count,
          totalSize,
          maxSize: this.maxCacheSize,
          usage: (totalSize / this.maxCacheSize) * 100
        })
      }

      request.onerror = () => reject(request.error)
    })
  }
}

// Create singleton instance
const audioCacheService = new AudioCacheService()

export default audioCacheService
