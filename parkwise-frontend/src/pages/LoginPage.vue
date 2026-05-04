<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import { useAuthStore } from '@/stores/auth'
import type { RegisterRequest } from '@/types/index'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

const isRegistering = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive<RegisterRequest>({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
})

function redirectAfterAuth() {
  router.push((route.query.redirect as string) || '/')
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    errorMessage.value = 'Please enter your username and password.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    await authStore.login(loginForm.username, loginForm.password)
    toast.add({ severity: 'success', summary: 'Welcome back', detail: 'Logged in successfully.', life: 2500 })
    redirectAfterAuth()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed.'
    toast.add({ severity: 'error', summary: 'Login failed', detail: errorMessage.value, life: 4500 })
  } finally {
    isLoading.value = false
  }
}

async function handleRegister() {
  if (!registerForm.username || !registerForm.email || !registerForm.password) {
    errorMessage.value = 'Username, email, and password are required.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    await authStore.register(registerForm)
    toast.add({ severity: 'success', summary: 'Account created', detail: 'Welcome to ParkWise.', life: 2500 })
    redirectAfterAuth()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Registration failed.'
    toast.add({ severity: 'error', summary: 'Registration failed', detail: errorMessage.value, life: 4500 })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <Card class="auth-card">
      <template #content>
        <div class="brand-lockup">
          <span class="brand-mark"><i class="pi pi-car" /></span>
          <h1>ParkWise</h1>
          <p>Reserve smart parking with live availability.</p>
        </div>

        <div class="auth-toggle">
          <Button label="Sign in" :outlined="isRegistering" :disabled="isLoading" @click="isRegistering = false" />
          <Button label="Create account" :outlined="!isRegistering" :disabled="isLoading" @click="isRegistering = true" />
        </div>

        <form v-if="!isRegistering" class="form-stack" @submit.prevent="handleLogin">
          <span class="p-float-label">
            <InputText id="username" v-model="loginForm.username" class="w-full" :disabled="isLoading" autocomplete="username" />
            <label for="username">Username</label>
          </span>
          <span class="p-float-label">
            <Password id="password" v-model="loginForm.password" class="w-full" input-class="w-full" :feedback="false" :disabled="isLoading" toggle-mask autocomplete="current-password" />
            <label for="password">Password</label>
          </span>
          <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
          <Button label="Sign in" icon="pi pi-sign-in" type="submit" :loading="isLoading" class="w-full" />
        </form>

        <form v-else class="form-stack" @submit.prevent="handleRegister">
          <div class="responsive-two">
            <span class="p-float-label">
              <InputText id="first" v-model="registerForm.first_name" class="w-full" :disabled="isLoading" />
              <label for="first">First name</label>
            </span>
            <span class="p-float-label">
              <InputText id="last" v-model="registerForm.last_name" class="w-full" :disabled="isLoading" />
              <label for="last">Last name</label>
            </span>
          </div>
          <span class="p-float-label">
            <InputText id="email" v-model="registerForm.email" class="w-full" type="email" :disabled="isLoading" autocomplete="email" />
            <label for="email">Email</label>
          </span>
          <span class="p-float-label">
            <InputText id="new-username" v-model="registerForm.username" class="w-full" :disabled="isLoading" autocomplete="username" />
            <label for="new-username">Username</label>
          </span>
          <span class="p-float-label">
            <Password id="new-password" v-model="registerForm.password" class="w-full" input-class="w-full" :disabled="isLoading" toggle-mask autocomplete="new-password" />
            <label for="new-password">Password</label>
          </span>
          <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
          <Button label="Create account" icon="pi pi-user-plus" type="submit" :loading="isLoading" class="w-full" />
        </form>
      </template>
    </Card>
  </section>
</template>
