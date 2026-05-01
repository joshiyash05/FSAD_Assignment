<template>
  <div class="bg-white rounded-lg p-2 inline-block border">
    <img v-if="dataUrl" :src="dataUrl" :alt="value" :width="size" :height="size" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'

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
    // keep console error for debugging
    // eslint-disable-next-line no-console
    console.error('QR generation failed', err)
  }
}

onMounted(generate)
watch(() => props.value, generate)
</script>
