<template>
  <header class="bg-body border-bottom d-flex align-items-center justify-content-between px-3 px-md-4 shadow-sm position-relative" style="height: 64px; z-index: 1030;">
    <!-- Left side: Mobile Menu Toggle & Production Search Box -->
    <div class="d-flex align-items-center flex-grow-1">
      <button @click="$emit('toggle-sidebar')" class="btn btn-link text-secondary d-md-none me-3 p-0 text-decoration-none" aria-label="Toggle Sidebar">
        <i class="pi pi-bars fs-5"></i>
      </button>
      
      <!-- Navbar Search Container -->
      <div class="position-relative d-none d-sm-block w-100" style="max-width: 440px;" ref="searchContainer">
        <div class="position-relative">
          <span class="position-absolute top-50 start-0 translate-middle-y ps-3 text-secondary pointer-events-none">
            <i v-if="!isLoading" class="pi pi-search fs-6"></i>
            <span v-else class="spinner-border spinner-border-sm text-primary" role="status" style="width: 0.9rem; height: 0.9rem;"></span>
          </span>
          
          <input 
            ref="searchInputRef"
            type="text" 
            v-model="searchQuery"
            @focus="openSearch"
            class="form-control ps-5 pe-5 bg-body-tertiary border-0 rounded-3 shadow-none search-input" 
            placeholder="Search customers, IP addresses, job orders, pages... (Cmd+K)" 
            aria-label="Global Search"
            aria-expanded="isSearchOpen"
          />

          <!-- Shortcut Badge or Clear Input Button -->
          <div class="position-absolute top-50 end-0 translate-middle-y pe-2.5 d-flex align-items-center gap-1">
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''" 
              class="btn btn-link text-secondary p-0 text-decoration-none border-0 me-1" 
              title="Clear search"
            >
              <i class="pi pi-times-circle fs-6"></i>
            </button>
            <kbd class="d-none d-lg-inline-block bg-body text-secondary border px-1.5 py-0.5 rounded shadow-xs text-uppercase" style="font-size: 0.68rem; font-family: inherit;">
              {{ isMac ? '⌘K' : 'Ctrl+K' }}
            </kbd>
          </div>
        </div>

        <!-- Floating Omnibox / Search Results Overlay -->
        <Transition name="dropdown-fade">
          <div 
            v-if="isSearchOpen" 
            class="position-absolute start-0 end-0 mt-2 shadow-lg border rounded-3 bg-body overflow-hidden search-results-dropdown"
            style="z-index: 1150; top: 100%; max-height: 480px; display: flex; flex-direction: column;"
          >
            <!-- Results Body -->
            <div class="overflow-y-auto p-2 flex-grow-1" style="max-height: 400px;">
              
              <!-- 1. Recent Searches (when query is empty) -->
              <div v-if="!searchQuery.trim() && recentSearches.length > 0">
                <div class="d-flex align-items-center justify-content-between px-2 py-1 mb-1 text-secondary" style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  <span><i class="pi pi-history me-1"></i> Recent Searches</span>
                  <button @click="clearRecentSearches" class="btn btn-link text-secondary p-0 text-decoration-none border-0" style="font-size: 0.7rem;">Clear All</button>
                </div>
                <div 
                  v-for="(item, idx) in recentSearches" 
                  :key="'recent-' + idx"
                  @click="selectItem(item)"
                  class="d-flex align-items-center justify-content-between py-2 ps-3 pe-2.5 rounded-2 border-0 mb-1 cursor-pointer search-item hover-bg"
                >
                  <div class="d-flex align-items-center gap-3 text-truncate">
                    <i :class="item.icon" class="text-secondary small"></i>
                    <span class="small fw-medium text-body text-truncate ms-1">{{ item.title }}</span>
                  </div>
                  <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10" style="font-size: 0.68rem;">{{ item.category }}</span>
                </div>
              </div>

              <!-- Default Prompt when Empty & No Recent Searches -->
              <div v-if="!searchQuery.trim() && recentSearches.length === 0" class="text-center py-4 px-3 text-secondary">
                <i class="pi pi-compass fs-2 text-primary opacity-50 mb-2"></i>
                <div class="fw-semibold text-body small">Quick Navigation & Global Search</div>
                <div class="small mt-1" style="font-size: 0.78rem;">Type a module name, customer name, job order ticket, or IP address...</div>
              </div>

              <!-- 2. Categorized Active Search Results -->
              <template v-if="searchQuery.trim() && groupedResults.length > 0">
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
                    class="d-flex align-items-center justify-content-between py-2 ps-3 pe-2.5 rounded-2 cursor-pointer search-item transition-all mb-1"
                    :class="{ 'active-item': isItemSelected(item) }"
                  >
                    <div class="d-flex align-items-center gap-3 overflow-hidden me-2">
                      <div 
                        class="rounded-2 p-1.5 d-flex align-items-center justify-content-center flex-shrink-0 item-icon-wrapper transition-all" 
                        :class="isItemSelected(item) ? 'bg-primary text-white shadow-sm' : 'bg-body-tertiary text-secondary'"
                        style="width: 34px; height: 34px;"
                      >
                        <i :class="item.icon" class="fs-6"></i>
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
              <div v-if="searchQuery.trim() && groupedResults.length === 0 && !isLoading" class="text-center py-4 px-3 text-secondary">
                <i class="pi pi-search-minus fs-2 mb-2 opacity-50"></i>
                <div class="fw-semibold text-body small">No results matching "{{ searchQuery }}"</div>
                <div class="small mt-1" style="font-size: 0.78rem;">Try searching for "Applications", "Dashboard", "Job Order", or "Router".</div>
              </div>

            </div>

            <!-- Keyboard Footer Hints -->
            <div class="bg-body-tertiary px-3 py-1.5 border-top d-flex align-items-center justify-content-between text-secondary" style="font-size: 0.7rem;">
              <div class="d-flex align-items-center gap-3">
                <span><kbd class="bg-body text-body border px-1 rounded">↑</kbd> <kbd class="bg-body text-body border px-1 rounded">↓</kbd> Navigate</span>
                <span><kbd class="bg-body text-body border px-1 rounded">↵</kbd> Select</span>
                <span><kbd class="bg-body text-body border px-1 rounded">ESC</kbd> Close</span>
              </div>
              <span class="fw-medium text-uppercase" style="font-size: 0.65rem; letter-spacing: 0.5px;">SwitchFiber Omnibox</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Right side: Network Status, Dark Mode, Notifications & Profile -->
    <div class="d-flex align-items-center ms-3 gap-3">
      <!-- Network Status -->
      <div class="d-none d-lg-flex align-items-center gap-2 px-3 py-1 bg-success bg-opacity-10 text-success rounded-pill border border-success border-opacity-25">
        <div class="spinner-grow spinner-grow-sm text-success" role="status" style="width: 0.5rem; height: 0.5rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="small fw-semibold" style="font-size: 0.75rem;">Systems Operational</span>
      </div>

      <!-- Quick Light/Dark Mode Toggle -->
      <button 
        @click="toggleTheme" 
        class="btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm border ms-1"
        :class="isDark ? 'btn-dark' : 'btn-light'"
        style="width: 36px; height: 36px; transition: transform 0.2s;"
        aria-label="Toggle Dark Mode"
        title="Toggle Dark Mode"
      >
        <i :class="isDark ? 'pi pi-sun text-warning' : 'pi pi-moon text-secondary'" class="fs-6"></i>
      </button>

      <!-- Notifications -->
      <button class="btn btn-link text-secondary position-relative p-1 text-decoration-none" aria-label="Notifications">
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
          <div 
            class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" 
            style="width: 34px; height: 34px; font-size: 0.85rem;"
          >
            {{ userInitial }}
          </div>
          <div class="ms-2 d-none d-md-block text-start">
            <div class="small fw-bold text-body lh-1">{{ userDisplayName }}</div>
            <div class="text-secondary mt-1" style="font-size: 0.7rem;">{{ userRole }}</div>
          </div>
          <i class="pi pi-chevron-down ms-2 text-secondary small d-none d-md-block chevron-icon" :class="{ 'rotate-180': isDropdownOpen }" style="font-size: 0.75rem;"></i>
        </div>

        <!-- Profile Dropdown Card -->
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import { useSearch } from '../composables/useSearch'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const { isDark, toggleTheme } = useTheme()

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

const userRole = computed(() => {
  if (!user.value) return 'Super Admin'
  return user.value.role || (user.value.accesslevel_id === 1 ? 'Super Admin' : 'User')
})

const handleClickOutside = (event) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    isDropdownOpen.value = false
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
  background-color: rgba(13, 110, 253, 0.12) !important;
  border-left-color: var(--bs-primary) !important;
}
[data-bs-theme="dark"] .search-item:hover,
[data-bs-theme="dark"] .search-item.active-item {
  background-color: rgba(13, 110, 253, 0.26) !important;
  border-left-color: #3b82f6 !important;
}

.search-item.active-item .enter-icon {
  opacity: 1 !important;
  color: var(--bs-primary) !important;
  transform: translateX(2px);
}

.hover-bg:hover {
  background-color: var(--bs-tertiary-bg, rgba(0,0,0,0.05));
}

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
