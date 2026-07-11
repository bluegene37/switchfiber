<template>
  <header class="bg-body border-bottom d-flex align-items-center justify-content-between px-3 px-md-4 shadow-sm" style="height: 64px; z-index: 1030;">
    <!-- Left side: Mobile Menu Toggle & Search -->
    <div class="d-flex align-items-center flex-grow-1">
      <button @click="$emit('toggle-sidebar')" class="btn btn-link text-secondary d-md-none me-3 p-0 text-decoration-none">
        <i class="pi pi-bars fs-5"></i>
      </button>
      
      <div class="position-relative d-none d-sm-block w-100" style="max-width: 400px;">
        <span class="position-absolute top-50 start-0 translate-middle-y ps-3">
          <i class="pi pi-search text-secondary"></i>
        </span>
        <input 
          type="text" 
          class="form-control ps-5 bg-body-tertiary" 
          placeholder="Search customers, IP addresses, invoices..." 
        />
      </div>
    </div>

    <!-- Right side: Notifications & Profile -->
    <div class="d-flex align-items-center ms-3 gap-3">
      <!-- Network Status -->
      <div class="d-none d-lg-flex align-items-center gap-2 px-3 py-1 bg-success bg-opacity-10 text-success rounded-pill border border-success border-opacity-25">
        <div class="spinner-grow spinner-grow-sm text-success" role="status" style="width: 0.5rem; height: 0.5rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="small fw-semibold" style="font-size: 0.75rem;">Systems Operational</span>
      </div>

      <!-- Theme Switcher -->
      <ThemeSwitcher />

      <!-- Notifications -->
      <button class="btn btn-link text-secondary position-relative p-1 text-decoration-none">
        <i class="pi pi-bell fs-5"></i>
        <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
          <span class="visually-hidden">New alerts</span>
        </span>
      </button>

      <!-- Profile Dropdown (Dummy visual for now) -->
      <div class="d-flex align-items-center ms-2" style="cursor: pointer;">
        <img class="rounded-circle border" src="https://i.pravatar.cc/150?img=11" alt="User avatar" width="32" height="32" />
        <span class="ms-2 d-none d-md-block small fw-medium text-body">
          {{ user?.name || 'Admin User' }}
        </span>
        <i class="pi pi-angle-down ms-1 text-secondary small d-none d-md-block"></i>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import ThemeSwitcher from './ThemeSwitcher.vue'

defineEmits(['toggle-sidebar'])

const authStore = useAuthStore()
const user = computed(() => authStore.user)
</script>
