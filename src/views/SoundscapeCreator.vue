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
      <button @click="toggleRecording" :disabled="loading" title="Voice Input">
        <i :class="recording ? 'pi pi-stop-circle' : 'pi pi-microphone'"></i>
        <span>{{ recording ? 'Stop' : 'Speak' }}</span>
      </button>
      <button @click="generate" :disabled="loading || !prompt" class="generate-btn" title="Generate Soundscape">
        <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-play'"></i>
        <span>{{ loading ? 'Generating...' : 'Generate' }}</span>
      </button>
      <button v-if="audioSrc" @click="downloadAudio" :disabled="loading" title="Download Audio">
        <i class="pi pi-download"></i>
        <span>Download</span>
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Generating your soundscape...</p>
    </div>

    <AudioVisualizer v-if="audioSrc && !loading" :audio="audioPlayer" />
    
    <ChannelMixer v-if="audioSrc && !loading" :audio="audioPlayer" />
    
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
import ChannelMixer from '@/components/ChannelMixer.vue'

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
  padding: 2.5rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: none;
  border-radius: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 
              0 0 1px rgba(255, 255, 255, 0.1) inset;
}

h1 {
  color: #ffffff;
  margin-bottom: 1.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
  padding: 1rem 1.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border-radius: 20px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 4px 20px rgba(66, 185, 131, 0.3),
              0 0 0 3px rgba(66, 185, 131, 0.2);
}

textarea:disabled {
  background: #eee;
  cursor: not-allowed;
}

.char-count {
  text-align: right;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
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
  padding: 0.65rem 1.25rem;
  border: none;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.mood-tags button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.mood-tags button.active {
  background: linear-gradient(135deg, #42b983 0%, #38a375 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(66, 185, 131, 0.4);
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
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 28px;
  background: linear-gradient(135deg, #42b983 0%, #38a375 100%);
  color: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 6px 20px rgba(66, 185, 131, 0.35);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.actions button i {
  font-size: 1.1rem;
}

.actions button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(66, 185, 131, 0.5);
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
  border-radius: 20px;
}
</style>

