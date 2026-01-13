<template>
  <div class="background-visualizer">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const canvas = ref(null)
let scene, camera, renderer, visualizerObject, animationId
let time = 0
let currentStyle = ref('particles')

onMounted(() => {
  // Load saved visualizer style
  const saved = localStorage.getItem('entropicAuraSettings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      if (settings.appearance?.visualizerStyle) {
        currentStyle.value = settings.appearance.visualizerStyle
      }
    } catch (err) {
      console.error('Failed to load visualizer style:', err)
    }
  }
  
  initVisualizer()
  animate()
  window.addEventListener('resize', onResize)
  
  // Listen for style changes
  window.addEventListener('visualizerStyleChanged', handleStyleChange)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('visualizerStyleChanged', handleStyleChange)
  cleanup()
})

function handleStyleChange(event) {
  currentStyle.value = event.detail
  cleanup()
  initVisualizer()
}

function cleanup() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (visualizerObject) {
    scene.remove(visualizerObject)
    if (visualizerObject.geometry) visualizerObject.geometry.dispose()
    if (visualizerObject.material) visualizerObject.material.dispose()
    visualizerObject = null
  }
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
}

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

  // Create visualizer based on style
  switch (currentStyle.value) {
    case 'particles':
      createParticles()
      break
    case 'waves':
      createWaves()
      break
    case 'nebula':
      createNebula()
      break
    case 'grid':
      createGrid()
      break
    default:
      createParticles()
  }
}

function createParticles() {
  const particleCount = 2000
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  const color1 = new THREE.Color(0x667eea)
  const color2 = new THREE.Color(0x764ba2)
  const color3 = new THREE.Color(0x42b983)

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * 200
    positions[i3 + 1] = (Math.random() - 0.5) * 200
    positions[i3 + 2] = (Math.random() - 0.5) * 100

    const mixFactor = Math.random()
    const mixColor = color1.clone().lerp(
      mixFactor > 0.5 ? color2 : color3,
      Math.random()
    )
    colors[i3] = mixColor.r
    colors[i3 + 1] = mixColor.g
    colors[i3 + 2] = mixColor.b

    sizes[i] = Math.random() * 2 + 0.5
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float pulse = sin(time * 2.0 + position.x * 0.1 + position.y * 0.1) * 0.5 + 0.5;
        gl_PointSize = size * (1.0 + pulse * 0.5) * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
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

  visualizerObject = new THREE.Points(geometry, material)
  scene.add(visualizerObject)
}

function createWaves() {
  const geometry = new THREE.PlaneGeometry(200, 200, 50, 50)
  const positions = geometry.attributes.position.array
  const colors = new Float32Array(positions.length)
  
  const color1 = new THREE.Color(0x667eea)
  const color2 = new THREE.Color(0x42b983)
  
  for (let i = 0; i < positions.length; i += 3) {
    const mixFactor = (positions[i + 1] + 100) / 200
    const mixColor = color1.clone().lerp(color2, mixFactor)
    colors[i] = mixColor.r
    colors[i + 1] = mixColor.g
    colors[i + 2] = mixColor.b
  }
  
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        vColor = color;
        vec3 pos = position;
        float wave = sin(pos.x * 0.1 + time) * cos(pos.y * 0.1 + time * 0.7) * 5.0;
        pos.z += wave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        gl_FragColor = vec4(vColor, 0.3);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    wireframe: true
  })
  
  visualizerObject = new THREE.Mesh(geometry, material)
  visualizerObject.rotation.x = -Math.PI / 3
  scene.add(visualizerObject)
}

function createNebula() {
  const particleCount = 3000
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    const radius = Math.random() * 80 + 20
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = radius * Math.cos(phi)
    
    const color = new THREE.Color()
    color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.3)
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
    
    sizes[i] = Math.random() * 4 + 1
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (250.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;
        float alpha = pow(1.0 - dist * 2.0, 3.0);
        gl_FragColor = vec4(vColor, alpha * 0.7);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  visualizerObject = new THREE.Points(geometry, material)
  scene.add(visualizerObject)
}

function createGrid() {
  const size = 100
  const divisions = 20
  const geometry = new THREE.BufferGeometry()
  const vertices = []
  const colors = []
  
  const color1 = new THREE.Color(0x667eea)
  const color2 = new THREE.Color(0x42b983)
  
  // Create grid lines
  for (let i = 0; i <= divisions; i++) {
    const pos = (i / divisions - 0.5) * size
    
    // Horizontal lines
    vertices.push(-size/2, pos, 0, size/2, pos, 0)
    const c1 = color1.clone().lerp(color2, i / divisions)
    colors.push(c1.r, c1.g, c1.b, c1.r, c1.g, c1.b)
    
    // Vertical lines
    vertices.push(pos, -size/2, 0, pos, size/2, 0)
    colors.push(c1.r, c1.g, c1.b, c1.r, c1.g, c1.b)
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.4
  })
  
  visualizerObject = new THREE.LineSegments(geometry, material)
  visualizerObject.rotation.x = -Math.PI / 4
  scene.add(visualizerObject)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  time += 0.005

  if (visualizerObject) {
    switch (currentStyle.value) {
      case 'particles':
        visualizerObject.rotation.x = time * 0.05
        visualizerObject.rotation.y = time * 0.08
        if (visualizerObject.material.uniforms) {
          visualizerObject.material.uniforms.time.value = time
        }
        const positions = visualizerObject.geometry.attributes.position.array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(time + positions[i] * 0.01) * 0.02
          if (positions[i + 1] > 100) positions[i + 1] = -100
          if (positions[i + 1] < -100) positions[i + 1] = 100
        }
        visualizerObject.geometry.attributes.position.needsUpdate = true
        break
        
      case 'waves':
        if (visualizerObject.material.uniforms) {
          visualizerObject.material.uniforms.time.value = time
        }
        visualizerObject.rotation.z = time * 0.05
        break
        
      case 'nebula':
        visualizerObject.rotation.y = time * 0.03
        visualizerObject.rotation.x = Math.sin(time * 0.5) * 0.2
        if (visualizerObject.material.uniforms) {
          visualizerObject.material.uniforms.time.value = time
        }
        break
        
      case 'grid':
        visualizerObject.rotation.z = time * 0.02
        visualizerObject.position.z = Math.sin(time) * 10
        break
    }
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
