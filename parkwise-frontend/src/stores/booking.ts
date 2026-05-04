import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Spot, Vehicle } from '@/types/index'

export const useBookingStore = defineStore('booking', () => {
  const selectedDate = ref<string>('')
  const startTime = ref<string>('09:00')
  const endTime = ref<string>('17:00')
  const selectedSpot = ref<Spot | null>(null)
  const selectedVehicle = ref<Vehicle | null>(null)

  const durationHours = computed(() => {
    const [sh, sm] = startTime.value.split(':').map(Number)
    const [eh, em] = endTime.value.split(':').map(Number)
    return Math.max(1, (eh + em / 60) - (sh + sm / 60))
  })

  const baseRate = computed(() => Math.round(durationHours.value * 20))
  const gst = computed(() => Math.round(baseRate.value * 0.18 * 100) / 100)
  const totalAmount = computed(() => Math.round((baseRate.value + gst.value) * 100) / 100)

  function reset() {
    selectedSpot.value = null
    selectedVehicle.value = null
  }

  return {
    selectedDate, startTime, endTime,
    selectedSpot, selectedVehicle,
    durationHours, baseRate, gst, totalAmount,
    reset
  }
})
