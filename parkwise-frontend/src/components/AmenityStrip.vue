<template>
  <div class="amenity-strip">
    <h4>Nearby amenities</h4>
    <div class="list">
      <div class="amen" v-for="a in amenities" :key="a.id">
        <div class="name">{{ a.name }}</div>
        <div class="meta">{{ a.distance }} • {{ a.operating_hours || '' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { amenityService } from '@/services/amenityService'

const amenities = ref<any[]>([])
onMounted(async () => {
  try { amenities.value = await amenityService.getAll() } catch(e){console.error(e)}
})
</script>

<style scoped>
.amenity-strip{margin-top:16px}
.list{display:flex;gap:8px;flex-wrap:wrap}
.amen{background:#fff;padding:8px;border-radius:6px;border:1px solid #eef2f6;width:200px}
.name{font-weight:600}
.meta{font-size:12px;color:#666}
</style>
