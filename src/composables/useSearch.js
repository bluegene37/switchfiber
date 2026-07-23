import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from './useTheme'
import { ApplicationService } from '../services/applications'
import { JobOrderService } from '../services/jobOrders'
import { UserService } from '../services/users'
import { PlanService } from '../services/plans'

const RECENT_SEARCHES_KEY = 'switchfiber_recent_searches_v1'
const MAX_RECENT_ITEMS = 5

export function useSearch() {
  const router = useRouter()
  const { toggleTheme, isDark } = useTheme()

  const searchQuery = ref('')
  const isSearchOpen = ref(false)
  const isLoading = ref(false)
  const selectedIndex = ref(0)
  const recentSearches = ref([])

  // Store active AbortController for request cancellation
  let activeAbortController = null
  let debounceTimeout = null

  // 1. Static App Navigation Scopes
  const navigationItems = [
    { id: 'nav-dashboard', category: 'Navigation', title: 'Dashboard', subtitle: 'System metrics, KPI stats, & real-time overview', icon: 'pi pi-home', route: '/dashboard' },
    { id: 'nav-application', category: 'Navigation', title: 'Applications', subtitle: 'Customer fiber connection applications', icon: 'pi pi-file-edit', route: '/application' },
    { id: 'nav-job-order', category: 'Navigation', title: 'Job Orders', subtitle: 'Field installation & repair dispatch tickets', icon: 'pi pi-ticket', route: '/job_order' },
    { id: 'nav-billing', category: 'Navigation', title: 'Billing & Payments', subtitle: 'Customer billing details & invoices', icon: 'pi pi-credit-card', route: '/billing' },
    { id: 'nav-invoice', category: 'Navigation', title: 'Invoices', subtitle: 'Generated billing invoices & statements', icon: 'pi pi-receipt', route: '/invoice' },
    { id: 'nav-lcp', category: 'Navigation', title: 'LCP Maintenance', subtitle: 'Local Control Point cabinets', icon: 'pi pi-server', route: '/lcp' },
    { id: 'nav-lcnap', category: 'Navigation', title: 'LCNAP Maintenance', subtitle: 'LCNAP splitter box maintenance', icon: 'pi pi-sitemap', route: '/lcnap' },
    { id: 'nav-lcnap-port', category: 'Navigation', title: 'LCNAP Ports', subtitle: 'LCNAP fiber port allocations', icon: 'pi pi-box', route: '/lcnap_port' },
    { id: 'nav-nap', category: 'Navigation', title: 'NAP Management', subtitle: 'Network Access Points configuration', icon: 'pi pi-globe', route: '/nap' },
    { id: 'nav-port', category: 'Navigation', title: 'Port Management', subtitle: 'Fiber port status & assignments', icon: 'pi pi-share-alt', route: '/port' },
    { id: 'nav-vlan', category: 'Navigation', title: 'VLAN Settings', subtitle: 'Virtual LAN network segmentation', icon: 'pi pi-shield', route: '/vlan' },
    { id: 'nav-router', category: 'Navigation', title: 'Router Management', subtitle: 'Core & edge router configurations', icon: 'pi pi-desktop', route: '/router' },
    { id: 'nav-plan', category: 'Navigation', title: 'Fiber Plans', subtitle: 'Bandwidth packages & pricing tiers', icon: 'pi pi-tags', route: '/plan' },
    { id: 'nav-user', category: 'Navigation', title: 'User Accounts', subtitle: 'System users & admin accounts', icon: 'pi pi-users', route: '/user' },
    { id: 'nav-access-level', category: 'Navigation', title: 'Access Levels & Permissions', subtitle: 'Role-based access control matrix', icon: 'pi pi-lock', route: '/access_level' },
    { id: 'nav-api-viewer', category: 'Navigation', title: 'API Data Viewer', subtitle: 'Inspect raw JSON endpoints & API tables', icon: 'pi pi-database', route: '/data-viewer' },
    { id: 'nav-settings', category: 'Navigation', title: 'Settings', subtitle: 'Account settings & preference management', icon: 'pi pi-cog', route: '/settings' }
  ]

  // 2. System Quick Actions
  const actionItems = [
    {
      id: 'act-toggle-theme',
      category: 'Quick Actions',
      title: 'Toggle Dark Mode',
      subtitle: computed(() => `Switch interface appearance to ${isDark.value ? 'Light' : 'Dark'} mode`),
      icon: 'pi pi-moon',
      action: () => toggleTheme()
    },
    {
      id: 'act-new-app',
      category: 'Quick Actions',
      title: 'Create New Application',
      subtitle: 'Open customer application form',
      icon: 'pi pi-plus-circle',
      route: '/application'
    },
    {
      id: 'act-new-job',
      category: 'Quick Actions',
      title: 'Dispatch New Job Order',
      subtitle: 'Create technical service ticket',
      icon: 'pi pi-send',
      route: '/job_order'
    }
  ]

  // Dynamic API Entity Results
  const dynamicResults = ref([])

  // Load recent searches on mount
  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        recentSearches.value = JSON.parse(stored)
      }
    } catch (e) {
      recentSearches.value = []
    }
  }

  const saveRecentSearch = (item) => {
    if (!item || !item.title) return
    const filtered = recentSearches.value.filter(r => r.title !== item.title)
    const updated = [{
      title: item.title,
      subtitle: item.subtitle || item.category,
      category: item.category || 'Recent',
      icon: item.icon || 'pi pi-search',
      route: item.route
    }, ...filtered].slice(0, MAX_RECENT_ITEMS)

    recentSearches.value = updated
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch (e) {
      // Ignore storage quota errors
    }
  }

  const clearRecentSearches = () => {
    recentSearches.value = []
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch (e) {}
  }

  // Unified Filtered Results
  const filteredNavigation = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return []
    return navigationItems.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.subtitle.toLowerCase().includes(query)
    ).slice(0, 5)
  })

  const filteredActions = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return []
    return actionItems.filter(item => {
      const sub = typeof item.subtitle === 'object' ? item.subtitle.value : item.subtitle
      return item.title.toLowerCase().includes(query) || sub.toLowerCase().includes(query)
    })
  })

  // Grouped Results structure for UI rendering
  const groupedResults = computed(() => {
    const groups = []

    if (filteredNavigation.value.length > 0) {
      groups.push({
        name: 'Navigation & Pages',
        icon: 'pi pi-compass',
        items: filteredNavigation.value
      })
    }

    if (dynamicResults.value.length > 0) {
      groups.push({
        name: 'Records & Data',
        icon: 'pi pi-database',
        items: dynamicResults.value
      })
    }

    if (filteredActions.value.length > 0) {
      groups.push({
        name: 'Quick Actions',
        icon: 'pi pi-bolt',
        items: filteredActions.value
      })
    }

    return groups
  })

  // Flattened list for keyboard navigation index
  const flatResults = computed(() => {
    return groupedResults.value.flatMap(group => group.items)
  })

  // Async API Search with Debounce & Request Cancellation
  const executeSearch = async (query) => {
    if (activeAbortController) {
      activeAbortController.abort()
    }

    if (!query || query.length < 2) {
      dynamicResults.value = []
      isLoading.value = false
      return
    }

    isLoading.value = true
    activeAbortController = new AbortController()
    const signal = activeAbortController.signal

    try {
      const lowerQuery = query.toLowerCase()

      // Perform parallel lightweight searches across services
      const [appsRes, jobsRes, usersRes, plansRes] = await Promise.allSettled([
        ApplicationService.getApplications(),
        JobOrderService.getJobOrders(),
        UserService.getUsers(),
        PlanService.getPlans()
      ])

      if (signal.aborted) return

      const fetched = []

      // Process Applications
      if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value)) {
        appsRes.value.forEach(app => {
          const name = `${app.firstName || ''} ${app.lastName || ''}`.trim() || app.name || ''
          const email = app.email || app.mobileNumber || ''
          if (name.toLowerCase().includes(lowerQuery) || email.toLowerCase().includes(lowerQuery)) {
            fetched.push({
              id: `app-${app.id || app.applicationId}`,
              category: 'Applications',
              title: name || `Application #${app.id}`,
              subtitle: `Application • Status: ${app.status || 'Pending'} • ${email}`,
              icon: 'pi pi-user',
              route: '/application',
              badge: app.status || 'Application',
              badgeClass: 'bg-primary'
            })
          }
        })
      }

      // Process Job Orders
      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value)) {
        jobsRes.value.forEach(job => {
          const title = job.jobOrderNo || job.title || `Job Order #${job.id}`
          const details = job.remarks || job.type || job.status || ''
          if (title.toLowerCase().includes(lowerQuery) || details.toLowerCase().includes(lowerQuery)) {
            fetched.push({
              id: `job-${job.id}`,
              category: 'Job Orders',
              title: title,
              subtitle: `Job Order • ${details}`,
              icon: 'pi pi-ticket',
              route: '/job_order',
              badge: job.status || 'Job Order',
              badgeClass: 'bg-warning text-dark'
            })
          }
        })
      }

      // Process Users
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        usersRes.value.forEach(u => {
          const uname = u.username || `${u.fname || ''} ${u.lname || ''}`.trim()
          if (uname.toLowerCase().includes(lowerQuery) || (u.email && u.email.toLowerCase().includes(lowerQuery))) {
            fetched.push({
              id: `user-${u.id}`,
              category: 'Users',
              title: uname,
              subtitle: `User • ${u.email || u.role || 'System User'}`,
              icon: 'pi pi-user-check',
              route: '/user',
              badge: u.role || 'User',
              badgeClass: 'bg-info text-dark'
            })
          }
        })
      }

      // Process Plans
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value)) {
        plansRes.value.forEach(plan => {
          const pname = plan.planName || plan.name || ''
          if (pname.toLowerCase().includes(lowerQuery)) {
            fetched.push({
              id: `plan-${plan.id}`,
              category: 'Plans',
              title: pname,
              subtitle: `Plan • Price: ${plan.price || 'N/A'}`,
              icon: 'pi pi-tags',
              route: '/plan',
              badge: 'Plan',
              badgeClass: 'bg-success'
            })
          }
        })
      }

      if (!signal.aborted) {
        dynamicResults.value = fetched.slice(0, 6)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search query error:', err)
      }
    } finally {
      if (!signal.aborted) {
        isLoading.value = false
      }
    }
  }

  // Watch query with debounce
  watch(searchQuery, (newVal) => {
    selectedIndex.value = 0
    if (debounceTimeout) clearTimeout(debounceTimeout)

    if (!newVal.trim()) {
      dynamicResults.value = []
      isLoading.value = false
      return
    }

    isLoading.value = true
    debounceTimeout = setTimeout(() => {
      executeSearch(newVal.trim())
    }, 300)
  })

  // Keyboard navigation & Shortcuts
  const handleKeydown = (event) => {
    // Global Cmd+K or Ctrl+K or '/' shortcut to open/focus search box
    const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
    const isSlash = event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)

    if (isCmdK || isSlash) {
      event.preventDefault()
      isSearchOpen.value = true
      return
    }

    if (!isSearchOpen.value) return

    const total = flatResults.value.length

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (total > 0) {
        selectedIndex.value = (selectedIndex.value + 1) % total
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (total > 0) {
        selectedIndex.value = (selectedIndex.value - 1 + total) % total
      }
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (total > 0 && flatResults.value[selectedIndex.value]) {
        selectItem(flatResults.value[selectedIndex.value])
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeSearch()
    }
  }

  const selectItem = (item) => {
    if (!item) return
    saveRecentSearch(item)
    closeSearch()

    if (item.action && typeof item.action === 'function') {
      item.action()
    } else if (item.route) {
      router.push(item.route)
    }
  }

  const closeSearch = () => {
    isSearchOpen.value = false
    searchQuery.value = ''
    selectedIndex.value = 0
  }

  const openSearch = () => {
    isSearchOpen.value = true
  }

  onMounted(() => {
    loadRecentSearches()
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (debounceTimeout) clearTimeout(debounceTimeout)
    if (activeAbortController) activeAbortController.abort()
  })

  return {
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
  }
}
