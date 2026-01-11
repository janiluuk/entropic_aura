<template>
  <div class="audio-visualizer">
    <canvas ref="canvas" width="600" height="100"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  audio: Object
})

const canvas = ref(null)
let audioContext = null
let analyser = null
let dataArray = null
let animationId = null

onMounted(() => {
  if (props.audio) {
    setupVisualizer()
  }
})

watch(() => props.audio, (newAudio) => {
  if (newAudio) {
    setupVisualizer()
  }
})

function setupVisualizer() {
  if (!canvas.value || !props.audio) return

  try {
    // Clean up existing context if any
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    
    // Check if source was already created for this element
    if (!props.audio._audioSource) {
      const source = audioContext.createMediaElementSource(props.audio)
      props.audio._audioSource = source
    }
    
    props.audio._audioSource.connect(analyser)
    analyser.connect(audioContext.destination)
    
    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)
    
    draw()
  } catch (error) {
    console.error('Visualizer setup failed:', error)
  }
}

function draw() {
  if (!canvas.value || !analyser) return

  animationId = requestAnimationFrame(draw)

  analyser.getByteFrequencyData(dataArray)

  const ctx = canvas.value.getContext('2d')
  const width = canvas.value.width
  const height = canvas.value.height

  ctx.fillStyle = 'rgb(20, 20, 20)'
  ctx.fillRect(0, 0, width, height)

  const barWidth = (width / dataArray.length) * 2.5
  let barHeight
  let x = 0

  for (let i = 0; i < dataArray.length; i++) {
    barHeight = (dataArray[i] / 255) * height

    ctx.fillStyle = `rgb(${barHeight + 100}, 50, 150)`
    ctx.fillRect(x, height - barHeight, barWidth, barHeight)

    x += barWidth + 1
  }
}

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  analyser = null
  dataArray = null
})
</script>

<style scoped>
.audio-visualizer {
  margin: 1rem 0;
  display: flex;
  justify-content: center;
}

canvas {
  border: 1px solid #333;
  border-radius: 4px;
  background: #1a1a1a;
}
</style>
