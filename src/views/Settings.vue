<template>
  <div class="settings-page">
    <div class="container">
      <h1>Settings</h1>

      <div class="settings-sections">
        <!-- Audio Settings -->
        <section class="settings-section">
          <h2>Audio Settings</h2>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Default Volume</span>
              <span class="label-value">{{ settings.audio.defaultVolume }}%</span>
            </label>
            <input
              v-model.number="settings.audio.defaultVolume"
              type="range"
              min="0"
              max="100"
              class="slider"
            />
          </div>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Audio Quality</span>
            </label>
            <select v-model="settings.audio.quality" class="select-input">
              <option value="low">Low (64 kbps)</option>
              <option value="medium">Medium (128 kbps)</option>
              <option value="high">High (256 kbps)</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label>
              <input v-model="settings.audio.autoplay" type="checkbox" />
              <span class="label-text">Autoplay audio when generated</span>
            </label>
          </div>
        </section>

        <!-- Playback Settings -->
        <section class="settings-section">
          <h2>Playback Settings</h2>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Default Mood</span>
            </label>
            <select v-model="settings.playback.defaultMood" class="select-input">
              <option value="">None</option>
              <option v-for="mood in moods" :key="mood" :value="mood">
                {{ mood }}
              </option>
            </select>
          </div>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Default Duration (seconds)</span>
            </label>
            <input
              v-model.number="settings.playback.defaultDuration"
              type="number"
              min="30"
              max="600"
              step="30"
              class="number-input"
            />
          </div>
          
          <div class="setting-item">
            <label>
              <input v-model="settings.playback.loopByDefault" type="checkbox" />
              <span class="label-text">Loop audio by default</span>
            </label>
          </div>
        </section>

        <!-- Playlist Settings -->
        <section class="settings-section">
          <h2>Playlist Settings</h2>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Default Rotation Interval (minutes)</span>
            </label>
            <input
              v-model.number="settings.playlist.defaultRotationInterval"
              type="number"
              min="1"
              max="60"
              class="number-input"
            />
          </div>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Crossfade Duration (seconds)</span>
            </label>
            <input
              v-model.number="settings.playlist.crossfadeDuration"
              type="number"
              min="0"
              max="30"
              class="number-input"
            />
            <small>Time to blend between tracks (0 = no crossfade)</small>
          </div>
          
          <div class="setting-item">
            <label>
              <input v-model="settings.playlist.shuffleByDefault" type="checkbox" />
              <span class="label-text">Shuffle playlists by default</span>
            </label>
          </div>
        </section>

        <!-- Appearance Settings -->
        <section class="settings-section">
          <h2>Appearance</h2>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Theme</span>
            </label>
            <select v-model="settings.appearance.theme" class="select-input">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (system)</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label>
              <input v-model="settings.appearance.showVisualizer" type="checkbox" />
              <span class="label-text">Show background visualizer</span>
            </label>
          </div>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Visualizer Style</span>
            </label>
            <select v-model="settings.appearance.visualizerStyle" @change="changeVisualizerStyle" class="select-input">
              <option value="particles">Particles - Classic floating dots</option>
              <option value="waves">Waves - Flowing grid waves</option>
              <option value="nebula">Nebula - Cosmic cloud</option>
              <option value="grid">Grid - Retro wireframe</option>
            </select>
            <small>Choose your preferred background animation style</small>
          </div>
        </section>

        <!-- Data Management -->
        <section class="settings-section">
          <h2>Data Management</h2>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Export / Import</span>
            </label>
            <div class="button-group">
              <button @click="exportData" class="action-btn" title="Export Data">
                <i class="pi pi-download"></i>
                <span>Export Presets & Playlists</span>
              </button>
              <button @click="triggerImport" class="action-btn" title="Import Data">
                <i class="pi pi-upload"></i>
                <span>Import Data</span>
              </button>
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                style="display: none"
                @change="importData"
              />
            </div>
          </div>
          
          <div class="setting-item">
            <label>
              <span class="label-text">Clear Data</span>
            </label>
            <button @click="clearAllData" class="danger-btn" title="Clear All Data">
              <i class="pi pi-trash"></i>
              <span>Clear All Presets & Playlists</span>
            </button>
            <small>Warning: This action cannot be undone!</small>
          </div>
        </section>
      </div>

      <div class="actions">
        <button @click="resetToDefaults" class="secondary-btn" title="Reset Settings">
          <i class="pi pi-refresh"></i>
          <span>Reset to Defaults</span>
        </button>
        <button @click="saveSettings" class="primary-btn" title="Save Settings">
          <i class="pi pi-check"></i>
          <span>Save Settings</span>
        </button>
      </div>

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const moods = ref([])
const fileInput = ref(null)
const message = ref('')
const messageType = ref('success')

const defaultSettings = {
  audio: {
    defaultVolume: 75,
    quality: 'medium',
    autoplay: true
  },
  playback: {
    defaultMood: '',
    defaultDuration: 300,
    loopByDefault: true
  },
  playlist: {
    defaultRotationInterval: 5,
    crossfadeDuration: 5,
    shuffleByDefault: false
  },
  appearance: {
    theme: 'auto',
    showVisualizer: true,
    visualizerStyle: 'particles'
  }
}

const settings = ref(JSON.parse(JSON.stringify(defaultSettings)))

onMounted(async () => {
  loadSettings()
  await loadMoods()
})

function loadSettings() {
  const saved = localStorage.getItem('entropicAuraSettings')
  if (saved) {
    try {
      settings.value = JSON.parse(saved)
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }
}

function saveSettings() {
  try {
    localStorage.setItem('entropicAuraSettings', JSON.stringify(settings.value))
    showMessage('Settings saved successfully!', 'success')
  } catch (err) {
    showMessage('Failed to save settings: ' + err.message, 'error')
  }
}

function changeVisualizerStyle() {
  // Save settings
  saveSettings()
  
  // Notify visualizer component to change style
  window.dispatchEvent(new CustomEvent('visualizerStyleChanged', {
    detail: settings.value.appearance.visualizerStyle
  }))
  
  showMessage(`Visualizer style changed to ${settings.value.appearance.visualizerStyle}`, 'success')
}

function resetToDefaults() {
  if (confirm('Reset all settings to defaults?')) {
    settings.value = JSON.parse(JSON.stringify(defaultSettings))
    saveSettings()
    showMessage('Settings reset to defaults', 'success')
  }
}

async function loadMoods() {
  try {
    const response = await fetch('/api/moods')
    if (!response.ok) throw new Error('Failed to load moods')
    
    const data = await response.json()
    moods.value = data.moods
  } catch (err) {
    console.error('Failed to load moods:', err)
  }
}

async function exportData() {
  try {
    // Fetch all presets and playlists
    const [presetsRes, playlistsRes] = await Promise.all([
      fetch('/api/presets'),
      fetch('/api/playlists')
    ])
    
    if (!presetsRes.ok || !playlistsRes.ok) {
      throw new Error('Failed to fetch data')
    }
    
    const presets = await presetsRes.json()
    const playlists = await playlistsRes.json()
    
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      presets: presets.presets,
      playlists: playlists.playlists,
      settings: settings.value
    }
    
    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `entropic-aura-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    showMessage('Data exported successfully!', 'success')
  } catch (err) {
    showMessage('Failed to export data: ' + err.message, 'error')
  }
}

function triggerImport() {
  fileInput.value.click()
}

async function importData(event) {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    if (!data.version || !data.presets || !data.playlists) {
      throw new Error('Invalid backup file format')
    }
    
    // Import presets
    for (const preset of data.presets) {
      await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      })
    }
    
    // Import playlists
    for (const playlist of data.playlists) {
      await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlist)
      })
    }
    
    // Import settings
    if (data.settings) {
      settings.value = data.settings
      saveSettings()
    }
    
    showMessage('Data imported successfully!', 'success')
    
    // Clear file input
    event.target.value = ''
  } catch (err) {
    showMessage('Failed to import data: ' + err.message, 'error')
  }
}

async function clearAllData() {
  if (!confirm('Are you sure you want to delete ALL presets and playlists? This cannot be undone!')) {
    return
  }
  
  try {
    // Fetch all presets and playlists
    const [presetsRes, playlistsRes] = await Promise.all([
      fetch('/api/presets'),
      fetch('/api/playlists')
    ])
    
    const presets = await presetsRes.json()
    const playlists = await playlistsRes.json()
    
    // Delete all presets
    for (const preset of presets.presets) {
      await fetch(`/api/presets/${preset.id}`, { method: 'DELETE' })
    }
    
    // Delete all playlists
    for (const playlist of playlists.playlists) {
      await fetch(`/api/playlists/${playlist.id}`, { method: 'DELETE' })
    }
    
    showMessage('All data cleared successfully', 'success')
  } catch (err) {
    showMessage('Failed to clear data: ' + err.message, 'error')
  }
}

function showMessage(text, type = 'success') {
  message.value = text
  messageType.value = type
  
  setTimeout(() => {
    message.value = ''
  }, 5000)
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: transparent;
  padding: 2rem;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin: 0 0 2rem;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}

.settings-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.settings-section h2 {
  margin: 0 0 1.5rem;
  color: #ffffff;
  font-size: 1.25rem;
  border-bottom: 2px solid rgba(66, 185, 131, 0.5);
  padding-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.label-text {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.label-value {
  color: #42b983;
  font-weight: 600;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
  border: none;
}

.select-input,
.number-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  background: rgba(0, 0, 0, 0.3);
  color: #ffffff;
}

.select-input:focus,
.number-input:focus {
  outline: none;
  border-color: rgba(66, 185, 131, 0.5);
  background: rgba(0, 0, 0, 0.4);
}

.select-input option {
  background: #2a2a2a;
  color: #ffffff;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn,
.danger-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn i,
.danger-btn i {
  font-size: 1rem;
}

.action-btn {
  background: #42b983;
  color: white;
}

.action-btn:hover {
  background: #35a372;
}

.danger-btn {
  background: #dc3545;
  color: white;
}

.danger-btn:hover {
  background: #c82333;
}

small {
  display: block;
  margin-top: 0.5rem;
  color: #999;
  font-size: 0.85rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.primary-btn,
.secondary-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.primary-btn i,
.secondary-btn i {
  font-size: 1rem;
}

.primary-btn {
  background: #42b983;
  color: white;
}

.primary-btn:hover {
  background: #35a372;
}

.secondary-btn {
  background: #f0f0f0;
  color: #666;
}

.secondary-btn:hover {
  background: #e0e0e0;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

input[type="checkbox"] {
  margin-right: 0.75rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}
</style>
