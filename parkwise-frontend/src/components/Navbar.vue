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
           @click="goProfile">
        {{ authStore.initials }}
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const navLinks = [
  { to: '/', name: 'dashboard', label: 'Dashboard' },
  { to: '/bookings', name: 'bookings', label: 'My bookings' },
  { to: '/nearby', name: 'nearby', label: 'Nearby' },
  { to: '/profile', name: 'profile', label: 'Profile' },
]

function goProfile() {
  router.push('/profile')
}
</script>
