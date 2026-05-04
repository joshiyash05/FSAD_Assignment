import api, { getApiErrorMessage } from './api'
import type { AdminStats, Reservation, Spot } from '@/types/index'

export const adminService = {
  async getReservations(): Promise<Reservation[]> {
    try {
      const response = await api.get<Reservation[]>('admin/reservations/')
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load admin reservations'))
    }
  },

  async getStats(): Promise<AdminStats> {
    try {
      const response = await api.get<AdminStats>('admin/stats/')
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load admin stats'))
    }
  },

  async updateSpot(id: number, payload: Partial<Spot>): Promise<Spot> {
    try {
      const response = await api.patch<Spot>(`admin/spots/${id}/`, payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update parking spot'))
    }
  },
}
