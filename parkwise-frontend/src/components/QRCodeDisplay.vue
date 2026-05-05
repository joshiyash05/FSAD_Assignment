<template>
  <Card class="qr-card">
    <template #content>
      <img v-if="dataUrl" :src="dataUrl" :alt="value" :width="size" :height="size" />
      <span v-else class="muted-label">QR unavailable</span>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import Card from 'primevue/card'

const props = defineProps<{ value: string; size?: number }>()
const dataUrl = ref<string>('')
const size = props.size ?? 80

async function generate() {
  if (!props.value) {
    dataUrl.value = ''
    return
  }
  try {
    dataUrl.value = await QRCode.toDataURL(props.value, { width: size, margin: 1 })
  } catch (err) {
    dataUrl.value = ''
    console.error('QR generation failed', err)
  }
}

onMounted(generate)
watch(() => props.value, generate)
</script>
