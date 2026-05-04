import api, { getApiErrorMessage } from './api'
import type { CreateReservationRequest, Reservation, ReservationStats } from '@/types/index'

export const reservationService = {
  async getAll(): Promise<Reservation[]> {
    try {
      const response = await api.get<Reservation[]>('reservations/')
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load bookings'))
    }
  },

  async getById(id: number): Promise<Reservation> {
    try {
      const response = await api.get<Reservation>(`reservations/${id}/`)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Reservation not found'))
    }
  },

  async create(payload: CreateReservationRequest): Promise<Reservation> {
    try {
      const response = await api.post<Reservation>('reservations/', payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to create reservation'))
    }
  },

  async cancel(id: number): Promise<Reservation> {
    try {
      const response = await api.patch<Reservation>(`reservations/${id}/cancel/`)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to cancel booking'))
    }
  },

  async getStats(): Promise<ReservationStats> {
    try {
      const response = await api.get<ReservationStats>('reservations/stats/')
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load booking stats'))
    }
  },
}
