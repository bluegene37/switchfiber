// Gene - Nov, 25, 2026: Pinia store for centralized ApplicationConfiguration settings and runtime theme application
import { defineStore } from 'pinia'
import { ref } from 'vue'
/*
import {
  ApplicationConfigurationService,
  isValidHexColor,
  normalizeHexColor,
  normalizeConfigKey
} from '../services/applicationConfiguration'
import { useTheme } from '../composables/useTheme'
*/
// Gene - Nov, 25, 2026: Use explicit .js extensions for Node ESM + Vite compatibility
import {
  ApplicationConfigurationService,
  isValidHexColor,
  normalizeHexColor,
  normalizeConfigKey
} from '../services/applicationConfiguration.js'
import { useTheme } from '../composables/useTheme.js'

const DEFAULT_APP_TITLE = 'SwitchFiber - Admin'

const extractArray = (response) => {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    const arrayKey = Object.keys(response).find(k => Array.isArray(response[k]))
    if (arrayKey) return response[arrayKey]
  }
  return []
}

export const useAppConfigStore = defineStore('appConfig', () => {
  const configs = ref([])
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const isSaving = ref(false)
  const error = ref(null)
  const appTitle = ref(DEFAULT_APP_TITLE)

  let pendingLoadPromise = null

  const findConfig = (key) => {
    const target = normalizeConfigKey(key)
    if (!target) return null
    return configs.value.find(
      item =>
        normalizeConfigKey(item?.name) === target ||
        normalizeConfigKey(item?.code) === target
    ) || null
  }

  const getConfig = (key) => {
    const match = findConfig(key)
    if (!match || match.isEnable === false) return null
    return match
  }

  const getValue = (key, fallback = '') => {
    const match = getConfig(key)
    if (!match || match.value === undefined || match.value === null) return fallback
    const trimmed = String(match.value).trim()
    return trimmed !== '' ? trimmed : fallback
  }

  const getFirstValue = (keys = [], fallback = '') => {
    for (const key of keys) {
      const match = getConfig(key)
      if (match && match.value !== undefined && match.value !== null) {
        const trimmed = String(match.value).trim()
        if (trimmed !== '') return trimmed
      }
    }
    return fallback
  }

  const applyRuntimeSettings = () => {
    const {
      setColorTheme,
      setThemeMode,
      applySemanticColorOverrides,
      MASTER_THEME_COLOR,
      THEME_PALETTES
    } = useTheme()

    // 1. Primary brand color
    const primarySetting = getFirstValue(['THEME_PRIMARY_COLOR', 'PRIMARY_COLOR', 'BRAND_COLOR'], '')
    if (primarySetting) {
      if (THEME_PALETTES[primarySetting]) {
        setColorTheme(primarySetting, { persist: true })
      } else {
        const normalized = normalizeHexColor(primarySetting)
        setColorTheme(normalized || MASTER_THEME_COLOR, { persist: true })
      }
    } else {
      setColorTheme(MASTER_THEME_COLOR, { persist: true })
    }

    // 2. Default light/dark mode (only when the user has not chosen a local theme preference)
    const defaultMode = getFirstValue(['THEME_DEFAULT_MODE', 'DEFAULT_THEME_MODE'], '').toLowerCase()
    const hasLocalTheme = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('theme'))
    if ((defaultMode === 'dark' || defaultMode === 'light') && !hasLocalTheme) {
      setThemeMode(defaultMode, { persist: false })
    }

    // 3. Semantic & table row highlight overrides
    const overrides = {}
    const semanticMap = {
      success: 'THEME_SUCCESS_COLOR',
      warning: 'THEME_WARNING_COLOR',
      danger: 'THEME_DANGER_COLOR',
      info: 'THEME_INFO_COLOR',
      rowHighlight: 'THEME_ROW_HIGHLIGHT'
    }
    for (const [overrideKey, configName] of Object.entries(semanticMap)) {
      const val = getValue(configName, '')
      if (isValidHexColor(val)) {
        overrides[overrideKey] = normalizeHexColor(val)
      }
    }
    applySemanticColorOverrides(overrides, { persist: true })

    // 4. Application title prefix
    const configuredTitle = getFirstValue(['APP_TITLE', 'APP_NAME'], DEFAULT_APP_TITLE)
    appTitle.value = configuredTitle || DEFAULT_APP_TITLE
    if (typeof document !== 'undefined') {
      const currentTitle = String(document.title || '')
      if (currentTitle.includes(' | ')) {
        const pageSuffix = currentTitle.split(' | ').slice(1).join(' | ').trim()
        document.title = pageSuffix ? `${appTitle.value} | ${pageSuffix}` : appTitle.value
      } else {
        document.title = appTitle.value
      }
    }
  }

  const loadConfigs = async ({ force = false } = {}) => {
    if (pendingLoadPromise && !force) return pendingLoadPromise
    if (isLoaded.value && !force) return configs.value

    isLoading.value = true
    error.value = null

    const run = async () => {
      try {
        const response = await ApplicationConfigurationService.getAll()
        const rows = extractArray(response)
        configs.value = [...rows].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
        isLoaded.value = true
        applyRuntimeSettings()
        return configs.value
      } catch (err) {
        error.value = err?.message || 'Unable to load application configuration.'
        return configs.value
      } finally {
        isLoading.value = false
        pendingLoadPromise = null
      }
    }

    pendingLoadPromise = run()
    return pendingLoadPromise
  }

  const createConfig = async (payload) => {
    isSaving.value = true
    error.value = null
    try {
      const created = await ApplicationConfigurationService.create(payload)
      await loadConfigs({ force: true })
      return created
    } catch (err) {
      error.value = err?.message || 'Failed to create configuration.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const updateConfig = async (id, code, payload) => {
    isSaving.value = true
    error.value = null
    try {
      const updated = await ApplicationConfigurationService.update(id, code, payload)
      await loadConfigs({ force: true })
      return updated
    } catch (err) {
      error.value = err?.message || 'Failed to update configuration.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const deleteConfig = async (code) => {
    isSaving.value = true
    error.value = null
    try {
      const removed = await ApplicationConfigurationService.remove(code)
      await loadConfigs({ force: true })
      return removed
    } catch (err) {
      error.value = err?.message || 'Failed to delete configuration.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const toggleConfig = async (record) => {
    if (!record) return null
    return updateConfig(record.id, record.code, {
      name: record.name,
      accountNo: record.code || record.accountNo || record.name,
      value: record.value,
      description: record.description || record.name,
      isEnable: !record.isEnable
    })
  }

  const upsertSetting = async (name, { value, description, isEnable = true, accountNo } = {}) => {
    const existing = findConfig(name)
    if (existing) {
      return updateConfig(existing.id, existing.code, {
        name: existing.name,
        accountNo: existing.code || accountNo || existing.name,
        value,
        description: description !== undefined ? description : existing.description,
        isEnable
      })
    }
    return createConfig({
      name,
      accountNo: accountNo || name,
      value,
      description: description || name,
      isEnable
    })
  }

  return {
    configs,
    isLoading,
    isLoaded,
    isSaving,
    error,
    appTitle,
    findConfig,
    getConfig,
    getValue,
    getFirstValue,
    applyRuntimeSettings,
    loadConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleConfig,
    upsertSetting
  }
})
