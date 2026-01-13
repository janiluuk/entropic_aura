<template>
  <div class="preset-manager">
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'all' }" 
        @click="activeTab = 'all'"
      >
        All Presets
      </button>
      <button 
        :class="{ active: activeTab === 'favorites' }" 
        @click="activeTab = 'favorites'"
      >
        ♥ Favorites
      </button>
    </div>
    
    <PresetList
      v-if="activeTab === 'all'"
      title="All Presets"
      :show-edit="false"
      :show-delete="false"
      @play="playPreset"
    />
    
    <PresetList
      v-if="activeTab === 'favorites'"
      title="Favorite Presets"
      :favorites-only="true"
      :show-edit="false"
      :show-delete="false"
      @play="playPreset"
    />
    
    <!-- Audio Player Section -->
    <div v-if="currentPreset" class="player-section">
      <div class="player-header">
        <h3>Now Playing: {{ currentPreset.name }}</h3>
        <button @click="stopPlaying" class="stop-btn">
          Stop
        </button>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Generating your soundscape...</p>
      </div>
      
      <audio
        v-if="audioSrc"
        :src="audioSrc"
        controls
        loop
        ref="audioPlayer"
        autoplay
        @error="handleAudioError"
        @loadeddata="handleAudioLoaded"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PresetList from '@/components/PresetList.vue'

const activeTab = ref('all')
const currentPreset = ref(null)
const audioSrc = ref('')
const audioPlayer = ref(null)
const loading = ref(false)
const error = ref('')

async function playPreset(preset) {
  error.value = ''
  loading.value = true
  currentPreset.value = preset
  
  try {
    const params = new URLSearchParams({
      text: preset.prompt,
      mood: preset.mood || 'default'
    })
    
    // Generate a timestamp-based URL to force reload
    const timestamp = new Date().getTime()
    audioSrc.value = `/api/stream?${params.toString()}&t=${timestamp}`
  } catch (err) {
    error.value = 'Failed to generate audio'
    loading.value = false
    currentPreset.value = null
  }
}

function stopPlaying() {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
  }
  currentPreset.value = null
  audioSrc.value = ''
  loading.value = false
}

function handleAudioError(event) {
  error.value = 'Failed to load audio. Please try again.'
  loading.value = false
}

function handleAudioLoaded() {
  loading.value = false
}
</script>

<style scoped>
.preset-manager {
  min-height: 100vh;
  background: transparent;
  padding-bottom: 200px; /* Space for fixed player */
}

.tabs {
  display: flex;
  gap: 0.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 2rem 0 2rem;
}

.tabs button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s;
}

.tabs button:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.tabs button.active {
  background: rgba(66, 185, 131, 0.8);
  color: white;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.player-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 2px solid #42b983;
  padding: 1.5rem 2rem;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.player-header h3 {
  margin: 0;
  color: #ffffff;
}

.stop-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.stop-btn:hover {
  background: #c82333;
}

audio {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: block;
  border-radius: 8px;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.loading {
  text-align: center;
  padding: 1rem;
}

.spinner {
  width: 30px;
  height: 30px;
  margin: 0 auto 0.5rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
