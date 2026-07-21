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
          <!-- Item with no children -->
          <router-link 
            v-if="!item.children"
            :to="item.path" 
            class="nav-link d-flex align-items-center rounded text-body opacity-75 sidebar-link"
            active-class="bg-primary text-white opacity-100 active-link"
            exact-active-class="bg-primary text-white opacity-100 active-link"
            @click="$emit('close')"
          >
            <i :class="['pi', item.icon, 'text-center me-3']" style="width: 24px;"></i>
            <span class="small fw-semibold">{{ item.name }}</span>
          </router-link>

          <!-- Item with children -->
          <div v-else>
            <div 
              class="nav-link d-flex align-items-center justify-content-between rounded sidebar-link"
              :class="item.expanded ? 'text-primary fw-bold bg-body-tertiary' : 'text-body opacity-75 fw-semibold'"
              style="cursor: pointer; user-select: none;"
              @click="item.expanded = !item.expanded"
            >
              <div class="d-flex align-items-center">
                <i :class="['pi', item.icon, 'text-center me-3']" style="width: 24px;"></i>
                <span>{{ item.name }}</span>
              </div>
              <i :class="['pi', item.expanded ? 'pi-chevron-down' : 'pi-chevron-right']" style="font-size: 0.8rem;"></i>
            </div>
            
            <ul v-show="item.expanded" class="nav flex-column ps-3 ms-3 mt-2 mb-2 gap-1 border-start">
              <li class="nav-item" v-for="child in item.children" :key="child.name">
                <router-link 
                  :to="child.path" 
                  class="nav-link d-flex align-items-center rounded text-body opacity-75 sidebar-link py-1"
                  active-class="bg-primary text-white opacity-100 active-link"
                  exact-active-class="bg-primary text-white opacity-100 active-link"
                  @click="$emit('close')"
                >
                  <i :class="['pi', child.icon, 'text-center me-3']" style="width: 20px; font-size: 0.9rem;"></i>
                  <span class="small fw-semibold">{{ child.name }}</span>
                </router-link>
              </li>
            </ul>
          </div>
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
  { 
    name: 'File Maintenance', 
    icon: 'pi-folder',
    expanded: false,
    children: [
      { name: 'LCP', path: '/lcp', icon: 'pi-server' },
      { name: 'LCNAP', path: '/lcnap', icon: 'pi-sitemap' },
      { name: 'LCNAP PORT', path: '/lcnap_port', icon: 'pi-share-alt' },
      { name: 'NAP', path: '/nap', icon: 'pi-box' },
      { name: 'PORT', path: '/port', icon: 'pi-link' },
      { name: 'VLAN', path: '/vlan', icon: 'pi-globe' },
      { name: 'ROUTER', path: '/router', icon: 'pi-wifi' },
    ]
  },
  { 
    name: 'User', 
    icon: 'pi-users',
    expanded: false,
    children: [
      { name: 'USER', path: '/user', icon: 'pi-user' },
      { name: 'MENU', path: '/menu', icon: 'pi-list' },
      { name: 'ACCESS LEVEL', path: '/access_level', icon: 'pi-shield' },
      { name: 'ACCESS LEVEL MENU', path: '/access_level_menu', icon: 'pi-key' },
    ]
  },
  { 
    name: 'Transaction', 
    icon: 'pi-wallet',
    expanded: false,
    children: [
      { name: 'JOB ORDER', path: '/job_order', icon: 'pi-clipboard' },
      { name: 'INVOICE', path: '/invoice', icon: 'pi-receipt' },
      { name: 'BILLING', path: '/billing', icon: 'pi-credit-card' },
    ]
  },
  // { name: 'Billing', path: '/billing', icon: 'pi-credit-card' },
  // { name: 'Network Monitoring', path: '/monitoring', icon: 'pi-chart-line' },
  // { name: 'Settings', path: '/settings', icon: 'pi-cog' }
  { name: 'API Viewer', path: '/data-viewer', icon: 'pi-database' },
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
