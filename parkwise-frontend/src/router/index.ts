import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'
import PaymentPage from '@/pages/PaymentPage.vue'
import ConfirmationPage from '@/pages/ConfirmationPage.vue'
import BookingsPage from '@/pages/BookingsPage.vue'
import NearbyPage from '@/pages/NearbyPage.vue'
import AdminPage from '@/pages/AdminPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    guest?: boolean
    requiresAuth?: boolean
    requiresAdmin?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { guest: true } },
    { path: '/', name: 'dashboard', component: DashboardPage, meta: { requiresAuth: true } },
    { path: '/dashboard', redirect: '/' },
    { path: '/profile', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } },
    { path: '/bookings', name: 'bookings', component: BookingsPage, meta: { requiresAuth: true } },
    { path: '/nearby', name: 'nearby', component: NearbyPage, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminPage, meta: { requiresAuth: true, requiresAdmin: true } },
    {
      path: '/payment/:reservationId',
      name: 'payment',
      component: PaymentPage,
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/confirmation/:reservationId',
      name: 'confirmation',
      component: ConfirmationPage,
      props: true,
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'dashboard' }
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
