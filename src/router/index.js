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
    },
    {
      path: '/playlists/new',
      name: 'PlaylistEditor',
      component: () => import('@/views/PlaylistEditor.vue')
    },
    {
      path: '/playlists/:id/edit',
      name: 'PlaylistEditorEdit',
      component: () => import('@/views/PlaylistEditor.vue')
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue')
    }
  ],
});

export default router;
