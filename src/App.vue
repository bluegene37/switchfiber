<template>
  <!-- Crash screen: without this, an uncaught render error leaves a blank page
       with no way back other than a manual reload. -->
  <div v-if="fatalError" class="min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center p-4">
    <div class="card shadow-lg border-0 rounded-4 p-4 p-sm-5 bg-body text-center" style="width: 100%; max-width: 480px;">
      <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mb-3 mx-auto" style="width: 64px; height: 64px;">
        <i class="pi pi-exclamation-triangle text-danger" style="font-size: 1.75rem;"></i>
      </div>
      <h1 class="fw-bolder text-body mb-1 fs-4">Something went wrong</h1>
      <p class="small text-secondary mb-4">
        The screen failed to load. Reloading usually clears it — if it keeps happening, send this message to your administrator.
      </p>
      <pre class="bg-body-tertiary border rounded-3 p-2 small text-start text-secondary mb-4 overflow-auto" style="max-height: 140px;">{{ fatalError }}</pre>
      <button type="button" class="btn btn-primary fw-semibold px-4" @click="reload">
        <i class="pi pi-refresh me-2"></i>Reload
      </button>
    </div>
  </div>

  <component v-else :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { computed, ref, onErrorCaptured } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from './layouts/AuthLayout.vue'
import AppLayout from './layouts/AppLayout.vue'

const route = useRoute()
const fatalError = ref(null)

// Determine layout based on route path metadata
const layout = computed(() => {
  if (route.meta.requiresAuth) return AppLayout
  return AuthLayout // default fallback for login/public pages
})

onErrorCaptured((err) => {
  fatalError.value = err?.message || String(err)
  console.error('[SwitchFiber] Unhandled component error:', err)
  return false
})

const reload = () => window.location.reload()
</script>
