<template>
  <div class="parking-grid p-grid p-nogutter">
    <div v-for="zone of zones" :key="zone" class="p-col-12 p-mb-3">
      <h4 class="p-mb-2">Zone {{ zone }}</h4>
      <div class="grid p-grid p-nogutter">
        <div v-for="spot in spotsFor(zone)" :key="spot.id" class="p-col-2 p-px-1 p-py-1">
          <Button :class="['spot', spotClass(spot)]" :label="spot.label" @click="onClick(spot)" :disabled="spot.status==='occupied'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import type { Spot } from '@/types/index'

const props = defineProps<{ spots: Spot[] }>()
const emit = defineEmits<{ (e: 'selectSpot', spot: Spot): void }>()

const zones = computed(() => {
  const s = props.spots.map(p => p.zone || '')
  return Array.from(new Set(s)).filter(Boolean).sort() as string[]
})

function spotsFor(zone: string) {
  return props.spots.filter(s => s.zone === zone)
}

function spotClass(spot: Spot) {
  if (spot.status === 'occupied') return 'p-button-danger'
  if (spot.status === 'opening_soon') return 'p-button-warning'
  return 'p-button-success'
}

function onClick(spot: Spot) {
  if (spot.status === 'occupied') return
  emit('selectSpot', spot)
}
</script>

<style scoped>
.spot{width:100%;border-radius:6px}
</style>
