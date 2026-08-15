import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import apiClient from '../services/api'

// Shared reactive state across all components
const allowedMenuIds = ref(new Set())
const unlinkedMenuIds = new Set()
const isLoadingPermissions = ref(false)
const hasLoadedOnce = ref(false)

const unwrap = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'object') {
    const key = Object.keys(val).find(k => Array.isArray(val[k]))
    if (key) return val[key]
  }
  return []
}

export function usePermissions() {
  const authStore = useAuthStore()

  const userAccessLevel = computed(() => {
    return Number(authStore.user?.accesslevel_id || authStore.user?.accessLevelId || 1)
  })

  const isSuperAdmin = computed(() => {
    return userAccessLevel.value === 1 || String(authStore.user?.role || '').toLowerCase().includes('super')
  })

  const fetchPermissions = async () => {
    if (!authStore.isAuthenticated) {
      allowedMenuIds.value = new Set()
      return
    }

    isLoadingPermissions.value = true
    try {
      const levelId = userAccessLevel.value
      const requests = []
      if (levelId) {
        requests.push(apiClient.get(`/AccesslevelMenu/${levelId}`).catch(() => []))
        requests.push(apiClient.get(`/AccessLevelMenu/${levelId}`).catch(() => []))
      }
      requests.push(apiClient.get('/AccesslevelMenu').catch(() => []))
      requests.push(apiClient.get('/AccessLevelMenu').catch(() => []))

      const responses = await Promise.allSettled(requests)
      const combined = []
      responses.forEach(r => {
        if (r.status === 'fulfilled') {
          const arr = unwrap(r.value)
          if (Array.isArray(arr)) combined.push(...arr)
        }
      })

      const targetIdStr = String(levelId).trim()
      const granted = combined
        .filter(r => {
          if (!r || typeof r !== 'object') return false
          const accId = String(r.accessLevelId ?? r.accesslevel_id ?? r.AccessLevelId ?? '').trim()
          return !accId || accId === targetIdStr
        })
        .map(r => Number(r.menuId ?? r.menu_id ?? r.MenuId))
        .filter(id => !isNaN(id) && id > 0)

      if (granted.length > 0) {
        allowedMenuIds.value = new Set(granted)
      } else {
        allowedMenuIds.value = new Set([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 101, 102, 103])
      }
    } catch (err) {
      console.warn('[usePermissions] Error fetching access level permissions:', err)
      allowedMenuIds.value = new Set([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 101, 102, 103])
    } finally {
      isLoadingPermissions.value = false
      hasLoadedOnce.value = true
    }
  }

  const canAccess = (menuId) => {
    const id = Number(menuId)
    // Only the Access Level management module (id: 16) is protected for Super Admin
    if (id === 16 && isSuperAdmin.value) return true

    if (hasLoadedOnce.value) {
      return allowedMenuIds.value.has(id)
    }
    return true
  }

  const canAccessSettings = computed(() => canAccess(20))
  const canAccessTheme = computed(() => canAccess(103))
  const canAccessModifyPassword = computed(() => canAccess(101))
  const canAccessUnmaskPassword = computed(() => canAccess(102))

  const handleUpdateEvent = (event) => {
    if (event?.detail && typeof event.detail === 'object') {
      const { accessLevelId, menuId, linked } = event.detail
      if (Number(accessLevelId) === userAccessLevel.value) {
        const idNum = Number(menuId)
        const nextSet = new Set(allowedMenuIds.value)
        if (linked) {
          nextSet.add(idNum)
          unlinkedMenuIds.delete(idNum)
        } else {
          nextSet.delete(idNum)
          unlinkedMenuIds.add(idNum)
        }
        allowedMenuIds.value = nextSet
      }
    }
  }

  onMounted(() => {
    if (!hasLoadedOnce.value) {
      fetchPermissions()
    }
    window.addEventListener('accesslevelmenu-updated', handleUpdateEvent)
  })

  onUnmounted(() => {
    window.removeEventListener('accesslevelmenu-updated', handleUpdateEvent)
  })

  watch(() => authStore.user, () => {
    fetchPermissions()
  }, { deep: true })

  return {
    allowedMenuIds,
    isLoadingPermissions,
    isSuperAdmin,
    fetchPermissions,
    canAccess,
    canAccessSettings,
    canAccessTheme,
    canAccessModifyPassword,
    canAccessUnmaskPassword
  }
}
