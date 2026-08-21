import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import apiClient from '../services/api'

// Menu ids for screens that live in the front end and have no Menus row in the
// database yet. See fetchPermissions for how these are treated.
const CLIENT_PROVIDED_MENU_IDS = [29, 30, 32, 33, 34, 35, 36, 37, 38] // 29 = Models, 30 = Disconnection, 32-35 = Job Orders, 36-38 = LCP NAP Locations

// Shared reactive state across all components
const allowedMenuIds = ref(new Set())
const unlinkedMenuIds = new Set()
const isLoadingPermissions = ref(false)
const hasLoadedOnce = ref(false)

// Why the full fallback menu set was applied instead of stored permissions:
// 'error' = the access level API could not be reached / failed, 'empty' = the
// API responded but held no usable rows. `null` = real permissions are active.
const permissionsFallbackReason = ref(null)

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

  // What the menu falls back to when no stored permissions are usable. Super
  // admins get the full built-in menu so they can still administer the system;
  // everyone else is held to Dashboard + Settings until the API answers again —
  // a failed permission lookup must not silently grant a regular user everything.
  const buildFallbackMenuSet = () => {
    if (isSuperAdmin.value) {
      return new Set([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35, 36, 37, 38, 101, 102, 103])
    }
    return new Set([5, 20]) // 5 = Dashboard, 20 = Settings
  }

  const fetchPermissions = async () => {
    if (!authStore.isAuthenticated) {
      allowedMenuIds.value = new Set()
      permissionsFallbackReason.value = null
      // Still a settled answer — callers waiting on the first result should
      // stop showing a loader rather than spin forever.
      hasLoadedOnce.value = true
      return
    }

    isLoadingPermissions.value = true
    try {
      const levelId = userAccessLevel.value
      // No inner .catch here: allSettled records the rejections, which is what
      // lets an unreachable API ('error') be told apart from an API that
      // answered with no rows ('empty') when the fallback menu kicks in.
      const requests = []
      if (levelId) {
        requests.push(apiClient.get(`/AccesslevelMenu/${levelId}`))
        requests.push(apiClient.get(`/AccessLevelMenu/${levelId}`))
      }
      requests.push(apiClient.get('/AccesslevelMenu'))
      requests.push(apiClient.get('/AccessLevelMenu'))

      const responses = await Promise.allSettled(requests)
      const anyFulfilled = responses.some(r => r.status === 'fulfilled')
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
        const allowed = new Set(granted)

        // A screen shipped by the front end has no AccesslevelMenu row until an
        // admin ticks it in Access Level Management, and an unprovisioned id
        // would otherwise be indistinguishable from a revoked one — hiding the
        // page from everybody. Grant it only while nothing has ever been said
        // about it; the moment any access level is given or denied the menu,
        // the stored configuration takes over.
        const everProvisioned = new Set(
          combined
            .map(r => Number(r?.menuId ?? r?.menu_id ?? r?.MenuId))
            .filter(id => !isNaN(id) && id > 0)
        )
        CLIENT_PROVIDED_MENU_IDS.forEach(id => {
          if (!everProvisioned.has(id)) allowed.add(id)
        })

        allowedMenuIds.value = allowed
        permissionsFallbackReason.value = null
      } else {
        allowedMenuIds.value = buildFallbackMenuSet()
        permissionsFallbackReason.value = anyFulfilled ? 'empty' : 'error'
      }
    } catch (err) {
      console.warn('[usePermissions] Error fetching access level permissions:', err)
      allowedMenuIds.value = buildFallbackMenuSet()
      permissionsFallbackReason.value = 'error'
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
    hasLoadedPermissions: hasLoadedOnce,
    permissionsFallbackReason,
    isSuperAdmin,
    fetchPermissions,
    canAccess,
    canAccessSettings,
    canAccessTheme,
    canAccessModifyPassword,
    canAccessUnmaskPassword
  }
}
