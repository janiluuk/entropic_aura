import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'

// Create a minimal App component since App.vue doesn't exist
const App = {
  template: `
    <div id="app">
      <router-view />
    </div>
  `
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
