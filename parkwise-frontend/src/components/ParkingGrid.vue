<template>
  <div class="parking-grid">
    <div class="zone" v-for="zone of zones" :key="zone">
      <h4>Zone {{ zone }}</h4>
      <div class="grid">
        <div v-for="spot in spotsFor(zone)" :key="spot.id" :class="['spot', spotClass(spot)]" @click="onClick(spot)">
          {{ spot.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Spot } from '@/types'

const props = defineProps<{ spots: Spot[] }>()
const emit = defineEmits<[ (e: 'selectSpot', spot: Spot) => void ]>()

const zones = computed(() => {
  const s = props.spots.map(p => p.zone)
  return Array.from(new Set(s)).sort()
})

function spotsFor(zone: string) {
  return props.spots.filter(s => s.zone === zone)
}

function spotClass(spot: Spot) {
  if (spot.status === 'occupied') return 'occupied'
  if (spot.status === 'opening_soon') return 'opening'
  return 'available'
}

function onClick(spot: Spot) {
  if (spot.status === 'occupied') return
  emit('selectSpot', spot)
}
</script>

<style scoped>
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
.spot{padding:10px;border-radius:6px;text-align:center}
.spot.available{background:#e6fbf3;border:1px solid #1D9E75;cursor:pointer}
.spot.opening{background:#fff4e6;border:1px solid #EF9F27;cursor:pointer}
.spot.occupied{background:#fdecec;border:1px solid #E24B4A;color:#a33}
</style>
