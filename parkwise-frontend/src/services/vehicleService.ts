import api from './api'
import type { Vehicle } from '@/types'

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const { data } = await api.get('/vehicles/')
    return data
  },

  async add(payload: Omit<Vehicle, 'id' | 'is_default'>): Promise<Vehicle> {
    const { data } = await api.post('/vehicles/', payload)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/vehicles/${id}/`)
  },

  async setDefault(id: number): Promise<Vehicle> {
    const { data } = await api.post(`/vehicles/${id}/set-default/`)
    return data
  }
}
