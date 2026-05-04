import api from './api'
import type { AvailabilityResponse } from '@/types/index'

export const spotService = {
  async getAll(): Promise<any> {
    const { data } = await api.get('/spots/')
    return data
  },
  async getAvailability(
    date: string,
    startTime: string,
    endTime: string
  ): Promise<AvailabilityResponse> {
    const { data } = await api.get('/spots/availability/', {
      params: { date, start_time: startTime, end_time: endTime }
    })
    return data
  }
}
