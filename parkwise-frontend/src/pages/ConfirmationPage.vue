<template>
  <div class="confirmation-page">
    <h2>Booking confirmed!</h2>
    <div v-if="!reservation">Loading...</div>
    <div v-else>
      <p>Order #PKW-{{ reservation.id }}</p>
      <p>Spot: {{ reservation.spot.label }}</p>
      <p>Vehicle: {{ reservation.vehicle?.plate_number || '—' }}</p>
      <p>Time: {{ new Date(reservation.start_time).toLocaleString() }} → {{ new Date(reservation.end_time).toLocaleString() }}</p>
      <p>Amount paid: ₹{{ reservation.payment?.amount || reservation.amount }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { reservationService } from '@/services/reservationService'

const route = useRoute()
const id = Number(route.params.reservationId)
const reservation = ref<any | null>(null)

onMounted(async () => {
  if (!id) return
  reservation.value = await reservationService.get(id)
})
</script>

<style scoped>
.confirmation-page{padding:16px}
</style>
