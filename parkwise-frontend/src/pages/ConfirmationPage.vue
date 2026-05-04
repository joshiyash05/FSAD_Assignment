<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import QRCodeDisplay from '@/components/QRCodeDisplay.vue'
import { reservationService } from '@/services/reservationService'
import type { Reservation } from '@/types/index'

const props = defineProps<{ reservationId: string | string[] }>()
const router = useRouter()
const toast = useToast()
const reservation = ref<Reservation | null>(null)
const isLoading = ref(true)

const reservationIdNumber = computed(() => Number(Array.isArray(props.reservationId) ? props.reservationId[0] : props.reservationId))
const baseAmount = computed(() => (reservation.value ? Math.round((reservation.value.amount / 1.18) * 100) / 100 : 0))
const gstAmount = computed(() => (reservation.value ? Math.round((reservation.value.amount - baseAmount.value) * 100) / 100 : 0))

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

async function loadReservation() {
  if (!Number.isFinite(reservationIdNumber.value)) {
    toast.add({
      severity: 'error',
      summary: 'Invalid confirmation link',
      detail: 'Reservation id is missing from the URL.',
      life: 5000,
    })
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    reservation.value = await reservationService.getById(reservationIdNumber.value)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Confirmation unavailable',
      detail: error instanceof Error ? error.message : 'Failed to load confirmation.',
      life: 5000,
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(loadReservation)
</script>

<template>
  <section class="confirmation-page">
    <ProgressSpinner v-if="isLoading" />

    <Card v-else-if="reservation" class="confirmation-card">
      <template #header>
        <div class="confirmation-hero">
          <i class="pi pi-check-circle" />
        </div>
      </template>
      <template #title>
        <div class="center-title">
          <h1>Booking Confirmed</h1>
          <p>Reservation PKW-{{ reservation.id }}</p>
        </div>
      </template>
      <template #content>
        <div class="confirmation-grid">
          <div class="summary-list wide">
            <span>Spot</span><strong>{{ reservation.spot.label }} · Zone {{ reservation.spot.zone }}</strong>
            <span>Vehicle</span><strong>{{ reservation.vehicle?.plate_number ?? 'No vehicle' }}</strong>
            <span>Check in</span><strong>{{ formatDateTime(reservation.start_time) }}</strong>
            <span>Check out</span><strong>{{ formatDateTime(reservation.end_time) }}</strong>
            <span>Status</span><Tag :value="reservation.status" severity="success" />
          </div>
          <div class="qr-box">
            <QRCodeDisplay :value="`PKW-${reservation.id}`" :size="180" />
            <span>Scan at entry</span>
          </div>
        </div>
        <Divider />
        <div class="price-box plain">
          <div><span>Base amount</span><strong>₹{{ baseAmount }}</strong></div>
          <div><span>GST</span><strong>₹{{ gstAmount }}</strong></div>
          <Divider />
          <div class="total-row"><span>Total paid</span><strong>₹{{ reservation.amount }}</strong></div>
        </div>
        <div class="sidebar-actions">
          <Button label="View bookings" icon="pi pi-calendar-check" severity="secondary" outlined @click="router.push('/bookings')" />
          <Button label="Dashboard" icon="pi pi-home" @click="router.push('/')" />
        </div>
      </template>
    </Card>

    <Message v-else severity="error" :closable="false">Failed to load confirmation details.</Message>
  </section>
</template>
