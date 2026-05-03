<template>
  <aside class="booking-sidebar">
    <h3>Spot {{ spot.label }}</h3>
    <p>{{ date }} • {{ startTime }} → {{ endTime }}</p>

    <div>
      <label>Vehicle</label>
      <select v-model="vehicleId">
        <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.plate_number }} — {{ v.model_name }}</option>
      </select>
    </div>

    <div style="margin-top:12px">
      <button class="pay" @click="createReservation" :disabled="booking">Reserve & Pay</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { vehicleService } from '@/services/vehicleService'
import { reservationService } from '@/services/reservationService'
import { useRouter } from 'vue-router'

import type { Spot } from '@/types'

const props = defineProps<{ spot: Spot; date: string; 'start-time': string; 'end-time': string }>()
const emit = defineEmits<[ (e: 'booked', res: any) => void ]>()

const vehicles = ref<any[]>([])
const vehicleId = ref<number | null>(null)
const booking = ref(false)
const router = useRouter()

const date = props.date || ''
const startTime = props['start-time'] || ''
const endTime = props['end-time'] || ''

onMounted(async () => {
  try {
    vehicles.value = await vehicleService.getAll()
    if (vehicles.value.length) vehicleId.value = vehicles.value.find((v: any) => v.is_default)?.id || vehicles.value[0].id
  } catch (err) {
    console.error(err)
  }
})

function parseTimeToHourMinute(t: string) {
  // t like '9:00 AM' or '12:00 PM'
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return '09:00:00'
  let h = parseInt(m[1], 10)
  const min = m[2]
  const ampm = m[3].toUpperCase()
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2,'0')}:${min}:00`
}

async function createReservation() {
  if (!vehicleId.value) return alert('Select a vehicle')
  booking.value = true
  try {
    const startIso = `${date}T${parseTimeToHourMinute(startTime)}`
    const endIso = `${date}T${parseTimeToHourMinute(endTime)}`
    const payload = { spot_id: props.spot.id, vehicle_id: vehicleId.value, start_time: startIso, end_time: endIso }
    const res = await reservationService.create(payload)
    emit('booked', res)
    // navigate to payment page if route exists
    try { router.push({ name: 'payment', params: { reservationId: res.id } }) } catch(e){}
  } catch (err) {
    console.error(err)
    alert('Failed to create reservation')
  } finally { booking.value = false }
}
</script>

<style scoped>
.booking-sidebar{width:320px;padding:12px;border-radius:8px;border:1px solid #e6e9ee;background:white}
.pay{background:#378ADD;color:white;padding:10px;border-radius:6px;border:0}
</style>
