<template>
  <div class="date-time-picker">
    <div class="date-row">
      <button v-for="d in dates" :key="d.iso" :class="['date-pill', { active: d.iso === selected }]" @click="select(d.iso)">{{ d.label }}</button>
      <input type="date" v-model="selected" />
    </div>

    <div class="time-row">
      <div>
        <label>Start</label>
        <select v-model="start">
          <option v-for="t in startOptions" :key="t">{{ t }}</option>
        </select>
      </div>
      <div>
        <label>End</label>
        <select v-model="end">
          <option v-for="t in endOptions" :key="t">{{ t }}</option>
        </select>
      </div>
      <div style="align-self:end">
        <button class="find" @click="emitSearch">Find spots</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const today = new Date()
function fmtDateISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

const dates = computed(() => {
  const out: { iso: string; label: string }[] = []
  for (let i = 0; i < 5; i++) {
    const dt = new Date()
    dt.setDate(today.getDate() + i)
    const label = dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    out.push({ iso: fmtDateISO(dt), label })
  }
  return out
})

const selected = ref(fmtDateISO(today))
const startOptions = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM']
const endOptions = ['12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM']
const start = ref('9:00 AM')
const end = ref('5:00 PM')

function select(iso: string) { selected.value = iso }

function emitSearch() {
  // Emit payload like { date, startTime, endTime }
  // @ts-ignore emit
  const payload = { date: selected.value, startTime: start.value, endTime: end.value }
  // @ts-ignore
  emit('search', payload)
}
</script>

<style scoped>
.date-row{display:flex;gap:8px;margin-bottom:8px;align-items:center}
.date-pill{padding:6px 8px;border-radius:999px;background:#f2f4f6;border:0}
.date-pill.active{background:#378ADD;color:white}
.time-row{display:flex;gap:12px;align-items:center}
.find{background:#1D9E75;color:white;border:0;padding:8px 12px;border-radius:6px}
</style>
