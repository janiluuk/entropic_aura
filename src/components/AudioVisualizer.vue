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
let source = null

onMounted(() => {
  if (props.audio) {
    setupVisualizer()
  }
})

watch(() => props.audio, (newAudio, oldAudio) => {
  if (newAudio && newAudio !== oldAudio) {
    setupVisualizer()
  }
})

async function setupVisualizer() {
  if (!canvas.value || !props.audio) return

  try {
    // Cancel any ongoing animation
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    // If we're switching audio elements, disconnect and close old context
    if (audioContext && source) {
      source.disconnect()
      await audioContext.close()
      audioContext = null
      source = null
    }

    // Create new audio context and source
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    
    // Create source - will throw if already created for this element
    try {
      source = audioContext.createMediaElementSource(props.audio)
    } catch (err) {
      // Source already exists for this element, clean up and return
      console.warn('MediaElementSource already exists for this audio element')
      if (audioContext) {
        await audioContext.close()
        audioContext = null
      }
      analyser = null
      return
    }
    
    source.connect(analyser)
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

onUnmounted(async () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (source) {
    source.disconnect()
    source = null
  }
  if (audioContext) {
    await audioContext.close()
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
