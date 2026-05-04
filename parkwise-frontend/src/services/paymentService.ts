import api, { getApiErrorMessage } from './api'
import type { CreateOrderResponse, VerifyPaymentRequest } from '@/types/index'

export const paymentService = {
  async createOrder(reservationId: number): Promise<CreateOrderResponse> {
    try {
      const response = await api.post<CreateOrderResponse>('payments/create-order/', {
        reservation_id: reservationId,
      })
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create payment order'))
    }
  },

  async verifyPayment(payload: VerifyPaymentRequest): Promise<{ status: string }> {
    try {
      const response = await api.post<{ status: string }>('payments/verify/', payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Payment verification failed'))
    }
  },
}
