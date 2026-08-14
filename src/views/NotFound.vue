<template>
  <div class="card shadow-lg border-0 rounded-4 p-4 p-sm-5 bg-body text-center" style="width: 100%; max-width: 480px;">
    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3 mx-auto" style="width: 64px; height: 64px;">
      <i class="pi pi-compass text-primary" style="font-size: 1.75rem;"></i>
    </div>

    <h1 class="fw-bolder text-body mb-1 fs-2">Page not found</h1>
    <p class="small text-secondary mb-4">
      <span class="font-monospace">{{ route.fullPath }}</span> does not match any screen in Switch Fiber.
    </p>

    <div class="d-flex flex-column flex-sm-row gap-2 justify-content-center">
      <router-link :to="homePath" class="btn btn-primary fw-semibold px-4">
        <i class="pi pi-home me-2"></i>{{ isAuthenticated ? 'Back to Dashboard' : 'Go to Sign in' }}
      </router-link>
      <button type="button" class="btn btn-outline-secondary fw-semibold px-4" @click="router.back()">
        <i class="pi pi-arrow-left me-2"></i>Go back
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const homePath = computed(() => (isAuthenticated.value ? '/dashboard' : '/login'))
</script>
