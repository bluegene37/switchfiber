<template>
  <aside 
    class="sidebar-wrapper d-flex flex-column flex-shrink-0 vh-100 shadow-sm border-end bg-body position-relative" 
    :style="{ width: isCollapsed ? '60px' : '250px', zIndex: 1050, transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }"
    :class="[
      isOpen ? 'transform-none' : 'transform-offcanvas',
      { 'is-collapsed': isCollapsed }
    ]"
  >
    <!-- Branding Header -->
    <div 
      class="d-flex align-items-center border-bottom overflow-hidden" 
      :class="isCollapsed ? 'justify-content-center px-2' : 'px-3 gap-2.5'" 
      style="height: 60px; min-height: 60px; max-height: 60px; flex-shrink: 0; box-sizing: border-box;"
    >
      <img src="/favicon.svg" alt="Switch Fiber Logo" class="flex-shrink-0" style="width: 28px; height: 28px;" />
      <span v-if="!isCollapsed" class="text-body fs-4 fw-bold tracking-wide text-nowrap">Switch Fiber</span>
    </div>

    <!-- Navigation List -->
    <nav class="flex-grow-1 overflow-y-auto py-3 px-2">
      <!-- Loading State (Modern Skeleton Shimmer) -->
      <div v-if="isLoading" class="d-flex flex-column gap-2 px-1">
        <div 
          v-for="n in 5" 
          :key="n" 
          class="d-flex align-items-center py-2 px-2.5 rounded opacity-75"
          :class="isCollapsed ? 'justify-content-center px-0' : 'gap-3'"
        >
          <div class="skeleton-box rounded-2 flex-shrink-0" style="width: 22px; height: 22px;"></div>
          <div v-if="!isCollapsed" class="skeleton-box rounded-2 flex-grow-1" :style="{ height: '16px', maxWidth: `${70 + ((n * 9) % 25)}%` }"></div>
        </div>
      </div>

      <!-- Navigation List -->
      <ul v-else-if="filteredMenuItems.length > 0" class="nav flex-column gap-1 p-0 m-0">
        <li class="nav-item" v-for="item in filteredMenuItems" :key="item.name">
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
            <i :class="['pi', item.icon, 'text-center', isCollapsed ? 'fs-5 me-0' : 'me-3']" style="width: 24px;"></i>
            <span v-if="!isCollapsed" class="small fw-semibold text-nowrap">{{ item.name }}</span>
          </router-link>

          <!-- Item WITH children -->
          <div v-else>
            <div 
              class="nav-link d-flex align-items-center rounded sidebar-link text-decoration-none py-2"
              :class="[
                isExpanded(item) && !isCollapsed ? 'text-primary fw-bold bg-body-tertiary' : 'text-body opacity-75 fw-semibold',
                isCollapsed ? 'justify-content-center px-0' : 'justify-content-between px-2.5'
              ]"
              style="cursor: pointer; user-select: none;"
              :title="isCollapsed ? item.name : ''"
              @click="handleParentClick(item)"
            >
              <div class="d-flex align-items-center" :class="{ 'justify-content-center w-100': isCollapsed }">
                <i :class="['pi', item.icon, 'text-center', isCollapsed ? 'fs-5 me-0' : 'me-3']" style="width: 24px;"></i>
                <span v-if="!isCollapsed" class="small fw-semibold text-nowrap">{{ item.name }}</span>
              </div>
              <i v-if="!isCollapsed" :class="['pi', isExpanded(item) ? 'pi-chevron-down' : 'pi-chevron-right']" style="font-size: 0.75rem;"></i>
            </div>
            
            <!-- Submenu Items (visible only when expanded and not collapsed) -->
            <ul v-show="isExpanded(item) && !isCollapsed" class="nav flex-column ps-3 ms-3 mt-1 mb-2 gap-1 border-start">
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

      <!-- Fallback Empty State -->
      <div v-else class="text-center text-muted py-4 small">
        <i class="pi pi-inbox fs-4 mb-2 d-block opacity-50"></i>
        <span v-if="!isCollapsed">No menu access</span>
      </div>
    </nav>
    
    <!-- Footer / Collapse Toggle, Settings & Logout -->
    <div class="p-2 border-top bg-body d-flex flex-column gap-1">
      <!-- Desktop Collapse Toggle Button -->
      <button 
        type="button"
        @click="$emit('toggle-collapse')" 
        class="btn w-100 d-none d-md-flex align-items-center rounded-3 text-body opacity-75 sidebar-link text-decoration-none py-2"
        :class="isCollapsed ? 'justify-content-center px-0' : 'px-2.5'"
        :title="isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
      >
        <i :class="['pi', isCollapsed ? 'pi-angle-right' : 'pi-angle-left', 'text-center', isCollapsed ? 'fs-5 me-0' : 'me-3']" style="width: 24px;"></i>
        <span v-if="!isCollapsed" class="small fw-semibold text-nowrap">Collapse Sidebar</span>
      </button>

      <router-link 
        v-if="allowedMenuIds.has(20)"
        to="/settings" 
        class="nav-link d-flex align-items-center rounded-3 text-body opacity-75 sidebar-link text-decoration-none py-2"
        :class="isCollapsed ? 'justify-content-center px-0' : 'px-2.5'"
        active-class="bg-primary text-white opacity-100 active-link"
        exact-active-class="bg-primary text-white opacity-100 active-link"
        :title="isCollapsed ? 'System Settings' : ''"
        @click="$emit('close')"
      >
        <i class="pi pi-cog text-center" :class="isCollapsed ? 'fs-5 me-0' : 'me-3'" style="width: 24px;"></i>
        <span v-if="!isCollapsed" class="small fw-semibold text-nowrap">Settings</span>
      </router-link>

      <button 
        type="button"
        @click="handleLogout" 
        class="btn w-100 d-flex align-items-center rounded-3 text-decoration-none text-danger border-0 bg-danger bg-opacity-10 hover-logout py-2"
        :class="isCollapsed ? 'justify-content-center px-0' : 'px-2.5'"
        :title="isCollapsed ? 'Logout Account' : ''"
      >
        <i class="pi pi-sign-out text-center" :class="isCollapsed ? 'fs-5 me-0' : 'me-3'" style="width: 24px;"></i>
        <span v-if="!isCollapsed" class="small fw-bold text-nowrap">Logout</span>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import apiClient from '../services/api'

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
const route = useRoute()
const authStore = useAuthStore()

const isLoading = ref(true)

const rawMenuItems = ref([
  { id: 5, name: 'Dashboard', path: '/dashboard', icon: 'pi-objects-column' },
  { 
    id: 21,
    name: 'File Maintenance', 
    icon: 'pi-folder',
    children: [
      { id: 6, name: 'LCP', path: '/lcp', icon: 'pi-server' },
      { id: 7, name: 'LCNAP', path: '/lcnap', icon: 'pi-sitemap' },
      { id: 8, name: 'LCNAP Port', path: '/lcnap_port', icon: 'pi-share-alt' },
      { id: 9, name: 'NAP', path: '/nap', icon: 'pi-box' },
      { id: 10, name: 'Port', path: '/port', icon: 'pi-link' },
      { id: 11, name: 'VLan', path: '/vlan', icon: 'pi-globe' },
      { id: 12, name: 'Router', path: '/router', icon: 'pi-wifi' },
      { id: 13, name: 'Plan', path: '/plan', icon: 'pi-tag' },
      { id: 14, name: 'Application', path: '/application', icon: 'pi-file' },
    ]
  },
  { 
    id: 22,
    name: 'User', 
    icon: 'pi-users',
    children: [
      { id: 15, name: 'User', path: '/user', icon: 'pi-user' },
      { id: 16, name: 'Access Level', path: '/access_level', icon: 'pi-shield' },
    ]
  },
  { 
    id: 23,
    name: 'Transaction', 
    icon: 'pi-wallet',
    children: [
      { id: 17, name: 'Job Order', path: '/job_order', icon: 'pi-clipboard' },
      { id: 18, name: 'Invoice', path: '/invoice', icon: 'pi-receipt' },
      { id: 19, name: 'Billing', path: '/billing', icon: 'pi-credit-card' },
    ]
  }
])

const expandedState = ref({})

const isExpanded = (item) => {
  if (!item || !item.id) return false
  return !!expandedState.value[item.id]
}

const handleParentClick = (item) => {
  if (!item || !item.id) return
  if (props.isCollapsed) {
    emit('toggle-collapse')
    expandedState.value[item.id] = true
  } else {
    expandedState.value[item.id] = !expandedState.value[item.id]
  }
}

const checkAutoExpand = (currentPath) => {
  if (!currentPath) return
  rawMenuItems.value.forEach(item => {
    if (item.children && item.children.some(child => child.path === currentPath)) {
      expandedState.value[item.id] = true
    }
  })
}

// Auto-expand parent category if current active route matches a child submenu
watch(() => route.path, (currentPath) => {
  checkAutoExpand(currentPath)
}, { immediate: true })

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const allowedMenuIds = ref(new Set())

const getAllMenuIds = () => {
  const ids = []
  rawMenuItems.value.forEach(item => {
    ids.push(item.id)
    if (item.children) {
      item.children.forEach(c => ids.push(c.id))
    }
  })
  return ids
}

const fetchPermissions = async () => {
  isLoading.value = true
  try {
    const userAccessLevel = Number(authStore.user?.accesslevel_id || authStore.user?.accessLevelId || 1)

    const res = await apiClient.get('/AccesslevelMenu').catch(() => [])
    let records = res
    if (res && !Array.isArray(res) && typeof res === 'object') {
      const key = Object.keys(res).find(k => Array.isArray(res[k]))
      if (key) records = res[key]
    }

    if (Array.isArray(records) && records.length > 0) {
      const granted = records
        .filter(r => Number(r.accessLevelId || r.accesslevel_id) === userAccessLevel)
        .map(r => Number(r.menuId || r.menu_id))
      
      allowedMenuIds.value = new Set(granted)
    } else {
      // Fallback if API response is empty
      allowedMenuIds.value = new Set(getAllMenuIds())
    }
  } catch (err) {
    console.error('Error fetching AccesslevelMenu permissions:', err)
    allowedMenuIds.value = new Set(getAllMenuIds())
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPermissions()
  checkAutoExpand(route.path)
  window.addEventListener('accesslevelmenu-updated', fetchPermissions)
})

onUnmounted(() => {
  window.removeEventListener('accesslevelmenu-updated', fetchPermissions)
})

watch(() => authStore.user, () => {
  fetchPermissions()
}, { deep: true })

const filteredMenuItems = computed(() => {
  return rawMenuItems.value
    .map(item => {
      if (item.children) {
        const validChildren = item.children.filter(child => allowedMenuIds.value.has(child.id))
        if (validChildren.length > 0) {
          return { ...item, children: validChildren }
        }
        return null
      }
      return allowedMenuIds.value.has(item.id) ? item : null
    })
    .filter(Boolean)
})
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

.skeleton-box {
  background: linear-gradient(90deg, var(--bs-tertiary-bg, rgba(108, 117, 125, 0.12)) 25%, var(--bs-secondary-bg, rgba(108, 117, 125, 0.28)) 50%, var(--bs-tertiary-bg, rgba(108, 117, 125, 0.12)) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
