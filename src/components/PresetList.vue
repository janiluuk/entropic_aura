<template>
  <div class="preset-list">
    <div class="list-header">
      <h2>{{ title }}</h2>
      <div class="list-controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search presets..."
          class="search-input"
        />
        
        <select v-model="filterMood" class="mood-filter">
          <option value="">All Moods</option>
          <option v-for="mood in moods" :key="mood" :value="mood">
            {{ mood }}
          </option>
        </select>
        
        <select v-model="sortBy" class="sort-select">
          <option value="">Newest First</option>
          <option value="popular">Most Played</option>
        </select>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading presets...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="filteredPresets.length === 0" class="empty-state">
      <p>No presets found</p>
      <p v-if="searchQuery || filterMood" class="empty-hint">
        Try adjusting your filters
      </p>
    </div>
    
    <div v-else class="presets-grid">
      <PresetCard
        v-for="preset in filteredPresets"
        :key="preset.id"
        :preset="preset"
        :show-edit="showEdit"
        :show-delete="showDelete"
        @play="handlePlay"
        @edit="handleEdit"
        @delete="handleDelete"
        @toggleFavorite="handleToggleFavorite"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineProps, defineEmits } from 'vue'
import PresetCard from './PresetCard.vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Presets'
  },
  showEdit: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  favoritesOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['play', 'edit', 'delete'])

const presets = ref([])
const moods = ref([])
const searchQuery = ref('')
const filterMood = ref('')
const sortBy = ref('')
const loading = ref(false)
const error = ref('')

// Watch for changes to filters and refetch
watch([filterMood, sortBy], () => {
  fetchPresets()
})

const filteredPresets = computed(() => {
  let filtered = presets.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
    )
  }

  // Filter by mood
  if (filterMood.value) {
    filtered = filtered.filter(p => p.mood === filterMood.value)
  }

  // Apply sorting
  if (sortBy.value === 'popular') {
    filtered = [...filtered].sort((a, b) => b.timesPlayed - a.timesPlayed)
  } else {
    // Default: newest first
    filtered = [...filtered].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  }

  return filtered
})

onMounted(async () => {
  await Promise.all([fetchPresets(), fetchMoods()])
})

async function fetchPresets() {
  loading.value = true
  error.value = ''
  
  try {
    const params = new URLSearchParams()
    if (sortBy.value) params.append('sortBy', sortBy.value)
    if (filterMood.value) params.append('mood', filterMood.value)
    if (searchQuery.value) params.append('search', searchQuery.value)
    
    const endpoint = props.favoritesOnly ? '/api/favorites' : '/api/presets'
    const response = await fetch(`${endpoint}?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch presets')
    }
    
    const data = await response.json()
    presets.value = props.favoritesOnly ? data.favorites : data.presets
  } catch (err) {
    error.value = err.message || 'Failed to load presets'
  } finally {
    loading.value = false
  }
}

async function fetchMoods() {
  try {
    const response = await fetch('/api/moods')
    const data = await response.json()
    moods.value = data.moods
  } catch (err) {
    console.error('Failed to fetch moods:', err)
  }
}

async function handlePlay(preset) {
  // Increment play count
  try {
    await fetch(`/api/presets/${preset.id}/play`, { method: 'POST' })
    // Update local state
    const index = presets.value.findIndex(p => p.id === preset.id)
    if (index !== -1) {
      presets.value[index].timesPlayed++
    }
  } catch (err) {
    console.error('Failed to increment play count:', err)
  }
  
  emit('play', preset)
}

function handleEdit(preset) {
  emit('edit', preset)
}

async function handleDelete(preset) {
  if (!confirm(`Are you sure you want to delete "${preset.name}"?`)) {
    return
  }
  
  try {
    const response = await fetch(`/api/presets/${preset.id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete preset')
    }
    
    // Remove from local state
    presets.value = presets.value.filter(p => p.id !== preset.id)
  } catch (err) {
    error.value = err.message || 'Failed to delete preset'
  }
  
  emit('delete', preset)
}

async function handleToggleFavorite(preset) {
  try {
    const method = preset.isFavorite ? 'DELETE' : 'POST'
    const response = await fetch(`/api/favorites/${preset.id}`, { method })
    
    if (!response.ok) {
      throw new Error('Failed to update favorite')
    }
    
    // Update local state
    const index = presets.value.findIndex(p => p.id === preset.id)
    if (index !== -1) {
      presets.value[index].isFavorite = !preset.isFavorite
    }
    
    // If we're in favorites-only view and unfavorited, remove from list
    if (props.favoritesOnly && !presets.value[index].isFavorite) {
      presets.value.splice(index, 1)
    }
  } catch (err) {
    error.value = err.message || 'Failed to update favorite'
  }
}
</script>

<style scoped>
.preset-list {
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

.search-input,
.mood-filter,
.sort-select {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-input:focus,
.mood-filter:focus,
.sort-select:focus {
  outline: none;
  border-color: #42b983;
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
}

.presets-grid {
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
  
  .presets-grid {
    grid-template-columns: 1fr;
  }
}
</style>
