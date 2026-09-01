<template>
  <div class="d-flex flex-column align-items-center justify-content-center h-100 text-center sfa-tracker-coming-soon">
    <div class="mb-4">
      <i class="pi pi-compass text-secondary" style="font-size: 4rem; opacity: 0.5;"></i>
    </div>
    <h1 class="fs-3 fw-bold text-body">{{ pageTitle }}</h1>
    <p class="text-secondary mt-2 max-w-md">
      This module is currently under construction. Check back later for updates!
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Several routes share this placeholder, so the screen names itself from the
// route rather than leaving every unbuilt module looking identical.
const pageTitle = computed(() => route.meta?.title || 'Coming Soon')
</script>
