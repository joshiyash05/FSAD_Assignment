<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { amenityService } from '@/services/amenityService'
import type { Amenity } from '@/types/index'

const toast = useToast()
const amenities = ref<Amenity[]>([])
const isLoading = ref(true)
const openCount = computed(() => amenities.value.filter((amenity) => amenity.is_open).length)

function categoryIcon(category: Amenity['category']) {
  const icons = {
    petrol: 'pi pi-car',
    ev: 'pi pi-bolt',
    cafe: 'pi pi-coffee',
    pharmacy: 'pi pi-heart',
    atm: 'pi pi-credit-card',
  }
  return icons[category]
}

async function loadAmenities() {
  isLoading.value = true
  try {
    amenities.value = await amenityService.getAll()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Amenities unavailable',
      detail: error instanceof Error ? error.message : 'Failed to load amenities.',
      life: 5000,
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(loadAmenities)
</script>

<template>
  <section class="page-stack">
    <div class="page-title">
      <div>
        <h1>Nearby</h1>
        <p>{{ openCount }} amenities open near your parking area.</p>
      </div>
      <Button icon="pi pi-refresh" label="Refresh" outlined :loading="isLoading" @click="loadAmenities" />
    </div>

    <div v-if="isLoading" class="amenity-grid">
      <Skeleton v-for="index in 6" :key="index" height="10rem" />
    </div>
    <Message v-else-if="amenities.length === 0" severity="info" :closable="false">No nearby amenities found.</Message>
    <div v-else class="amenity-grid">
      <Card v-for="amenity in amenities" :key="amenity.id">
        <template #content>
          <div class="amenity-card">
            <span class="amenity-icon"><i :class="categoryIcon(amenity.category)" /></span>
            <div>
              <div class="zone-title">
                <h2>{{ amenity.name }}</h2>
                <Tag :value="amenity.is_open ? 'Open' : 'Closed'" :severity="amenity.is_open ? 'success' : 'danger'" />
              </div>
              <p>{{ amenity.distance }}</p>
              <span>{{ amenity.operating_hours || 'Hours unavailable' }}</span>
              <strong v-if="amenity.extra_info">{{ amenity.extra_info }}</strong>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>
