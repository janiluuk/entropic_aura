// Settings management service using localStorage
class SettingsService {
  constructor() {
    this.storageKey = 'entropic-aura-settings'
    this.defaults = {
      theme: 'light',
      audioQuality: 'high',
      enableCache: true,
      maxCacheSize: 100, // MB
      autoplay: false,
      volume: 0.8,
      defaultMood: 'default',
      showNotifications: true
    }
    this.settings = this.load()
  }

  /**
   * Load settings from localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return { ...this.defaults, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return { ...this.defaults }
  }

  /**
   * Save settings to localStorage
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings))
      return true
    } catch (error) {
      console.error('Failed to save settings:', error)
      return false
    }
  }

  /**
   * Get all settings
   */
  getAll() {
    return { ...this.settings }
  }

  /**
   * Get a specific setting
   */
  get(key) {
    return this.settings[key]
  }

  /**
   * Set a specific setting
   */
  set(key, value) {
    this.settings[key] = value
    this.save()
  }

  /**
   * Update multiple settings at once
   */
  update(updates) {
    this.settings = { ...this.settings, ...updates }
    this.save()
  }

  /**
   * Reset to default settings
   */
  reset() {
    this.settings = { ...this.defaults }
    this.save()
  }

  /**
   * Export settings as JSON string
   */
  export() {
    return JSON.stringify(this.settings, null, 2)
  }

  /**
   * Import settings from JSON string
   */
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString)
      this.settings = { ...this.defaults, ...imported }
      this.save()
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }
}

// Create singleton instance
const settingsService = new SettingsService()

export default settingsService
