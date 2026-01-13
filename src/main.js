import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'

// Create a minimal App component with navigation
const App = {
  template: `
    <div id="app">
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
  `
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Add global navigation styles
const style = document.createElement('style')
style.textContent = `
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
  
  .main-nav {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    position: sticky;
    top: 0;
    z-index: 100;
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
  }
`
document.head.appendChild(style)
