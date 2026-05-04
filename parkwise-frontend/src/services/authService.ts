import api, { getApiErrorMessage } from './api'
import type { AuthResponse, RegisterRequest } from '@/types/index'

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('auth/login/', { username, password })
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Invalid credentials'))
    }
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('auth/register/', payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Registration failed'))
    }
  },

  async logout(): Promise<void> {
    await api.post('auth/logout/')
  },
}
