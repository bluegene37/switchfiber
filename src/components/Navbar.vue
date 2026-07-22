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

      <!-- Profile Dropdown Menu Trigger -->
      <div class="position-relative">
        <div 
          class="d-flex align-items-center ms-2 p-1 rounded-3 hover-bg-light" 
          style="cursor: pointer; user-select: none;"
          @click="toggleProfileMenu"
        >
          <img class="rounded-circle border border-2 border-primary border-opacity-25" src="https://i.pravatar.cc/150?img=11" alt="User avatar" width="34" height="34" />
          <div class="ms-2 d-none d-md-block text-start">
            <div class="small fw-bold text-body lh-1">{{ userDisplayName }}</div>
            <div class="text-secondary mt-1" style="font-size: 0.7rem;">{{ userRole }}</div>
          </div>
          <i class="pi pi-chevron-down ms-2 text-secondary small d-none d-md-block" style="font-size: 0.75rem;"></i>
        </div>

        <Menu ref="profileMenu" :model="menuItems" :popup="true" />
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ThemeSwitcher from './ThemeSwitcher.vue'
import Menu from 'primevue/menu'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const profileMenu = ref(null)

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

const toggleProfileMenu = (event) => {
  if (profileMenu.value) {
    profileMenu.value.toggle(event)
  }
}

const menuItems = ref([
  {
    label: 'Account',
    items: [
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => {
          router.push('/user')
        }
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => {
          authStore.logout()
          router.push('/login')
        }
      }
    ]
  }
])
</script>
