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
    }
  ],
});

export default router;
