<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from './layouts/AuthLayout.vue'
import AppLayout from './layouts/AppLayout.vue'

const route = useRoute()

// Determine layout based on route path
const layout = computed(() => {
  if (route.path === '/login') return AuthLayout
  // Use AppLayout for any known internal route
  if (['/dashboard', '/settings', '/api', '/connections', '/billing', '/monitoring'].some(p => route.path.startsWith(p))) return AppLayout
  return AuthLayout // default fallback
})
</script>
