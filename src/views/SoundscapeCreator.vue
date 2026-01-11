<template>
  <div class="soundscape-creator">
    <h1>Create a Soundscape</h1>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="healthStatus && !healthStatus.comfyui" class="warning-message">
      ⚠️ ComfyUI is unavailable. Audio generation may not work.
    </div>
    
    <textarea 
      v-model="prompt" 
      placeholder="Describe your soundscape or mood..."
      :disabled="loading"
      maxlength="500"
    />
    <div class="char-count">{{ prompt.length }}/500</div>

    <div class="mood-tags">
      <button
        v-for="mood in moods"
        :key="mood"
        :class="{ active: selectedMood === mood }"
        :disabled="loading"
        @click="selectedMood = mood"
      >
        {{ mood }}
      </button>
    </div>

    <div class="actions">
      <button @click="toggleRecording" :disabled="loading">
        {{ recording ? 'Stop Recording' : '🎤 Speak' }}
      </button>
      <button @click="generate" :disabled="loading || !prompt">
        {{ loading ? 'Generating...' : '▶️ Generate' }}
      </button>
      <button v-if="audioSrc" @click="downloadAudio" :disabled="loading">
        💾 Download
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Generating your soundscape...</p>
    </div>

    <AudioVisualizer v-if="audioSrc && !loading" :audio="audioPlayer" />
    <audio
      v-if="audioSrc"
      :src="audioSrc"
      controls
      loop
      ref="audioPlayer"
      @error="handleAudioError"
      @loadeddata="handleAudioLoaded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AudioVisualizer from '@/components/AudioVisualizer.vue'

const prompt = ref('')
const selectedMood = ref('')
const moods = ref([])
const recording = ref(false)
const audioSrc = ref('')
const audioPlayer = ref(null)
const loading = ref(false)
const error = ref('')
const healthStatus = ref(null)

// Fetch available moods from backend
onMounted(async () => {
  try {
    const response = await fetch('/api/moods')
    const data = await response.json()
    moods.value = data.moods
  } catch (err) {
    console.error('Failed to fetch moods:', err)
    moods.value = ['Relaxing', 'Energizing'] // Fallback
  }
  
  // Check health
  checkHealth()
})

async function checkHealth() {
  try {
    const response = await fetch('/api/health')
    healthStatus.value = await response.json()
  } catch (err) {
    console.error('Health check failed:', err)
  }
}

function toggleRecording() {
  if (!recording.value) {
    startRecording()
  } else {
    stopRecording()
  }
}

function startRecording() {
  // Check for browser support
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    error.value = 'Speech recognition not supported in this browser'
    return
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = 'en-US'
  
  recognition.onstart = () => {
    recording.value = true
    error.value = ''
  }
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    prompt.value = transcript
    recording.value = false
  }
  
  recognition.onerror = (event) => {
    error.value = `Speech recognition error: ${event.error}`
    recording.value = false
  }
  
  recognition.onend = () => {
    recording.value = false
  }
  
  recognition.start()
  window.currentRecognition = recognition
}

function stopRecording() {
  if (window.currentRecognition) {
    window.currentRecognition.stop()
  }
  recording.value = false
}

async function generate() {
  if (!prompt.value) {
    error.value = 'Please enter a description'
    return
  }
  
  error.value = ''
  loading.value = true
  
  try {
    const params = new URLSearchParams({
      text: prompt.value,
      mood: selectedMood.value
    })
    
    // Generate a timestamp-based URL to force reload
    const timestamp = new Date().getTime()
    audioSrc.value = `/api/stream?${params.toString()}&t=${timestamp}`
  } catch (err) {
    error.value = 'Failed to generate audio'
    loading.value = false
  }
}

function handleAudioError(event) {
  error.value = 'Failed to load audio. Please try again.'
  loading.value = false
}

function handleAudioLoaded() {
  loading.value = false
}

function downloadAudio() {
  if (!audioSrc.value) return
  
  const filename = `soundscape-${Date.now()}.aac`
  const link = document.createElement('a')
  link.href = audioSrc.value
  link.download = filename
  link.click()
}
</script>

<style scoped>
.soundscape-creator {
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.warning-message {
  background: #fffbf0;
  border: 1px solid #ffe0a3;
  color: #856404;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

textarea {
  width: 100%;
  min-height: 100px;
  margin-bottom: 0.25rem;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
}

textarea:focus {
  outline: none;
  border-color: #42b983;
}

textarea:disabled {
  background: #eee;
  cursor: not-allowed;
}

.char-count {
  text-align: right;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 1rem;
}

.mood-tags {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.mood-tags button {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.mood-tags button:hover:not(:disabled) {
  border-color: #42b983;
  transform: translateY(-2px);
}

.mood-tags button.active {
  background: #42b983;
  color: #fff;
  border-color: #42b983;
}

.mood-tags button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.actions {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #42b983;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.actions button:hover:not(:disabled) {
  background: #38a375;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.actions button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.loading {
  margin: 2rem 0;
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

.loading p {
  color: #666;
  font-style: italic;
}

audio {
  width: 100%;
  margin-top: 1rem;
  border-radius: 8px;
}
</style>

