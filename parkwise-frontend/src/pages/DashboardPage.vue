<template>
  <div class="py-6">
    <h1 class="text-2xl font-semibold mb-4">Dashboard</h1>
    <div class="A" style="padding:14px">
      <div style="background:#E6F1FB;border-radius:var(--border-radius-lg);padding:12px;margin-bottom:12px">
        <p style="font-size:13px;font-weight:500;color:#0C447C;margin:0 0 8px">When do you want to park?</p>
        <div>
          <DateTimePicker @search="onDateSearch" />
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div class="S" style="flex:1"><p class="SL">Available</p><p class="SV" style="color:#0F6E56" id="avail-count">{{ availCount }} <span style="font-size:12px;font-weight:400;color:var(--color-text-secondary)">of {{ totalSpots }}</span></p></div>
        <div class="S" style="flex:1"><p class="SL">Free in next 3h</p><p class="SV" style="color:#0C447C">{{ freeSoon }}</p></div>
        <div class="S" style="flex:1"><p class="SL">Est. cost</p><p class="SV" style="color:var(--color-text-primary)" id="est-cost">{{ estCost }}</p></div>
        <div class="S" style="flex:1"><p class="SL">Your selection</p><p class="SV" id="sel-label" style="color:var(--color-text-tertiary)">{{ selectedSpotObj?.label || selectedSpotObj?.plate_number || 'None' }}</p></div>
      </div>

        <div style="display:flex;gap:10px">
          <div style="flex:1">
          <p style="font-size:11px;font-weight:500;color:var(--color-text-secondary);margin:0 0 5px">Zone A — Near gate 1</p>
          <Legend />
          <div id="gA">
            <div v-for="spot in zA" :key="spot.id" class="GS" :data-status="spot.s"
                 @click="pick(spot)"
                 :style="{ background: colorForStatus(spot.s) }">
              {{ spot.id }}
            </div>
          </div>
          <p style="font-size:11px;font-weight:500;color:var(--color-text-secondary);margin:0 0 5px">Zone B — Near elevator</p>
          <div id="gB">
            <div v-for="spot in zB" :key="spot.id" class="GS" :data-status="spot.s"
                 @click="pick(spot)"
                 :style="{ background: colorForStatus(spot.s) }">
              {{ spot.id }}
            </div>
          </div>
        </div>

        <div id="side" style="width:320px;">
          <BookingSidebar v-if="selectedSpotObj" :spot="selectedSpotObj" :date="dateStr" :start-time="selectedStartISO" :end-time="selectedEndISO" @booked="onBooked" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { spotService } from '@/services/spotService'
import BookingSidebar from '@/components/BookingSidebar.vue'
import Legend from '@/components/Legend.vue'
import DateTimePicker from '@/components/DateTimePicker.vue'

const today = new Date()
function fmtDay(d: Date){ const days=["SUN","MON","TUE","WED","THU","FRI","SAT"];const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return { label: days[d.getDay()] , day: d.getDate(), key: d.toDateString(), pretty: d.getDate() + ' ' + months[d.getMonth()] } }

const dates = Array.from({length:5}).map((_,i)=>{ const d=new Date(today); d.setDate(today.getDate()+i); return fmtDay(d) })
const selectedDate = ref(0)

// Manual start/end selects removed — DateTimePicker replaces them
const estCost = computed(()=>{
  if(!selectedStartISO.value || !selectedEndISO.value) return '—'
  try{
    const s = new Date(selectedStartISO.value)
    const e = new Date(selectedEndISO.value)
    const hours = Math.max(1, Math.round((e.getTime()-s.getTime())/3600000))
    const r = hours * 20
    const g = Math.round(r*0.18)
    return '₹' + Math.round(r+g)
  }catch(e){ return '—' }
})

// spots returned from backend (keep raw backend object for booking)
const zA = ref<Array<{id:string,s:string,raw:any}>>([])
const zB = ref<Array<{id:string,s:string,raw:any}>>([])

const selectedSpotObj = ref<any | null>(null)
const selectedStartISO = ref<string | null>(null)
const selectedEndISO = ref<string | null>(null)
const totalSpots = computed(()=> zA.value.length + zB.value.length)
const availCount = computed(()=> zA.value.filter(s=>s.s!=='r').length + zB.value.filter(s=>s.s!=='r').length)
const freeSoon = ref(0)

function colorForStatus(s: string){ if(s==='g') return '#1D9E75'; if(s==='r') return '#E24B4A'; if(s==='b') return '#378ADD'; return '#EF9F27' }

function pick(spot: {id:string,s:string,raw?:any}){
  if(spot.s==='r') return
  const raw = spot.raw || {}
  const normalized = {
    id: raw.id ?? spot.id,
    label: raw.label ?? spot.id,
    zone: raw.zone ?? (typeof spot.id === 'string' && spot.id.startsWith('B') ? 'B' : 'A'),
    ...raw
  }
  console.log('pick -> selected spot', normalized)
  selectedSpotObj.value = normalized
}

async function loadSpotsFromBackend(opts?: { dateISO?: string; startHour?: number; endHour?: number }){
  try{
    const spots = await spotService.getAll()
    // spots expected to be array of { id, label, zone }
    const mapped = spots.map((s: any)=>({ id: s.label || s.id, zone: s.zone || (s.label? s.label[0] : 'A'), raw: s }))
    zA.value = mapped.filter((m:any)=>String(m.zone).startsWith('A')).map((m:any)=>({ id: m.id, s: 'g', raw: m.raw }))
    zB.value = mapped.filter((m:any)=>String(m.zone).startsWith('B')).map((m:any)=>({ id: m.id, s: 'g', raw: m.raw }))

    // Try availability endpoint to get statuses
    try{
    const dateStr = opts?.dateISO ?? new Date(dates[selectedDate.value].key).toISOString().split('T')[0]
    // backend expects YYYY-MM-DD and HH:MM:SS (24h)
    const fmtHourTime = (h:number) => String(h).padStart(2,'0') + ':00:00'
    const sHour = opts?.startHour ?? 9
    const eHour = opts?.endHour ?? 17
    const startTs = fmtHourTime(sHour)
    const endTs = fmtHourTime(eHour)
    const res = await spotService.getAvailability(dateStr, startTs, endTs)
      // handle few possible response shapes
      if(res && typeof res === 'object'){
        // expected: { availability: { A1: 'occupied' } } or map directly
        const anyRes = res as any
        const map: Record<string, any> = (anyRes.availability as Record<string, any>) || (anyRes as Record<string, any>) || {}
        const getStatus = (id:string)=>{
          const v = map[id] || map[id.replace(/^A|B/,'')]
          if(!v) return 'g'
          if(v==='occupied' || v==='r' || v===false) return 'r'
          if(v==='soon' || v==='b') return 'b'
          return 'g'
        }
        zA.value = zA.value.map(s=>({ id: s.id, s: getStatus(s.id), raw: s.raw }))
        zB.value = zB.value.map(s=>({ id: s.id, s: getStatus(s.id), raw: s.raw }))
      }
    }catch(e){
      // availability failed — fall back to random statuses
      zA.value = zA.value.map((s)=>({ id: s.id, s: Math.random()>0.35? 'g' : Math.random()>0.5? 'r' : 'b', raw: s.raw }))
      zB.value = zB.value.map((s)=>({ id: s.id, s: Math.random()>0.35? 'g' : Math.random()>0.5? 'r' : 'b', raw: s.raw }))
    }
  }catch(err){
    console.error('Failed to load spots', err)
    // fallback to sample grid
    const sampleA = ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12","A13","A14","A15","A16","A17","A18"]
    const sampleB = ["B1","B2","B3","B4","B5","B6","B7","B8","B9","B10","B11","B12"]
    zA.value = sampleA.map((id)=>({ id, s: Math.random()>0.35? 'g' : Math.random()>0.5? 'r' : 'b', raw: { id: null, label: id, zone: 'A' } }))
    zB.value = sampleB.map((id)=>({ id, s: Math.random()>0.35? 'g' : Math.random()>0.5? 'r' : 'b', raw: { id: null, label: id, zone: 'B' } }))
  }
}


function onDateSearch(payload: { date: string; start_time: string; end_time: string }){
  // payload.start_time is HH:MM:SS
  const dateISO = payload.date
  const [sh] = payload.start_time.split(':').map(Number)
  const [eh] = payload.end_time.split(':').map(Number)
  selectedStartISO.value = `${dateISO}T${payload.start_time}`
  selectedEndISO.value = `${dateISO}T${payload.end_time}`
  // also set the textual selects for duration/estimate UI
  // no local textual selects — update ISO refs only
  // Update selectedDate to the matching index if present
  const idx = dates.findIndex(d=> new Date(d.key).toISOString().split('T')[0] === dateISO)
  if(idx >= 0) selectedDate.value = idx
  // load spots for the chosen window
  loadSpotsFromBackend({ dateISO, startHour: sh, endHour: eh })
}

async function findSpots(){
  await loadSpotsFromBackend()
  selectedSpotObj.value = null
}

onMounted(()=>{ loadSpotsFromBackend() })

const dateStr = computed(()=> new Date(dates[selectedDate.value].key).toISOString().split('T')[0])

function onBooked(){
  // clear selection and refresh availability
  selectedSpotObj.value = null
  findSpots()
}
</script>
