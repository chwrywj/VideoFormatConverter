import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'video-format-conversion',
      component: () => import('../views/VideoFormatConversion.vue')
    }
  ]
})

export default router
