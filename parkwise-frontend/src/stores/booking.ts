import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Spot, Vehicle } from '@/types/index'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

export const useBookingStore = defineStore('booking', () => {
  const selectedDate = ref(localStorage.getItem('booking_date') ?? todayIso())
  const startTime = ref(localStorage.getItem('booking_start') ?? '09:00:00')
  const endTime = ref(localStorage.getItem('booking_end') ?? '11:00:00')
  const selectedSpot = ref<Spot | null>(null)
  const selectedVehicle = ref<Vehicle | null>(null)

  const durationHours = computed(() => {
    const [startHour, startMinute] = startTime.value.split(':').map(Number)
    const [endHour, endMinute] = endTime.value.split(':').map(Number)
    return Math.max(1, (endHour + endMinute / 60) - (startHour + startMinute / 60))
  })
  const baseRate = computed(() => Math.round(durationHours.value * 20 * 100) / 100)
  const gst = computed(() => Math.round(baseRate.value * 0.18 * 100) / 100)
  const totalAmount = computed(() => Math.round((baseRate.value + gst.value) * 100) / 100)

  function setFilters(date: string, start: string, end: string) {
    selectedDate.value = date
    startTime.value = start
    endTime.value = end
    localStorage.setItem('booking_date', date)
    localStorage.setItem('booking_start', start)
    localStorage.setItem('booking_end', end)
  }

  function selectSpot(spot: Spot | null) {
    selectedSpot.value = spot
  }

  function selectVehicle(vehicle: Vehicle | null) {
    selectedVehicle.value = vehicle
  }

  function resetSelection() {
    selectedSpot.value = null
    selectedVehicle.value = null
  }

  return {
    selectedDate,
    startTime,
    endTime,
    selectedSpot,
    selectedVehicle,
    durationHours,
    baseRate,
    gst,
    totalAmount,
    setFilters,
    selectSpot,
    selectVehicle,
    resetSelection,
  }
})
