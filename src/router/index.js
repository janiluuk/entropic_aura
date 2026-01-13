import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      redirect: "/soundscape"
    },
    {
      path: '/soundscape',
      name: 'SoundscapeCreator',
      component: () => import('@/views/SoundscapeCreator.vue')
    },
    {
      path: '/presets',
      name: 'PresetManager',
      component: () => import('@/views/PresetManager.vue')
    },
    {
      path: '/playlists',
      name: 'PlaylistManager',
      component: () => import('@/views/PlaylistManager.vue')
    }
  ],
});

export default router;
