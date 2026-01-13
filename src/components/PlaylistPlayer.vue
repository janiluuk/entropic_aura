<template>
  <div class="playlist-player">
    <div class="player-header">
      <div class="playlist-info">
        <h3>{{ playlist.name }}</h3>
        <p class="current-preset">
          {{ currentPresetIndex + 1 }} / {{ playlist.presets.length }}:
          {{ currentPresetName }}
        </p>
      </div>
      <div class="player-controls">
        <button @click="previousPreset" :disabled="!canGoPrevious" class="btn-control">
          ⏮️
        </button>
        <button @click="togglePlay" class="btn-control btn-play">
          {{ isPlaying ? '⏸️' : '▶️' }}
        </button>
        <button @click="nextPreset" :disabled="!canGoNext" class="btn-control">
          ⏭️
        </button>
        <button @click="stop" class="btn-control btn-stop">
          ⏹️
        </button>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading audio...</p>
    </div>
    
    <div class="player-progress">
      <div class="progress-info">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>
    
    <div class="player-settings">
      <label class="setting-toggle">
        <input type="checkbox" v-model="autoRotate" />
        Auto-rotate ({{ formatInterval(playlist.rotationInterval) }})
      </label>
      <label class="setting-toggle">
        <input type="checkbox" :checked="playlist.shuffle" disabled />
        Shuffle {{ playlist.shuffle ? '(enabled)' : '' }}
      </label>
      <label class="setting-toggle">
        <input type="checkbox" :checked="playlist.repeat" disabled />
        Repeat {{ playlist.repeat ? '(enabled)' : '' }}
      </label>
    </div>
    
    <audio
      ref="audioPlayer"
      :src="audioSrc"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleMetadata"
      @ended="handleEnded"
      @error="handleError"
      @canplay="handleCanPlay"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineProps, defineEmits } from 'vue'

const props = defineProps({
  playlist: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['stop'])

const audioPlayer = ref(null)
const audioSrc = ref('')
const currentPresetIndex = ref(0)
const isPlaying = ref(false)
const loading = ref(false)
const error = ref('')
const currentTime = ref(0)
const duration = ref(0)
const autoRotate = ref(true)
const rotationTimer = ref(null)

const currentPreset = computed(() => {
  if (!props.playlist.presets || props.playlist.presets.length === 0) return null
  return props.playlist.presets[currentPresetIndex.value]
})

const currentPresetName = computed(() => {
  if (!currentPreset.value) return 'No preset'
  // We'd need to fetch preset details, for now just show ID
  return `Preset ${currentPreset.value.presetId.substring(0, 8)}...`
})

const progressPercent = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const canGoPrevious = computed(() => {
  return currentPresetIndex.value > 0
})

const canGoNext = computed(() => {
  return currentPresetIndex.value < props.playlist.presets.length - 1 || props.playlist.repeat
})

onMounted(() => {
  if (props.playlist.presets.length > 0) {
    loadCurrentPreset()
  }
})

onUnmounted(() => {
  clearRotationTimer()
  if (audioPlayer.value) {
    audioPlayer.value.pause()
  }
})

async function loadCurrentPreset() {
  if (!currentPreset.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Fetch preset details to get the prompt
    const response = await fetch(`/api/presets/${currentPreset.value.presetId}`)
    if (!response.ok) throw new Error('Failed to load preset')
    
    const data = await response.json()
    const preset = data.preset
    
    // Generate audio URL
    const params = new URLSearchParams({
      text: preset.prompt,
      mood: preset.mood || 'default'
    })
    
    const timestamp = new Date().getTime()
    audioSrc.value = `/api/stream?${params.toString()}&t=${timestamp}`
    
    // Start rotation timer if enabled
    if (autoRotate.value) {
      startRotationTimer()
    }
  } catch (err) {
    error.value = 'Failed to load preset audio'
    loading.value = false
  }
}

function togglePlay() {
  if (!audioPlayer.value) return
  
  if (isPlaying.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
    clearRotationTimer()
  } else {
    audioPlayer.value.play()
    isPlaying.value = true
    if (autoRotate.value) {
      startRotationTimer()
    }
  }
}

function previousPreset() {
  if (currentPresetIndex.value > 0) {
    currentPresetIndex.value--
    loadCurrentPreset()
    if (isPlaying.value) {
      setTimeout(() => audioPlayer.value?.play(), 100)
    }
  }
}

function nextPreset() {
  if (currentPresetIndex.value < props.playlist.presets.length - 1) {
    currentPresetIndex.value++
  } else if (props.playlist.repeat) {
    currentPresetIndex.value = 0
  } else {
    stop()
    return
  }
  
  loadCurrentPreset()
  if (isPlaying.value) {
    setTimeout(() => audioPlayer.value?.play(), 100)
  }
}

function stop() {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value.currentTime = 0
  }
  isPlaying.value = false
  clearRotationTimer()
  emit('stop')
}

function handleTimeUpdate() {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
  }
}

function handleMetadata() {
  if (audioPlayer.value) {
    duration.value = audioPlayer.value.duration
  }
}

function handleEnded() {
  // Auto-advance to next preset if repeat is enabled
  if (props.playlist.repeat && currentPresetIndex.value < props.playlist.presets.length - 1) {
    nextPreset()
  } else {
    isPlaying.value = false
  }
}

function handleError() {
  error.value = 'Failed to load audio'
  loading.value = false
  isPlaying.value = false
}

function handleCanPlay() {
  loading.value = false
}

function startRotationTimer() {
  clearRotationTimer()
  
  if (!autoRotate.value || !props.playlist.rotationInterval) return
  
  rotationTimer.value = setInterval(() => {
    if (isPlaying.value) {
      nextPreset()
    }
  }, props.playlist.rotationInterval * 1000)
}

function clearRotationTimer() {
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
    rotationTimer.value = null
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatInterval(seconds) {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}
</script>

<style scoped>
.playlist-player {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.playlist-info h3 {
  margin: 0 0 0.5rem 0;
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

.btn-control {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-control:hover:not(:disabled) {
  background: #e0e0e0;
  transform: scale(1.05);
}

.btn-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-play {
  background: #42b983;
  color: white;
  width: 56px;
  height: 56px;
  font-size: 1.5rem;
}

.btn-play:hover:not(:disabled) {
  background: #38a375;
}

.btn-stop {
  background: #dc3545;
  color: white;
}

.btn-stop:hover:not(:disabled) {
  background: #c82333;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 1.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 0.5rem;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.player-progress {
  margin-bottom: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b983, #38a375);
  transition: width 0.3s;
}

.player-settings {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.setting-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  cursor: pointer;
}

.setting-toggle input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.setting-toggle input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

audio {
  display: none;
}

@media (max-width: 768px) {
  .playlist-player {
    padding: 1.5rem;
  }
  
  .player-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .player-controls {
    width: 100%;
    justify-content: center;
  }
  
  .player-settings {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
