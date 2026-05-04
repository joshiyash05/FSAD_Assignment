<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { adminService } from '@/services/adminService'
import type { AdminStats, Reservation } from '@/types/index'

const toast = useToast()
const stats = ref<AdminStats | null>(null)
const reservations = ref<Reservation[]>([])
const isLoading = ref(true)

const totalRevenue = computed(() => {
  return reservations.value.reduce((sum, reservation) => sum + Number(reservation.amount || 0), 0)
})

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function statusSeverity(status: Reservation['status']) {
  if (status === 'cancelled') return 'danger'
  if (status === 'completed') return 'success'
  return 'info'
}

async function loadAdminData() {
  isLoading.value = true
  try {
    const [statsResponse, reservationResponse] = await Promise.all([
      adminService.getStats(),
      adminService.getReservations(),
    ])
    stats.value = statsResponse
    reservations.value = reservationResponse
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Admin data unavailable',
      detail: error instanceof Error ? error.message : 'Failed to load admin dashboard.',
      life: 5000,
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(loadAdminData)
</script>

<template>
  <section class="page-stack">
    <div class="page-title">
      <div>
        <h1>Admin</h1>
        <p>Monitor occupancy, bookings, users, and revenue.</p>
      </div>
      <Button icon="pi pi-refresh" label="Refresh" outlined :loading="isLoading" @click="loadAdminData" />
    </div>

    <div class="stat-grid">
      <Card>
        <template #content>
          <span class="muted-label">Users</span>
          <strong class="stat">{{ stats?.total_users ?? 0 }}</strong>
        </template>
      </Card>
      <Card>
        <template #content>
          <span class="muted-label">Active bookings</span>
          <strong class="stat info">{{ stats?.active_bookings ?? 0 }}</strong>
        </template>
      </Card>
      <Card>
        <template #content>
          <span class="muted-label">Occupancy</span>
          <strong class="stat success">{{ stats?.occupancy_percent ?? 0 }}%</strong>
        </template>
      </Card>
      <Card>
        <template #content>
          <span class="muted-label">Revenue today</span>
          <strong class="stat">₹{{ stats?.revenue_today ?? 0 }}</strong>
        </template>
      </Card>
    </div>

    <Card>
      <template #title>
        <div class="zone-title">
          <span>Reservations</span>
          <Tag :value="`₹${totalRevenue.toFixed(2)} total listed`" severity="info" />
        </div>
      </template>
      <template #content>
        <div v-if="isLoading" class="page-stack">
          <Skeleton v-for="index in 5" :key="index" height="3.5rem" />
        </div>
        <Message v-else-if="reservations.length === 0" severity="info" :closable="false">
          No reservations found.
        </Message>
        <DataTable
          v-else
          :value="reservations"
          paginator
          :rows="10"
          :rows-per-page-options="[10, 25, 50]"
          sort-field="created_at"
          :sort-order="-1"
          responsive-layout="scroll"
        >
          <Column field="id" header="ID" sortable>
            <template #body="{ data }">PKW-{{ data.id }}</template>
          </Column>
          <Column field="user.username" header="User" sortable>
            <template #body="{ data }">
              <div class="table-person">
                <strong>{{ data.user?.username ?? '-' }}</strong>
                <span>{{ data.user?.email ?? '' }}</span>
              </div>
            </template>
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
          <Column field="end_time" header="End" sortable>
            <template #body="{ data }">{{ formatDate(data.end_time) }}</template>
          </Column>
          <Column field="amount" header="Amount" sortable>
            <template #body="{ data }">₹{{ data.amount }}</template>
          </Column>
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag :value="data.status" :severity="statusSeverity(data.status)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </section>
</template>
