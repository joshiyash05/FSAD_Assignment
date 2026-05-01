import api from './api'
import type { AuthResponse } from '@/types'

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login/', { username, password })
    return data
  },

  async register(payload: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
  }): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register/', payload)
    return data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout/')
  }
}
