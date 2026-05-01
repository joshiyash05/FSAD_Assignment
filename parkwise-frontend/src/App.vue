<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import Navbar from '@/components/Navbar.vue'
import { Toaster } from 'vue-sonner'

const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar v-if="authStore.isAuthenticated" />
    <main class="max-w-5xl mx-auto p-4">
      <router-view />
    </main>
    <Toaster position="top-right" />
  </div>
</template>
