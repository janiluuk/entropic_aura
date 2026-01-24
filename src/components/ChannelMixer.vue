<template>
  <div class="channel-mixer">
    <div class="mixer-header" @click="toggleExpanded">
      <h3>
        {{ expanded ? '▼' : '▶' }} Advanced Settings
      </h3>
      <span class="hint">{{ expanded ? 'Click to collapse' : 'Click to expand mixer' }}</span>
    </div>
    
    <transition name="expand">
      <div v-if="expanded" class="mixer-content">
        <div class="channels-grid">
          <div 
            v-for="channel in channels" 
            :key="channel.id" 
            class="channel-control"
          >
            <div class="channel-header">
              <label>{{ channel.name }}</label>
              <span class="channel-volume">{{ Math.round(channel.volume * 100) }}%</span>
            </div>
            
            <!-- Sound indicator (visualizer) -->
            <div class="sound-indicator">
              <canvas 
                :ref="el => channelCanvases[channel.id] = el" 
                :width="100" 
                :height="40"
                class="indicator-canvas"
              ></canvas>
            </div>
            
            <!-- Volume slider -->
            <div class="volume-control">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                :value="channel.volume"
                @input="updateVolume(channel.id, $event.target.value)"
                class="volume-slider"
              />
            </div>
            
            <!-- Mute button -->
            <button 
              @click="toggleMute(channel.id)" 
              :class="['mute-btn', { muted: channel.muted }]"
              :title="channel.muted ? 'Unmute' : 'Mute'"
            >
              {{ channel.muted ? '🔇' : '🔊' }}
            </button>
          </div>
        </div>
        
        <!-- Master controls -->
        <div class="master-controls">
          <button @click="resetAll" class="btn-reset">
            Reset All
          </button>
          <button @click="muteAll" class="btn-mute-all">
            {{ allMuted ? 'Unmute All' : 'Mute All' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  audio: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['volume-change'])

const expanded = ref(false)
const channelCanvases = ref({})
const channels = ref([
  { id: 0, name: 'Channel 1', volume: 1.0, muted: false },
  { id: 1, name: 'Channel 2', volume: 1.0, muted: false },
  { id: 2, name: 'Channel 3', volume: 1.0, muted: false },
  { id: 3, name: 'Channel 4', volume: 1.0, muted: false }
])

let audioContext = null
let analyser = null
let source = null
let splitter = null
let gainNodes = []
let channelAnalysers = []
let animationId = null

const allMuted = computed(() => {
  return channels.value.every(ch => ch.muted)
})

function toggleExpanded() {
  expanded.value = !expanded.value
}

function updateVolume(channelId, value) {
  const channel = channels.value.find(ch => ch.id === channelId)
  if (channel) {
    channel.volume = parseFloat(value)
    // Update gain node if it exists
    if (gainNodes[channelId]) {
      gainNodes[channelId].gain.value = channel.muted ? 0 : channel.volume
    }
  }
}

function toggleMute(channelId) {
  const channel = channels.value.find(ch => ch.id === channelId)
  if (channel) {
    channel.muted = !channel.muted
    // Update gain node if it exists
    if (gainNodes[channelId]) {
      gainNodes[channelId].gain.value = channel.muted ? 0 : channel.volume
    }
  }
}

function resetAll() {
  channels.value.forEach(channel => {
    channel.volume = 1.0
    channel.muted = false
    // Update gain node if it exists
    if (gainNodes[channel.id]) {
      gainNodes[channel.id].gain.value = 1.0
    }
  })
}

function muteAll() {
  const shouldMute = !allMuted.value
  channels.value.forEach(channel => {
    channel.muted = shouldMute
    // Update gain node if it exists
    if (gainNodes[channel.id]) {
      gainNodes[channel.id].gain.value = shouldMute ? 0 : channel.volume
    }
  })
}

async function setupAudioAnalysis() {
  if (!props.audio || !expanded.value) return
  
  try {
    // Clean up existing context
    if (audioContext) {
      if (animationId) cancelAnimationFrame(animationId)
      if (source) source.disconnect()
      if (splitter) splitter.disconnect()
      channelAnalysers.forEach(analyser => {
        if (analyser) analyser.disconnect()
      })
      gainNodes.forEach(gain => {
        if (gain) gain.disconnect()
      })
      await audioContext.close()
    }
    
    // Create new context
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Try to create media element source
    try {
      source = audioContext.createMediaElementSource(props.audio)
    } catch (err) {
      console.warn('MediaElementSource already exists for this audio element')
      // If source already exists, we can't create visualization for this element
      // This is a limitation of the Web Audio API
      return
    }
    
    // Create channel splitter for 4 channels
    splitter = audioContext.createChannelSplitter(4)
    source.connect(splitter)
    
    // Create a single merger to combine all channels back to output
    const merger = audioContext.createChannelMerger(4)
    merger.connect(audioContext.destination)
    
    // Create analyser and gain node for each channel
    channelAnalysers = []
    gainNodes = []
    for (let i = 0; i < 4; i++) {
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      
      const gainNode = audioContext.createGain()
      gainNode.gain.value = channels.value[i].volume
      
      // Connect: splitter -> analyser -> gain -> merger
      splitter.connect(analyser, i)
      analyser.connect(gainNode)
      gainNode.connect(merger, 0, i)
      
      channelAnalysers.push(analyser)
      gainNodes.push(gainNode)
    }
    
    // Start visualization
    visualize()
  } catch (error) {
    console.error('Failed to setup audio analysis:', error)
  }
}

function visualize() {
  if (!expanded.value) {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    return
  }
  
  animationId = requestAnimationFrame(visualize)
  
  channelAnalysers.forEach((analyser, index) => {
    const canvas = channelCanvases.value[index]
    if (!canvas || !analyser) return
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    // Clear canvas
    ctx.fillStyle = 'rgb(20, 20, 20)'
    ctx.fillRect(0, 0, width, height)
    
    // Draw bars
    const barWidth = (width / dataArray.length) * 2.5
    let x = 0
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * height
      
      // Color based on channel
      const colors = [
        'rgb(255, 100, 100)', // Red
        'rgb(100, 255, 100)', // Green
        'rgb(100, 100, 255)', // Blue
        'rgb(255, 255, 100)'  // Yellow
      ]
      
      ctx.fillStyle = colors[index]
      ctx.fillRect(x, height - barHeight, barWidth, barHeight)
      x += barWidth + 1
    }
  })
}

watch(() => props.audio, (newAudio) => {
  if (newAudio && expanded.value) {
    setupAudioAnalysis()
  }
})

watch(expanded, (isExpanded) => {
  if (isExpanded && props.audio) {
    setupAudioAnalysis()
  } else if (!isExpanded && animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})

onUnmounted(async () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (source) {
    source.disconnect()
  }
  if (splitter) {
    splitter.disconnect()
  }
  channelAnalysers.forEach(analyser => {
    if (analyser) analyser.disconnect()
  })
  gainNodes.forEach(gain => {
    if (gain) gain.disconnect()
  })
  if (audioContext) {
    await audioContext.close()
  }
})
</script>

<style scoped>
.channel-mixer {
  margin: 1.5rem 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.mixer-header {
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  transition: background 0.3s;
}

.mixer-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mixer-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
}

.mixer-header .hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.mixer-content {
  padding: 1.5rem;
}

.channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.channel-control {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.channel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.channel-header label {
  color: #ffffff;
  font-weight: 600;
  font-size: 0.95rem;
}

.channel-volume {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-family: monospace;
}

.sound-indicator {
  margin-bottom: 0.75rem;
  border-radius: 4px;
  overflow: hidden;
  background: #1a1a1a;
}

.indicator-canvas {
  display: block;
  width: 100%;
  height: 40px;
}

.volume-control {
  margin-bottom: 0.75rem;
}

.volume-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
  transition: all 0.2s;
}

.volume-slider::-webkit-slider-thumb:hover {
  background: #38a375;
  transform: scale(1.1);
}

.volume-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.volume-slider::-moz-range-thumb:hover {
  background: #38a375;
  transform: scale(1.1);
}

.mute-btn {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.mute-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mute-btn.muted {
  background: rgba(255, 100, 100, 0.3);
  border-color: rgba(255, 100, 100, 0.5);
}

.master-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.master-controls button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: rgba(66, 185, 131, 0.8);
  color: white;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s;
}

.master-controls button:hover {
  background: rgba(66, 185, 131, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-reset {
  background: rgba(100, 150, 200, 0.8) !important;
}

.btn-reset:hover {
  background: rgba(100, 150, 200, 1) !important;
}

.btn-mute-all {
  background: rgba(200, 100, 100, 0.8) !important;
}

.btn-mute-all:hover {
  background: rgba(200, 100, 100, 1) !important;
}
</style>
