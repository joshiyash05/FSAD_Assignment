<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'

const emit = defineEmits<{
  search: [payload: { date: string; start_time: string; end_time: string }]
}>()

const date = ref(new Date())
const startTime = ref('09:00:00')
const endTime = ref('11:00:00')
const timeOptions = Array.from({ length: 32 }, (_, index) => {
  const minutes = 6 * 60 + index * 30
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  return { label: value.slice(0, 5), value }
})
const valid = computed(() => Boolean(date.value) && startTime.value < endTime.value)

function dateString(value: Date) {
  return value.toLocaleDateString('en-CA')
}

function setPreset(hours: number) {
  const now = new Date()
  const roundedHour = Math.min(22, now.getHours() + 1)
  startTime.value = `${String(roundedHour).padStart(2, '0')}:00:00`
  endTime.value = `${String(roundedHour + hours).padStart(2, '0')}:00:00`
  date.value = now
}

function submit() {
  if (!valid.value) return
  emit('search', { date: dateString(date.value), start_time: startTime.value, end_time: endTime.value })
}
</script>

<template>
  <Card>
    <template #content>
      <div class="search-grid">
        <span class="p-float-label">
          <Calendar id="dtp-date" v-model="date" class="w-full" date-format="yy-mm-dd" :min-date="new Date()" />
          <label for="dtp-date">Date</label>
        </span>
        <span class="p-float-label">
          <Dropdown id="dtp-start" v-model="startTime" :options="timeOptions" option-label="label" option-value="value" class="w-full" />
          <label for="dtp-start">Start</label>
        </span>
        <span class="p-float-label">
          <Dropdown id="dtp-end" v-model="endTime" :options="timeOptions" option-label="label" option-value="value" class="w-full" />
          <label for="dtp-end">End</label>
        </span>
        <div class="dtp-actions">
          <Button label="Next hour" text @click="setPreset(1)" />
          <Button label="Find spots" icon="pi pi-search" :disabled="!valid" @click="submit" />
        </div>
      </div>
    </template>
  </Card>
</template>
