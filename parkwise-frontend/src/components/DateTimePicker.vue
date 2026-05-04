<template>
  <div class="dtp">
    <div class="date-row">
      <div class="date-pills">
        <button
          v-for="d in quickDates"
          :key="d.iso"
          :class="['date-pill', { active: d.iso === selectedDate }]"
          @click="selectDate(d.iso)">
          <div class="pill-day">{{ d.day }}</div>
          <div class="pill-date">{{ d.label }}</div>
        </button>
      </div>

      <div class="calendar-input">
        <Calendar v-model="startDateObj" :showTime="true" :hourFormat="24" :stepMinute="15" placeholder="Start date & time" @input="onStartCal" />
      </div>
    </div>

    <div class="time-row">
      <div class="time-field">
        <label>Start</label>
        <Calendar v-model="startDateObj" :showTime="true" :hourFormat="24" :stepMinute="15" timeOnly="false" />
      </div>

      <div class="time-field">
        <label>End</label>
        <Calendar v-model="endDateObj" :showTime="true" :hourFormat="24" :stepMinute="15" timeOnly="false" />
      </div>

      <div class="actions">
        <div class="presets">
          <Button label="Now → 1h" class="p-button-text" @click="setPreset('now')" />
          <Button label="Afternoon" class="p-button-text" @click="setPreset('today_afternoon')" />
        </div>
        <Button label="Find spots" :disabled="!valid" class="p-button-success" @click="onSearch" />
      </div>
    </div>

    <div class="errors" v-if="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'

// register locally
const components = { Calendar, Button }

// Helpers
function toISODate(d: Date) { return d.toISOString().slice(0, 10) }
function pad(n: number) { return n < 10 ? '0' + n : '' + n }
function minutesToHHMMSS(m: number) { const hh = Math.floor(m / 60); const mm = m % 60; return `${pad(hh)}:${pad(mm)}:00` }
function fmt12(m: number) {
  const hh = Math.floor(m / 60)
  const mm = m % 60
  const am = hh < 12
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${h12}:${pad(mm)} ${am ? 'AM' : 'PM'}`
}

const emit = defineEmits<{
  (e: 'search', payload: { date: string; start_time: string; end_time: string }): void
}>()

const today = new Date()
const todayISO = toISODate(today)

const selectedDate = ref(toISODate(today))
const showCalendar = ref(false)

// Time options: 15-minute steps from 06:00 to 23:45
const timeOptions = Array.from({ length: (24 * 4) - 24 }, (_, i) => 6 * 60 + i * 15)
// default start/end minutes
const startMin = ref(9 * 60) // 9:00
const endMin = ref(17 * 60) // 17:00

const error = ref('')

const displayDate = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
})

const quickDates = computed(() => {
  const out: { iso: string; label: string; day: string }[] = []
  for (let i = 0; i < 5; i++) {
    const dt = new Date()
    dt.setDate(today.getDate() + i)
    out.push({ iso: toISODate(dt), label: dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), day: dt.toLocaleDateString(undefined, { weekday: 'short' }) })
  }
  return out
})

// Calendar: show current month days
const calendarDays = computed(() => {
  const d0 = new Date()
  d0.setDate(1)
  const year = d0.getFullYear()
  const month = d0.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeek = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const arr: Array<{ iso: string; num: number; disabled: boolean }> = []
  // prepend blanks to align weekdays
  for (let i = 0; i < startWeek; i++) arr.push({ iso: '', num: 0, disabled: true })
  for (let day = 1; day <= daysInMonth; day++) {
    const dt = new Date(year, month, day)
    const iso = toISODate(dt)
    // disable past dates
    const disabled = new Date(iso + 'T00:00:00') < new Date(toISODate(new Date()) + 'T00:00:00')
    arr.push({ iso, num: day, disabled })
  }
  return arr
})

// Calendar-backed Date objects for PrimeVue Calendar
const startDateObj = ref<Date | null>(new Date())
const endDateObj = ref<Date | null>(new Date(new Date().getTime() + 60 * 60 * 1000))

function selectDate(iso: string) {
  selectedDate.value = iso
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d, startDateObj.value ? startDateObj.value.getHours() : 9, startDateObj.value ? startDateObj.value.getMinutes() : 0)
  startDateObj.value = dt
  endDateObj.value = new Date(dt.getTime() + 60 * 60 * 1000)
  showCalendar.value = false
  validate()
}

function onStartCal() {
  // keep selectedDate in sync with start date
  if (startDateObj.value) selectedDate.value = toISODate(startDateObj.value)
}

function fmtTime(m: number) { return fmt12(m) }

function setPreset(p: string) {
  if (p === 'now') {
    const now = new Date()
    const mins = now.getHours() * 60 + Math.floor(now.getMinutes() / 15) * 15
    startMin.value = mins
    endMin.value = Math.min(mins + 60, 23 * 60 + 45)
    selectedDate.value = toISODate(now)
  } else if (p === 'today_afternoon') {
    selectedDate.value = toISODate(new Date())
    startMin.value = 13 * 60
    endMin.value = 15 * 60
  }
  validate()
}

const valid = computed(() => {
  if (!startDateObj.value || !endDateObj.value) return false
  if (startDateObj.value >= endDateObj.value) return false
  if (toISODate(startDateObj.value) === todayISO) {
    const now = new Date()
    if (startDateObj.value < now) return false
  }
  return true
})

function validate() {
  error.value = ''
  if (!startDateObj.value || !endDateObj.value) error.value = 'Select start and end times.'
  else if (startDateObj.value >= endDateObj.value) error.value = 'Start must be before end.'
  else if (toISODate(startDateObj.value) === todayISO && startDateObj.value < new Date()) error.value = 'Start time cannot be in the past.'
}

function onSearch() {
  validate()
  if (!valid.value) return
  emit('search', {
    date: toISODate(startDateObj.value as Date),
    start_time: minutesToHHMMSS((startDateObj.value as Date).getHours() * 60 + (startDateObj.value as Date).getMinutes()),
    end_time: minutesToHHMMSS((endDateObj.value as Date).getHours() * 60 + (endDateObj.value as Date).getMinutes()),
  })
}

onMounted(() => validate())
</script>

<style scoped>
:root{
  --primary:#378ADD;
  --accent:#1D9E75;
  --muted:#f4f6f8;
  --card:#ffffff;
  --danger:#E24B4B;
}
.dtp{background:var(--card);padding:12px;border-radius:10px;box-shadow:0 6px 18px rgba(31,41,55,0.06);max-width:760px}
.date-row{display:flex;gap:12px;align-items:center;justify-content:space-between}
.date-pills{display:flex;gap:8px;flex:1}
.date-pill{background:var(--muted);border:0;padding:8px 10px;border-radius:10px;display:flex;flex-direction:column;align-items:center;min-width:78px}
.date-pill.active{background:var(--primary);color:white}
.pill-day{font-size:12px;opacity:0.85}
.pill-date{font-weight:600;font-size:14px}
.calendar-input{position:relative}
.calendar-input input{padding:8px 10px;border-radius:8px;border:1px solid #e6e9ee;background:white;min-width:180px}
.calendar-popup{position:absolute;top:44px;right:0;background:white;padding:12px;border-radius:8px;box-shadow:0 8px 20px rgba(31,41,55,0.08);z-index:30}
.calendar-grid{display:grid;grid-template-columns:repeat(7,34px);gap:6px}
.cal-day{border:0;background:transparent;padding:6px;border-radius:6px}
.cal-day.today{border:1px dashed var(--primary)}
.cal-day.selected{background:var(--primary);color:white}
.cal-day.disabled{opacity:0.4;pointer-events:none}
.time-row{display:flex;gap:16px;align-items:center;margin-top:12px}
.time-field{display:flex;flex-direction:column}
.time-field label{font-size:12px;color:#374151;margin-bottom:6px}
.time-field select{padding:8px;border-radius:8px;border:1px solid #e6e9ee;min-width:160px}
.actions{display:flex;flex-direction:column;gap:8px;align-items:flex-end}
.presets{display:flex;gap:8px}
.presets button{background:transparent;border:1px solid #e6e9ee;padding:6px 8px;border-radius:6px}
.find{background:var(--accent);color:white;border:0;padding:10px 14px;border-radius:8px}
.find:disabled{opacity:0.5}
.errors{color:var(--danger);margin-top:8px}

@media (max-width:720px){
  .date-row{flex-direction:column;align-items:stretch}
  .time-row{flex-direction:column;align-items:stretch}
  .actions{align-items:stretch}
}
</style>
