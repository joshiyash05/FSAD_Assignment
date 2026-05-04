<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { reservationService } from '@/services/reservationService'
import { vehicleService } from '@/services/vehicleService'
import { useAuthStore } from '@/stores/auth'
import type { CreateVehicleRequest, ReservationStats, Vehicle } from '@/types/index'

const toast = useToast()
const authStore = useAuthStore()
const vehicles = ref<Vehicle[]>([])
const stats = ref<ReservationStats | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const dialogVisible = ref(false)
const form = reactive<CreateVehicleRequest>({
  plate_number: '',
  model_name: '',
  color: '',
  vehicle_type: 'car',
  fuel_type: 'petrol',
})

const userName = computed(() => {
  const user = authStore.user
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ')
  return fullName || user?.username || 'ParkWise user'
})
const vehicleTypeOptions = [
  { label: 'Car', value: 'car' },
  { label: 'SUV', value: 'suv' },
  { label: 'Two-wheeler', value: 'two_wheeler' },
]
const fuelTypeOptions = [
  { label: 'Petrol', value: 'petrol' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'EV', value: 'ev' },
]

function resetForm() {
  form.plate_number = ''
  form.model_name = ''
  form.color = ''
  form.vehicle_type = 'car'
  form.fuel_type = 'petrol'
}

async function loadProfile() {
  isLoading.value = true
  try {
    const [vehicleResponse, statsResponse] = await Promise.all([vehicleService.getAll(), reservationService.getStats()])
    vehicles.value = vehicleResponse
    stats.value = statsResponse
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Profile unavailable',
      detail: error instanceof Error ? error.message : 'Failed to load profile.',
      life: 5000,
    })
  } finally {
    isLoading.value = false
  }
}

async function addVehicle() {
  if (!form.plate_number || !form.model_name) {
    toast.add({ severity: 'warn', summary: 'Missing vehicle info', detail: 'Plate number and model are required.', life: 3000 })
    return
  }

  isSaving.value = true
  try {
    const vehicle = await vehicleService.add({ ...form, plate_number: form.plate_number.toUpperCase() })
    vehicles.value = [vehicle, ...vehicles.value]
    dialogVisible.value = false
    resetForm()
    toast.add({ severity: 'success', summary: 'Vehicle added', detail: 'Vehicle saved to your profile.', life: 3000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Vehicle not saved',
      detail: error instanceof Error ? error.message : 'Failed to add vehicle.',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

async function setDefault(vehicle: Vehicle) {
  try {
    const updated = await vehicleService.setDefault(vehicle.id)
    vehicles.value = vehicles.value.map((item) => ({ ...item, is_default: item.id === updated.id }))
    toast.add({ severity: 'success', summary: 'Default updated', detail: `${updated.plate_number} is now default.`, life: 2500 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Update failed',
      detail: error instanceof Error ? error.message : 'Could not update default vehicle.',
      life: 4500,
    })
  }
}

onMounted(loadProfile)
</script>

<template>
  <section class="page-stack">
    <div class="page-title">
      <div>
        <h1>Profile</h1>
        <p>{{ userName }} · {{ authStore.user?.email }}</p>
      </div>
      <Button label="Add vehicle" icon="pi pi-plus" @click="dialogVisible = true" />
    </div>

    <div class="stat-grid">
      <Card><template #content><span class="muted-label">Bookings</span><strong class="stat">{{ stats?.total_bookings ?? 0 }}</strong></template></Card>
      <Card><template #content><span class="muted-label">Hours parked</span><strong class="stat info">{{ stats?.total_hours ?? 0 }}</strong></template></Card>
      <Card><template #content><span class="muted-label">Cancellations</span><strong class="stat danger">{{ stats?.cancellations ?? 0 }}</strong></template></Card>
      <Card><template #content><span class="muted-label">Favorite spot</span><strong class="stat success">{{ stats?.favourite_spot ?? '-' }}</strong></template></Card>
    </div>

    <Card>
      <template #title>My Vehicles</template>
      <template #content>
        <div v-if="isLoading" class="vehicle-list">
          <Skeleton v-for="index in 3" :key="index" height="5rem" />
        </div>
        <Message v-else-if="vehicles.length === 0" severity="info" :closable="false">
          No vehicles added yet. Add one before creating a reservation.
        </Message>
        <div v-else class="vehicle-list">
          <div v-for="vehicle in vehicles" :key="vehicle.id" class="vehicle-row">
            <div>
              <strong>{{ vehicle.plate_number }}</strong>
              <p>{{ vehicle.model_name }} · {{ vehicle.color || 'No color' }}</p>
              <span>{{ vehicle.vehicle_type }} · {{ vehicle.fuel_type }}</span>
            </div>
            <div class="row-actions">
              <Tag v-if="vehicle.is_default" value="Default" severity="success" />
              <Button v-else label="Set default" size="small" text @click="setDefault(vehicle)" />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="dialogVisible" modal header="Add Vehicle" class="vehicle-dialog">
      <div class="form-stack">
        <span class="p-float-label">
          <InputText id="plate" v-model="form.plate_number" class="w-full" :disabled="isSaving" />
          <label for="plate">Plate number</label>
        </span>
        <span class="p-float-label">
          <InputText id="model" v-model="form.model_name" class="w-full" :disabled="isSaving" />
          <label for="model">Model</label>
        </span>
        <span class="p-float-label">
          <InputText id="color" v-model="form.color" class="w-full" :disabled="isSaving" />
          <label for="color">Color</label>
        </span>
        <Dropdown v-model="form.vehicle_type" :options="vehicleTypeOptions" option-label="label" option-value="value" placeholder="Vehicle type" class="w-full" :disabled="isSaving" />
        <Dropdown v-model="form.fuel_type" :options="fuelTypeOptions" option-label="label" option-value="value" placeholder="Fuel type" class="w-full" :disabled="isSaving" />
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" outlined :disabled="isSaving" @click="dialogVisible = false" />
        <Button label="Save" icon="pi pi-check" :loading="isSaving" @click="addVehicle" />
      </template>
    </Dialog>
  </section>
</template>
