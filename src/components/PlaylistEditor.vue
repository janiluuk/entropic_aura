<template>
  <div class="playlist-editor">
    <div class="editor-header">
      <h2>{{ isEdit ? 'Edit Playlist' : 'Create Playlist' }}</h2>
      <button @click="close" class="btn-close">✕</button>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <form @submit.prevent="save" class="editor-form">
      <div class="form-group">
        <label for="name">Playlist Name *</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="My Awesome Playlist"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="Describe your playlist..."
          rows="3"
        />
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="rotationInterval">Rotation Interval (minutes)</label>
          <input
            id="rotationInterval"
            v-model.number="rotationMinutes"
            type="number"
            min="1"
            max="1440"
          />
        </div>
        
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="form.shuffle" />
            Shuffle Presets
          </label>
        </div>
        
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="form.repeat" />
            Repeat Playlist
          </label>
        </div>
      </div>
      
      <div class="presets-section">
        <h3>Presets</h3>
        
        <div class="preset-actions">
          <button type="button" @click="showPresetSelector = true" class="btn-secondary">
            ➕ Add Preset
          </button>
        </div>
        
        <div v-if="form.presets.length === 0" class="empty-presets">
          No presets added yet. Click "Add Preset" to get started.
        </div>
        
        <div v-else class="presets-list">
          <div
            v-for="(preset, index) in form.presets"
            :key="preset.presetId"
            class="preset-item"
          >
            <div class="preset-info">
              <span class="preset-order">{{ index + 1 }}.</span>
              <span class="preset-name">{{ getPresetName(preset.presetId) }}</span>
            </div>
            <div class="preset-controls">
              <button
                type="button"
                @click="movePreset(index, -1)"
                :disabled="index === 0"
                class="btn-icon"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                @click="movePreset(index, 1)"
                :disabled="index === form.presets.length - 1"
                class="btn-icon"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                @click="removePreset(index)"
                class="btn-icon btn-danger-icon"
                title="Remove"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" @click="close" class="btn-secondary">
          Cancel
        </button>
        <button type="submit" :disabled="saving" class="btn-primary">
          {{ saving ? 'Saving...' : 'Save Playlist' }}
        </button>
      </div>
    </form>
    
    <!-- Preset Selector Modal -->
    <div v-if="showPresetSelector" class="modal-overlay" @click.self="showPresetSelector = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Presets</h3>
          <button @click="showPresetSelector = false" class="btn-close">✕</button>
        </div>
        
        <div class="preset-selector">
          <input
            v-model="presetSearchQuery"
            type="text"
            placeholder="Search presets..."
            class="search-input"
          />
          
          <div v-if="loadingPresets" class="loading">
            <div class="spinner"></div>
          </div>
          
          <div v-else class="available-presets">
            <div
              v-for="preset in filteredAvailablePresets"
              :key="preset.id"
              class="available-preset"
              @click="addPreset(preset.id)"
            >
              <span class="preset-name">{{ preset.name }}</span>
              <span class="preset-mood">{{ preset.mood }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, defineEmits } from 'vue'

const props = defineProps({
  playlist: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'close'])

const isEdit = computed(() => !!props.playlist)

const form = ref({
  name: '',
  description: '',
  presets: [],
  rotationInterval: 300, // 5 minutes
  shuffle: false,
  repeat: true
})

const rotationMinutes = computed({
  get: () => Math.floor(form.value.rotationInterval / 60),
  set: (val) => { form.value.rotationInterval = val * 60 }
})

const saving = ref(false)
const error = ref('')
const showPresetSelector = ref(false)
const presetSearchQuery = ref('')
const loadingPresets = ref(false)
const availablePresets = ref([])
const presetCache = ref({})

const filteredAvailablePresets = computed(() => {
  const alreadyAdded = new Set(form.value.presets.map(p => p.presetId))
  let filtered = availablePresets.value.filter(p => !alreadyAdded.has(p.id))
  
  if (presetSearchQuery.value) {
    const query = presetSearchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

onMounted(async () => {
  if (props.playlist) {
    // Edit mode - populate form
    form.value = {
      name: props.playlist.name,
      description: props.playlist.description || '',
      presets: [...props.playlist.presets],
      rotationInterval: props.playlist.rotationInterval || 300,
      shuffle: props.playlist.shuffle || false,
      repeat: props.playlist.repeat !== false
    }
  }
  
  // Load available presets
  await loadPresets()
})

async function loadPresets() {
  loadingPresets.value = true
  try {
    const response = await fetch('/api/presets')
    if (!response.ok) throw new Error('Failed to load presets')
    
    const data = await response.json()
    availablePresets.value = data.presets
    
    // Build preset cache for quick lookups
    data.presets.forEach(preset => {
      presetCache.value[preset.id] = preset.name
    })
  } catch (err) {
    console.error('Failed to load presets:', err)
    error.value = 'Failed to load available presets'
  } finally {
    loadingPresets.value = false
  }
}

function getPresetName(presetId) {
  return presetCache.value[presetId] || 'Unknown Preset'
}

function addPreset(presetId) {
  form.value.presets.push({
    presetId,
    duration: null,
    order: form.value.presets.length
  })
  showPresetSelector.value = false
  presetSearchQuery.value = ''
}

function removePreset(index) {
  form.value.presets.splice(index, 1)
  // Update order
  form.value.presets.forEach((p, i) => {
    p.order = i
  })
}

function movePreset(index, direction) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= form.value.presets.length) return
  
  const temp = form.value.presets[index]
  form.value.presets[index] = form.value.presets[newIndex]
  form.value.presets[newIndex] = temp
  
  // Update order
  form.value.presets.forEach((p, i) => {
    p.order = i
  })
}

async function save() {
  if (!form.value.name.trim()) {
    error.value = 'Please enter a playlist name'
    return
  }
  
  saving.value = true
  error.value = ''
  
  try {
    const method = isEdit.value ? 'PATCH' : 'POST'
    const url = isEdit.value ? `/api/playlists/${props.playlist.id}` : '/api/playlists'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })
    
    if (!response.ok) {
      throw new Error('Failed to save playlist')
    }
    
    const data = await response.json()
    emit('save', data.playlist)
  } catch (err) {
    error.value = err.message || 'Failed to save playlist'
  } finally {
    saving.value = false
  }
}

function close() {
  emit('close')
}
</script>

<style scoped>
.playlist-editor {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.editor-header h2 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #42b983;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  align-items: end;
}

.checkbox-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.checkbox-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.presets-section {
  border-top: 2px solid #f0f0f0;
  padding-top: 1.5rem;
}

.presets-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.preset-actions {
  margin-bottom: 1rem;
}

.empty-presets {
  text-align: center;
  padding: 2rem;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.preset-item:hover {
  background: #f0f0f0;
  border-color: #ddd;
}

.preset-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.preset-order {
  font-weight: 600;
  color: #999;
  min-width: 30px;
}

.preset-name {
  color: #2c3e50;
  font-weight: 500;
}

.preset-controls {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #999;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger-icon:hover:not(:disabled) {
  background: #fee;
  border-color: #fcc;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 2px solid #f0f0f0;
}

.btn-primary,
.btn-secondary {
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

.btn-primary:hover:not(:disabled) {
  background: #38a375;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.preset-selector {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: auto;
}

.search-input {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #42b983;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.available-presets {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.available-preset {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.available-preset:hover {
  background: #42b983;
  color: white;
}

.available-preset .preset-name {
  font-weight: 500;
}

.available-preset .preset-mood {
  padding: 0.25rem 0.75rem;
  background: white;
  border-radius: 12px;
  font-size: 0.875rem;
  color: #666;
}

.available-preset:hover .preset-mood {
  background: #38a375;
  color: white;
}

@media (max-width: 768px) {
  .playlist-editor {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
  }
}
</style>
