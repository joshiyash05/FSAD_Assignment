<template>
  <div class="legend p-d-flex p-ai-center p-gap-3 p-mb-2">
    <Tag value="Available" severity="success" class="p-mr-2" />
    <Tag value="Opening soon" severity="info" class="p-mr-2" />
    <Tag value="Occupied" severity="danger" />
  </div>
</template>

<script setup lang="ts">
import Tag from 'primevue/tag'
</script>

<style scoped>
.legend{ }
</style>
