import axios, { type AxiosError } from 'axios'

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  const axiosError = error as AxiosError<Record<string, unknown>>
  const data = axiosError.response?.data

  if (typeof data?.error === 'string') return data.error
  if (typeof data?.detail === 'string') return data.detail
  if (Array.isArray(data?.non_field_errors)) return data.non_field_errors.join(', ')
  if (data && typeof data === 'object') {
    const messages = Object.values(data).flat().filter(Boolean)
    if (messages.length) return messages.join(', ')
  }

  return axiosError.message || fallback
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }
    }

    return Promise.reject(error)
  },
)

export default api
