<template>
  <div id="app">
    <BackgroundVisualizer />
    <nav class="main-nav">
      <div class="nav-container">
        <h1 class="app-title">Entropic Aura</h1>
        <div class="nav-links">
          <router-link to="/soundscape" class="nav-link">Soundscape</router-link>
          <router-link to="/presets" class="nav-link">Presets</router-link>
          <router-link to="/playlists" class="nav-link">Playlists</router-link>
          <router-link to="/settings" class="nav-link">Settings</router-link>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import BackgroundVisualizer from '@/components/BackgroundVisualizer.vue'
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #0a0a0a;
}

.main-nav {
  background: linear-gradient(180deg, 
    rgba(102, 126, 234, 0.75) 0%, 
    rgba(118, 75, 162, 0.6) 50%,
    rgba(118, 75, 162, 0.3) 85%,
    transparent 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

#app {
  min-height: 100vh;
  position: relative;
}
</style>
