import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/services/authService'
import type { RegisterRequest, User } from '@/types/index'

const storedUser = localStorage.getItem('user')

function parseStoredUser() {
  if (!storedUser) return null

  try {
    const parsedUser = JSON.parse(storedUser) as User
    return typeof parsedUser.is_staff === 'boolean' ? parsedUser : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(parseStoredUser())
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => Boolean(token.value))
  const isAdmin = computed(() => user.value?.is_staff ?? false)
  const initials = computed(() => {
    const currentUser = user.value
    if (!currentUser) return 'P'

    const nameParts = [currentUser.first_name, currentUser.last_name]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))

    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }

    if (nameParts.length === 1) {
      const [name] = nameParts
      return name.slice(0, 2).toUpperCase()
    }

    return (currentUser.username?.[0] ?? currentUser.email?.[0] ?? 'P').toUpperCase()
  })

  function persistSession(nextToken: string, nextUser: User) {
    token.value = nextToken
    user.value = nextUser
    localStorage.setItem('token', nextToken)
    localStorage.setItem('user', JSON.stringify(nextUser))
  }

  async function login(username: string, password: string) {
    const response = await authService.login(username, password)
    persistSession(response.token, response.user)
  }

  async function register(payload: RegisterRequest) {
    const response = await authService.register(payload)
    persistSession(response.token, response.user)
  }

  async function logout() {
    try {
      if (token.value) await authService.logout()
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  return { user, token, isAuthenticated, isAdmin, initials, login, register, logout }
})
