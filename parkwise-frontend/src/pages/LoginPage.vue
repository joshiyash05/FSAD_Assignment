<template>
  <div class="P">
    <div class="A pw-center">
      <div style="width:310px">
        <div style="text-align:center;margin-bottom:1.5rem">
          <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:8px">
            <div class="NI" style="width:36px;height:36px;font-size:14px">P</div>
            <span style="font-size:20px;font-weight:500;color:var(--color-text-primary)">ParkWise</span>
          </div>
          <p style="font-size:13px;color:var(--color-text-secondary);margin:4px 0 0">Find, book, and pay for parking in seconds</p>
        </div>

        <div v-if="!showReg">
          <div style="margin-bottom:10px">
            <label class="SL">Email</label>
            <input v-model="username" type="text" placeholder="you@example.com" style="width:100%;font-size:13px;padding:8px 10px" />
          </div>
          <div style="margin-bottom:14px">
            <label class="SL">Password</label>
            <input v-model="password" type="password" placeholder="Enter password" style="width:100%;font-size:13px;padding:8px 10px" />
          </div>
          <button class="BP" @click="onSubmit">Sign in</button>
          <p style="text-align:center;font-size:12px;color:var(--color-text-secondary);margin:10px 0 0">Don't have an account? <span style="color:#0C447C;cursor:pointer" @click="showReg = true">Register</span></p>
        </div>

        <div v-else>
          <div style="margin-bottom:10px">
            <label class="SL">Full name</label>
            <input type="text" placeholder="Yash Kumar" style="width:100%;font-size:13px;padding:8px 10px" />
          </div>
          <div style="margin-bottom:10px">
            <label class="SL">Email</label>
            <input type="text" placeholder="you@example.com" style="width:100%;font-size:13px;padding:8px 10px" />
          </div>
          <div style="margin-bottom:10px">
            <label class="SL">Phone</label>
            <input type="text" placeholder="+91 98765 43210" style="width:100%;font-size:13px;padding:8px 10px" />
          </div>
          <div style="margin-bottom:14px">
            <label class="SL">Password</label>
            <input type="password" placeholder="Create password" style="width:100%;font-size:13px;padding:8px 10px" />
          </div>
          <button class="BP" @click="onSubmit">Create account</button>
          <p style="text-align:center;font-size:12px;color:var(--color-text-secondary);margin:10px 0 0">Already registered? <span style="color:#0C447C;cursor:pointer" @click="showReg = false">Sign in</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const showReg = ref(false)
const authStore = useAuthStore()
const router = useRouter()

async function onSubmit() {
  try {
    // keep existing login flow
    await authStore.login(username.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (err) {
    console.error(err)
  }
}
</script>
