import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.is_staff ?? false)
  const initials = computed(() => {
    if (!user.value) return ''
    return (user.value.first_name[0] + user.value.last_name[0]).toUpperCase()
  })

  async function login(username: string, password: string) {
    const res = await authService.login(username, password)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
  }

  async function register(payload: {
    username: string; email: string; password: string;
    first_name: string; last_name: string
  }) {
    const res = await authService.register(payload)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
  }

  function logout() {
    authService.logout().catch(() => {})
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isAuthenticated, isAdmin, initials, login, register, logout }
})
