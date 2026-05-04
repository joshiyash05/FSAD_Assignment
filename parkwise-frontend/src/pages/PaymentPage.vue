<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { paymentService } from '@/services/paymentService'
import { reservationService } from '@/services/reservationService'
import type { RazorpayPaymentResponse, RazorpayWindowOptions, Reservation } from '@/types/index'

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayWindowOptions) => { open: () => void }
  }
}

const props = defineProps<{ reservationId: string | string[] }>()
const router = useRouter()
const toast = useToast()
const reservation = ref<Reservation | null>(null)
const isLoading = ref(true)
const isProcessing = ref(false)
const errorMessage = ref('')

// Toggle this while developing:
// true = open Razorpay Checkout
// false = simulate payment and continue to confirmation
const useRazorpayPayment = false

const reservationIdNumber = computed(() => Number(Array.isArray(props.reservationId) ? props.reservationId[0] : props.reservationId))
const baseAmount = computed(() => (reservation.value ? Math.round((reservation.value.amount / 1.18) * 100) / 100 : 0))
const gstAmount = computed(() => (reservation.value ? Math.round((reservation.value.amount - baseAmount.value) * 100) / 100 : 0))

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Razorpay checkout. Check your network connection.'))
    document.head.appendChild(script)
  })
}

async function loadReservation() {
  if (!Number.isFinite(reservationIdNumber.value)) {
    errorMessage.value = 'Invalid reservation id in payment URL.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    reservation.value = await reservationService.getById(reservationIdNumber.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load reservation.'
  } finally {
    isLoading.value = false
  }
}

async function verifyPayment(response: RazorpayPaymentResponse) {
  try {
    await paymentService.verifyPayment(response)
    toast.add({ severity: 'success', summary: 'Payment verified', detail: 'Your booking is confirmed.', life: 3000 })
    router.push(`/confirmation/${reservationIdNumber.value}`)
  } catch (error) {
    isProcessing.value = false
    toast.add({
      severity: 'error',
      summary: 'Verification failed',
      detail: error instanceof Error ? error.message : 'Payment verification failed.',
      life: 5000,
    })
  }
}

async function handlePayment() {
  if (!reservation.value) return

  isProcessing.value = true

  if (!useRazorpayPayment) {
    window.setTimeout(() => {
      toast.add({
        severity: 'success',
        summary: 'Dummy payment successful',
        detail: 'Payment was simulated for development.',
        life: 3000,
      })
      router.push(`/confirmation/${reservationIdNumber.value}`)
    }, 700)
    return
  }

  try {
    await loadRazorpayScript()
    const order = await paymentService.createOrder(reservationIdNumber.value)
    if (!window.Razorpay) throw new Error('Razorpay checkout is unavailable.')

    const checkout = new window.Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: 'ParkWise',
      description: `Parking reservation ${reservation.value.spot.label}`,
      prefill: {
        name: reservation.value.user?.first_name || reservation.value.user?.username,
        email: reservation.value.user?.email,
      },
      handler: (response) => {
        verifyPayment(response)
      },
      modal: {
        ondismiss: () => {
          isProcessing.value = false
          toast.add({ severity: 'info', summary: 'Payment cancelled', detail: 'No amount was charged.', life: 3000 })
        },
      },
    })
    checkout.open()
  } catch (error) {
    isProcessing.value = false
    toast.add({
      severity: 'error',
      summary: 'Payment failed',
      detail: error instanceof Error ? error.message : 'Could not start payment.',
      life: 5000,
    })
  }
}

onMounted(loadReservation)
</script>

<template>
  <section class="page-stack narrow-page">
    <Button icon="pi pi-arrow-left" label="Back" text class="self-start" @click="router.push('/')" />
    <div class="page-title">
      <div>
        <h1>Payment</h1>
        <p>Complete your secure Razorpay checkout.</p>
      </div>
    </div>

    <div v-if="isLoading" class="page-stack">
      <Skeleton height="14rem" />
      <Skeleton height="7rem" />
    </div>

    <Message v-else-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

    <template v-else-if="reservation">
      <Card>
        <template #title>
          <div class="zone-title">
            <span>Order Summary</span>
            <Tag :value="reservation.status" severity="info" />
          </div>
        </template>
        <template #content>
          <div class="summary-list wide">
            <span>Spot</span><strong>{{ reservation.spot.label }} · Zone {{ reservation.spot.zone }}</strong>
            <span>Vehicle</span><strong>{{ reservation.vehicle?.plate_number ?? 'No vehicle' }}</strong>
            <span>Starts</span><strong>{{ formatDateTime(reservation.start_time) }}</strong>
            <span>Ends</span><strong>{{ formatDateTime(reservation.end_time) }}</strong>
            <span>Duration</span><strong>{{ reservation.duration_hours }} hr</strong>
          </div>
          <Divider />
          <div class="price-box plain">
            <div><span>Base amount</span><strong>₹{{ baseAmount }}</strong></div>
            <div><span>GST</span><strong>₹{{ gstAmount }}</strong></div>
            <Divider />
            <div class="total-row"><span>Total payable</span><strong>₹{{ reservation.amount }}</strong></div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="payment-method">
            <i :class="useRazorpayPayment ? 'pi pi-credit-card' : 'pi pi-check-circle'" />
            <div>
              <strong>{{ useRazorpayPayment ? 'Razorpay' : 'Dummy payment' }}</strong>
              <p>{{ useRazorpayPayment ? 'Cards, UPI, net banking, and wallets.' : 'Development checkout with no external payment popup.' }}</p>
            </div>
          </div>
          <Button
            :label="useRazorpayPayment ? 'Pay now' : 'Complete dummy payment'"
            icon="pi pi-wallet"
            class="w-full mt-4"
            :loading="isProcessing"
            :disabled="isProcessing"
            @click="handlePayment"
          />
        </template>
      </Card>
    </template>
  </section>
</template>
