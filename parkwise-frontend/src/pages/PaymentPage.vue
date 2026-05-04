<template>
  <div class="payment-page">
    <h2>Payment</h2>
    <div v-if="!reservation">Loading...</div>
    <div v-else class="layout">
      <div class="summary">
        <h3>Order summary</h3>
        <p>Spot: {{ reservation.spot.label }} (Zone {{ reservation.spot.zone }})</p>
        <p>Date: {{ startDate }}</p>
        <p>Duration: {{ reservation.duration_hours }} hours</p>
        <p>Amount: ₹{{ reservation.amount }}</p>
      </div>

      <div class="checkout">
        <button @click="startPayment" :disabled="loading">Pay ₹{{ reservation.amount }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { paymentService } from '@/services/paymentService'
import { reservationService } from '@/services/reservationService'

const route = useRoute()
const router = useRouter()
const reservationId = Number(route.params.reservationId)

const reservation = ref<any | null>(null)
const loading = ref(false)

onMounted(async () => {
  if (!reservationId) return
  reservation.value = await reservationService.get(reservationId)
})

const startDate = computed(() => reservation.value ? new Date(reservation.value.start_time).toLocaleString() : '')

async function startPayment() {
  if (!reservationId) return
  loading.value = true
  try {
    const order = await paymentService.createOrder(reservationId)
    const options: any = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'ParkWise',
      description: `Reservation ${reservationId}`,
      order_id: order.order_id,
      handler: async function (response: any) {
        try {
          await paymentService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          router.push({ name: 'confirmation', params: { reservationId } })
        } catch (e) {
          console.error('Verification failed', e)
          alert('Payment verification failed')
        }
      }
    }
    // open Razorpay
    const rzp = (window as any).Razorpay(options)
    rzp.open()
  } catch (err) {
    console.error(err)
    alert('Failed to create order')
  } finally { loading.value = false }
}
</script>

<style scoped>
.layout{display:flex;gap:16px}
.summary{flex:1;padding:12px;border:1px solid #eef2f6;border-radius:8px}
.checkout{width:260px;display:flex;align-items:center;justify-content:center}
.checkout button{background:#1D9E75;color:white;padding:10px 16px;border-radius:8px;border:0}
</style>
