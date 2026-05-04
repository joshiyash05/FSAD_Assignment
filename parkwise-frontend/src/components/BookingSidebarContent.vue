<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { reservationService } from '@/services/reservationService'
import { vehicleService } from '@/services/vehicleService'
import { useBookingStore } from '@/stores/booking'
import type { Spot, Vehicle } from '@/types/index'

const props = defineProps<{ spot: Spot }>()
const emit = defineEmits<{ booked: [reservationId: number]; close: [] }>()

const toast = useToast()
const bookingStore = useBookingStore()
const vehicles = ref<Vehicle[]>([])
const selectedVehicleId = ref<number | null>(bookingStore.selectedVehicle?.id ?? null)
const isLoadingVehicles = ref(true)
const isBooking = ref(false)
const errorMessage = ref('')

const selectedVehicle = computed(() => vehicles.value.find((vehicle) => vehicle.id === selectedVehicleId.value) ?? null)

async function loadVehicles() {
  isLoadingVehicles.value = true
  try {
    vehicles.value = await vehicleService.getAll()
    const defaultVehicle = vehicles.value.find((vehicle) => vehicle.is_default)
    selectedVehicleId.value = selectedVehicleId.value ?? defaultVehicle?.id ?? vehicles.value[0]?.id ?? null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Vehicles unavailable',
      detail: error instanceof Error ? error.message : 'Failed to load vehicles.',
      life: 4000,
    })
  } finally {
    isLoadingVehicles.value = false
  }
}

async function handleBook() {
  if (!selectedVehicleId.value) {
    errorMessage.value = 'Add or select a vehicle before booking.'
    return
  }

  isBooking.value = true
  errorMessage.value = ''
  bookingStore.selectVehicle(selectedVehicle.value)

  try {
    const startDateTime = new Date(`${bookingStore.selectedDate}T${bookingStore.startTime}`)
    const endDateTime = new Date(`${bookingStore.selectedDate}T${bookingStore.endTime}`)
    const reservation = await reservationService.create({
      spot_id: props.spot.id,
      vehicle_id: selectedVehicleId.value,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
    })
    if (!reservation.id) {
      throw new Error('Reservation was created, but the API did not return a reservation id.')
    }
    emit('booked', reservation.id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Booking failed.'
    toast.add({ severity: 'error', summary: 'Booking failed', detail: errorMessage.value, life: 5000 })
  } finally {
    isBooking.value = false
  }
}

onMounted(loadVehicles)
</script>

<template>
  <div class="booking-panel">
    <div class="summary-head">
      <div>
        <span class="muted-label">Selected spot</span>
        <h2>{{ spot.label }}</h2>
        <p>{{ spot.zone }} · {{ spot.spot_type }}</p>
      </div>
      <Tag value="Available" severity="success" />
    </div>

    <Divider />

    <div class="summary-list">
      <span>Date</span>
      <strong>{{ bookingStore.selectedDate }}</strong>
      <span>Time</span>
      <strong>{{ bookingStore.startTime.slice(0, 5) }} - {{ bookingStore.endTime.slice(0, 5) }}</strong>
      <span>Duration</span>
      <strong>{{ bookingStore.durationHours }} hr</strong>
    </div>

    <div class="price-box">
      <div><span>Base rate</span><strong>₹{{ bookingStore.baseRate }}</strong></div>
      <div><span>GST</span><strong>₹{{ bookingStore.gst }}</strong></div>
      <Divider />
      <div class="total-row"><span>Total</span><strong>₹{{ bookingStore.totalAmount }}</strong></div>
    </div>

    <Skeleton v-if="isLoadingVehicles" height="3rem" />
    <div v-else class="form-stack compact">
      <Dropdown
        v-model="selectedVehicleId"
        :options="vehicles"
        option-label="plate_number"
        option-value="id"
        placeholder="Select vehicle"
        class="w-full"
        :disabled="isBooking"
      >
        <template #value="{ value, placeholder }">
          <span v-if="value">{{ vehicles.find((vehicle) => vehicle.id === value)?.plate_number }}</span>
          <span v-else>{{ placeholder }}</span>
        </template>
        <template #option="{ option }">
          <div class="vehicle-option">
            <strong>{{ option.plate_number }}</strong>
            <span>{{ option.model_name }}</span>
          </div>
        </template>
      </Dropdown>
      <Message v-if="vehicles.length === 0" severity="info" :closable="false">
        Add a vehicle from Profile before reserving a spot.
      </Message>
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
    </div>

    <div class="sidebar-actions">
      <Button label="Cancel" severity="secondary" outlined :disabled="isBooking" @click="emit('close')" />
      <Button
        label="Reserve"
        icon="pi pi-check"
        :loading="isBooking"
        :disabled="isLoadingVehicles || vehicles.length === 0"
        @click="handleBook"
      />
    </div>
  </div>
</template>
