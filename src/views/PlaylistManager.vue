<template>
  <div class="playlist-manager">
    <div class="header">
      <h1>Playlists</h1>
      <button @click="showCreateDialog = true" class="create-btn">
        + Create Playlist
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading playlists...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="playlists.length === 0" class="empty-state">
      <p>No playlists yet</p>
      <p class="empty-hint">Create your first playlist to get started</p>
    </div>

    <div v-else class="playlists-grid">
      <div
        v-for="playlist in playlists"
        :key="playlist.id"
        class="playlist-card"
      >
        <div class="card-header">
          <h3>{{ playlist.name }}</h3>
          <div class="card-actions">
            <button @click="playPlaylist(playlist)" class="play-btn" title="Play">
              ▶
            </button>
            <button @click="editPlaylist(playlist)" class="edit-btn" title="Edit">
              ✎
            </button>
            <button @click="deletePlaylist(playlist.id)" class="delete-btn" title="Delete">
              ×
            </button>
          </div>
        </div>
        
        <p class="description">{{ playlist.description || 'No description' }}</p>
        
        <div class="playlist-meta">
          <span>{{ playlist.presets.length }} preset{{ playlist.presets.length !== 1 ? 's' : '' }}</span>
          <span>{{ formatInterval(playlist.rotationInterval) }} rotation</span>
        </div>
        
        <div class="playlist-options">
          <span v-if="playlist.shuffle" class="option-badge">🔀 Shuffle</span>
          <span v-if="playlist.repeat" class="option-badge">🔁 Repeat</span>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <div v-if="showCreateDialog || editingPlaylist" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <h2>{{ editingPlaylist ? 'Edit Playlist' : 'Create Playlist' }}</h2>
        
        <form @submit.prevent="savePlaylist">
          <div class="form-group">
            <label>Name</label>
            <input v-model="playlistForm.name" type="text" required />
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="playlistForm.description" rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label>Rotation Interval (seconds)</label>
            <input v-model.number="playlistForm.rotationInterval" type="number" min="60" step="60" />
            <small>How long to play each preset before switching</small>
          </div>
          
          <div class="form-group">
            <label>
              <input v-model="playlistForm.shuffle" type="checkbox" />
              Shuffle
            </label>
          </div>
          
          <div class="form-group">
            <label>
              <input v-model="playlistForm.repeat" type="checkbox" />
              Repeat
            </label>
          </div>
          
          <div class="dialog-actions">
            <button type="button" @click="closeDialog" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn">{{ editingPlaylist ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Playlist Player -->
    <div v-if="currentPlaylist" class="player-section">
      <div class="player-header">
        <div>
          <h3>{{ currentPlaylist.name }}</h3>
          <p class="current-preset">{{ currentPresetName }}</p>
        </div>
        <div class="player-controls">
          <button @click="previousPreset" class="control-btn">⏮</button>
          <button @click="togglePlay" class="control-btn play">{{ isPlaying ? '⏸' : '▶' }}</button>
          <button @click="nextPreset" class="control-btn">⏭</button>
          <button @click="stopPlaylist" class="control-btn stop">⏹</button>
        </div>
      </div>
      
      <div v-if="playlistError" class="error-message">
        {{ playlistError }}
      </div>
      
      <audio
        v-if="audioSrc"
        :src="audioSrc"
        ref="audioPlayer"
        @error="handleAudioError"
        @ended="onAudioEnded"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const playlists = ref([])
const loading = ref(false)
const error = ref('')
const showCreateDialog = ref(false)
const editingPlaylist = ref(null)
const playlistForm = ref({
  name: '',
  description: '',
  rotationInterval: 300,
  shuffle: false,
  repeat: true
})

// Playlist playback state
const currentPlaylist = ref(null)
const currentPresetIndex = ref(0)
const currentPresetName = ref('')
const audioSrc = ref('')
const audioPlayer = ref(null)
const isPlaying = ref(false)
const playlistError = ref('')
let rotationTimer = null

onMounted(() => {
  loadPlaylists()
})

onUnmounted(() => {
  clearRotationTimer()
})

async function loadPlaylists() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/playlists')
    if (!response.ok) throw new Error('Failed to load playlists')
    
    const data = await response.json()
    playlists.value = data.playlists
  } catch (err) {
    error.value = 'Failed to load playlists: ' + err.message
  } finally {
    loading.value = false
  }
}

function formatInterval(seconds) {
  const minutes = Math.floor(seconds / 60)
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function editPlaylist(playlist) {
  editingPlaylist.value = playlist
  playlistForm.value = {
    name: playlist.name,
    description: playlist.description,
    rotationInterval: playlist.rotationInterval,
    shuffle: playlist.shuffle,
    repeat: playlist.repeat
  }
}

async function savePlaylist() {
  try {
    const url = editingPlaylist.value
      ? `/api/playlists/${editingPlaylist.value.id}`
      : '/api/playlists'
    
    const method = editingPlaylist.value ? 'PATCH' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlistForm.value)
    })
    
    if (!response.ok) throw new Error('Failed to save playlist')
    
    await loadPlaylists()
    closeDialog()
  } catch (err) {
    alert('Failed to save playlist: ' + err.message)
  }
}

async function deletePlaylist(id) {
  if (!confirm('Are you sure you want to delete this playlist?')) return
  
  try {
    const response = await fetch(`/api/playlists/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to delete playlist')
    
    await loadPlaylists()
  } catch (err) {
    alert('Failed to delete playlist: ' + err.message)
  }
}

function closeDialog() {
  showCreateDialog.value = false
  editingPlaylist.value = null
  playlistForm.value = {
    name: '',
    description: '',
    rotationInterval: 300,
    shuffle: false,
    repeat: true
  }
}

async function playPlaylist(playlist) {
  // Fetch full playlist with presets
  try {
    const response = await fetch(`/api/playlists/${playlist.id}`)
    if (!response.ok) throw new Error('Failed to load playlist')
    
    const data = await response.json()
    currentPlaylist.value = data.playlist
    
    if (currentPlaylist.value.presets.length === 0) {
      alert('This playlist has no presets. Add some presets first.')
      return
    }
    
    currentPresetIndex.value = 0
    await playCurrentPreset()
    isPlaying.value = true
    
    // Start rotation timer
    startRotationTimer()
  } catch (err) {
    playlistError.value = 'Failed to start playlist: ' + err.message
  }
}

async function playCurrentPreset() {
  if (!currentPlaylist.value || currentPlaylist.value.presets.length === 0) return
  
  const presetRef = currentPlaylist.value.presets[currentPresetIndex.value]
  
  // Fetch the preset details
  try {
    const response = await fetch(`/api/presets/${presetRef.presetId}`)
    if (!response.ok) throw new Error('Preset not found')
    
    const data = await response.json()
    const preset = data.preset
    
    currentPresetName.value = preset.name
    
    const params = new URLSearchParams({
      text: preset.prompt,
      mood: preset.mood || 'Relaxing'
    })
    
    const timestamp = new Date().getTime()
    audioSrc.value = `/api/stream?${params.toString()}&t=${timestamp}`
    
    if (audioPlayer.value) {
      audioPlayer.value.load()
      if (isPlaying.value) {
        audioPlayer.value.play()
      }
    }
    
    playlistError.value = ''
  } catch (err) {
    playlistError.value = 'Failed to load preset: ' + err.message
  }
}

function startRotationTimer() {
  clearRotationTimer()
  
  if (currentPlaylist.value && currentPlaylist.value.rotationInterval > 0) {
    rotationTimer = setTimeout(() => {
      nextPreset()
    }, currentPlaylist.value.rotationInterval * 1000)
  }
}

function clearRotationTimer() {
  if (rotationTimer) {
    clearTimeout(rotationTimer)
    rotationTimer = null
  }
}

function nextPreset() {
  if (!currentPlaylist.value || currentPlaylist.value.presets.length === 0) return
  
  let nextIndex
  
  if (currentPlaylist.value.shuffle) {
    // Random next preset (avoid repeating current)
    do {
      nextIndex = Math.floor(Math.random() * currentPlaylist.value.presets.length)
    } while (nextIndex === currentPresetIndex.value && currentPlaylist.value.presets.length > 1)
  } else {
    nextIndex = currentPresetIndex.value + 1
    
    if (nextIndex >= currentPlaylist.value.presets.length) {
      if (currentPlaylist.value.repeat) {
        nextIndex = 0
      } else {
        stopPlaylist()
        return
      }
    }
  }
  
  currentPresetIndex.value = nextIndex
  playCurrentPreset()
  startRotationTimer()
}

function previousPreset() {
  if (!currentPlaylist.value || currentPlaylist.value.presets.length === 0) return
  
  if (currentPlaylist.value.shuffle) {
    // Random previous
    nextPreset()
  } else {
    let prevIndex = currentPresetIndex.value - 1
    
    if (prevIndex < 0) {
      prevIndex = currentPlaylist.value.repeat ? currentPlaylist.value.presets.length - 1 : 0
    }
    
    currentPresetIndex.value = prevIndex
    playCurrentPreset()
    startRotationTimer()
  }
}

function togglePlay() {
  if (!audioPlayer.value) return
  
  if (isPlaying.value) {
    audioPlayer.value.pause()
    clearRotationTimer()
  } else {
    audioPlayer.value.play()
    startRotationTimer()
  }
  
  isPlaying.value = !isPlaying.value
}

function stopPlaylist() {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
  }
  
  clearRotationTimer()
  currentPlaylist.value = null
  currentPresetIndex.value = 0
  currentPresetName.value = ''
  audioSrc.value = ''
  isPlaying.value = false
  playlistError.value = ''
}

function onAudioEnded() {
  // When audio ends, move to next preset
  nextPreset()
}

function handleAudioError() {
  playlistError.value = 'Failed to load audio. Skipping to next preset...'
  setTimeout(() => {
    nextPreset()
  }, 2000)
}
</script>

<style scoped>
.playlist-manager {
  min-height: 100vh;
  background: transparent;
  padding: 2rem;
  padding-bottom: 200px;
}

.header {
  max-width: 1200px;
  margin: 0 auto 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.create-btn {
  padding: 0.75rem 1.5rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  background: #35a372;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.3);
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-hint {
  color: #999;
  font-size: 0.9rem;
  margin-top: 0.5rem;
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

.playlists-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.playlist-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
}

.playlist-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border-color: rgba(66, 185, 131, 0.5);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.card-actions button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.play-btn {
  background: #42b983;
  color: white;
}

.play-btn:hover {
  background: #35a372;
}

.edit-btn {
  background: #f0f0f0;
  color: #666;
}

.edit-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.delete-btn {
  background: #fee;
  color: #c33;
  font-size: 1.5rem;
  line-height: 1;
}

.delete-btn:hover {
  background: #fdd;
  color: #a22;
}

.description {
  color: #666;
  margin: 0 0 1rem;
  font-size: 0.9rem;
}

.playlist-meta {
  display: flex;
  gap: 1rem;
  color: #999;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.playlist-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.option-badge {
  padding: 0.25rem 0.5rem;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog h2 {
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

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-btn, .save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.save-btn {
  background: #42b983;
  color: white;
}

.save-btn:hover {
  background: #35a372;
}

.player-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 2px solid #42b983;
  padding: 1.5rem 2rem;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.player-header {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-header h3 {
  margin: 0 0 0.25rem;
  color: #2c3e50;
}

.current-preset {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.player-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #666;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.control-btn.play {
  background: #42b983;
  color: white;
  width: 56px;
  height: 56px;
  font-size: 1.5rem;
}

.control-btn.play:hover {
  background: #35a372;
}

.control-btn.stop {
  background: #fee;
  color: #c33;
}

.control-btn.stop:hover {
  background: #fdd;
  color: #a22;
}

audio {
  display: none;
}
</style>
