<template>
  <div class="audio-visualizer">
    <canvas ref="canvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  audio: {
    type: Object,
    default: null
  },
  width: {
    type: Number,
    default: 600
  },
  height: {
    type: Number,
    default: 100
  },
  barColor: {
    type: String,
    default: '#42b983'
  }
})

const canvas = ref(null)
let audioContext = null
let analyser = null
let dataArray = null
let animationId = null
let source = null

const initVisualizer = () => {
  if (!props.audio || !canvas.value) return

  try {
    // Create audio context if it doesn't exist
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }

    // Create analyser node
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)

    // Connect audio element to analyser
    if (!source) {
      source = audioContext.createMediaElementSource(props.audio)
      source.connect(analyser)
      analyser.connect(audioContext.destination)
    }

    // Start visualization
    draw()
  } catch (error) {
    console.error('Failed to initialize audio visualizer:', error)
  }
}

const draw = () => {
  if (!canvas.value || !analyser || !dataArray) return

  const canvasCtx = canvas.value.getContext('2d')
  const width = canvas.value.width
  const height = canvas.value.height

  animationId = requestAnimationFrame(draw)

  analyser.getByteFrequencyData(dataArray)

  // Clear canvas
  canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  canvasCtx.fillRect(0, 0, width, height)

  const barWidth = (width / dataArray.length) * 2.5
  let barHeight
  let x = 0

  for (let i = 0; i < dataArray.length; i++) {
    barHeight = (dataArray[i] / 255) * height

    // Create gradient
    const gradient = canvasCtx.createLinearGradient(0, height - barHeight, 0, height)
    gradient.addColorStop(0, props.barColor)
    gradient.addColorStop(1, 'rgba(66, 185, 131, 0.3)')

    canvasCtx.fillStyle = gradient
    canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight)

    x += barWidth + 1
  }
}

const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close()
    audioContext = null
  }
  analyser = null
  source = null
  dataArray = null
}

// Watch for audio element changes
watch(() => props.audio, (newAudio) => {
  if (newAudio) {
    cleanup()
    // Wait for audio element to be ready
    if (newAudio.readyState >= 2) {
      initVisualizer()
    } else {
      newAudio.addEventListener('loadeddata', initVisualizer, { once: true })
    }
  }
})

onMounted(() => {
  if (props.audio) {
    initVisualizer()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.audio-visualizer {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1rem;
}

canvas {
  display: block;
  border-radius: 4px;
}
</style>
