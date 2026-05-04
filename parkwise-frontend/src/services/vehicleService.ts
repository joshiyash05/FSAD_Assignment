import api, { getApiErrorMessage } from './api'
import type { CreateVehicleRequest, Vehicle } from '@/types/index'

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    try {
      const response = await api.get<Vehicle[]>('vehicles/')
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load vehicles'))
    }
  },

  async add(payload: CreateVehicleRequest): Promise<Vehicle> {
    try {
      const response = await api.post<Vehicle>('vehicles/', payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to add vehicle'))
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`vehicles/${id}/`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete vehicle'))
    }
  },

  async setDefault(id: number): Promise<Vehicle> {
    try {
      const response = await api.post<Vehicle>(`vehicles/${id}/set_default/`)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update default vehicle'))
    }
  },
}
