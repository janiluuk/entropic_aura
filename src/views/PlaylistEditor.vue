<template>
  <div class="playlist-editor">
    <div class="header">
      <button @click="goBack" class="back-btn">← Back</button>
      <h1>{{ isEditing ? 'Edit Playlist' : 'Create Playlist' }}</h1>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div class="editor-container">
      <!-- Playlist Details -->
      <div class="details-section">
        <h2>Playlist Details</h2>
        
        <div class="form-group">
          <label>Name</label>
          <input v-model="playlistData.name" type="text" required />
        </div>
        
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="playlistData.description" rows="3"></textarea>
        </div>
        
        <div class="form-group">
          <label>Rotation Interval</label>
          <input v-model.number="playlistData.rotationInterval" type="number" min="60" step="60" />
          <small>{{ formatInterval(playlistData.rotationInterval) }} between presets</small>
        </div>
        
        <div class="form-group">
          <label>
            <input v-model="playlistData.shuffle" type="checkbox" />
            Shuffle playback
          </label>
        </div>
        
        <div class="form-group">
          <label>
            <input v-model="playlistData.repeat" type="checkbox" />
            Repeat playlist
          </label>
        </div>
        
        <div class="actions">
          <button @click="savePlaylist" class="save-btn">
            {{ isEditing ? 'Update Playlist' : 'Create Playlist' }}
          </button>
        </div>
      </div>

      <!-- Preset Management -->
      <div class="presets-section">
        <h2>Presets ({{ selectedPresets.length }})</h2>
        
        <div v-if="!showPresetSelector" class="preset-list">
          <div v-if="selectedPresets.length === 0" class="empty-state">
            <p>No presets added yet</p>
            <button @click="showPresetSelector = true" class="add-btn">
              + Add Presets
            </button>
          </div>
          
          <div v-else>
            <button @click="showPresetSelector = true" class="add-btn">
              + Add More Presets
            </button>
            
            <div class="selected-presets">
              <div
                v-for="(preset, index) in selectedPresets"
                :key="preset.id"
                class="preset-item"
              >
                <div class="preset-order">{{ index + 1 }}</div>
                <div class="preset-info">
                  <strong>{{ preset.name }}</strong>
                  <span class="mood-badge">{{ preset.mood }}</span>
                </div>
                <div class="preset-actions">
                  <button
                    v-if="index > 0"
                    @click="movePresetUp(index)"
                    class="move-btn"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    v-if="index < selectedPresets.length - 1"
                    @click="movePresetDown(index)"
                    class="move-btn"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    @click="removePreset(index)"
                    class="remove-btn"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preset Selector -->
        <div v-else class="preset-selector">
          <div class="selector-header">
            <h3>Select Presets</h3>
            <button @click="showPresetSelector = false" class="close-btn">Close</button>
          </div>
          
          <input
            v-model="presetSearchQuery"
            type="text"
            placeholder="Search presets..."
            class="search-input"
          />
          
          <div class="available-presets">
            <div
              v-for="preset in availablePresets"
              :key="preset.id"
              class="available-preset"
              @click="addPreset(preset)"
            >
              <div>
                <strong>{{ preset.name }}</strong>
                <p>{{ preset.description }}</p>
              </div>
              <span class="mood-badge">{{ preset.mood }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isEditing = computed(() => !!route.params.id)
const playlistId = computed(() => route.params.id)

const playlistData = ref({
  name: '',
  description: '',
  rotationInterval: 300,
  shuffle: false,
  repeat: true
})

const selectedPresets = ref([])
const allPresets = ref([])
const showPresetSelector = ref(false)
const presetSearchQuery = ref('')
const error = ref('')

const availablePresets = computed(() => {
  const selectedIds = new Set(selectedPresets.value.map(p => p.id))
  const filtered = allPresets.value.filter(p => !selectedIds.has(p.id))
  
  if (!presetSearchQuery.value) return filtered
  
  const query = presetSearchQuery.value.toLowerCase()
  return filtered.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.description?.toLowerCase().includes(query) ||
    p.mood?.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await loadPresets()
  
  if (isEditing.value) {
    await loadPlaylist()
  }
})

async function loadPresets() {
  try {
    const response = await fetch('/api/presets')
    if (!response.ok) throw new Error('Failed to load presets')
    
    const data = await response.json()
    allPresets.value = data.presets
  } catch (err) {
    error.value = 'Failed to load presets: ' + err.message
  }
}

async function loadPlaylist() {
  try {
    const response = await fetch(`/api/playlists/${playlistId.value}`)
    if (!response.ok) throw new Error('Failed to load playlist')
    
    const data = await response.json()
    const playlist = data.playlist
    
    playlistData.value = {
      name: playlist.name,
      description: playlist.description,
      rotationInterval: playlist.rotationInterval,
      shuffle: playlist.shuffle,
      repeat: playlist.repeat
    }
    
    // Load preset details for each preset in the playlist
    const presetPromises = playlist.presets.map(async (presetRef) => {
      const response = await fetch(`/api/presets/${presetRef.presetId}`)
      if (response.ok) {
        const data = await response.json()
        return data.preset
      }
      return null
    })
    
    const presets = await Promise.all(presetPromises)
    selectedPresets.value = presets.filter(p => p !== null)
  } catch (err) {
    error.value = 'Failed to load playlist: ' + err.message
  }
}

async function savePlaylist() {
  if (!playlistData.value.name.trim()) {
    alert('Please enter a playlist name')
    return
  }
  
  try {
    const payload = {
      ...playlistData.value,
      presets: selectedPresets.value.map((preset, index) => ({
        presetId: preset.id,
        order: index
      }))
    }
    
    const url = isEditing.value
      ? `/api/playlists/${playlistId.value}`
      : '/api/playlists'
    
    const method = isEditing.value ? 'PATCH' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) throw new Error('Failed to save playlist')
    
    router.push('/playlists')
  } catch (err) {
    error.value = 'Failed to save playlist: ' + err.message
  }
}

function addPreset(preset) {
  selectedPresets.value.push(preset)
  presetSearchQuery.value = ''
}

function removePreset(index) {
  selectedPresets.value.splice(index, 1)
}

function movePresetUp(index) {
  if (index > 0) {
    const temp = selectedPresets.value[index]
    selectedPresets.value[index] = selectedPresets.value[index - 1]
    selectedPresets.value[index - 1] = temp
  }
}

function movePresetDown(index) {
  if (index < selectedPresets.value.length - 1) {
    const temp = selectedPresets.value[index]
    selectedPresets.value[index] = selectedPresets.value[index + 1]
    selectedPresets.value[index + 1] = temp
  }
}

function formatInterval(seconds) {
  const minutes = Math.floor(seconds / 60)
  return minutes < 60 ? `${minutes} minutes` : `${Math.floor(minutes / 60)} hours ${minutes % 60} minutes`
}

function goBack() {
  router.push('/playlists')
}
</script>

<style scoped>
.playlist-editor {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem;
}

.header {
  max-width: 1200px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.error-message {
  max-width: 1200px;
  margin: 0 auto 1rem;
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
}

.editor-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.details-section, .presets-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  margin: 0 0 1.5rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 600;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input[type="checkbox"] {
  margin-right: 0.5rem;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #999;
  font-size: 0.85rem;
}

.actions {
  margin-top: 2rem;
}

.save-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #35a372;
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.add-btn:hover {
  background: #35a372;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.selected-presets {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.preset-order {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #42b983;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  flex-shrink: 0;
}

.preset-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preset-info strong {
  color: #2c3e50;
}

.mood-badge {
  padding: 0.25rem 0.75rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.preset-actions {
  display: flex;
  gap: 0.5rem;
}

.move-btn, .remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.move-btn {
  background: #f0f0f0;
  color: #666;
}

.move-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.remove-btn {
  background: #fee;
  color: #c33;
  font-size: 1.5rem;
  line-height: 1;
}

.remove-btn:hover {
  background: #fdd;
  color: #a22;
}

.preset-selector {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selector-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.available-presets {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.available-preset {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.available-preset:hover {
  background: #f0f0f0;
  border-color: #42b983;
  transform: translateX(4px);
}

.available-preset strong {
  display: block;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.available-preset p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .editor-container {
    grid-template-columns: 1fr;
  }
}
</style>
