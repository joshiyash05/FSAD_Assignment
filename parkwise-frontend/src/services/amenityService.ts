import api, { getApiErrorMessage } from './api'
import type { Amenity } from '@/types/index'

export const amenityService = {
  async getAll(): Promise<Amenity[]> {
    try {
      const response = await api.get<Amenity[]>('amenities/')
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load nearby amenities'))
    }
  },
}
