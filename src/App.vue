<template>
  <div id="app">
    <BackgroundVisualizer />
    <nav class="main-nav">
      <div class="nav-container">
        <div class="app-title">
          <svg class="logo" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" opacity="0.3"/>
            <circle cx="20" cy="20" r="14" fill="none" stroke="url(#logoGradient)" stroke-width="2"/>
            <circle cx="20" cy="20" r="10" fill="none" stroke="url(#logoGradient)" stroke-width="1.5"/>
            <circle cx="20" cy="20" r="6" fill="none" stroke="url(#logoGradient)" stroke-width="1"/>
            <path d="M 20 2 Q 22 10, 20 20 Q 18 30, 20 38" stroke="url(#logoGradient)" stroke-width="1.5" fill="none" opacity="0.6"/>
            <path d="M 2 20 Q 10 22, 20 20 Q 30 18, 38 20" stroke="url(#logoGradient)" stroke-width="1.5" fill="none" opacity="0.6"/>
            <circle cx="20" cy="20" r="3" fill="url(#logoGradient)"/>
          </svg>
          <span>Entropic Aura</span>
        </div>
        <div class="nav-links">
          <router-link to="/soundscape" class="nav-link" title="Soundscape">
            <i class="pi pi-volume-up"></i>
            <span class="nav-text">Soundscape</span>
          </router-link>
          <router-link to="/presets" class="nav-link" title="Presets">
            <i class="pi pi-star"></i>
            <span class="nav-text">Presets</span>
          </router-link>
          <router-link to="/playlists" class="nav-link" title="Playlists">
            <i class="pi pi-list"></i>
            <span class="nav-text">Playlists</span>
          </router-link>
          <router-link to="/settings" class="nav-link" title="Settings">
            <i class="pi pi-cog"></i>
            <span class="nav-text">Settings</span>
          </router-link>
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link i {
  font-size: 1.2rem;
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
