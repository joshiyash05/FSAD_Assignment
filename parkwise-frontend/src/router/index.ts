import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'
import PaymentPage from '@/pages/PaymentPage.vue'
import ConfirmationPage from '@/pages/ConfirmationPage.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginPage, meta: { guest: true } },
  { path: '/', name: 'dashboard', component: DashboardPage },
  { path: '/profile', name: 'profile', component: ProfilePage },
  { path: '/payment/:reservationId', name: 'payment', component: PaymentPage, props: true },
  { path: '/confirmation/:reservationId', name: 'confirmation', component: ConfirmationPage, props: true },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (!to.meta.guest && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
