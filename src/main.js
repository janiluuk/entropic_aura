import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import SoundscapeCreator from './views/SoundscapeCreator.vue'

// Minimal router for the soundscape feature
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/soundscape'
    },
    {
      path: '/soundscape',
      component: SoundscapeCreator
    }
  ]
})

const app = createApp({
  template: '<router-view />'
})

app.use(router)
app.mount('#app')
