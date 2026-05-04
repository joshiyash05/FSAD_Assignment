<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Menubar from 'primevue/menubar'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const items = computed(() => [
  { label: 'Dashboard', icon: 'pi pi-th-large', command: () => router.push('/') },
  { label: 'Bookings', icon: 'pi pi-book', command: () => router.push('/bookings') },
  { label: 'Nearby', icon: 'pi pi-map-marker', command: () => router.push('/nearby') },
  { label: 'Profile', icon: 'pi pi-user', command: () => router.push('/profile') },
  ...(authStore.isAdmin ? [{ label: 'Admin', icon: 'pi pi-shield', command: () => router.push('/admin') }] : []),
])

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="topbar">
    <Menubar :model="items">
      <template #start>
        <button class="brand-button" type="button" @click="router.push('/')">
          <span class="brand-mark small"><i class="pi pi-car" /></span>
          <span>ParkWise</span>
        </button>
      </template>
      <template #item="{ item, props }">
        <a v-bind="props.action" class="nav-menu-link">
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </a>
      </template>
      <template #end>
        <div class="topbar-actions">
          <Avatar :label="authStore.initials" shape="circle" class="profile-avatar" />
          <Button icon="pi pi-sign-out" text rounded aria-label="Logout" @click="logout" />
        </div>
      </template>
    </Menubar>
  </header>
</template>
