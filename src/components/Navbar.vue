<template>
  <header class="bg-body border-bottom d-flex align-items-center justify-content-between px-3 px-md-4 shadow-sm position-relative sfa-tracker-navbar" style="height: 60px; min-height: 60px; max-height: 60px; flex-shrink: 0; box-sizing: border-box; z-index: 1030;">
    <!-- Left side: Mobile & Desktop Menu Toggle & Production Search Box -->
    <div class="d-flex align-items-center flex-grow-1">
      <button 
        @click="handleToggleSidebar" 
        class="btn btn-link text-secondary me-2 me-md-3 p-1 text-decoration-none rounded-circle hover-bg-icon d-flex align-items-center justify-content-center flex-shrink-0 sfa-tracker-navbar-menu-toggle" 
        style="width: 42px; height: 42px;"
        aria-label="Toggle Sidebar"
        v-tooltip.bottom="isOpen ? 'Close Sidebar' : (isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar')"
      >
        <i :class="['pi', isOpen ? 'pi-times' : (isCollapsed ? 'pi-bars' : 'pi-align-left'), 'fs-4']"></i>
      </button>

      <!-- Mobile Search Icon Trigger Button (Visible only on xs screens < 576px when search is closed) -->
      <button 
        v-if="!isMobileSearchActive"
        @click="openMobileSearch" 
        class="btn btn-link text-secondary p-1 d-sm-none border-0 text-decoration-none me-2 rounded-circle hover-bg-icon d-flex align-items-center justify-content-center" 
        style="width: 40px; height: 40px;"
        aria-label="Open Search"
        v-tooltip.bottom="'Search'"
      >
        <i class="pi pi-search fs-5"></i>
      </button>
      
      <!-- Navbar Search Container -->
      <div 
        class="position-relative w-100 sfa-tracker-navbar-omnibox" 
        :class="isMobileSearchActive ? 'mobile-search-bar d-flex align-items-center px-2 bg-body position-absolute start-0 top-0 h-100 w-100 z-3' : 'd-none d-sm-block'"
        style="max-width: 480px;" 
        ref="searchContainer"
      >
        <button 
          v-if="isMobileSearchActive" 
          @click="closeMobileSearch" 
          class="btn btn-link text-secondary p-1 me-2 text-decoration-none border-0 d-sm-none"
        >
          <i class="pi pi-arrow-left fs-5"></i>
        </button>

        <div class="position-relative flex-grow-1">
          <span class="position-absolute top-50 start-0 translate-middle-y ps-3 text-secondary pointer-events-none">
            <i v-if="!isLoading" class="pi pi-search fs-5"></i>
            <span v-else class="spinner-border spinner-border-sm text-primary" role="status" style="width: 1rem; height: 1rem;"></span>
          </span>
          
          <input 
            ref="searchInputRef"
            type="text" 
            v-model="searchQuery"
            @focus="openSearch"
            class="form-control ps-5 pe-5 bg-body-tertiary border-0 rounded-3 shadow-none search-input py-2.5" 
            style="font-size: 0.92rem;"
            placeholder="Search customers, IP addresses, job orders..." 
            aria-label="Global Search"
            aria-expanded="isSearchOpen"
          />

          <!-- Shortcut Badge or Clear Input Button -->
          <div class="position-absolute top-50 end-0 translate-middle-y pe-3 d-flex align-items-center gap-1">
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''" 
              class="btn btn-link text-secondary p-0 text-decoration-none border-0 me-1" 
              title="Clear search"
            >
              <i class="pi pi-times-circle fs-5"></i>
            </button>
            <kbd class="d-none d-lg-inline-block bg-body text-secondary border px-2 py-1 rounded shadow-xs text-uppercase" style="font-size: 0.72rem; font-family: inherit;">
              {{ isMac ? '⌘K' : 'Ctrl+K' }}
            </kbd>
          </div>
        </div>

        <!-- Floating Omnibox / Search Results Overlay -->
        <Transition name="dropdown-fade">
          <div 
            v-if="isSearchOpen" 
            class="position-absolute start-0 end-0 mt-2 shadow-lg border rounded-3 bg-body overflow-hidden search-results-dropdown sfa-tracker-navbar-omnibox-results"
            style="z-index: 1150; top: 100%; max-height: 480px; display: flex; flex-direction: column;"
          >
            <!-- Results Body -->
            <div class="overflow-y-auto p-2 flex-grow-1" style="max-height: 400px;">
              
              <!-- 1. Recent Searches (when query is empty) -->
              <div v-if="!searchQuery.trim() && (recentSearches || []).length > 0">
                <div class="d-flex align-items-center justify-content-between px-2 py-1 mb-1 text-secondary" style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  <span><i class="pi pi-history me-1"></i> Recent Searches</span>
                  <button @click="clearRecentSearches" class="btn btn-link text-secondary p-0 text-decoration-none border-0" style="font-size: 0.7rem;">Clear All</button>
                </div>
                <div 
                  v-for="(item, idx) in recentSearches" 
                  :key="'recent-' + idx"
                  @click="selectItem(item)"
                  class="d-flex align-items-center justify-content-between py-2 px-3 rounded-2 border-0 mb-1 cursor-pointer search-item hover-bg"
                >
                  <div class="d-flex align-items-center gap-3 text-truncate">
                    <i :class="getItemIconClass(item)" class="text-secondary small"></i>
                    <span class="small fw-medium text-body text-truncate ms-1">{{ item.title }}</span>
                  </div>
                  <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10" style="font-size: 0.68rem;">{{ item.category }}</span>
                </div>
              </div>

              <!-- Default Prompt when Empty & No Recent Searches -->
              <div v-if="!searchQuery.trim() && (recentSearches || []).length === 0" class="text-center py-4 px-3 text-secondary">
                <i class="pi pi-compass fs-2 text-primary opacity-50 mb-2"></i>
                <div class="fw-semibold text-body small">Quick Navigation & Global Search</div>
                <div class="small mt-1" style="font-size: 0.78rem;">Type a module name, customer name, job order ticket, or IP address...</div>
              </div>

              <!-- 2. Categorized Active Search Results -->
              <template v-if="searchQuery.trim() && (groupedResults || []).length > 0">
                <div v-for="(group, gIdx) in groupedResults" :key="group.name" class="mb-2">
                  <div class="px-2 py-1 text-secondary d-flex align-items-center gap-1.5" style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    <i :class="group.icon" style="font-size: 0.75rem;"></i>
                    <span>{{ group.name }}</span>
                  </div>

                  <div 
                    v-for="(item, iIdx) in group.items" 
                    :key="item.id"
                    @click="selectItem(item)"
                    @mouseenter="updateSelectedIndex(item)"
                    class="d-flex align-items-center justify-content-between py-2 px-3 rounded-2 cursor-pointer search-item transition-all mb-1"
                    :class="{ 'active-item': isItemSelected(item) }"
                  >
                    <div class="d-flex align-items-center gap-3 overflow-hidden me-2">
                      <div 
                        class="rounded-2 p-1.5 d-flex align-items-center justify-content-center flex-shrink-0 item-icon-wrapper transition-all" 
                        :class="getItemIconWrapperClass(item)"
                        style="width: 34px; height: 34px;"
                      >
                        <i :class="getItemIconClass(item)" class="fs-6"></i>
                      </div>
                      <div class="overflow-hidden text-start ms-1">
                        <div 
                          class="small text-truncate item-title transition-all"
                          :class="isItemSelected(item) ? 'text-primary fw-bold' : 'fw-semibold text-body'"
                        >{{ item.title }}</div>
                        <div class="text-secondary text-truncate" style="font-size: 0.73rem;">{{ getSubtitle(item) }}</div>
                      </div>
                    </div>

                    <div class="d-flex align-items-center gap-2 flex-shrink-0">
                      <span v-if="item.badge" class="badge" :class="item.badgeClass || 'bg-secondary'" style="font-size: 0.68rem;">
                        {{ item.badge }}
                      </span>
                      <i class="pi pi-arrow-up-right text-secondary small opacity-50 enter-icon transition-all"></i>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 3. Empty Search Result State -->
              <div v-if="searchQuery.trim() && (groupedResults || []).length === 0 && !isLoading" class="text-center py-4 px-3 text-secondary">
                <i class="pi pi-search-minus fs-2 mb-2 opacity-50"></i>
                <div class="fw-semibold text-body small">No results matching "{{ searchQuery }}"</div>
                <div class="small mt-1" style="font-size: 0.78rem;">Try searching for "Applications", "Dashboard", "Job Order", or "Router".</div>
              </div>

            </div>

            <!-- Keyboard Footer Hints -->
            <div class="bg-body-tertiary px-4 py-2 border-top d-flex align-items-center justify-content-between text-secondary" style="font-size: 0.72rem;">
              <div class="d-flex align-items-center gap-3">
                <span class="d-inline-flex align-items-center gap-1.5">
                  <kbd class="bg-body text-body border rounded shadow-xs" style="font-size: 0.65rem; line-height: 1; display: inline-flex; align-items: center; justify-content: center; height: 18px; min-width: 18px; padding: 0 4px;">↑</kbd>
                  <kbd class="bg-body text-body border rounded shadow-xs" style="font-size: 0.65rem; line-height: 1; display: inline-flex; align-items: center; justify-content: center; height: 18px; min-width: 18px; padding: 0 4px;">↓</kbd>
                  <span>&nbsp;Navigate</span>
                </span>
                <span class="d-inline-flex align-items-center gap-1.5">
                  <kbd class="bg-body text-body border rounded shadow-xs" style="font-size: 0.65rem; line-height: 1; display: inline-flex; align-items: center; justify-content: center; height: 18px; min-width: 18px; padding: 0 4px;">↵</kbd>
                  <span>&nbsp;Select</span>
                </span>
                <span class="d-inline-flex align-items-center gap-1.5">
                  <kbd class="bg-body text-body border rounded shadow-xs" style="font-size: 0.65rem; line-height: 1; display: inline-flex; align-items: center; justify-content: center; height: 18px; padding: 0 6px;">ESC</kbd>
                  <span>&nbsp;Close</span>
                </span>
              </div>
              <span class="fw-semibold text-uppercase opacity-75" style="font-size: 0.65rem; letter-spacing: 0.5px;">SwitchFiber Omnibox</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Right side: Network Status, Dark Mode, Notifications & Profile -->
    <div class="d-flex align-items-center ms-3 gap-3 sfa-tracker-navbar-right">
      <!-- Network Status — reflects the last health check, not a fixed label -->
      <div
        class="d-none d-lg-flex align-items-center gap-2 px-3 py-1.5 rounded-pill border border-opacity-25 sfa-tracker-navbar-api-status"
        :class="apiDegraded ? 'bg-danger bg-opacity-10 text-danger border-danger' : 'bg-success bg-opacity-10 text-success border-success'"
        v-tooltip.bottom="apiDegraded ? 'One or more API endpoints are failing — open notifications for details' : 'All monitored API endpoints are responding'"
      >
        <div class="spinner-grow spinner-grow-sm" :class="apiDegraded ? 'text-danger' : 'text-success'" role="status" style="width: 0.55rem; height: 0.55rem;">
          <span class="visually-hidden">Status indicator</span>
        </div>
        <span class="fw-semibold" style="font-size: 0.8rem;">{{ apiDegraded ? 'Service Degraded' : 'Systems Operational' }}</span>
      </div>

      <!-- Quick Light/Dark Mode Toggle (Access-Controlled) -->
      <button 
        v-if="canAccessTheme"
        @click="toggleTheme" 
        class="btn btn-sm rounded-3 d-flex align-items-center justify-content-center p-0 shadow-sm border ms-1 sfa-tracker-navbar-theme-btn"
        :class="isDark ? 'btn-dark' : 'btn-light'"
        style="width: 42px; height: 42px; transition: transform 0.2s;"
        aria-label="Toggle Dark Mode"
        v-tooltip.bottom="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <i :class="isDark ? 'pi pi-sun text-warning' : 'pi pi-moon text-secondary'" class="fs-5"></i>
      </button>

      <!-- Interactive Notification Bell & Dropdown -->
      <div class="position-relative sfa-tracker-navbar-notifications" ref="notificationContainer">
        <button 
          @click="toggleNotifications"
          class="btn btn-link text-secondary position-relative p-2 text-decoration-none rounded-circle hover-bg-icon d-flex align-items-center justify-content-center"
          style="width: 42px; height: 42px; transition: transform 0.2s;"
          aria-label="Notifications"
          v-tooltip.bottom="'System Notifications'"
        >
          <i class="pi pi-bell fs-5" :class="{ 'text-primary': isNotificationOpen }"></i>
          <!-- Red Badge Pulse for Unread Count -->
          <span 
            v-if="unreadCount > 0" 
            class="position-absolute top-0 start-100 translate-middle p-1.5 bg-danger border border-light rounded-circle"
            style="font-size: 0.65rem;"
          >
            <span class="visually-hidden">New alerts</span>
          </span>
        </button>

        <!-- Notification Dropdown Card -->
        <Transition name="dropdown-fade">
          <div
            v-if="isNotificationOpen"
            class="position-absolute end-0 mt-2 shadow-lg border rounded-4 bg-body overflow-hidden notification-dropdown sfa-tracker-navbar-notifications-panel"
            style="z-index: 1100; top: 100%;"
          >
            <!-- Header -->
            <div class="p-3 bg-body border-bottom d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <h6 class="fw-bold text-body mb-0">Notifications</h6>
                <span v-if="unreadCount > 0" class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0.5 rounded-pill small">
                  {{ unreadCount }} new
                </span>
              </div>
              <button 
                v-if="unreadCount > 0" 
                @click="markAllAsRead" 
                class="btn btn-link p-0 text-primary small text-decoration-none fw-semibold shadow-none border-0"
                style="font-size: 0.78rem;"
              >
                Mark all read
              </button>
            </div>

            <!-- Notification Item List -->
            <div class="overflow-y-auto custom-scrollbar" style="max-height: 340px;">
              <div v-if="isCheckingHealth && (notifications || []).length === 0" class="p-4 text-center text-secondary small">
                <i class="pi pi-spin pi-spinner fs-5 d-block mb-2 opacity-75"></i>
                Checking system health…
              </div>

              <div v-else-if="(notifications || []).length === 0" class="p-4 text-center text-secondary small">
                <i class="pi pi-check-circle fs-4 d-block mb-2 text-success opacity-75"></i>
                <div class="fw-semibold text-body">All systems responding</div>
                <div class="mt-1" style="font-size: 0.78rem;">No alerts at the moment.</div>
              </div>

              <div
                v-for="item in notifications"
                :key="item.id"
                class="p-3 border-bottom transition-all cursor-pointer hover-bg-item d-flex gap-3 align-items-start"
                :class="{ 'bg-primary bg-opacity-10': item.unread }"
                @click="item.unread = false"
              >
                <!-- Icon Badge -->
                <div 
                  class="p-2 rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center"
                  :class="getNotificationIconBgClass(item.severity)"
                  style="width: 36px; height: 36px;"
                >
                  <i :class="['pi', item.icon, getNotificationIconColorClass(item.severity)]"></i>
                </div>

                <!-- Text Body -->
                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex align-items-center justify-content-between gap-1 mb-1">
                    <span class="fw-bold text-body small text-truncate">{{ item.title }}</span>
                    <span class="text-secondary" style="font-size: 0.7rem;">{{ item.time }}</span>
                  </div>
                  <p class="small text-secondary mb-0" style="font-size: 0.78rem; line-height: 1.4;">
                    {{ item.message }}
                  </p>
                </div>

                <!-- Unread Dot Indicator -->
                <span v-if="item.unread" class="p-1 bg-primary rounded-circle flex-shrink-0 mt-1" style="width: 8px; height: 8px;"></span>
              </div>
            </div>

            <!-- Footer -->
            <div class="p-2 bg-body-tertiary border-top"></div>
          </div>
        </Transition>
      </div>

      <!-- Attached Profile Dropdown -->
      <div class="position-relative sfa-tracker-navbar-user-menu" ref="dropdownContainer">
        <div 
          class="d-flex align-items-center ms-2 px-3 py-2 rounded-3 user-chip" 
          :class="{ 'active-chip': isDropdownOpen }"
          style="cursor: pointer; user-select: none;"
          @click="isDropdownOpen = !isDropdownOpen"
        >
          <div 
            class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0" 
            style="width: 42px; height: 42px; font-size: 1rem;"
          >
            {{ userInitial }}
          </div>
          <div class="ms-3 me-2.5 d-none d-md-block text-start">
            <div class="fw-bold text-body lh-1" style="font-size: 0.9rem;">{{ userDisplayName }}</div>
            <div class="text-secondary mt-1" style="font-size: 0.75rem;">{{ userRole }}</div>
          </div>
          <i class="pi pi-chevron-down ms-1 text-secondary small d-none d-md-block chevron-icon" :class="{ 'rotate-180': isDropdownOpen }" style="font-size: 0.8rem;"></i>
        </div>

        <!-- Profile Dropdown Card -->
        <Transition name="dropdown-fade">
          <div 
            v-if="isDropdownOpen" 
            class="position-absolute end-0 mt-2 p-2 shadow-lg border rounded-3 bg-body sfa-tracker-navbar-user-menu-panel"
            style="min-width: 220px; z-index: 1100; top: 100%;"
          >
            <div class="px-3 py-2 border-bottom mb-1 bg-body-tertiary rounded-2">
              <div class="fw-bold small text-body">{{ userDisplayName }}</div>
              <div v-if="user?.email" class="text-secondary small text-truncate" style="font-size: 0.75rem;">{{ user.email }}</div>
            </div>
            
            <button 
              v-if="canAccessSettings"
              @click="goToSettings" 
              class="w-100 btn btn-link text-start text-body text-decoration-none d-flex align-items-center gap-2 rounded-2 py-2 px-3 hover-dropdown-item border-0 shadow-none"
            >
              <i class="pi pi-cog text-secondary"></i>
              <span class="small fw-medium">Settings</span>
            </button>

            <div class="dropdown-divider my-1"></div>

            <button 
              @click="handleLogout" 
              class="w-100 btn btn-link text-start text-danger text-decoration-none d-flex align-items-center gap-2 rounded-2 py-2 px-3 hover-logout-dropdown-item border-0 shadow-none"
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import { useSearch } from '../composables/useSearch'
import { usePermissions } from '../composables/usePermissions'
import apiClient from '../services/api'
import { MONITORED_ENDPOINTS, probePathFor } from '../models/monitoredEndpoints'

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-sidebar', 'toggle-collapse'])

const handleToggleSidebar = () => {
  if (window.innerWidth < 768) {
    emit('toggle-sidebar')
  } else {
    emit('toggle-collapse')
  }
}

const isMobileSearchActive = ref(false)

const openMobileSearch = () => {
  isMobileSearchActive.value = true
  openSearch()
  nextTick(() => {
    if (searchInputRef.value) searchInputRef.value.focus()
  })
}

const closeMobileSearch = () => {
  isMobileSearchActive.value = false
  closeSearch()
}

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const { isDark, toggleTheme } = useTheme()
const { canAccessTheme, canAccessSettings, isSuperAdmin } = usePermissions()

// Integrated Global Search Composable
const {
  searchQuery,
  isSearchOpen,
  isLoading,
  selectedIndex,
  recentSearches,
  groupedResults,
  flatResults,
  selectItem,
  openSearch,
  closeSearch,
  clearRecentSearches
} = useSearch()

const searchContainer = ref(null)
const searchInputRef = ref(null)

const isMac = computed(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0)

// Focus input when search is opened via keyboard shortcut
watch(isSearchOpen, (isOpen) => {
  if (isOpen && searchInputRef.value) {
    searchInputRef.value.focus()
  }
})

// Auto-scroll active item into view during keyboard navigation
watch(selectedIndex, () => {
  nextTick(() => {
    const activeEl = document.querySelector('.search-item.active-item')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
})

const getSubtitle = (item) => {
  if (!item || !item.subtitle) return ''
  return typeof item.subtitle === 'object' ? item.subtitle.value : item.subtitle
}

const isItemSelected = (item) => {
  if (!flatResults.value.length) return false
  const activeItem = flatResults.value[selectedIndex.value]
  return activeItem && activeItem.id === item.id
}

const updateSelectedIndex = (item) => {
  const index = flatResults.value.findIndex(i => i.id === item.id)
  if (index !== -1) {
    selectedIndex.value = index
  }
}

const getItemIconClass = (item) => {
  if (!item) return 'pi pi-compass'
  let icon = item.icon
  const titleLower = (item.title || '').toLowerCase()
  const subLower = (typeof item.subtitle === 'string' ? item.subtitle : '').toLowerCase()
  const isGuest = titleLower.includes('guest') || subLower.includes('guest')
  
  if (!icon || typeof icon !== 'string' || !icon.trim()) {
    if (item.category === 'Users' || isGuest) {
      return isGuest ? 'pi pi-user-minus' : 'pi pi-user'
    }
    if (item.category === 'Applications') return 'pi pi-file-edit'
    if (item.category === 'Job Orders') return 'pi pi-ticket'
    if (item.category === 'Plans') return 'pi pi-tags'
    return 'pi pi-compass'
  }
  
  icon = icon.trim()
  if (isGuest && (icon === 'pi pi-user' || icon === 'pi pi-user-check')) {
    return 'pi pi-user-minus'
  }
  if (!icon.startsWith('pi ') && !icon.startsWith('pi-')) {
    icon = `pi pi-${icon}`
  } else if (!icon.startsWith('pi ')) {
    icon = `pi ${icon}`
  }
  return icon
}

const getItemIconWrapperClass = (item) => {
  const selected = isItemSelected(item)
  if (selected) return 'bg-primary text-white shadow-sm'
  
  const titleLower = (item?.title || '').toLowerCase()
  const subLower = (typeof item?.subtitle === 'string' ? item.subtitle : '').toLowerCase()
  const isGuest = titleLower.includes('guest') || subLower.includes('guest')
  if (isGuest) {
    return 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
  }
  return 'bg-body-tertiary text-secondary'
}

// User Profile Dropdown logic
const isDropdownOpen = ref(false)
const dropdownContainer = ref(null)

const userDisplayName = computed(() => {
  if (!user.value) return 'Admin User'
  if (user.value.username) return user.value.username
  if (user.value.fname) return `${user.value.fname} ${user.value.lname || ''}`.trim()
  return user.value.email || 'Admin User'
})

const userInitial = computed(() => {
  return (userDisplayName.value || 'A').charAt(0).toUpperCase()
})

const accessLevelsList = ref([])

onMounted(async () => {
  try {
    const res = await apiClient.get('/AccessLevel').catch(() => [])
    let unwrapped = res
    if (res && !Array.isArray(res) && typeof res === 'object') {
      const key = Object.keys(res).find(k => Array.isArray(res[k]))
      if (key) unwrapped = res[key]
    }
    accessLevelsList.value = Array.isArray(unwrapped) ? unwrapped : []
  } catch (e) {
    console.warn('Failed to fetch AccessLevel in Navbar:', e)
  }

  refreshNotifications()
})

const userRole = computed(() => {
  if (!user.value) return 'Super Admin'
  const userAccId = Number(user.value.accesslevel_id || user.value.accessLevelId || 0)
  const found = accessLevelsList.value.find(a => Number(a.id || a.Id) === userAccId)
  if (found && (found.name || found.Name)) return found.name || found.Name
  if (user.value.role) return user.value.role
  if (user.value.accessLevelName) return user.value.accessLevelName
  return (userAccId === 1 || userAccId === 3 || isSuperAdmin.value) ? 'Super Admin' : (userAccId ? `Access Level ${userAccId}` : 'User')
})

// Notifications Dropdown Logic & Dummy Data
const isNotificationOpen = ref(false)
const notificationContainer = ref(null)

// Real notifications: system-health alerts derived from the endpoints this
// console depends on. The previous fabricated alerts (peak load, completed job
// orders, backups) reported events that never happened.
const notifications = ref([])
const isCheckingHealth = ref(false)

// Every monitored endpoint is checked, so the bell reports the same set of
// failures the Dashboard health badge counts — not just a hand-picked few.
const HEALTH_CHECKS = MONITORED_ENDPOINTS

// A probe only needs to know whether the endpoint answers, so it must not wait
// out the 60s apiClient default on an endpoint that is effectively down — that
// slow is a failure worth reporting, not something to keep waiting on.
const HEALTH_PROBE_TIMEOUT_MS = 15000

const apiDegraded = ref(false)

const refreshNotifications = async () => {
  isCheckingHealth.value = true
  try {
    const results = await Promise.all(HEALTH_CHECKS.map(async (check) => {
      try {
        await apiClient.get(probePathFor(check), { timeout: HEALTH_PROBE_TIMEOUT_MS })
        return null
      } catch (err) {
        // A probe aborted by navigating away says nothing about endpoint health.
        if (err.isCanceled) return null
        return {
          id: check.path,
          title: `${check.label} unavailable`,
          message: err.message || 'The endpoint returned an error.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true,
          severity: 'danger',
          icon: 'pi-exclamation-triangle'
        }
      }
    }))

    notifications.value = results.filter(Boolean)
    apiDegraded.value = notifications.value.length > 0
  } finally {
    isCheckingHealth.value = false
  }
}

// Re-checked when the panel is opened rather than on a timer, so an idle tab
// is not polling four endpoints forever.
const toggleNotifications = () => {
  isNotificationOpen.value = !isNotificationOpen.value
  if (isNotificationOpen.value) refreshNotifications()
}

const unreadCount = computed(() => notifications.value.filter(n => n.unread).length)

const markAllAsRead = () => {
  notifications.value.forEach(n => { n.unread = false })
}

const getNotificationIconBgClass = (severity) => {
  switch (severity) {
    case 'danger': return 'bg-danger bg-opacity-10'
    case 'success': return 'bg-success bg-opacity-10'
    case 'info': return 'bg-info bg-opacity-10'
    default: return 'bg-secondary bg-opacity-10'
  }
}

const getNotificationIconColorClass = (severity) => {
  switch (severity) {
    case 'danger': return 'text-danger'
    case 'success': return 'text-success'
    case 'info': return 'text-info'
    default: return 'text-secondary'
  }
}

const handleClickOutside = (event) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
  if (notificationContainer.value && !notificationContainer.value.contains(event.target)) {
    isNotificationOpen.value = false
  }
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    closeSearch()
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
/* Right-anchored to the bell on desktop; on phones the bell sits close to the
   right edge, so a 340px card anchored there ran off the left side of the
   screen. Below 480px the card pins to the viewport instead, with an even
   margin on both sides, just under the 60px navbar. */
.notification-dropdown {
  width: min(340px, calc(100vw - 1.5rem));
}

@media (max-width: 479.98px) {
  .notification-dropdown {
    position: fixed !important;
    left: 0.75rem;
    right: 0.75rem;
    top: 68px !important;
    width: auto;
    margin-top: 0 !important;
  }
}

.search-input {
  transition: all 0.2s ease;
}
.search-input:focus {
  background-color: var(--bs-body-bg) !important;
  box-shadow: 0 0 0 2px rgba(var(--bs-primary-rgb), 0.25) !important;
}

.search-results-dropdown {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15) !important;
}

.search-item {
  transition: all 0.15s ease-in-out;
  border-left: 3.5px solid transparent;
  position: relative;
}
.search-item:hover, .search-item.active-item {
  background-color: rgba(var(--bs-primary-rgb, 231, 76, 90), 0.10) !important;
  border-left-color: var(--bs-primary) !important;
}
[data-bs-theme="dark"] .search-item:hover,
[data-bs-theme="dark"] .search-item.active-item {
  background-color: rgba(var(--bs-primary-rgb, 231, 76, 90), 0.22) !important;
  border-left-color: var(--bs-primary) !important;
}

.search-item.active-item .enter-icon {
  opacity: 1 !important;
  color: var(--bs-primary) !important;
  transform: translateX(-2px);
}

.hover-bg:hover {
  background-color: var(--bs-tertiary-bg, rgba(0,0,0,0.05));
}

.user-chip {
  transition: all 0.2s ease-in-out;
  border: 1px solid transparent !important;
  outline: none !important;
}
.user-chip:hover,
.user-chip:focus,
.user-chip:active,
.active-chip {
  background-color: var(--bs-tertiary-bg, rgba(0, 0, 0, 0.05));
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
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
.hover-dropdown-item:hover,
.hover-dropdown-item:focus,
.hover-dropdown-item:active {
  background-color: var(--bs-tertiary-bg, rgba(0, 0, 0, 0.05)) !important;
  box-shadow: none !important;
  outline: none !important;
}

.hover-logout-dropdown-item {
  transition: all 0.2s ease-in-out;
}
.hover-logout-dropdown-item:hover,
.hover-logout-dropdown-item:focus,
.hover-logout-dropdown-item:active {
  background-color: var(--bs-danger) !important;
  color: #ffffff !important;
  box-shadow: none !important;
  outline: none !important;
}
.hover-logout-dropdown-item:hover i,
.hover-logout-dropdown-item:focus i,
.hover-logout-dropdown-item:active i {
  color: #ffffff !important;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}
.hover-bg-item {
  transition: background-color 0.15s ease-in-out;
}
.hover-bg-item:hover {
  background-color: var(--bs-tertiary-bg, rgba(0, 0, 0, 0.05)) !important;
}

.hover-bg-icon {
  transition: all 0.15s ease-in-out;
}
.hover-bg-icon:hover {
  background-color: var(--bs-tertiary-bg, rgba(0, 0, 0, 0.05)) !important;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
