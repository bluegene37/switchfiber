import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import apiClient from '../services/api'
import {
  ALL_MENU_CODES,
  MENU_CODE_TO_SERVER_KEY,
  SERVER_BACKED_MENU_CODES,
  PARENT_TO_CHILD_CODES,
  normalizeMenuName,
  resolveMenuCodesFromName,
  isSuperAdminName
} from '../constants/menuCatalog'

// Shared reactive state across all components
const allowedMenuCodes = ref(new Set())
const isLoadingPermissions = ref(false)
const hasLoadedOnce = ref(false)

// Live registry mappings: rebuilt from `/api/Menus` on every permission load.
// Database IDs can shift, get re-seeded or deleted, so everything resolves
// dynamically through parsed menu names.
const menuIdByServerKey = ref(new Map())
const serverKeyByMenuId = ref(new Map())
const menuIdToCodes = ref(new Map())
const codeToMenuIds = ref(new Map())
const menuIdToName = ref(new Map())

// Why the restricted fallback set was applied instead of stored permissions:
// 'error' = the access level API could not be reached / failed, 'empty' = the
// API responded but held no usable rows. `null` = real permissions are active.
const permissionsFallbackReason = ref(null)

// Menu names present in `/api/Menus` that no catalog entry claims, and catalog
// entries that found no matching row. Surfaced for diagnostics.
const unmatchedServerMenus = ref([])
const unresolvedMenuCodes = ref([])

const unwrap = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'object') {
    const key = Object.keys(val).find(k => Array.isArray(val[k]))
    if (key) return val[key]
  }
  return []
}

// The name of the user's access level, resolved from the API. Lets a level
// NAMED "Super Admin" stored under any ID (e.g. ID 3) still be treated as a super admin.
const resolvedLevelName = ref('')

// Everything below is module scope, not per-component: the route guard has to
// ask the same questions the sidebar does, and it runs outside any component.

const currentUser = () => useAuthStore().user

const userAccessLevel = computed(() => {
  const user = currentUser()
  return Number(user?.accesslevel_id || user?.accessLevelId || 0)
})

/**
 * Super Admin is decided by NAME, never by ID.
 *
 * The IDs are not stable — the client deletes and recreates access levels, and
 * the live data shows it: 28 AccesslevelMenu rows still point at level 1, a level
 * that no longer exists, and the current Super Admin sits at ID 3. Trusting
 * `id === 1 || id === 3` means the next re-seed hands the whole menu to whichever
 * level lands on that ID.
 *
 * The match is also a whole-name match (`isSuperAdminName`), not a substring one:
 * a substring test on 'super' gives "Supervisor" and "Superintendent" full access,
 * and a level named "Developer" is an ordinary level whose menus are granted row
 * by row like everyone else's.
 */
const isSuperAdmin = computed(() => {
  const user = currentUser()
  return (
    isSuperAdminName(resolvedLevelName.value) ||
    isSuperAdminName(user?.role) ||
    isSuperAdminName(user?.accessLevelName)
  )
})

// Fallback menu when no stored permissions are usable: Dashboard + Settings only.
const buildFallbackMenuSet = () => new Set(['dashboard', 'settings'])

const resolveLevelName = async () => {
  const levelId = userAccessLevel.value
  const user = currentUser()
  if (user?.role || user?.accessLevelName) {
    resolvedLevelName.value = String(user.role || user.accessLevelName)
  }

  if (!levelId) return

  try {
    const level = await apiClient.get(`/AccessLevel/${levelId}`, { cancelOnNavigate: false })
    const name = String(level?.name || level?.Name || level?.data?.name || '')
    if (name) {
      resolvedLevelName.value = name
      return
    }
  } catch {
    // Endpoint fallback
  }

  try {
    const levels = await apiClient.get('/AccessLevel', { cancelOnNavigate: false })
    const arr = unwrap(levels)
    const matched = arr.find(l => Number(l.id || l.Id) === levelId)
    if (matched && (matched.name || matched.Name)) {
      resolvedLevelName.value = String(matched.name || matched.Name)
    }
  } catch {
    // Retain existing name
  }
}

/**
 * Pull `/api/Menus` and index it by intelligently parsed name.
 * Maps live row IDs to catalog codes and vice versa.
 */
const loadMenuRegistry = async () => {
  let rows = []
  try {
    rows = unwrap(await apiClient.get('/Menus', { cancelOnNavigate: false }))
  } catch {
    menuIdByServerKey.value = new Map()
    serverKeyByMenuId.value = new Map()
    menuIdToCodes.value = new Map()
    codeToMenuIds.value = new Map()
    menuIdToName.value = new Map()
    return false
  }

  const byKey = new Map()
  const byId = new Map()
  const idToCodesMap = new Map()
  const codeToIdsMap = new Map()
  const idToNameMap = new Map()

  rows.forEach(row => {
    const id = Number(row?.id ?? row?.Id)
    const rawName = String(row?.name ?? row?.Name ?? '').trim()
    const key = normalizeMenuName(rawName)
    if (!key || isNaN(id) || id <= 0) return

    if (!byKey.has(key) || byKey.get(key) > id) byKey.set(key, id)
    byId.set(id, key)
    idToNameMap.set(id, rawName)

    // Intelligently parse and resolve codes for this row name
    const codes = resolveMenuCodesFromName(rawName)
    idToCodesMap.set(id, codes)

    codes.forEach(code => {
      if (!codeToIdsMap.has(code)) codeToIdsMap.set(code, [])
      codeToIdsMap.get(code).push(id)
    })
  })

  menuIdByServerKey.value = byKey
  serverKeyByMenuId.value = byId
  menuIdToCodes.value = idToCodesMap
  codeToMenuIds.value = codeToIdsMap
  menuIdToName.value = idToNameMap

  // Diagnostics
  const matchedServerNames = new Set()
  rows.forEach(r => {
    const name = String(r?.name ?? r?.Name ?? '').trim()
    const codes = resolveMenuCodesFromName(name)
    if (codes.length > 0) matchedServerNames.add(name)
  })

  unmatchedServerMenus.value = rows
    .map(r => String(r?.name ?? r?.Name ?? '').trim())
    .filter(name => name && !matchedServerNames.has(name))

  unresolvedMenuCodes.value = SERVER_BACKED_MENU_CODES
    .filter(code => !codeToIdsMap.has(code))

  return idToCodesMap.size > 0 || rows.length > 0
}

/** The `/api/Menus` id currently representing this code, or null. */
const serverIdForCode = (code) => {
  const ids = codeToMenuIds.value.get(code)
  if (ids && ids.length > 0) return ids[0]
  const key = MENU_CODE_TO_SERVER_KEY.get(code)
  if (!key) return null
  const id = menuIdByServerKey.value.get(key)
  return id === undefined ? null : id
}

// The in-flight load, so the route guard can wait for the answer instead of
// deciding against a half-built permission set. Cleared when the load settles.
let pendingFetch = null

const runFetch = async () => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    allowedMenuCodes.value = new Set()
    permissionsFallbackReason.value = null
    hasLoadedOnce.value = true
    return
  }

  isLoadingPermissions.value = true
  try {
    await resolveLevelName()

    // Super Admin has every menu by definition
    if (isSuperAdmin.value) {
      await loadMenuRegistry()
      allowedMenuCodes.value = new Set(ALL_MENU_CODES)
      permissionsFallbackReason.value = null
      return
    }

    const registryLoaded = await loadMenuRegistry()
    if (!registryLoaded) {
      allowedMenuCodes.value = buildFallbackMenuSet()
      permissionsFallbackReason.value = 'error'
      return
    }

    const levelId = userAccessLevel.value
    const requests = []
    if (levelId) {
      requests.push(apiClient.get(`/AccesslevelMenu/${levelId}`, { cancelOnNavigate: false }))
      requests.push(apiClient.get(`/AccessLevelMenu/${levelId}`, { cancelOnNavigate: false }))
    }
    requests.push(apiClient.get('/AccesslevelMenu', { cancelOnNavigate: false }))
    requests.push(apiClient.get('/AccessLevelMenu', { cancelOnNavigate: false }))

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
    const grantedIds = combined
      .filter(r => {
        if (!r || typeof r !== 'object') return false
        const accId = String(r.accessLevelId ?? r.accesslevel_id ?? r.AccessLevelId ?? '').trim()
        return !accId || accId === targetIdStr
      })
      .map(r => Number(r.menuId ?? r.menu_id ?? r.MenuId))
      .filter(id => !isNaN(id) && id > 0)

    if (grantedIds.length > 0) {
      const allowed = new Set()

      // Turn granted menu IDs into their resolved catalog codes via name parsing
      grantedIds.forEach(id => {
        const codes = menuIdToCodes.value.get(id)
        if (codes && codes.length > 0) {
          codes.forEach(code => {
            allowed.add(code)
            // If a parent category is granted, grant all its child items
            if (PARENT_TO_CHILD_CODES.has(code)) {
              PARENT_TO_CHILD_CODES.get(code).forEach(child => allowed.add(child))
            }
          })
        } else {
          // Fallback via normalized server key
          const key = serverKeyByMenuId.value.get(id)
          if (key) {
            const matched = resolveMenuCodesFromName(key)
            matched.forEach(c => allowed.add(c))
          }
        }
      })

      // Screens with no serverMenu row in the catalog are client features
      // granted unless explicitly denied
      ALL_MENU_CODES.forEach(code => {
        if (!MENU_CODE_TO_SERVER_KEY.has(code) && !codeToMenuIds.value.has(code)) {
          allowed.add(code)
        }
      })

      allowedMenuCodes.value = allowed
      permissionsFallbackReason.value = null
    } else {
      allowedMenuCodes.value = buildFallbackMenuSet()
      permissionsFallbackReason.value = anyFulfilled ? 'empty' : 'error'
    }
  } catch (err) {
    console.warn('[usePermissions] Error fetching access level permissions:', err)
    allowedMenuCodes.value = buildFallbackMenuSet()
    permissionsFallbackReason.value = 'error'
  } finally {
    isLoadingPermissions.value = false
    hasLoadedOnce.value = true
  }
}

const fetchPermissions = () => {
  const run = runFetch().finally(() => {
    if (pendingFetch === run) pendingFetch = null
  })
  pendingFetch = run
  return run
}

/**
 * Resolve to the current permission set, starting a load if none has happened.
 * The route guard awaits this: deciding access against an unloaded set would let
 * every first navigation through.
 */
export const ensurePermissionsLoaded = async () => {
  if (pendingFetch) return pendingFetch
  if (!hasLoadedOnce.value) return fetchPermissions()
  return Promise.resolve()
}

export const canAccess = (code) => {
  // Access Level management is always reachable for a Super Admin
  if (code === 'users-management.access-level' && isSuperAdmin.value) return true

  if (hasLoadedOnce.value) {
    return allowedMenuCodes.value.has(code)
  }
  return true
}

const handleUpdateEvent = (event) => {
  if (event?.detail && typeof event.detail === 'object') {
    const { accessLevelId, menuId, menuName, linked } = event.detail
    if (Number(accessLevelId) !== userAccessLevel.value) return

    let codes = []
    if (menuName) {
      codes = resolveMenuCodesFromName(menuName)
    } else if (menuId && menuIdToCodes.value.has(Number(menuId))) {
      codes = menuIdToCodes.value.get(Number(menuId))
    } else {
      const key = serverKeyByMenuId.value.get(Number(menuId))
      if (key) codes = resolveMenuCodesFromName(key)
    }

    if (!codes || !codes.length) return

    const nextSet = new Set(allowedMenuCodes.value)
    codes.forEach(code => {
      if (linked) {
        nextSet.add(code)
        if (PARENT_TO_CHILD_CODES.has(code)) {
          PARENT_TO_CHILD_CODES.get(code).forEach(child => nextSet.add(child))
        }
      } else {
        nextSet.delete(code)
      }
    })
    allowedMenuCodes.value = nextSet
  }
}

export function usePermissions() {
  const authStore = useAuthStore()

  const canAccessSettings = computed(() => canAccess('settings'))
  const canAccessTheme = computed(() => canAccess('settings.theme'))
  const canAccessModifyPassword = computed(() => canAccess('settings.modify-password'))
  const canAccessUnmaskPassword = computed(() => canAccess('settings.unmask-password'))

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
    allowedMenuCodes,
    isLoadingPermissions,
    hasLoadedPermissions: hasLoadedOnce,
    permissionsFallbackReason,
    unmatchedServerMenus,
    unresolvedMenuCodes,
    isSuperAdmin,
    fetchPermissions,
    serverIdForCode,
    canAccess,
    canAccessSettings,
    canAccessTheme,
    canAccessModifyPassword,
    canAccessUnmaskPassword
  }
}
