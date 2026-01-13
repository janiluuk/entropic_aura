<template>
  <div class="playlist-card">
    <div class="playlist-header">
      <h3 class="playlist-name">{{ playlist.name }}</h3>
      <span class="preset-count">{{ playlist.presets.length }} presets</span>
    </div>
    
    <p class="playlist-description">{{ playlist.description || 'No description' }}</p>
    
    <div class="playlist-meta">
      <span class="meta-item" v-if="playlist.rotationInterval">
        🔄 {{ formatInterval(playlist.rotationInterval) }}
      </span>
      <span class="meta-item" v-if="playlist.shuffle">
        🔀 Shuffle
      </span>
      <span class="meta-item" v-if="playlist.repeat">
        🔁 Repeat
      </span>
    </div>
    
    <div class="playlist-actions">
      <button class="btn-primary" @click="playPlaylist">
        ▶️ Play
      </button>
      <button class="btn-secondary" @click="editPlaylist">
        ✏️ Edit
      </button>
      <button class="btn-danger" @click="deletePlaylist">
        🗑️ Delete
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  playlist: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['play', 'edit', 'delete'])

function formatInterval(seconds) {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

function playPlaylist() {
  emit('play', props.playlist)
}

function editPlaylist() {
  emit('edit', props.playlist)
}

function deletePlaylist() {
  emit('delete', props.playlist)
}
</script>

<style scoped>
.playlist-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.playlist-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.playlist-name {
  font-size: 1.25rem;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.preset-count {
  background: #e0e0e0;
  color: #666;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.playlist-description {
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  min-height: 1.5rem;
}

.playlist-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  padding: 0.25rem 0.75rem;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 0.875rem;
  color: #666;
}

.playlist-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.playlist-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover {
  background: #38a375;
  transform: translateY(-1px);
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
</style>
