import api from './api'
import type { CreateOrderResponse } from '@/types/index'

export const paymentService = {
  async createOrder(reservationId: number): Promise<CreateOrderResponse> {
    const { data } = await api.post('/payments/create-order/', {
      reservation_id: reservationId
    })
    return data
  },

  async verifyPayment(payload: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }): Promise<{ status: string }> {
    const { data } = await api.post('/payments/verify/', payload)
    return data
  }
}
