<template>
  <div class="settings-page">
    <div class="settings-container">
      <h1>Settings</h1>
      
      <div v-if="saveMessage" class="save-message" :class="saveMessageType">
        {{ saveMessage }}
      </div>
      
      <div class="settings-section">
        <h2>Appearance</h2>
        
        <div class="setting-item">
          <label for="theme">Theme</label>
          <select id="theme" v-model="settings.theme" @change="handleChange">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>Audio</h2>
        
        <div class="setting-item">
          <label for="audioQuality">Audio Quality</label>
          <select id="audioQuality" v-model="settings.audioQuality" @change="handleChange">
            <option value="low">Low (64 kbps)</option>
            <option value="medium">Medium (96 kbps)</option>
            <option value="high">High (128 kbps)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="volume">
            Volume
            <span class="setting-value">{{ Math.round(settings.volume * 100) }}%</span>
          </label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model.number="settings.volume"
            @change="handleChange"
          />
        </div>
        
        <div class="setting-item checkbox-item">
          <label>
            <input type="checkbox" v-model="settings.autoplay" @change="handleChange" />
            <span>Autoplay next preset</span>
          </label>
        </div>
        
        <div class="setting-item">
          <label for="defaultMood">Default Mood</label>
          <select id="defaultMood" v-model="settings.defaultMood" @change="handleChange">
            <option value="default">Default</option>
            <option value="relaxing">Relaxing</option>
            <option value="energizing">Energizing</option>
            <option value="peaceful">Peaceful</option>
            <option value="nature">Nature</option>
            <option value="dark">Dark</option>
            <option value="cinematic">Cinematic</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>Cache</h2>
        
        <div class="setting-item checkbox-item">
          <label>
            <input type="checkbox" v-model="settings.enableCache" @change="handleChange" />
            <span>Enable audio caching</span>
          </label>
          <small>Cache audio files locally for faster playback</small>
        </div>
        
        <div class="setting-item">
          <label for="maxCacheSize">
            Max Cache Size
            <span class="setting-value">{{ settings.maxCacheSize }} MB</span>
          </label>
          <input
            id="maxCacheSize"
            type="range"
            min="50"
            max="500"
            step="50"
            v-model.number="settings.maxCacheSize"
            @change="handleChange"
          />
        </div>
        
        <div class="cache-stats" v-if="cacheStats">
          <h3>Cache Statistics</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Cached Items:</span>
              <span class="stat-value">{{ cacheStats.count }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Used Space:</span>
              <span class="stat-value">{{ formatBytes(cacheStats.totalSize) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Usage:</span>
              <span class="stat-value">{{ cacheStats.usage.toFixed(1) }}%</span>
            </div>
          </div>
          <button @click="clearCache" class="btn-danger">Clear Cache</button>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>Notifications</h2>
        
        <div class="setting-item checkbox-item">
          <label>
            <input type="checkbox" v-model="settings.showNotifications" @change="handleChange" />
            <span>Show notifications</span>
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>Data Management</h2>
        
        <div class="button-group">
          <button @click="exportSettings" class="btn-secondary">
            Export Settings
          </button>
          <button @click="showImport = true" class="btn-secondary">
            Import Settings
          </button>
          <button @click="resetSettings" class="btn-danger">
            Reset to Defaults
          </button>
        </div>
        
        <div v-if="showImport" class="import-section">
          <textarea
            v-model="importData"
            placeholder="Paste exported settings JSON here..."
            rows="6"
          />
          <div class="button-group">
            <button @click="importSettings" class="btn-primary">Import</button>
            <button @click="showImport = false" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import settingsService from '@/services/settingsService'
import audioCacheService from '@/services/audioCacheService'

const settings = ref(settingsService.getAll())
const cacheStats = ref(null)
const saveMessage = ref('')
const saveMessageType = ref('success')
const showImport = ref(false)
const importData = ref('')

onMounted(async () => {
  await loadCacheStats()
})

function handleChange() {
  settingsService.update(settings.value)
  showSaveMessage('Settings saved', 'success')
}

function showSaveMessage(message, type = 'success') {
  saveMessage.value = message
  saveMessageType.value = type
  setTimeout(() => {
    saveMessage.value = ''
  }, 3000)
}

async function loadCacheStats() {
  try {
    cacheStats.value = await audioCacheService.getStats()
  } catch (error) {
    console.error('Failed to load cache stats:', error)
  }
}

async function clearCache() {
  if (!confirm('Are you sure you want to clear the cache? This cannot be undone.')) {
    return
  }
  
  try {
    await audioCacheService.clear()
    await loadCacheStats()
    showSaveMessage('Cache cleared successfully', 'success')
  } catch (error) {
    showSaveMessage('Failed to clear cache', 'error')
  }
}

function exportSettings() {
  const data = settingsService.export()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'entropic-aura-settings.json'
  a.click()
  URL.revokeObjectURL(url)
  showSaveMessage('Settings exported', 'success')
}

function importSettings() {
  try {
    const success = settingsService.import(importData.value)
    if (success) {
      settings.value = settingsService.getAll()
      showImport.value = false
      importData.value = ''
      showSaveMessage('Settings imported successfully', 'success')
    } else {
      showSaveMessage('Failed to import settings', 'error')
    }
  } catch (error) {
    showSaveMessage('Invalid settings format', 'error')
  }
}

function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return
  }
  
  settingsService.reset()
  settings.value = settingsService.getAll()
  showSaveMessage('Settings reset to defaults', 'success')
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #2c3e50;
  margin: 0 0 2rem 0;
}

.save-message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 600;
}

.save-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.save-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #f0f0f0;
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h2 {
  color: #2c3e50;
  font-size: 1.25rem;
  margin: 0 0 1.5rem 0;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.setting-value {
  float: right;
  color: #42b983;
  font-weight: 600;
}

.setting-item select,
.setting-item input[type="range"] {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.setting-item select:focus {
  outline: none;
  border-color: #42b983;
}

.setting-item input[type="range"] {
  padding: 0;
  height: 8px;
  background: #ddd;
  cursor: pointer;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox-item small {
  display: block;
  margin-top: 0.5rem;
  margin-left: 2rem;
  color: #999;
  font-size: 0.875rem;
}

.cache-stats {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1.5rem;
}

.cache-stats h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #2c3e50;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #42b983;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover {
  background: #38a375;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.import-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.import-section textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  resize: vertical;
}

.import-section textarea:focus {
  outline: none;
  border-color: #42b983;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1rem;
  }
  
  .settings-container {
    padding: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .button-group button {
    width: 100%;
  }
}
</style>
