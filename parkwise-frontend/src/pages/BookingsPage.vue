<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import QRCodeDisplay from '@/components/QRCodeDisplay.vue'
import { reservationService } from '@/services/reservationService'
import type { Reservation } from '@/types/index'

const toast = useToast()
const reservations = ref<Reservation[]>([])
const isLoading = ref(true)
const qrDialogVisible = ref(false)
const selectedQrBooking = ref<Reservation | null>(null)

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function statusSeverity(status: Reservation['status']) {
  if (status === 'cancelled') return 'danger'
  if (status === 'completed') return 'success'
  return 'info'
}

function effectiveStatus(reservation: Reservation): Reservation['status'] {
  if (reservation.status === 'active' && new Date(reservation.end_time).getTime() <= Date.now()) {
    return 'completed'
  }
  return reservation.status
}

function qrPayload(reservation: Reservation) {
  return JSON.stringify({
    ref: `PKW-${reservation.id}`,
    spot: reservation.spot.label,
    zone: reservation.spot.zone,
    vehicle: reservation.vehicle?.plate_number ?? null,
    start: reservation.start_time,
    end: reservation.end_time,
    status: effectiveStatus(reservation),
  })
}

function showQrCode(reservation: Reservation) {
  selectedQrBooking.value = reservation
  qrDialogVisible.value = true
}

async function loadBookings() {
  isLoading.value = true
  try {
    reservations.value = await reservationService.getAll()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Bookings unavailable',
      detail: error instanceof Error ? error.message : 'Failed to load bookings.',
      life: 5000,
    })
  } finally {
    isLoading.value = false
  }
}

async function cancelBooking(reservation: Reservation) {
  try {
    const updated = await reservationService.cancel(reservation.id)
    reservations.value = reservations.value.map((item) => (item.id === updated.id ? updated : item))
    toast.add({ severity: 'success', summary: 'Booking cancelled', detail: `PKW-${updated.id} was cancelled.`, life: 3000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Cancellation failed',
      detail: error instanceof Error ? error.message : 'Could not cancel booking.',
      life: 5000,
    })
  }
}

onMounted(loadBookings)
</script>

<template>
  <section class="page-stack">
    <div class="page-title">
      <div>
        <h1>Bookings</h1>
        <p>Reservation history with live status.</p>
      </div>
      <Button icon="pi pi-refresh" label="Refresh" outlined :loading="isLoading" @click="loadBookings" />
    </div>

    <Card>
      <template #content>
        <div v-if="isLoading" class="page-stack">
          <Skeleton v-for="index in 4" :key="index" height="3.5rem" />
        </div>
        <Message v-else-if="reservations.length === 0" severity="info" :closable="false">
          You do not have any bookings yet.
        </Message>
        <DataTable
          v-else
          :value="reservations"
          paginator
          :rows="8"
          :rows-per-page-options="[8, 15, 30]"
          sort-field="created_at"
          :sort-order="-1"
          responsive-layout="scroll"
        >
          <Column field="id" header="Reference" sortable>
            <template #body="{ data }">PKW-{{ data.id }}</template>
          </Column>
          <Column field="spot.label" header="Spot" sortable>
            <template #body="{ data }">{{ data.spot.label }} · Zone {{ data.spot.zone }}</template>
          </Column>
          <Column field="vehicle.plate_number" header="Vehicle">
            <template #body="{ data }">{{ data.vehicle?.plate_number ?? '-' }}</template>
          </Column>
          <Column field="start_time" header="Start" sortable>
            <template #body="{ data }">{{ formatDate(data.start_time) }}</template>
          </Column>
          <Column field="amount" header="Amount" sortable>
            <template #body="{ data }">₹{{ data.amount }}</template>
          </Column>
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag :value="effectiveStatus(data)" :severity="statusSeverity(effectiveStatus(data))" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <div class="table-actions">
                <Button
                  label="QR"
                  icon="pi pi-qrcode"
                  text
                  size="small"
                  @click="showQrCode(data)"
                />
              <Button
                v-if="effectiveStatus(data) === 'active'"
                label="Cancel"
                severity="danger"
                text
                size="small"
                @click="cancelBooking(data)"
              />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="qrDialogVisible" modal header="Booking QR Code" class="qr-dialog">
      <div v-if="selectedQrBooking" class="qr-dialog-content">
        <QRCodeDisplay :value="qrPayload(selectedQrBooking)" :size="220" />
        <div class="center-title compact">
          <h2>PKW-{{ selectedQrBooking.id }}</h2>
          <p>{{ selectedQrBooking.spot.label }} · Zone {{ selectedQrBooking.spot.zone }}</p>
        </div>
        <Divider />
        <div class="summary-list wide">
          <span>Vehicle</span>
          <strong>{{ selectedQrBooking.vehicle?.plate_number ?? '-' }}</strong>
          <span>Start</span>
          <strong>{{ formatDate(selectedQrBooking.start_time) }}</strong>
          <span>End</span>
          <strong>{{ formatDate(selectedQrBooking.end_time) }}</strong>
          <span>Status</span>
          <Tag :value="effectiveStatus(selectedQrBooking)" :severity="statusSeverity(effectiveStatus(selectedQrBooking))" />
        </div>
      </div>
      <template #footer>
        <Button label="Close" icon="pi pi-times" @click="qrDialogVisible = false" />
      </template>
    </Dialog>
  </section>
</template>
