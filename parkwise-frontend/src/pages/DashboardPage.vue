<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import Sidebar from 'primevue/sidebar'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import BookingSidebarContent from '@/components/BookingSidebarContent.vue'
import { amenityService } from '@/services/amenityService'
import { spotService } from '@/services/spotService'
import { useBookingStore } from '@/stores/booking'
import type { Amenity, Spot } from '@/types/index'

const router = useRouter()
const toast = useToast()
const bookingStore = useBookingStore()

const date = ref(new Date(`${bookingStore.selectedDate}T00:00:00`))
const startTime = ref(bookingStore.startTime)
const endTime = ref(bookingStore.endTime)
const spots = ref<Spot[]>([])
const summary = ref({ total: 0, available: 0, occupied: 0, opening_soon: 0 })
const isSearching = ref(false)
const hasSearched = ref(false)
const sidebarVisible = ref(false)
const refreshTimer = ref<number | null>(null)
const amenities = ref<Amenity[]>([])
const isLoadingAmenities = ref(false)

const timeOptions = Array.from({ length: 32 }, (_, index) => {
  const minutes = 6 * 60 + index * 30
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  return { label: value.slice(0, 5), value }
})

const spotsByZone = computed(() => {
  return spots.value.reduce<Record<string, Spot[]>>((zones, spot) => {
    zones[spot.zone] = zones[spot.zone] ?? []
    zones[spot.zone].push(spot)
    return zones
  }, {})
})
const selectedSpot = computed(() => bookingStore.selectedSpot)
const bestSpotId = computed(() => spots.value.find((spot) => spot.status === 'available')?.id)
const emptyMessage = computed(() => hasSearched.value && !isSearching.value && spots.value.length === 0)
const visibleAmenities = computed(() => amenities.value.slice(0, 4))

function toDateString(input: Date) {
  return input.toLocaleDateString('en-CA')
}

function spotSeverity(status: Spot['status']) {
  if (status === 'occupied') return 'danger'
  if (status === 'opening_soon') return 'info'
  return 'success'
}

function spotLabel(status: Spot['status']) {
  if (status === 'occupied') return 'Occupied'
  if (status === 'opening_soon') return 'Soon'
  return 'Available'
}

function spotIcon(spot: Spot) {
  if (spot.spot_type === 'ev') return 'pi pi-bolt'
  if (spot.spot_type === 'covered') return 'pi pi-shield'
  if (spot.spot_type === 'handicap') return 'pi pi-heart'
  return 'pi pi-car'
}

function amenityIcon(category: Amenity['category']) {
  const icons = {
    petrol: 'pi pi-map',
    ev: 'pi pi-bolt',
    cafe: 'pi pi-coffee',
    pharmacy: 'pi pi-heart',
    atm: 'pi pi-credit-card',
  }
  return icons[category]
}

function amenityTone(category: Amenity['category']) {
  return `amenity-${category}`
}

async function searchAvailability(showToast = true) {
  if (!date.value || !startTime.value || !endTime.value) {
    toast.add({ severity: 'warn', summary: 'Missing filters', detail: 'Select date, start time, and end time.', life: 3500 })
    return
  }
  if (startTime.value >= endTime.value) {
    toast.add({ severity: 'warn', summary: 'Invalid time', detail: 'End time must be after start time.', life: 3500 })
    return
  }

  isSearching.value = true
  hasSearched.value = true
  bookingStore.resetSelection()

  try {
    const dateString = toDateString(date.value)
    bookingStore.setFilters(dateString, startTime.value, endTime.value)
    const response = await spotService.getAvailability(dateString, startTime.value, endTime.value)
    spots.value = response.spots
    summary.value = response.summary
    if (showToast) {
      toast.add({ severity: 'success', summary: 'Availability refreshed', detail: `${response.summary.available} spots available.`, life: 2500 })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Search failed',
      detail: error instanceof Error ? error.message : 'Unable to search availability.',
      life: 5000,
    })
  } finally {
    isSearching.value = false
  }
}

async function loadAmenities() {
  isLoadingAmenities.value = true
  try {
    amenities.value = await amenityService.getAll()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Amenities unavailable',
      detail: error instanceof Error ? error.message : 'Unable to load nearby amenities.',
      life: 4000,
    })
  } finally {
    isLoadingAmenities.value = false
  }
}

function selectSpot(spot: Spot) {
  if (spot.status === 'occupied') {
    toast.add({ severity: 'info', summary: 'Spot occupied', detail: `${spot.label} is not available for this window.`, life: 2500 })
    return
  }
  bookingStore.selectSpot(spot)
  sidebarVisible.value = true
}

function handleBooked(reservationId: number) {
  if (!Number.isFinite(reservationId)) {
    toast.add({
      severity: 'error',
      summary: 'Reservation id missing',
      detail: 'The reservation was created, but the payment page could not be opened.',
      life: 5000,
    })
    return
  }
  sidebarVisible.value = false
  router.push(`/payment/${reservationId}`)
}

onMounted(() => {
  searchAvailability(false)
  loadAmenities()
  refreshTimer.value = window.setInterval(() => searchAvailability(false), 30000)
})

onUnmounted(() => {
  if (refreshTimer.value) window.clearInterval(refreshTimer.value)
})
</script>

<template>
  <section class="page-stack">
    <div class="page-title">
      <div>
        <h1>Find Parking</h1>
        <p>Live availability, booking conflict checks, and instant payment handoff.</p>
      </div>
      <Button icon="pi pi-refresh" label="Refresh" outlined :loading="isSearching" @click="searchAvailability()" />
    </div>

    <Card>
      <template #content>
        <div class="search-grid">
          <span class="p-float-label">
            <Calendar id="date" v-model="date" class="w-full" date-format="yy-mm-dd" :min-date="new Date()" :disabled="isSearching" />
            <label for="date">Date</label>
          </span>
          <span class="p-float-label">
            <Dropdown id="start" v-model="startTime" :options="timeOptions" option-label="label" option-value="value" class="w-full" :disabled="isSearching" />
            <label for="start">Start</label>
          </span>
          <span class="p-float-label">
            <Dropdown id="end" v-model="endTime" :options="timeOptions" option-label="label" option-value="value" class="w-full" :disabled="isSearching" />
            <label for="end">End</label>
          </span>
          <Button label="Search" icon="pi pi-search" :loading="isSearching" @click="searchAvailability()" />
        </div>
      </template>
    </Card>

    <div class="stat-grid">
      <Card><template #content><span class="muted-label">Available</span><strong class="stat success">{{ summary.available }}</strong></template></Card>
      <Card><template #content><span class="muted-label">Occupied</span><strong class="stat danger">{{ summary.occupied }}</strong></template></Card>
      <Card><template #content><span class="muted-label">Opening soon</span><strong class="stat info">{{ summary.opening_soon }}</strong></template></Card>
      <Card><template #content><span class="muted-label">Estimated total</span><strong class="stat">₹{{ bookingStore.totalAmount }}</strong></template></Card>
    </div>

    <Skeleton v-if="isSearching" height="22rem" />
    <Message v-else-if="emptyMessage" severity="info" :closable="false">No spots found for this time window.</Message>

    <div v-else class="zone-stack">
      <Card v-for="(zoneSpots, zone) in spotsByZone" :key="zone">
        <template #title>
          <div class="zone-title">
            <span>Zone {{ zone }}</span>
            <Tag v-if="zoneSpots.some((spot) => spot.id === bestSpotId)" value="Best available here" severity="success" />
          </div>
        </template>
        <template #content>
          <div class="spot-grid">
            <button
              v-for="spot in zoneSpots"
              :key="spot.id"
              type="button"
              class="spot-tile"
              :class="[spot.status, { selected: selectedSpot?.id === spot.id, best: bestSpotId === spot.id }]"
              :disabled="spot.status === 'occupied'"
              @click="selectSpot(spot)"
            >
              <span class="spot-topline">
                <i :class="spotIcon(spot)" />
                <Tag v-if="bestSpotId === spot.id" value="Best" severity="success" />
              </span>
              <strong>{{ spot.label }}</strong>
              <span>Zone {{ spot.zone }} · {{ spot.spot_type }}</span>
              <Tag :value="spotLabel(spot.status)" :severity="spotSeverity(spot.status)" rounded />
            </button>
          </div>
        </template>
      </Card>
    </div>

    <Card>
      <template #title>
        <div class="zone-title">
          <span>Nearby Amenities</span>
          <Button label="View all" icon="pi pi-arrow-right" text @click="router.push('/nearby')" />
        </div>
      </template>
      <template #content>
        <div v-if="isLoadingAmenities" class="dashboard-amenities">
          <Skeleton v-for="index in 4" :key="index" height="7rem" />
        </div>
        <Message v-else-if="visibleAmenities.length === 0" severity="info" :closable="false">
          No amenities found near this parking area.
        </Message>
        <div v-else class="dashboard-amenities">
          <article v-for="amenity in visibleAmenities" :key="amenity.id" class="dashboard-amenity">
            <span class="dashboard-amenity-icon" :class="amenityTone(amenity.category)">
              <i :class="amenityIcon(amenity.category)" />
            </span>
            <div>
              <div class="amenity-head">
                <strong>{{ amenity.name }}</strong>
                <Tag :value="amenity.is_open ? 'Open' : 'Closed'" :severity="amenity.is_open ? 'success' : 'danger'" />
              </div>
              <p>{{ amenity.distance }}</p>
              <span>{{ amenity.extra_info || amenity.operating_hours || 'Details unavailable' }}</span>
            </div>
          </article>
        </div>
      </template>
    </Card>

    <Sidebar v-model:visible="sidebarVisible" position="right" class="booking-sidebar">
      <template #header>
        <h2>Booking Summary</h2>
      </template>
      <BookingSidebarContent v-if="selectedSpot" :spot="selectedSpot" @booked="handleBooked" @close="sidebarVisible = false" />
    </Sidebar>
  </section>
</template>
