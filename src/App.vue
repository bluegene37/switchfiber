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

// Determine layout based on route path metadata
const layout = computed(() => {
  if (route.meta.requiresAuth) return AppLayout
  return AuthLayout // default fallback for login/public pages
})
</script>
