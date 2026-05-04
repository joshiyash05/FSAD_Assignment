<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import Navbar from '@/components/Navbar.vue'
import Toast from 'primevue/toast'

const authStore = useAuthStore()
</script>

<template>
  <div class="app-shell">
    <Navbar v-if="authStore.isAuthenticated" />
    <main class="app-main">
      <router-view />
    </main>
    <Toast position="top-right" />
  </div>
</template>
