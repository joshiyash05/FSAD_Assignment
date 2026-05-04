import api, { getApiErrorMessage } from './api'
import type { AvailabilityResponse, Spot } from '@/types/index'

export const spotService = {
  async getAll(): Promise<Spot[]> {
    try {
      const response = await api.get<Spot[]>('spots/')
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load parking spots'))
    }
  },

  async getAvailability(date: string, startTime: string, endTime: string): Promise<AvailabilityResponse> {
    try {
      const response = await api.get<AvailabilityResponse>('spots/availability/', {
        params: { date, start_time: startTime, end_time: endTime },
      })
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to search availability'))
    }
  },
}
