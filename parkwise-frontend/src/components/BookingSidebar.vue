<template>
  <Card class="p-shadow-2 booking-sidebar">
    <div class="sb-header">
      <h4>Spot {{ spot.label }}</h4>
      <Button icon="pi pi-times" class="p-button-rounded p-button-text" @click="$emit('close')" />
    </div>

    <div class="sb-body">
      <div class="sb-left">
        <div class="sb-row"><span class="sb-label">Date</span><span class="sb-value">{{ dateDisplay }}</span></div>
        <div class="sb-row"><span class="sb-label">Time</span><span class="sb-value">{{ startDisplay }} – {{ endDisplay }}</span></div>
        <div class="sb-row"><span class="sb-label">Duration</span><span class="sb-value">{{ durationHours }}h</span></div>

        <label class="sb-label-inline">Vehicle</label>
        <div class="vehicle-select">
          <Dropdown :options="vehicles" optionLabel="plate_number" optionValue="id" v-model="vehicleId" placeholder="Select vehicle" />
        </div>
      </div>

      <div class="sb-right">
        <div class="price-row"><div>Rate</div><div class="price">{{ formatCurrency(baseRate) }}</div></div>
        <div class="price-row"><div>GST 18%</div><div class="price">{{ formatCurrency(gst) }}</div></div>
        <div class="price-total"><div>Total</div><div class="price">{{ formatCurrency(totalAmount) }}</div></div>
        <Button class="pay-btn" :loading="booking" @click="createReservation">Pay {{ formatCurrency(totalAmount) }}</Button>
        <div class="secure">Secured by Razorpay</div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { vehicleService } from '@/services/vehicleService'
import { reservationService } from '@/services/reservationService'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'

import type { Spot } from '@/types/index'

const props = defineProps<{ spot: Spot; date: string | null; startTime: string | null; endTime: string | null }>()
const emit = defineEmits<{ (e: 'booked', res: any): void; (e: 'close'): void }>()

const vehicles = ref<any[]>([])
const vehicleId = ref<number | null>(null)
const booking = ref(false)
const router = useRouter()
const toast = useToast()

const date = computed(() => props.date || '')
const startISO = computed(() => props.startTime || '')
const endISO = computed(() => props.endTime || '')

const startDisplay = computed(() => {
  try { return new Date(startISO.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
})
const endDisplay = computed(() => {
  try { return new Date(endISO.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
})

const dateDisplay = computed(() => {
  try { return new Date(date.value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) } catch { return date.value }
})

const durationHours = computed(() => {
  try {
    const s = new Date(startISO.value)
    const e = new Date(endISO.value)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 3600000))
  } catch { return 1 }
})

const baseRate = computed(() => Math.round(durationHours.value * 20))
const gst = computed(() => Math.round(baseRate.value * 0.18 * 100) / 100)
const totalAmount = computed(() => Math.round((baseRate.value + gst.value) * 100) / 100)

function formatCurrency(n: number | string){
  try{ const v = Number(n); return '₹' + v.toFixed(2) }catch{ return '₹0.00' }
}

onMounted(async () => {
  try {
    vehicles.value = await vehicleService.getAll()
    if (vehicles.value.length) vehicleId.value = vehicles.value.find((v: any) => v.is_default)?.id || vehicles.value[0].id
    console.log('BookingSidebar mounted, spot prop =', props.spot)
  } catch (err) {
    console.error(err)
  }
})

async function createReservation() {
  if (!vehicleId.value) {
    toast.add({ severity: 'warn', summary: 'Vehicle required', detail: 'Select a vehicle before booking.', life: 3000 })
    return
  }
  booking.value = true
  try {
  // backend expects ISO datetimes; props.startTime/endTime may already be ISO
  if (!startISO.value || !endISO.value) {
    toast.add({ severity: 'warn', summary: 'Time required', detail: 'Select a date and time before booking.', life: 3000 })
    return
  }
  const payload = { spot_id: props.spot.id, vehicle_id: vehicleId.value, start_time: startISO.value, end_time: endISO.value }
    const res = await reservationService.create(payload)
    emit('booked', res)
    try { router.push({ name: 'payment', params: { reservationId: res.id } }) } catch(e){}
  } catch (err) {
    console.error(err)
    toast.add({ severity: 'error', summary: 'Booking failed', detail: 'Failed to create reservation.', life: 4000 })
  } finally { booking.value = false }
}
</script>

<style scoped>
.booking-sidebar{width:320px;padding:14px;box-sizing:border-box}
.booking-body .vehicle-select{width:100%}
.booking-body .vehicle-select .p-dropdown{width:100%}
.booking-actions{align-items:center}
.reserve-btn{min-width:160px}

.booking-sidebar{background:#ffffff;border:2px solid rgba(11,105,255,0.12);box-shadow:0 6px 18px rgba(11,69,130,0.06);min-height:140px}
.booking-debug{background:linear-gradient(90deg, #fef3c7, #fff);color:#92400e;padding:6px 10px;border-radius:6px;margin-bottom:10px;font-size:13px;text-align:center}


@media (max-width:720px){
  .booking-sidebar{width:100%;padding:12px}
  .booking-actions{width:100%;display:block}
  .reserve-btn{width:100%}
}

/* new sidebar layout styles */
.sb-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:8px;margin-bottom:10px}
.sb-header h4{margin:0;font-size:16px}
.sb-body{display:flex;gap:12px}
.sb-left{flex:1}
.sb-right{width:200px;background:#fafafa;border-radius:8px;padding:10px;border:1px solid #eef2f6}
.sb-row{display:flex;justify-content:space-between;margin-bottom:8px}
.sb-label{color:var(--color-text-secondary);font-size:13px}
.sb-value{font-weight:600;color:var(--color-text-primary)}
.sb-label-inline{display:block;margin-top:8px;margin-bottom:6px;color:var(--color-text-secondary);font-size:13px}
.price-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #eef2f6}
.price-total{display:flex;justify-content:space-between;padding:10px 0;font-weight:700}
.price{font-weight:600}
.pay-btn{width:100%;margin-top:10px;background:var(--accent);color:white;border:none}
.secure{font-size:12px;color:#9ca3af;text-align:center;margin-top:8px}
</style>
