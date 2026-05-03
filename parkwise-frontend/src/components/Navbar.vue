<template>
  <nav class="N">
    <div class="NL">
      <div class="NI">P</div>
      <span class="NT">ParkWise</span>
    </div>

    <div class="NR">
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="NB"
        :class="$route.name === link.name ? 'NA' : ''"
      >
        {{ link.label }}
      </router-link>

      <router-link v-if="authStore.isAdmin" to="/admin" class="NB" :class="$route.name === 'admin' ? 'NA' : ''">Admin</router-link>

      <div class="AV" @click="goProfile">{{ authStore.initials }}</div>
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
