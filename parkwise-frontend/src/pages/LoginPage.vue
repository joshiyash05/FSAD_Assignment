<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-sm w-full bg-white rounded-xl p-6 shadow">
      <h2 class="text-xl font-semibold mb-4">Sign in</h2>
      <form @submit.prevent="onSubmit">
        <input v-model="username" placeholder="Username" class="w-full mb-2 p-2 border rounded" />
        <input type="password" v-model="password" placeholder="Password" class="w-full mb-4 p-2 border rounded" />
        <button class="bg-primary text-white rounded-lg px-4 py-2 w-full">Sign in</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()

async function onSubmit() {
  try {
    await authStore.login(username.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (err) {
    // silent for scaffold
    console.error(err)
  }
}
</script>
