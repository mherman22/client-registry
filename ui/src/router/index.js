import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/Home.vue') },
  { path: '/client/:clientId', name: 'client', component: () => import('@/views/Client.vue') },
  { path: '/review', name: 'review', component: () => import('@/views/Review.vue') },
  { path: '/automatch', name: 'automatch', component: () => import('@/views/AutoMatches.vue') },
  { path: '/audit', name: 'audit', component: () => import('@/views/AuditLog.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue') },
  { path: '/users', name: 'users', component: () => import('@/views/Users.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!auth.isAuthenticated && to.name !== 'login') {
    return { name: 'login' }
  }
})

export default router
