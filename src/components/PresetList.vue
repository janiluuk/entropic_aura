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
import { FALLBACK_PRESETS } from '@/data/fallbackPresets'

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
    // If API is unavailable and not in favorites mode, use fallback presets
    if (!props.favoritesOnly) {
      presets.value = FALLBACK_PRESETS
      error.value = '' // Clear error since we have fallback data
    } else {
      error.value = err.message || 'Failed to load presets'
    }
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
  color: #ffffff;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.list-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input,
.mood-filter,
.sort-select {
  padding: 0.85rem 1.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: #ffffff;
  border-radius: 20px;
  font-size: 1rem;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.mood-filter option,
.sort-select option {
  background: #1a1a1a;
  color: #ffffff;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-input:focus,
.mood-filter:focus,
.sort-select:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 4px 20px rgba(66, 185, 131, 0.3),
              0 0 0 3px rgba(66, 185, 131, 0.2);
}

.loading {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.8);
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
  background: rgba(220, 53, 69, 0.15);
  border: none;
  color: #ff6b6b;
  padding: 1.25rem;
  border-radius: 20px;
  text-align: center;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 16px rgba(220, 53, 69, 0.2);
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
