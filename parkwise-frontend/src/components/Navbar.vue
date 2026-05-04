<template>
  <div class="p-d-flex p-jc-between p-ai-center p-px-3 p-py-2 nav">
    <div class="p-d-flex p-ai-center">
      <div class="logo p-mr-2">P</div>
      <div class="title">ParkWise</div>
    </div>

    <div class="p-d-flex p-ai-center p-gap-3">
      <Button v-for="link in navLinks" :key="link.to" :label="link.label" class="p-button-text" @click="() => go(link.to)" />

      <Button v-if="authStore.isAdmin" label="Admin" class="p-button-text" @click="() => go('/admin')" />

      <Avatar :label="authStore.initials" shape="circle" class="p-ml-2" @click="goProfile" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'

const authStore = useAuthStore()
const router = useRouter()

const navLinks = [
  { to: '/', name: 'dashboard', label: 'Dashboard' },
  { to: '/bookings', name: 'bookings', label: 'My bookings' },
  { to: '/nearby', name: 'nearby', label: 'Nearby' },
  { to: '/profile', name: 'profile', label: 'Profile' },
]

function goProfile() { router.push('/profile') }
function go(path: string) { router.push(path) }
</script>

<style scoped>
.nav{background:white;border-bottom:1px solid #eef2f6}
.logo{width:36px;height:36px;background:#378ADD;color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700}
.title{font-weight:700}
</style>
