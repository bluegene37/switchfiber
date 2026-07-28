<template>
  <aside 
    class="sidebar-wrapper d-flex flex-column flex-shrink-0 vh-100 shadow-sm border-end bg-body position-relative" 
    :style="{ width: isCollapsed ? '70px' : '250px', zIndex: 1050, transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }"
    :class="[
      isOpen ? 'transform-none' : 'transform-offcanvas',
      { 'is-collapsed': isCollapsed }
    ]"
  >
    <!-- Branding Header -->
    <div class="d-flex align-items-center justify-content-between px-3 border-bottom overflow-hidden" style="height: 64px; flex-shrink: 0;">
      <div class="d-flex align-items-center overflow-hidden gap-2">
        <img src="/favicon.svg" alt="Switch Fiber Logo" class="flex-shrink-0" style="width: 28px; height: 28px;" />
        <span v-if="!isCollapsed" class="text-body fs-5 fw-bold tracking-wide text-nowrap">Switch Fiber</span>
      </div>

      <!-- Desktop Collapse Toggle Button -->
      <button 
        type="button"
        @click="$emit('toggle-collapse')" 
        class="btn btn-sm btn-link text-secondary p-1 border-0 d-none d-md-flex align-items-center justify-content-center rounded-circle hover-bg ms-auto"
        :title="isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        style="width: 28px; height: 28px; text-decoration: none;"
      >
        <i :class="['pi', isCollapsed ? 'pi-angle-right' : 'pi-angle-left', 'fs-6']"></i>
      </button>
    </div>

    <!-- Navigation List -->
    <nav class="flex-grow-1 overflow-y-auto py-3 px-2">
      <ul class="nav flex-column gap-1 p-0 m-0">
        <li class="nav-item" v-for="item in menuItems" :key="item.name">
          <!-- Item with NO children -->
          <router-link 
            v-if="!item.children"
            :to="item.path" 
            class="nav-link d-flex align-items-center rounded text-body opacity-75 sidebar-link text-decoration-none py-2"
            :class="isCollapsed ? 'justify-content-center px-0' : 'px-2.5'"
            active-class="bg-primary text-white opacity-100 active-link"
            exact-active-class="bg-primary text-white opacity-100 active-link"
            :title="isCollapsed ? item.name : ''"
            @click="$emit('close')"
          >
            <i :class="['pi', item.icon, 'text-center', isCollapsed ? 'fs-5' : 'me-3']" style="width: 24px;"></i>
            <span v-if="!isCollapsed" class="small fw-semibold text-nowrap">{{ item.name }}</span>
          </router-link>

          <!-- Item WITH children -->
          <div v-else>
            <div 
              class="nav-link d-flex align-items-center rounded sidebar-link text-decoration-none py-2"
              :class="[
                item.expanded && !isCollapsed ? 'text-primary fw-bold bg-body-tertiary' : 'text-body opacity-75 fw-semibold',
                isCollapsed ? 'justify-content-center px-0' : 'justify-content-between px-2.5'
              ]"
              style="cursor: pointer; user-select: none;"
              :title="isCollapsed ? item.name : ''"
              @click="handleParentClick(item)"
            >
              <div class="d-flex align-items-center">
                <i :class="['pi', item.icon, 'text-center', isCollapsed ? 'fs-5' : 'me-3']" style="width: 24px;"></i>
                <span v-if="!isCollapsed" class="small fw-semibold text-nowrap">{{ item.name }}</span>
              </div>
              <i v-if="!isCollapsed" :class="['pi', item.expanded ? 'pi-chevron-down' : 'pi-chevron-right']" style="font-size: 0.75rem;"></i>
            </div>
            
            <!-- Submenu Items (visible only when expanded and not collapsed) -->
            <ul v-show="item.expanded && !isCollapsed" class="nav flex-column ps-3 ms-3 mt-1 mb-2 gap-1 border-start">
              <li class="nav-item" v-for="child in item.children" :key="child.name">
                <router-link 
                  :to="child.path" 
                  class="nav-link d-flex align-items-center rounded text-body opacity-75 sidebar-link text-decoration-none py-1.5 px-2"
                  active-class="bg-primary text-white opacity-100 active-link"
                  exact-active-class="bg-primary text-white opacity-100 active-link"
                  @click="$emit('close')"
                >
                  <i :class="['pi', child.icon, 'text-center me-2.5']" style="width: 18px; font-size: 0.85rem;"></i>
                  <span class="small fw-semibold text-nowrap">{{ child.name }}</span>
                </router-link>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </nav>
    
    <!-- Footer / Logout -->
    <div class="p-2 border-top bg-body">
      <button 
        type="button"
        @click="handleLogout" 
        class="btn w-100 d-flex align-items-center rounded-3 text-decoration-none bg-danger bg-opacity-10 text-danger hover-logout py-2"
        :class="isCollapsed ? 'justify-content-center px-0' : 'justify-content-center gap-2 px-3'"
        :title="isCollapsed ? 'Logout' : ''"
      >
        <i class="pi pi-sign-out" :class="isCollapsed ? 'fs-5' : ''"></i>
        <span v-if="!isCollapsed" class="small fw-bold">Logout</span>
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

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  isCollapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'toggle-collapse'])

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
      { name: 'LCNAP Port', path: '/lcnap_port', icon: 'pi-share-alt' },
      { name: 'NAP', path: '/nap', icon: 'pi-box' },
      { name: 'Port', path: '/port', icon: 'pi-link' },
      { name: 'VLan', path: '/vlan', icon: 'pi-globe' },
      { name: 'Router', path: '/router', icon: 'pi-wifi' },
      { name: 'Plan', path: '/plan', icon: 'pi-tag' },
      { name: 'Application', path: '/application', icon: 'pi-file' },
    ]
  },
  { 
    name: 'User', 
    icon: 'pi-users',
    expanded: false,
    children: [
      { name: 'User', path: '/user', icon: 'pi-user' },
      { name: 'Access Level', path: '/access_level', icon: 'pi-shield' },
    ]
  },
  { 
    name: 'Transaction', 
    icon: 'pi-wallet',
    expanded: false,
    children: [
      { name: 'Job Order', path: '/job_order', icon: 'pi-clipboard' },
      { name: 'Invoice', path: '/invoice', icon: 'pi-receipt' },
      { name: 'Billing', path: '/billing', icon: 'pi-credit-card' },
    ]
  },
])

const handleParentClick = (item) => {
  if (props.isCollapsed) {
    emit('toggle-collapse')
    item.expanded = true
  } else {
    item.expanded = !item.expanded
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar-link {
  transition: all 0.2s ease-in-out;
  text-decoration: none !important;
}
.sidebar-link:hover:not(.active-link) {
  background-color: var(--bs-secondary-bg);
  opacity: 1 !important;
  text-decoration: none !important;
}

.hover-logout {
  transition: all 0.2s ease-in-out;
  border: 1px solid rgba(220, 53, 69, 0.2) !important;
}
.hover-logout:hover {
  background-color: var(--bs-danger) !important;
  color: #ffffff !important;
  border-color: var(--bs-danger) !important;
}

.hover-bg:hover {
  background-color: var(--bs-secondary-bg);
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
