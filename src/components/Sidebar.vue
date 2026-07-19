<template>
  <aside 
    class="sidebar-wrapper d-md-flex flex-column flex-shrink-0 vh-100 shadow-sm border-end bg-body" 
    style="width: 250px; z-index: 1050; transition: transform 0.3s ease-in-out;"
    :class="isOpen ? 'transform-none' : 'transform-offcanvas'"
  >
    <!-- Branding -->
    <div class="d-flex align-items-center px-4 border-bottom" style="height: 64px;">
      <i class="pi pi-bolt text-primary fs-5 me-2"></i>
      <span class="text-body fs-5 fw-bold tracking-wide">Switch Fiber</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-grow-1 overflow-y-auto py-3">
      <ul class="nav flex-column px-2 gap-1">
        <li class="nav-item" v-for="item in menuItems" :key="item.name">
          <router-link 
            :to="item.path" 
            class="nav-link d-flex align-items-center rounded text-body opacity-75 sidebar-link"
            active-class="bg-primary text-white opacity-100 active-link"
            exact-active-class="bg-primary text-white opacity-100 active-link"
            @click="$emit('close')"
          >
            <i :class="['pi', item.icon, 'text-center me-3']" style="width: 24px;"></i>
            <span class="small fw-semibold">{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
    
    <!-- Footer / Logout -->
    <div class="p-3 border-top">
      <button @click="handleLogout" class="btn btn-link nav-link w-100 d-flex align-items-center text-start text-body opacity-75 rounded sidebar-link">
        <i class="pi pi-sign-out text-center me-3" style="width: 24px;"></i>
        <span class="small fw-semibold">Logout</span>
      </button>
    </div>
  </aside>

  <!-- Overlay for mobile when sidebar is open -->
  <div 
    v-if="isOpen" 
    class="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none" 
    style="z-index: 1040;" 
    @click="$emit('close')"
  ></div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const router = useRouter()
const authStore = useAuthStore()

const menuItems = ref([
  { name: 'Dashboard', path: '/dashboard', icon: 'pi-objects-column' },
  { name: 'API Viewer', path: '/data-viewer', icon: 'pi-database' },
  { name: 'Connection Manager', path: '/connections', icon: 'pi-users' },
  { name: 'Billing', path: '/billing', icon: 'pi-credit-card' },
  { name: 'Network Monitoring', path: '/monitoring', icon: 'pi-chart-line' },
  { name: 'Settings', path: '/settings', icon: 'pi-cog' }
])

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar-link {
  transition: all 0.2s;
}
.sidebar-link:hover:not(.active-link) {
  background-color: var(--bs-secondary-bg);
  opacity: 1 !important;
}

.sidebar-wrapper {
  position: fixed;
}
.transform-offcanvas {
  transform: translateX(-100%);
}
.transform-none {
  transform: translateX(0);
}

@media (min-width: 768px) {
  .sidebar-wrapper {
    position: static;
  }
  .transform-offcanvas {
    transform: none;
  }
}
</style>
