<template>
  <div class="background-visualizer">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const canvas = ref(null)
let scene, camera, renderer, particles, animationId
let time = 0

onMounted(() => {
  initVisualizer()
  animate()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
})

function initVisualizer() {
  if (!canvas.value) return

  // Scene setup
  scene = new THREE.Scene()
  
  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 50

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Create particle system
  createParticles()
}

function createParticles() {
  const particleCount = 2000
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  // Purple gradient colors matching the nav bar
  const color1 = new THREE.Color(0x667eea)
  const color2 = new THREE.Color(0x764ba2)
  const color3 = new THREE.Color(0x42b983)

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3

    // Position
    positions[i3] = (Math.random() - 0.5) * 200
    positions[i3 + 1] = (Math.random() - 0.5) * 200
    positions[i3 + 2] = (Math.random() - 0.5) * 100

    // Color - mix between the gradient colors
    const mixFactor = Math.random()
    const mixColor = color1.clone().lerp(
      mixFactor > 0.5 ? color2 : color3,
      Math.random()
    )
    colors[i3] = mixColor.r
    colors[i3 + 1] = mixColor.g
    colors[i3 + 2] = mixColor.b

    // Size
    sizes[i] = Math.random() * 2 + 0.5
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  // Shader material for custom particle rendering
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // Pulse effect based on time and position
        float pulse = sin(time * 2.0 + position.x * 0.1 + position.y * 0.1) * 0.5 + 0.5;
        gl_PointSize = size * (1.0 + pulse * 0.5) * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        // Circular particles with soft edges
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        if (dist > 0.5) discard;
        
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha * 0.6);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  time += 0.005

  if (particles) {
    // Rotate particle system slowly
    particles.rotation.x = time * 0.05
    particles.rotation.y = time * 0.08
    
    // Update shader time uniform
    particles.material.uniforms.time.value = time

    // Animate individual particles
    const positions = particles.geometry.attributes.position.array
    for (let i = 0; i < positions.length; i += 3) {
      // Gentle wave motion
      positions[i + 1] += Math.sin(time + positions[i] * 0.01) * 0.02
      
      // Wrap around
      if (positions[i + 1] > 100) positions[i + 1] = -100
      if (positions[i + 1] < -100) positions[i + 1] = 100
    }
    particles.geometry.attributes.position.needsUpdate = true
  }

  renderer.render(scene, camera)
}

function onResize() {
  if (!camera || !renderer) return

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}
</script>

<style scoped>
.background-visualizer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
