<template>
  <div class="py-6">
    <h1 class="text-2xl font-semibold mb-4">Dashboard</h1>
    <div class="A" style="padding:14px">
      <div style="background:#E6F1FB;border-radius:var(--border-radius-lg);padding:12px;margin-bottom:12px">
        <p style="font-size:13px;font-weight:500;color:#0C447C;margin:0 0 8px">When do you want to park?</p>
        <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
          <div style="flex:1;min-width:200px">
            <label class="SL">Date</label>
            <div id="date-row" style="display:flex;gap:5px">
              <div v-for="(d, i) in dates" :key="d.key" @click="selectedDate = i"
                   :class="['FP', { 'date-selected': selectedDate === i }]"
                   style="cursor:pointer;min-width:72px;text-align:center;padding:8px;border-radius:8px"
              >
                <div style="font-size:10px;color:var(--color-text-tertiary)">{{ d.label }}</div>
                <div style="font-size:13px;font-weight:500;color:var(--color-text-primary)">{{ d.day }}</div>
              </div>
            </div>
          </div>

          <div>
            <label class="SL">Start</label>
            <select v-model="selectedStart" class="" style="font-size:12px;padding:7px 8px;min-width:90px" @change="recalc">
              <option v-for="t in startOptions" :key="t">{{ t }}</option>
            </select>
          </div>

          <div>
            <label class="SL">End</label>
            <select v-model="selectedEnd" class="" style="font-size:12px;padding:7px 8px;min-width:90px" @change="recalc">
              <option v-for="t in endOptions" :key="t">{{ t }}</option>
            </select>
          </div>

          <div style="background:var(--color-background-primary);border-radius:var(--border-radius-md);padding:7px 12px;text-align:center;border:0.5px solid var(--color-border-tertiary)">
            <p style="font-size:10px;color:var(--color-text-tertiary);margin:0">Duration</p>
            <p style="font-size:14px;font-weight:500;color:#0C447C;margin:2px 0 0">{{ durationText }}</p>
          </div>

          <button class="BP" style="padding:8px 16px;width:auto;display:flex;align-items:center;gap:5px;white-space:nowrap" @click="findSpots">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            Find spots
          </button>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div class="S" style="flex:1"><p class="SL">Available</p><p class="SV" style="color:#0F6E56" id="avail-count">{{ availCount }} <span style="font-size:12px;font-weight:400;color:var(--color-text-secondary)">of {{ totalSpots }}</span></p></div>
        <div class="S" style="flex:1"><p class="SL">Free in next 3h</p><p class="SV" style="color:#0C447C">{{ freeSoon }}</p></div>
        <div class="S" style="flex:1"><p class="SL">Est. cost</p><p class="SV" style="color:var(--color-text-primary)" id="est-cost">{{ estCost }}</p></div>
        <div class="S" style="flex:1"><p class="SL">Your selection</p><p class="SV" id="sel-label" style="color:var(--color-text-tertiary)">{{ selectedSpot || 'None' }}</p></div>
      </div>

      <div style="display:flex;gap:10px">
        <div style="flex:1">
          <p style="font-size:11px;font-weight:500;color:var(--color-text-secondary);margin:0 0 5px">Zone A — Near gate 1</p>
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

        <div id="side" style="width:185px;display:none">
          <!-- Side panel can be implemented later -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { spotService } from '@/services/spotService'

const today = new Date()
function fmtDay(d: Date){ const days=["SUN","MON","TUE","WED","THU","FRI","SAT"];const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return { label: days[d.getDay()] , day: d.getDate(), key: d.toDateString(), pretty: d.getDate() + ' ' + months[d.getMonth()] } }

const dates = Array.from({length:5}).map((_,i)=>{ const d=new Date(today); d.setDate(today.getDate()+i); return fmtDay(d) })
const selectedDate = ref(0)

const startOptions = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM"]
const endOptions = ["12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM"]
const selectedStart = ref('9:00 AM')
const selectedEnd = ref('5:00 PM')

const TM: Record<string, number> = {"8:00 AM":8,"9:00 AM":9,"10:00 AM":10,"11:00 AM":11,"12:00 PM":12,"1:00 PM":13,"2:00 PM":14,"3:00 PM":15}
const TE: Record<string, number> = {"12:00 PM":12,"1:00 PM":13,"2:00 PM":14,"3:00 PM":15,"4:00 PM":16,"5:00 PM":17,"6:00 PM":18,"7:00 PM":19,"8:00 PM":20}

const duration = computed(()=>{ const s=TM[selectedStart.value]||9; const e=TE[selectedEnd.value]||17; const h=Math.max(1,e-s); return h })
const durationText = computed(()=> duration.value + ' hour' + (duration.value>1?'s':''))
const estCost = computed(()=>{ const r = duration.value * 20; const g = Math.round(r*0.18); return '₹' + Math.round(r+g) })

// spots returned from backend
const zA = ref<Array<{id:string,s:string}>>([])
const zB = ref<Array<{id:string,s:string}>>([])

const selectedSpot = ref<string | null>(null)
const totalSpots = computed(()=> zA.value.length + zB.value.length)
const availCount = computed(()=> zA.value.filter(s=>s.s!=='r').length + zB.value.filter(s=>s.s!=='r').length)
const freeSoon = ref(0)

function colorForStatus(s: string){ if(s==='g') return '#1D9E75'; if(s==='r') return '#E24B4A'; if(s==='b') return '#378ADD'; return '#EF9F27' }

function pick(spot: {id:string,s:string}){ if(spot.s==='r') return; selectedSpot.value = spot.id }

async function recalc(){ /* placeholder to trigger computed updates */ }

async function loadSpotsFromBackend(){
  try{
    const spots = await spotService.getAll()
    // spots expected to be array of { id, label, zone }
    const mapped = spots.map((s: any)=>({ id: s.label || s.id, zone: s.zone || (s.label? s.label[0] : 'A'), raw: s }))
    zA.value = mapped.filter((m:any)=>String(m.zone).startsWith('A')).map((m:any)=>({ id: m.id, s: 'g' }))
    zB.value = mapped.filter((m:any)=>String(m.zone).startsWith('B')).map((m:any)=>({ id: m.id, s: 'g' }))

    // Try availability endpoint to get statuses
    try{
    const dateStr = new Date(dates[selectedDate.value].key).toISOString().split('T')[0]
    // backend expects YYYY-MM-DD and HH:MM:SS (24h)
    const fmtHourTime = (h:number) => String(h).padStart(2,'0') + ':00:00'
    const sHour = TM[selectedStart.value] ?? 9
    const eHour = TE[selectedEnd.value] ?? 17
    const startTs = fmtHourTime(sHour)
    const endTs = fmtHourTime(eHour)
    const res = await spotService.getAvailability(dateStr, startTs, endTs)
      // handle few possible response shapes
      if(res && typeof res === 'object'){
        // expected: { availability: { A1: 'occupied' } } or map directly
        const map = res.availability || res || {}
        const getStatus = (id:string)=>{
          const v = map[id] || map[id.replace(/^A|B/,'')]
          if(!v) return 'g'
          if(v==='occupied' || v==='r' || v===false) return 'r'
          if(v==='soon' || v==='b') return 'b'
          return 'g'
        }
        zA.value = zA.value.map(s=>({ id: s.id, s: getStatus(s.id) }))
        zB.value = zB.value.map(s=>({ id: s.id, s: getStatus(s.id) }))
      }
    }catch(e){
      // availability failed — fall back to random statuses
      zA.value = zA.value.map((s,i)=>({ id: s.id, s: Math.random()>0.35? 'g' : Math.random()>0.5? 'r' : 'b' }))
      zB.value = zB.value.map((s,i)=>({ id: s.id, s: Math.random()>0.35? 'g' : Math.random()>0.5? 'r' : 'b' }))
    }
  }catch(err){
    console.error('Failed to load spots', err)
    // fallback to sample grid
    const sampleA = ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12","A13","A14","A15","A16","A17","A18"]
    const sampleB = ["B1","B2","B3","B4","B5","B6","B7","B8","B9","B10","B11","B12"]
    zA.value = sampleA.map((id,i)=>({ id, s: Math.random()>0.35? 'g' : Math.random()>0.5? 'r' : 'b' }))
    zB.value = sampleB.map((id,i)=>({ id, s: Math.random()>0.35? 'g' : Math.random()>0.5? 'r' : 'b' }))
  }
}

async function findSpots(){
  await loadSpotsFromBackend()
  selectedSpot.value = null
}

onMounted(()=>{ loadSpotsFromBackend() })
</script>
