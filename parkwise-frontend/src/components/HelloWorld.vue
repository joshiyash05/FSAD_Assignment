<script setup lang="ts">
import { ref } from 'vue'
import viteLogo from '../assets/vite.svg'
import heroImg from '../assets/hero.png'
import vueLogo from '../assets/vue.svg'
import Card from 'primevue/card'
import Button from 'primevue/button'

const count = ref(0)
</script>

<template>
  <section id="center">
    <Card class="hero-card p-mb-4 p-d-flex p-jc-between p-ai-center">
      <div class="p-d-flex p-ai-center">
        <img :src="heroImg" class="base" width="140" height="150" alt="" />
        <div class="p-ml-4">
          <h1>Get started</h1>
          <p>Edit <code>src/App.vue</code> and save to test <code>HMR</code></p>
        </div>
      </div>
      <div>
        <Button label="Count is {{count}}" class="p-button-outlined" @click="count++" />
      </div>
    </Card>

    <div class="ticks"></div>

    <section id="next-steps">
      <Card class="p-mb-3">
        <h2>Documentation</h2>
        <p>Your questions, answered</p>
        <ul>
          <li>
            <a href="https://vite.dev/" target="_blank">
              <img class="logo" :src="viteLogo" alt="" />
              Explore Vite
            </a>
          </li>
          <li>
            <a href="https://vuejs.org/" target="_blank">
              <img class="button-icon" :src="vueLogo" alt="" />
              Learn more
            </a>
          </li>
        </ul>
      </Card>

      <Card>
        <h2>Connect with us</h2>
        <p>Join the Vite community</p>
      </Card>
    </section>

    <div class="ticks"></div>
    <section id="spacer"></section>
  </section>
</template>
