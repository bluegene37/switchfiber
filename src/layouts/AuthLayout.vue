<template>
  <div class="position-relative min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center p-4 sfa-tracker-auth-layout-shell">
    <div class="position-absolute top-0 end-0 p-3 p-sm-4">
      <ThemeSwitcher />
    </div>
    
    <!-- <router-view /> -->
    <!-- Gene - Nov, 22, 2026: Show branded loading indicator while initial route, permissions, or lazy page chunk is still resolving instead of a blank screen -->
    <router-view v-slot="{ Component }">
      <component v-if="Component" :is="Component" />
      <div
        v-else
        class="d-flex flex-column align-items-center justify-content-center text-center sfa-tracker-auth-layout-loader"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3 shadow-sm p-2"
          style="width: 64px; height: 64px;"
        >
          <img :src="logoUrl" alt="SwitchFiber Logo" width="40" height="40" style="object-fit: contain;" />
        </div>
        <div class="spinner-border text-primary mb-3" style="width: 2rem; height: 2rem;" aria-hidden="true"></div>
        <p class="fw-semibold text-body mb-1">Loading SwitchFiber Admin…</p>
        <p class="small text-secondary mb-0">Please wait while the page is loading.</p>
      </div>
    </router-view>
  </div>
</template>

<script setup>
import ThemeSwitcher from '../components/ThemeSwitcher.vue'

// Gene - Nov, 22, 2026: Resolve logo path relative to Vite BASE_URL so it works under both / and subpath deployments
const logoUrl = `${import.meta.env.BASE_URL}logo.png`
</script>
