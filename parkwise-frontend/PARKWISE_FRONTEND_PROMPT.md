# ParkWise — Frontend Development Prompt (Vue 3 + TypeScript + Vite)

## Project overview

ParkWise is a parking spot finder and reservation system. This is the Vue 3 frontend (Composition API + TypeScript) that connects to a Django REST Framework backend running at `http://localhost:8000/api/`.

**Tech stack:** Vue 3 (Composition API), TypeScript, Vite, Vue Router 4, Pinia (state management), Tailwind CSS, Axios, qrcode.vue3, vue-sonner (toast notifications)

---

## Project structure

```
parkwise-frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.vue               # Top navigation bar with logo, links, avatar
│   │   ├── ParkingGrid.vue          # Color-coded spot grid (Zone A + Zone B)
│   │   ├── SpotCard.vue             # Individual spot cell in the grid
│   │   ├── BookingSidebar.vue       # Right sidebar with booking form + price
│   │   ├── DateTimePicker.vue       # Date pills + start/end time selectors + duration
│   │   ├── StatCard.vue             # Reusable metric card (label + big number)
│   │   ├── BookingCard.vue          # Single reservation card with QR + countdown
│   │   ├── AmenityCard.vue          # Nearby amenity card (icon + name + distance)
│   │   ├── VehicleCard.vue          # Vehicle card in profile
│   │   ├── QRCodeDisplay.vue        # QR code renderer using qrcode.vue3
│   │   ├── StepProgress.vue         # 3-step progress bar (spot → payment → confirmed)
│   │   └── CountdownTimer.vue       # Live countdown for active bookings
│   ├── pages/
│   │   ├── LoginPage.vue            # Login + Register toggle
│   │   ├── DashboardPage.vue        # Main page: date picker + grid + sidebar + amenities
│   │   ├── PaymentPage.vue          # Order summary + Razorpay checkout
│   │   ├── ConfirmationPage.vue     # Booking confirmed with QR
│   │   ├── BookingsPage.vue         # My bookings list (active/completed/cancelled tabs)
│   │   ├── NearbyPage.vue           # Nearby amenities grid
│   │   ├── ProfilePage.vue          # User info + vehicles + preferences + stats
│   │   └── AdminPage.vue            # Admin stats + reservations table
│   ├── services/
│   │   ├── api.ts                   # Axios instance with base URL + auth interceptor
│   │   ├── authService.ts           # login(), register(), logout()
│   │   ├── spotService.ts           # getSpots(), getAvailability()
│   │   ├── reservationService.ts    # getReservations(), createReservation(), cancelReservation()
│   │   ├── vehicleService.ts        # getVehicles(), addVehicle(), deleteVehicle(), setDefault()
│   │   ├── paymentService.ts        # createOrder(), verifyPayment()
│   │   └── amenityService.ts        # getAmenities()
│   ├── stores/
│   │   ├── auth.ts                  # Pinia store for auth state (user, token, login, logout)
│   │   └── booking.ts              # Pinia store for current booking flow state
│   ├── types/
│   │   └── index.ts                 # All TypeScript interfaces
│   ├── router/
│   │   └── index.ts                 # Vue Router setup with auth guards
│   ├── App.vue
│   ├── main.ts
│   └── style.css                    # Tailwind imports
├── public/
├── index.html
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Setup

```bash
npm create vite@latest parkwise-frontend -- --template vue-ts
cd parkwise-frontend
npm install
npm install vue-router@4 pinia axios qrcode.vue3 vue-sonner
npm install -D tailwindcss @tailwindcss/vite
```

### vite.config.ts

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

### tailwind.config.js

```js
export default {
  content: ["./index.html", "./src/**/*.{vue,ts,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#378ADD",
        'primary-light': "#E6F1FB",
        'primary-dark': "#0C447C",
        success: "#1D9E75",
        'success-light': "#E1F5EE",
        'success-dark': "#0F6E56",
        danger: "#E24B4A",
        'danger-light': "#FCEBEB",
        'danger-dark': "#A32D2D",
        warning: "#EF9F27",
        'warning-light': "#FAEEDA",
        'warning-dark': "#854F0B",
      }
    }
  },
  plugins: [],
}
```

### index.html — Add Razorpay script

```html
<head>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
```

---

## TypeScript interfaces (types/index.ts)

```ts
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Spot {
  id: number
  label: string
  zone: string                          // "A" | "B"
  spot_type: string                     // "regular" | "ev" | "handicap" | "covered"
  description: string
  is_active: boolean
  status?: 'available' | 'occupied' | 'opening_soon'  // from availability endpoint
}

export interface AvailabilityResponse {
  spots: Spot[]
  summary: {
    total: number
    available: number
    occupied: number
    opening_soon: number
  }
}

export interface Vehicle {
  id: number
  plate_number: string
  model_name: string
  color: string
  vehicle_type: string                 // "car" | "two_wheeler" | "suv"
  fuel_type: string                    // "petrol" | "diesel" | "ev"
  is_default: boolean
}

export interface Reservation {
  id: number
  user: number
  spot: Spot
  vehicle: Vehicle | null
  start_time: string                   // ISO datetime
  end_time: string                     // ISO datetime
  status: 'active' | 'completed' | 'cancelled'
  duration_hours: number
  amount: number
  created_at: string
  payment?: Payment
}

export interface Payment {
  id: number
  reservation: number
  razorpay_order_id: string
  razorpay_payment_id: string
  amount: number
  status: 'pending' | 'paid' | 'refunded'
  created_at: string
}

export interface CreateOrderResponse {
  order_id: string
  amount: number                       // in paise
  currency: string
  key_id: string
}

export interface Amenity {
  id: number
  name: string
  category: string                     // "petrol" | "ev" | "cafe" | "pharmacy" | "atm"
  distance: string
  is_open: boolean
  operating_hours: string
  extra_info: string
}

export interface UserStats {
  total_bookings: number
  total_hours: number
  cancellations: number
  favourite_spot: string | null
}

export interface AdminStats {
  total_users: number
  active_bookings: number
  revenue_today: number
  occupancy_percent: number
}

// Razorpay global type
declare global {
  interface Window {
    Razorpay: any
  }
}
```

---

## API service layer (services/api.ts)

```ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

### services/authService.ts

```ts
import api from './api'
import type { AuthResponse } from '@/types'

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login/', { username, password })
    return data
  },

  async register(payload: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
  }): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register/', payload)
    return data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout/')
  }
}
```

### services/spotService.ts

```ts
import api from './api'
import type { AvailabilityResponse } from '@/types'

export const spotService = {
  async getAvailability(
    date: string,       // "2026-04-29"
    startTime: string,  // "09:00"
    endTime: string     // "17:00"
  ): Promise<AvailabilityResponse> {
    const { data } = await api.get('/spots/availability/', {
      params: { date, start_time: startTime, end_time: endTime }
    })
    return data
  }
}
```

### services/reservationService.ts

```ts
import api from './api'
import type { Reservation, UserStats } from '@/types'

export const reservationService = {
  async getAll(): Promise<Reservation[]> {
    const { data } = await api.get('/reservations/')
    return data
  },

  async create(payload: {
    spot_id: number
    vehicle_id: number
    start_time: string
    end_time: string
  }): Promise<Reservation> {
    const { data } = await api.post('/reservations/', payload)
    return data
  },

  async cancel(id: number): Promise<Reservation> {
    const { data } = await api.patch(`/reservations/${id}/cancel/`)
    return data
  },

  async getStats(): Promise<UserStats> {
    const { data } = await api.get('/reservations/stats/')
    return data
  }
}
```

### services/vehicleService.ts

```ts
import api from './api'
import type { Vehicle } from '@/types'

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const { data } = await api.get('/vehicles/')
    return data
  },

  async add(payload: Omit<Vehicle, 'id' | 'is_default'>): Promise<Vehicle> {
    const { data } = await api.post('/vehicles/', payload)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/vehicles/${id}/`)
  },

  async setDefault(id: number): Promise<Vehicle> {
    const { data } = await api.post(`/vehicles/${id}/set-default/`)
    return data
  }
}
```

### services/paymentService.ts

```ts
import api from './api'
import type { CreateOrderResponse } from '@/types'

export const paymentService = {
  async createOrder(reservationId: number): Promise<CreateOrderResponse> {
    const { data } = await api.post('/payments/create-order/', {
      reservation_id: reservationId
    })
    return data
  },

  async verifyPayment(payload: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }): Promise<{ status: string }> {
    const { data } = await api.post('/payments/verify/', payload)
    return data
  }
}
```

### services/amenityService.ts

```ts
import api from './api'
import type { Amenity } from '@/types'

export const amenityService = {
  async getAll(): Promise<Amenity[]> {
    const { data } = await api.get('/amenities/')
    return data
  }
}
```

---

## Pinia stores

### stores/auth.ts

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.is_staff ?? false)
  const initials = computed(() => {
    if (!user.value) return ''
    return (user.value.first_name[0] + user.value.last_name[0]).toUpperCase()
  })

  async function login(username: string, password: string) {
    const res = await authService.login(username, password)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
  }

  async function register(payload: {
    username: string; email: string; password: string;
    first_name: string; last_name: string
  }) {
    const res = await authService.register(payload)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
  }

  function logout() {
    authService.logout().catch(() => {})
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isAuthenticated, isAdmin, initials, login, register, logout }
})
```

### stores/booking.ts

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Spot, Vehicle } from '@/types'

export const useBookingStore = defineStore('booking', () => {
  const selectedDate = ref<string>('')       // "2026-04-29"
  const startTime = ref<string>('09:00')
  const endTime = ref<string>('17:00')
  const selectedSpot = ref<Spot | null>(null)
  const selectedVehicle = ref<Vehicle | null>(null)

  const durationHours = computed(() => {
    const [sh, sm] = startTime.value.split(':').map(Number)
    const [eh, em] = endTime.value.split(':').map(Number)
    return Math.max(1, (eh + em / 60) - (sh + sm / 60))
  })

  const baseRate = computed(() => Math.round(durationHours.value * 20))
  const gst = computed(() => Math.round(baseRate.value * 0.18 * 100) / 100)
  const totalAmount = computed(() => Math.round((baseRate.value + gst.value) * 100) / 100)

  function reset() {
    selectedSpot.value = null
    selectedVehicle.value = null
  }

  return {
    selectedDate, startTime, endTime,
    selectedSpot, selectedVehicle,
    durationHours, baseRate, gst, totalAmount,
    reset
  }
})
```

---

## Router (router/index.ts)

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import BookingsPage from '@/pages/BookingsPage.vue'
import PaymentPage from '@/pages/PaymentPage.vue'
import ConfirmationPage from '@/pages/ConfirmationPage.vue'
import NearbyPage from '@/pages/NearbyPage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'
import AdminPage from '@/pages/AdminPage.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginPage, meta: { guest: true } },
  { path: '/', name: 'dashboard', component: DashboardPage },
  { path: '/bookings', name: 'bookings', component: BookingsPage },
  { path: '/payment/:reservationId', name: 'payment', component: PaymentPage, props: true },
  { path: '/confirmation/:reservationId', name: 'confirmation', component: ConfirmationPage, props: true },
  { path: '/nearby', name: 'nearby', component: NearbyPage },
  { path: '/profile', name: 'profile', component: ProfilePage },
  { path: '/admin', name: 'admin', component: AdminPage, meta: { admin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // If route requires auth and user is not logged in, redirect to login
  if (!to.meta.guest && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  // If route is guest-only (login) and user is logged in, redirect to dashboard
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  // If route requires admin and user is not admin, redirect to dashboard
  if (to.meta.admin && !auth.isAdmin) {
    return { name: 'dashboard' }
  }
})

export default router
```

---

## main.ts

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

---

## Page-by-page specifications

### 1. LoginPage.vue

**Layout:** Centered card (max-w-sm) on a clean background. No Navbar.

**State:**
```ts
const isLogin = ref(true)           // Toggle between login / register
const username = ref('')
const email = ref('')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const loading = ref(false)
```

**Login form fields:** Username, Password, "Sign in" button (primary blue)
**Register form fields:** First name, Last name, Email, Username, Password, "Create account" button
**Toggle link** at the bottom: "Don't have an account? Register" / "Already registered? Sign in"

**Behavior:**
- On submit, call `authStore.login()` or `authStore.register()`
- On success, `router.push('/')`
- On error, show toast: `toast.error('Invalid credentials')`
- Show loading spinner on button during API call

---

### 2. DashboardPage.vue — Main page

This is the core page. It has 4 vertical sections:

**Section A — DateTimePicker.vue**
- Blue highlighted container (`bg-primary-light rounded-xl p-4`)
- "When do you want to park?" heading
- **Date row:** Next 5 days as clickable pill buttons. Each shows day abbreviation + date. First (today) is selected by default (blue bg). Clicking another deselects current. A "More" button opens native `<input type="date">`.
- **Start time** `<select>`: 8:00 AM to 4:00 PM in 1h increments. Default 9:00 AM
- **End time** `<select>`: 12:00 PM to 9:00 PM in 1h increments. Default 5:00 PM
- **Duration** display: Auto-computed from start/end, shown in bordered box
- **"Find spots" button**: Emits event to parent with `{ date, startTime, endTime }`

```ts
// Emits
defineEmits<{
  search: [payload: { date: string; startTime: string; endTime: string }]
}>()
```

**Section B — Stat cards row**
4 `StatCard` components:
- "Available" — `summary.available` in green + "of {summary.total}"
- "Free in next 3h" — `summary.opening_soon` in blue
- "Est. cost" — computed `₹{bookingStore.totalAmount}` 
- "Your selection" — `bookingStore.selectedSpot?.label` or "None"

**Section C — ParkingGrid.vue + BookingSidebar.vue**
Left side: Two grids separated by zone labels ("Zone A — Near gate 1", "Zone B — Near elevator")
- Each `SpotCard.vue` receives `spot: Spot` prop
- Color logic:
  ```ts
  const spotColor = computed(() => {
    if (props.spot.label === bookingStore.selectedSpot?.label) return 'bg-warning'    // amber
    switch (props.spot.status) {
      case 'available': return 'bg-success'     // green
      case 'occupied': return 'bg-danger'       // red
      case 'opening_soon': return 'bg-primary'  // blue
      default: return 'bg-gray-400'
    }
  })
  ```
- Red spots: `opacity-75 cursor-not-allowed`, no click handler
- Green/blue spots: `cursor-pointer hover:scale-110 transition-transform`, on click → `bookingStore.selectedSpot = spot`
- Grid: `grid grid-cols-6 gap-1`
- Legend row above grid with colored dots + filter pills

Right side: `BookingSidebar.vue` (v-if `bookingStore.selectedSpot`)
- Spot label heading
- Date, time, duration (read from bookingStore)
- Vehicle `<select>` populated from `vehicleService.getAll()`
- Price breakdown: Base (duration × ₹20), GST (18%), Total
- "Pay ₹{total}" button:
  1. Call `reservationService.create({ spot_id, vehicle_id, start_time, end_time })`
  2. On success → `router.push({ name: 'payment', params: { reservationId: res.id } })`
- "Secured by Razorpay" small text

**Section D — Amenity strip**
- 4 `AmenityCard` components in a flex row
- Icon per category: petrol = map pin, ev = lightning bolt, cafe = coffee cup, pharmacy = plus-circle
- Icon background colors: petrol = warning-light, ev = primary-light, cafe = danger-light, pharmacy = success-light
- Show: name, distance, open/closed status

**Dashboard data fetching:**
```ts
// In DashboardPage.vue setup
const spots = ref<Spot[]>([])
const amenities = ref<Amenity[]>([])
const summary = ref({ total: 0, available: 0, occupied: 0, opening_soon: 0 })
const vehicles = ref<Vehicle[]>([])

onMounted(async () => {
  amenities.value = await amenityService.getAll()
  vehicles.value = await vehicleService.getAll()
})

async function handleSearch(payload: { date: string; startTime: string; endTime: string }) {
  bookingStore.selectedDate = payload.date
  bookingStore.startTime = payload.startTime
  bookingStore.endTime = payload.endTime
  bookingStore.selectedSpot = null

  const res = await spotService.getAvailability(payload.date, payload.startTime, payload.endTime)
  spots.value = res.spots
  summary.value = res.summary
}
```

---

### 3. PaymentPage.vue

**Props:** `reservationId: string` (from route param)

**Layout:** StepProgress at top (step 1 done, step 2 active, step 3 pending). Two-column layout below.

**Left — Order summary card:**
- Fetch reservation: `GET /api/reservations/{id}/`
- Display: Spot label + zone, date + time, vehicle, duration, price breakdown

**Right — Razorpay trigger:**
- On mount, call `paymentService.createOrder(reservationId)` to get `{ order_id, amount, key_id }`
- Show payment method options (UPI selected by default, Card, Net banking, Wallet) as styled radio buttons — these are visual only, Razorpay handles the actual method selection
- "Pay ₹XXX" green button triggers Razorpay:

```ts
function openRazorpay() {
  const options = {
    key: orderData.value!.key_id,
    amount: orderData.value!.amount,
    currency: 'INR',
    name: 'ParkWise',
    description: `Parking — Spot ${reservation.value!.spot.label}`,
    order_id: orderData.value!.order_id,
    handler: async (response: any) => {
      try {
        await paymentService.verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
        toast.success('Payment successful!')
        router.push({ name: 'confirmation', params: { reservationId: props.reservationId } })
      } catch {
        toast.error('Payment verification failed')
      }
    },
    prefill: {
      name: authStore.user?.first_name,
      email: authStore.user?.email,
    },
    theme: { color: '#378ADD' }
  }

  const rzp = new window.Razorpay(options)
  rzp.open()
}
```

---

### 4. ConfirmationPage.vue

**Props:** `reservationId: string`

**Layout:** StepProgress at top (all 3 done, green). Centered content below.

**Content:**
- Green checkmark icon (success circle)
- "Booking confirmed!" heading in green
- "Order #PKW-{reservationId}" subtitle
- Details grid: Spot, Vehicle, Time, Amount paid
- QR code: `<QRCodeDisplay :value="'PKW-' + reservationId" />`
- "Show this QR at entry gate" text
- Two buttons: "Download receipt" (outline) + "My bookings" (primary, links to `/bookings`)
- Cancellation policy notice in amber box

**QRCodeDisplay.vue:**
```vue
<template>
  <div class="bg-white rounded-lg p-2 inline-block border">
    <QRCodeVue3 :value="value" :width="80" :height="80" />
  </div>
</template>

<script setup lang="ts">
import QRCodeVue3 from 'qrcode.vue3'
defineProps<{ value: string }>()
</script>
```

---

### 5. BookingsPage.vue

**Layout:** Heading + filter tabs + booking cards grid.

**Filter tabs:** "Active" (blue pill, selected), "Completed" (gray), "Cancelled" (gray). Click to filter.

```ts
const activeTab = ref<'active' | 'completed' | 'cancelled'>('active')
const reservations = ref<Reservation[]>([])

onMounted(async () => {
  reservations.value = await reservationService.getAll()
})

const filtered = computed(() =>
  reservations.value.filter(r => r.status === activeTab.value)
)
```

**BookingCard.vue** for each reservation:
- Spot label + zone, date + time
- Vehicle plate number
- Status badge (green for active, gray for completed, red for cancelled)
- **If active:** CountdownTimer + QR code + Cancel button
- **If completed:** "Completed on {date}" text
- Amount paid

**CountdownTimer.vue:**
```ts
const props = defineProps<{ endTime: string }>()

const remaining = ref('')

onMounted(() => {
  const interval = setInterval(() => {
    const end = new Date(props.endTime).getTime()
    const now = Date.now()
    const diff = end - now

    if (diff <= 0) {
      remaining.value = 'Expired'
      clearInterval(interval)
      return
    }

    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    remaining.value = `${hours}h ${mins}m remaining`
  }, 1000)

  onUnmounted(() => clearInterval(interval))
})
```

**Cancel button:** Confirm with `window.confirm()`, then call `reservationService.cancel(id)`, show toast, refresh list.

---

### 6. NearbyPage.vue

**Layout:** Heading + 2-column grid of AmenityCard components.

Fetch amenities on mount. Each card shows:
- Category icon (colored rounded square)
- Name (bold)
- Distance + landmark
- Status badge: "Open now" (green) or "Closed" (red)
- Operating hours

**Category icon mapping:**
```ts
const iconConfig: Record<string, { bg: string; color: string }> = {
  petrol: { bg: 'bg-warning-light', color: 'text-warning-dark' },
  ev: { bg: 'bg-primary-light', color: 'text-primary-dark' },
  cafe: { bg: 'bg-danger-light', color: 'text-danger-dark' },
  pharmacy: { bg: 'bg-success-light', color: 'text-success-dark' },
  atm: { bg: 'bg-purple-100', color: 'text-purple-800' },
}
```

---

### 7. ProfilePage.vue

**Layout:** Two columns — main content (left) + sidebar (right).

**Left column (3 stacked cards):**

**Card 1 — User info:**
- Avatar circle with initials (from authStore)
- Full name, email, phone
- "Member since {date}" in muted text
- "Edit" button (opens inline editing or modal — keep it simple, inline is fine)

**Card 2 — My vehicles:**
- Header with "My vehicles" + "+ Add" button
- List of `VehicleCard.vue` components
- Default vehicle has blue border + "Default" badge
- Non-default vehicles have "Set default" link
- Each card: plate number, model + color, type + fuel
- Add vehicle: simple form modal or inline expandable form with fields: plate_number, model_name, color, vehicle_type, fuel_type

**Card 3 — Preferences:**
- "Booking reminders" — toggle switch (just UI, store in localStorage)
- "Expiry alerts" — toggle switch
- "Preferred zone" — `<select>` dropdown (Zone A / Zone B / Any)

**Right sidebar (2 cards):**

**Card 1 — Parking stats:**
Fetch from `reservationService.getStats()`. Four `StatCard` components stacked:
- Total bookings (number)
- Hours parked (blue number + "h")
- Cancellations (red number)
- Favourite spot (green, spot label)

**Card 2 — Recent activity:**
Show last 4 reservation events as a timeline:
- Green dot = booked
- Gray dot = completed
- Red dot = cancelled
- Each: action text + timestamp

---

### 8. AdminPage.vue

**Route guard:** Only accessible if `authStore.isAdmin` is true.

**Layout:** Heading with "Admin" badge + stats row + reservations table.

**Stat cards row (4 cards):**
Fetch from `/api/admin/stats/`:
- Total users
- Active bookings (blue)
- Revenue today (green, ₹ formatted)
- Occupancy % (red)

**Reservations table:**
Fetch from `/api/admin/reservations/`. Columns:
- User (name)
- Spot (label)
- Vehicle (plate)
- Time (formatted)
- Amount (₹, green for paid)
- Status (colored badge)

**Search input** above table: filters client-side by user name or spot label.

```ts
const searchQuery = ref('')

const filteredReservations = computed(() => {
  if (!searchQuery.value) return allReservations.value
  const q = searchQuery.value.toLowerCase()
  return allReservations.value.filter(r =>
    r.user_name?.toLowerCase().includes(q) ||
    r.spot.label.toLowerCase().includes(q)
  )
})
```

---

## Component design guidelines

### Color system
- **Primary blue:** #378ADD (buttons, links, active states, "opening soon" spots)
- **Success green:** #1D9E75 (available spots, active badges, paid amounts, open status)
- **Danger red:** #E24B4A (occupied spots, cancel buttons, cancelled badges)
- **Warning amber:** #EF9F27 (selected spot, info notices, cancellation policy box)
- Use `-light` variants for badge backgrounds (e.g., `bg-success-light text-success-dark`)
- Use `-dark` variants for text on light backgrounds

### Tailwind patterns used throughout
```
// Stat card
bg-gray-50 rounded-lg p-3

// Raised card
bg-white border border-gray-200 rounded-xl p-3

// Primary button
bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-dark transition

// Outline button
border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition

// Badge
text-xs px-2 py-0.5 rounded-full font-medium

// Filter pill (active)
text-xs px-3 py-1 rounded-full border border-primary text-primary-dark bg-primary-light

// Filter pill (inactive)
text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer

// Grid spot
rounded text-white text-xs font-medium py-2 text-center cursor-pointer hover:scale-110 transition-transform
```

### Toast notifications
Use `vue-sonner` for all notifications:
```ts
import { toast } from 'vue-sonner'

toast.success('Booking confirmed!')
toast.error('Payment failed')
toast('Spot A6 selected')
```

Show toasts for: login success, registration success, booking created, payment verified, booking cancelled, errors.

---

## Navbar.vue

Shown on all pages except LoginPage. Use `v-if="authStore.isAuthenticated"` in App.vue.

```vue
<template>
  <nav class="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
    <router-link to="/" class="flex items-center gap-2">
      <div class="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-medium">P</div>
      <span class="text-base font-medium">ParkWise</span>
    </router-link>

    <div class="flex items-center gap-3 text-sm">
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="px-2 py-1 rounded-lg"
        :class="$route.name === link.name
          ? 'bg-primary-light text-primary-dark font-medium'
          : 'text-gray-500 hover:bg-gray-50'"
      >
        {{ link.label }}
      </router-link>

      <div v-if="authStore.isAdmin"
        class="ml-1">
        <router-link to="/admin"
          class="px-2 py-1 rounded-lg"
          :class="$route.name === 'admin'
            ? 'bg-primary-light text-primary-dark font-medium'
            : 'text-gray-500 hover:bg-gray-50'"
        >Admin</router-link>
      </div>

      <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 cursor-pointer"
           @click="router.push('/profile')">
        {{ authStore.initials }}
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const navLinks = [
  { to: '/', name: 'dashboard', label: 'Dashboard' },
  { to: '/bookings', name: 'bookings', label: 'My bookings' },
  { to: '/nearby', name: 'nearby', label: 'Nearby' },
  { to: '/profile', name: 'profile', label: 'Profile' },
]
</script>
```

---

## App.vue

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar v-if="authStore.isAuthenticated" />
    <main class="max-w-5xl mx-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import Navbar from '@/components/Navbar.vue'
import { Toaster } from 'vue-sonner'

const authStore = useAuthStore()
</script>
```

---

## Quick start commands

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Proxies `/api` requests to Django at `http://localhost:8000`.
