<template>
  <Card class="amenity-strip p-mt-3">
    <h4>Nearby amenities</h4>
    <div class="p-grid p-nogutter p-align-start p-justify-start">
      <div v-for="a in amenities" :key="a.id" class="p-col-12 p-md-4 p-lg-3 p-p-2">
        <div class="p-p-3 p-shadow-1 amen">
          <div class="p-d-flex p-jc-between p-ai-center">
            <div class="name">{{ a.name }}</div>
            <Tag :value="a.category" severity="info" />
          </div>
          <div class="meta p-mt-2">{{ a.distance }} <span v-if="a.operating_hours">• {{ a.operating_hours }}</span></div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { amenityService } from '@/services/amenityService'
import Card from 'primevue/card'
import Tag from 'primevue/tag'

const amenities = ref<any[]>([])
onMounted(async () => {
  try { amenities.value = await amenityService.getAll() } catch(e){console.error(e)}
})
</script>

<style scoped>
.amenity-strip{width:100%}
.amen{background:#fff;border-radius:8px}
.name{font-weight:600}
.meta{font-size:13px;color:#555}
</style>
