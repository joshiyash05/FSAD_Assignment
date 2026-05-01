import api from './api'

export const adminService = {
  async getReservations(): Promise<any[]> {
    const { data } = await api.get('/admin/reservations/')
    return data
  },

  async getStats(): Promise<any> {
    const { data } = await api.get('/admin/stats/')
    return data
  },

  async updateSpot(id: number, payload: any): Promise<any> {
    const { data } = await api.patch(`/admin/spots/${id}/`, payload)
    return data
  }
}
