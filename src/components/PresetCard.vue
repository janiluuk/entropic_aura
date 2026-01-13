<template>
  <div class="preset-card" :class="{ 'is-favorite': preset.isFavorite }">
    <div class="preset-header">
      <h3 class="preset-name">{{ preset.name }}</h3>
      <button 
        class="favorite-btn" 
        :class="{ active: preset.isFavorite }"
        @click="toggleFavorite"
        :title="preset.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
      >
        ♥
      </button>
    </div>
    
    <p class="preset-description">{{ preset.description }}</p>
    
    <div class="preset-meta">
      <span class="mood-badge" :class="`mood-${preset.mood?.toLowerCase()}`">
        {{ preset.mood || 'Default' }}
      </span>
      <span v-if="preset.timesPlayed > 0" class="play-count">
        ▶ {{ preset.timesPlayed }}
      </span>
    </div>
    
    <div v-if="preset.tags && preset.tags.length" class="preset-tags">
      <span v-for="tag in preset.tags" :key="tag" class="tag">
        {{ tag }}
      </span>
    </div>
    
    <div class="preset-actions">
      <button class="btn-primary" @click="playPreset">
        ▶️ Play
      </button>
      <button v-if="showEdit" class="btn-secondary" @click="editPreset">
        ✏️ Edit
      </button>
      <button v-if="showDelete" class="btn-danger" @click="deletePreset">
        🗑️ Delete
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  preset: {
    type: Object,
    required: true
  },
  showEdit: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['play', 'edit', 'delete', 'toggleFavorite'])

function playPreset() {
  emit('play', props.preset)
}

function editPreset() {
  emit('edit', props.preset)
}

function deletePreset() {
  emit('delete', props.preset)
}

function toggleFavorite() {
  emit('toggleFavorite', props.preset)
}
</script>

<style scoped>
.preset-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.preset-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
  border-color: rgba(66, 185, 131, 0.6);
}

.preset-card.is-favorite {
  border-color: #ff6b6b;
}

.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.preset-name {
  font-size: 1.25rem;
  color: #ffffff;
  margin: 0;
  flex: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.favorite-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.2s;
  padding: 0;
  line-height: 1;
}

.favorite-btn:hover {
  color: #ff6b6b;
  transform: scale(1.2);
}

.favorite-btn.active {
  color: #ff6b6b;
}

.preset-description {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.preset-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.mood-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.mood-relaxing {
  background: #d4edda;
  color: #155724;
}

.mood-energizing {
  background: #fff3cd;
  color: #856404;
}

.mood-peaceful {
  background: #d1ecf1;
  color: #0c5460;
}

.mood-dark {
  background: #d6d8db;
  color: #1b1e21;
}

.mood-cinematic {
  background: #e7d4f7;
  color: #4a0e66;
}

.mood-nature {
  background: #d4edda;
  color: #155724;
}

.mood-default {
  background: #e2e3e5;
  color: #383d41;
}

.play-count {
  color: #999;
  font-size: 0.875rem;
}

.preset-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #666;
}

.preset-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preset-actions button {
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
