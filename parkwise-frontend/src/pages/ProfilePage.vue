<template>
  <div class="py-6">
    <h1 class="text-2xl font-semibold mb-4">Profile</h1>
    <div class="A" style="padding:14px">
      <div style="display:flex;gap:10px">
        <div style="flex:1">
          <div class="C" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <div style="width:44px;height:44px;border-radius:50%;background:#E6F1FB;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:500;color:#185FA5">{{ initials }}</div>
              <div style="flex:1"><p style="font-size:14px;font-weight:500;margin:0;color:var(--color-text-primary)">{{ userFullName }}</p><p style="font-size:11px;color:var(--color-text-secondary);margin:2px 0 0">{{ user?.email }}</p><p style="font-size:11px;color:var(--color-text-tertiary);margin:2px 0 0">{{ user?.phone || '' }}</p></div>
              <button class="BO" style="font-size:11px;padding:5px 10px">Edit</button>
            </div>
          </div>

          <div class="C" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><p class="T" style="margin:0">My vehicles</p><button class="BO" style="font-size:11px;padding:3px 8px" @click="openAdd = true">+ Add</button></div>
            <div style="display:flex;gap:8px;flex-direction:column">
              <div v-for="v in vehicles" :key="v.id" :style="{border: v.is_default ? '2px solid #378ADD' : '1px solid var(--color-border-tertiary)', padding: '8px', borderRadius: '8px', background: v.is_default ? 'var(--color-background-secondary)' : 'transparent'}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><span style="font-size:12px;font-weight:500;color:var(--color-text-primary)">{{ v.plate_number }}</span><span class="B" :style="{background: v.is_default ? '#E6F1FB' : 'var(--color-background-secondary)', color: v.is_default ? '#185FA5' : 'var(--color-text-secondary)'}">{{ v.is_default ? 'Default' : 'Set default' }}</span></div>
                <p style="font-size:11px;color:var(--color-text-secondary);margin:0">{{ v.model_name }} — {{ v.color }}</p>
                <p style="font-size:10px;color:var(--color-text-tertiary);margin:2px 0 0">{{ v.vehicle_type }}</p>
              </div>
            </div>
          </div>

        </div>
        <div style="width:190px">
          <div class="C" style="margin-bottom:10px">
            <p class="T">Stats</p>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div class="S" style="padding:8px"><p class="SL">Bookings</p><p style="font-size:16px;font-weight:500;margin:0;color:var(--color-text-primary)">{{ stats.bookings }}</p></div>
              <div class="S" style="padding:8px"><p class="SL">Hours parked</p><p style="font-size:16px;font-weight:500;margin:0;color:#0C447C">{{ stats.hours }}</p></div>
              <div class="S" style="padding:8px"><p class="SL">Cancellations</p><p style="font-size:16px;font-weight:500;margin:0;color:#A32D2D">{{ stats.cancellations }}</p></div>
              <div class="S" style="padding:8px"><p class="SL">Favourite</p><p style="font-size:16px;font-weight:500;margin:0;color:#0F6E56">{{ stats.favourite }}</p></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add vehicle modal (simple) -->
      <div v-if="openAdd" style="position:fixed;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
        <div style="background:white;padding:16px;border-radius:8px;min-width:320px">
          <h3 style="margin:0 0 8px">Add vehicle</h3>
          <input v-model="newVehicle.plate_number" placeholder="Plate number" style="width:100%;padding:8px;margin-bottom:8px" />
          <input v-model="newVehicle.model_name" placeholder="Model" style="width:100%;padding:8px;margin-bottom:8px" />
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="BO" @click="openAdd = false">Cancel</button>
            <button class="BP" @click="addVehicle">Add</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { vehicleService } from '@/services/vehicleService'

const auth = useAuthStore()
const user = computed(() => auth.user)
const initials = computed(() => auth.initials)
const userFullName = computed(() => user.value ? (user.value.first_name + ' ' + (user.value.last_name || '')) : '')

const vehicles = ref<Array<any>>([])
const stats = ref({ bookings: 0, hours: 0, cancellations: 0, favourite: 'A6' })

const openAdd = ref(false)
const newVehicle = ref({ plate_number: '', model_name: '' })

async function loadVehicles(){
  try{
    vehicles.value = await vehicleService.getAll()
  }catch(e){
    console.error('Failed to load vehicles', e)
  }
}

async function addVehicle(){
  try{
    const v = await vehicleService.add({ plate_number: newVehicle.value.plate_number, model_name: newVehicle.value.model_name, color: '', vehicle_type: 'car', fuel_type: '' })
    vehicles.value.unshift(v)
    openAdd.value = false
    newVehicle.value.plate_number = ''
    newVehicle.value.model_name = ''
  }catch(e){ console.error(e) }
}

onMounted(()=>{ loadVehicles() })
</script>
