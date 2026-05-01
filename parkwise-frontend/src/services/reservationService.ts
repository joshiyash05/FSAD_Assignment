import api from './api'
import type { Reservation, UserStats } from '@/types'

export const reservationService = {
  async getAll(): Promise<Reservation[]> {
    const { data } = await api.get('/reservations/')
    return data
  },

  async get(id: number): Promise<Reservation> {
    const { data } = await api.get(`/reservations/${id}/`)
    return data
  },

  async create(payload: {
    spot_id: number
    vehicle_id: number
    start_time: string
    end_time: string
  }): Promise<Reservation> {
    const { data } = await api.post('/reservations/', payload)
    return data
  },

  async cancel(id: number): Promise<Reservation> {
    const { data } = await api.patch(`/reservations/${id}/cancel/`)
    return data
  },

  async getStats(): Promise<UserStats> {
    const { data } = await api.get('/reservations/stats/')
    return data
  }
}
