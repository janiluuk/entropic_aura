<template>
  <div class="playlist-list">
    <div class="list-header">
      <h2>{{ title }}</h2>
      <div class="list-controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search playlists..."
          class="search-input"
        />
        <button @click="createNew" class="btn-create">
          ➕ Create Playlist
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading playlists...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="filteredPlaylists.length === 0" class="empty-state">
      <p>No playlists found</p>
      <p v-if="searchQuery" class="empty-hint">
        Try adjusting your search
      </p>
      <button v-else @click="createNew" class="btn-primary">
        Create Your First Playlist
      </button>
    </div>
    
    <div v-else class="playlists-grid">
      <PlaylistCard
        v-for="playlist in filteredPlaylists"
        :key="playlist.id"
        :playlist="playlist"
        @play="handlePlay"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, defineEmits } from 'vue'
import PlaylistCard from './PlaylistCard.vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Playlists'
  }
})

const emit = defineEmits(['play', 'edit', 'create'])

const playlists = ref([])
const searchQuery = ref('')
const loading = ref(false)
const error = ref('')

const filteredPlaylists = computed(() => {
  if (!searchQuery.value) return playlists.value

  const query = searchQuery.value.toLowerCase()
  return playlists.value.filter(p =>
    p.name.toLowerCase().includes(query) ||
    (p.description && p.description.toLowerCase().includes(query))
  )
})

onMounted(async () => {
  await fetchPlaylists()
})

async function fetchPlaylists() {
  loading.value = true
  error.value = ''
  
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    
    const response = await fetch(`/api/playlists?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch playlists')
    }
    
    const data = await response.json()
    playlists.value = data.playlists
  } catch (err) {
    error.value = err.message || 'Failed to load playlists'
  } finally {
    loading.value = false
  }
}

function createNew() {
  emit('create')
}

function handlePlay(playlist) {
  emit('play', playlist)
}

function handleEdit(playlist) {
  emit('edit', playlist)
}

async function handleDelete(playlist) {
  if (!confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
    return
  }
  
  try {
    const response = await fetch(`/api/playlists/${playlist.id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete playlist')
    }
    
    // Remove from local state
    playlists.value = playlists.value.filter(p => p.id !== playlist.id)
  } catch (err) {
    error.value = err.message || 'Failed to delete playlist'
  }
}

// Expose refresh method for parent components
defineExpose({
  refresh: fetchPlaylists
})
</script>

<style scoped>
.playlist-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.list-header {
  margin-bottom: 2rem;
}

.list-header h2 {
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.list-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
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

.btn-create {
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

.btn-create:hover {
  background: #38a375;
  transform: translateY(-1px);
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
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

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-hint {
  font-size: 0.875rem;
  color: #999;
  margin-bottom: 1rem;
}

.btn-primary {
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

.btn-primary:hover {
  background: #38a375;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .list-controls {
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
  
  .playlists-grid {
    grid-template-columns: 1fr;
  }
}
</style>
