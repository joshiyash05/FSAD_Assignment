import api from './api'
import type { Amenity } from '@/types'

export const amenityService = {
  async getAll(): Promise<Amenity[]> {
    const { data } = await api.get('/amenities/')
    return data
  }
}
