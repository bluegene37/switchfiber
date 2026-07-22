<template>
  <header class="bg-body border-bottom d-flex align-items-center justify-content-between px-3 px-md-4 shadow-sm position-relative" style="height: 64px; z-index: 1030;">
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

      <!-- Notifications -->
      <button class="btn btn-link text-secondary position-relative p-1 text-decoration-none">
        <i class="pi pi-bell fs-5"></i>
        <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
          <span class="visually-hidden">New alerts</span>
        </span>
      </button>

      <!-- Attached Profile Dropdown -->
      <div class="position-relative" ref="dropdownContainer">
        <div 
          class="d-flex align-items-center ms-2 px-2 py-1.5 rounded-3 user-chip" 
          :class="{ 'active-chip': isDropdownOpen }"
          style="cursor: pointer; user-select: none;"
          @click="isDropdownOpen = !isDropdownOpen"
        >
          <img class="rounded-circle border border-2 border-primary border-opacity-25" src="https://i.pravatar.cc/150?img=11" alt="User avatar" width="34" height="34" />
          <div class="ms-2 d-none d-md-block text-start">
            <div class="small fw-bold text-body lh-1">{{ userDisplayName }}</div>
            <div class="text-secondary mt-1" style="font-size: 0.7rem;">{{ userRole }}</div>
          </div>
          <i class="pi pi-chevron-down ms-2 text-secondary small d-none d-md-block chevron-icon" :class="{ 'rotate-180': isDropdownOpen }" style="font-size: 0.75rem;"></i>
        </div>

        <!-- Dropdown Card Floating Directly Under Avatar -->
        <Transition name="dropdown-fade">
          <div 
            v-if="isDropdownOpen" 
            class="position-absolute end-0 mt-2 p-2 shadow-lg border rounded-3 bg-body"
            style="min-width: 220px; z-index: 1100; top: 100%;"
          >
            <div class="px-3 py-2 border-bottom mb-1 bg-body-tertiary rounded-2">
              <div class="fw-bold small text-body">{{ userDisplayName }}</div>
              <div class="text-secondary small text-truncate" style="font-size: 0.75rem;">{{ user?.email || 'admin@switchfiber.com' }}</div>
            </div>
            
            <button 
              @click="goToSettings" 
              class="w-100 btn btn-link text-start text-body text-decoration-none d-flex align-items-center gap-2 rounded-2 py-2 px-3 hover-dropdown-item border-0"
            >
              <i class="pi pi-cog text-secondary"></i>
              <span class="small fw-medium">Settings</span>
            </button>

            <div class="dropdown-divider my-1"></div>

            <button 
              @click="handleLogout" 
              class="w-100 btn btn-link text-start text-danger text-decoration-none d-flex align-items-center gap-2 rounded-2 py-2 px-3 hover-logout-dropdown-item border-0"
            >
              <i class="pi pi-sign-out"></i>
              <span class="small fw-semibold">Logout</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const isDropdownOpen = ref(false)
const dropdownContainer = ref(null)

const userDisplayName = computed(() => {
  if (!user.value) return 'Admin User'
  if (user.value.username) return user.value.username
  if (user.value.fname) return `${user.value.fname} ${user.value.lname || ''}`.trim()
  return user.value.email || 'Admin User'
})

const userRole = computed(() => {
  if (!user.value) return 'Super Admin'
  return user.value.role || (user.value.accesslevel_id === 1 ? 'Super Admin' : 'User')
})

const handleClickOutside = (event) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const goToSettings = () => {
  isDropdownOpen.value = false
  router.push('/settings')
}

const handleLogout = () => {
  isDropdownOpen.value = false
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.user-chip {
  transition: all 0.2s ease-in-out;
}
.user-chip:hover, .active-chip {
  background-color: var(--bs-tertiary-bg, rgba(0,0,0,0.05));
}
.chevron-icon {
  transition: transform 0.2s ease-in-out;
}
.chevron-icon.rotate-180 {
  transform: rotate(180deg);
}

.hover-dropdown-item {
  transition: background-color 0.2s ease-in-out;
}
.hover-dropdown-item:hover {
  background-color: var(--bs-tertiary-bg, rgba(0,0,0,0.05)) !important;
}

.hover-logout-dropdown-item {
  transition: all 0.2s ease-in-out;
}
.hover-logout-dropdown-item:hover {
  background-color: var(--bs-danger) !important;
  color: #ffffff !important;
}
.hover-logout-dropdown-item:hover i {
  color: #ffffff !important;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
