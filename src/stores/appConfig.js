// Gene - Nov, 25, 2026: Pinia store for centralized ApplicationConfiguration settings and runtime theme application
import { defineStore } from 'pinia'
/*
import { ref } from 'vue'
*/
// Gene - Nov, 26, 2026: Add computed for reactive logo URL resolution alongside dynamic website settings
import { computed, ref } from 'vue'
/*
import {
  ApplicationConfigurationService,
  isValidHexColor,
  normalizeHexColor,
  normalizeConfigKey
} from '../services/applicationConfiguration'
import { useTheme } from '../composables/useTheme'
*/
/*
// Gene - Nov, 25, 2026: Use explicit .js extensions for Node ESM + Vite compatibility
import {
  ApplicationConfigurationService,
  isValidHexColor,
  normalizeHexColor,
  normalizeConfigKey
} from '../services/applicationConfiguration.js'
import { useTheme } from '../composables/useTheme.js'

const DEFAULT_APP_TITLE = 'SwitchFiber - Admin'
*/
// Gene - Nov, 26, 2026: Import preset lookup, asset resolver, and cache dynamic site settings for zero-flash hydration
import {
  APPLICATION_CONFIG_PRESETS,
  ApplicationConfigurationService,
  findPresetByCode,
  isValidHexColor,
  normalizeHexColor,
  normalizeConfigKey,
  resolveAssetUrl
} from '../services/applicationConfiguration.js'
import { useTheme } from '../composables/useTheme.js'

const SITE_SETTINGS_STORAGE_KEY = 'sfa_app_site_settings_v1'
const DEFAULT_APP_TITLE = 'SwitchFiber - Admin'
const DEFAULT_BRAND_NAME = 'Switch Fiber'
const DEFAULT_LOGIN_SUBTITLE = 'Distributed Fiber Network Management'
const DEFAULT_LANDING_SUBTITLE = 'SwitchFiber Network Operations Hub. Real-time operations calendar, live field weather, and network telemetry.'
const DEFAULT_FOOTER_TEXT = 'Switch Fiber Network Operations'
const DEFAULT_LOGO_PATH = 'logo.png'
const DEFAULT_FAVICON_PATH = 'favicon.ico'
const DEFAULT_TABLE_ROWS = 50
const DEFAULT_SUPPORT_EMAIL = 'admin@switchfiber.com'

const getBaseUrl = () => {
  try {
    return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
      ? import.meta.env.BASE_URL
      : '/'
  } catch {
    return '/'
  }
}

const readCachedSiteSettings = () => {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(SITE_SETTINGS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeCachedSiteSettings = (snapshot) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SITE_SETTINGS_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Ignore storage quota / private-mode errors cleanly
  }
}

const applyFavicon = (href) => {
  if (typeof document === 'undefined' || !document.head || !href) return
  try {
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    if (link.getAttribute('href') !== href) {
      link.setAttribute('href', href)
    }
  } catch {
    // Ignore DOM errors in headless/non-standard environments
  }
}

const extractArray = (response) => {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    const arrayKey = Object.keys(response).find(k => Array.isArray(response[k]))
    if (arrayKey) return response[arrayKey]
  }
  return []
}

export const useAppConfigStore = defineStore('appConfig', () => {
  const cachedSite = readCachedSiteSettings()
  const configs = ref([])
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const isSaving = ref(false)
  const error = ref(null)
  /*
  const appTitle = ref(DEFAULT_APP_TITLE)
  */
  // Gene - Nov, 26, 2026: Reactive dynamic website configuration properties hydrated from localStorage cache
  const appTitle = ref(cachedSite.appTitle || DEFAULT_APP_TITLE)
  const brandName = ref(cachedSite.brandName || DEFAULT_BRAND_NAME)
  const loginSubtitle = ref(cachedSite.loginSubtitle || DEFAULT_LOGIN_SUBTITLE)
  const landingSubtitle = ref(cachedSite.landingSubtitle || DEFAULT_LANDING_SUBTITLE)
  const footerText = ref(cachedSite.footerText || DEFAULT_FOOTER_TEXT)
  const logoPath = ref(cachedSite.logoPath || DEFAULT_LOGO_PATH)
  const logoUrl = computed(() => resolveAssetUrl(logoPath.value || DEFAULT_LOGO_PATH, getBaseUrl()) || `${getBaseUrl()}${DEFAULT_LOGO_PATH}`)
  const faviconPath = ref(cachedSite.faviconPath || DEFAULT_FAVICON_PATH)
  const defaultTableRows = ref(Number(cachedSite.defaultTableRows) > 0 ? Number(cachedSite.defaultTableRows) : DEFAULT_TABLE_ROWS)
  const supportEmail = ref(cachedSite.supportEmail || DEFAULT_SUPPORT_EMAIL)

  let pendingLoadPromise = null

  /*
  const findConfig = (key) => {
    const target = normalizeConfigKey(key)
    if (!target) return null
    return configs.value.find(
      item =>
        normalizeConfigKey(item?.name) === target ||
        normalizeConfigKey(item?.code) === target
    ) || null
  }
  */
  // Gene - Nov, 26, 2026: Resolve configs by exact Setting Code (name/code) or legacy preset aliases
  const findConfig = (key) => {
    const target = normalizeConfigKey(key)
    if (!target) return null

    const matchByKey = (candidateKey) => configs.value.find(
      item =>
        normalizeConfigKey(item?.name) === candidateKey ||
        normalizeConfigKey(item?.code) === candidateKey
    ) || null

    const exact = matchByKey(target)
    if (exact) return exact

    const preset = findPresetByCode(target)
    if (preset) {
      const candidateKeys = [preset.name, ...(preset.aliases || [])]
        .map(normalizeConfigKey)
        .filter(k => k && k !== target)
      for (const altKey of candidateKeys) {
        const match = matchByKey(altKey)
        if (match) return match
      }
    }
    return null
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

  /*
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
  */
  // Gene - Nov, 26, 2026: Apply short-code dynamic website settings (TITLE1, BRAND1, COLOR1, etc.) + semantic colors, favicon, and localStorage snapshot
  const applyRuntimeSettings = () => {
    const {
      setColorTheme,
      setThemeMode,
      applySemanticColorOverrides,
      MASTER_THEME_COLOR,
      THEME_PALETTES
    } = useTheme()

    // 1. Primary brand color (COLOR1 + legacy aliases)
    const primarySetting = getFirstValue(['COLOR1', 'THEME_PRIMARY_COLOR', 'PRIMARY_COLOR', 'BRAND_COLOR'], '')
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

    // 2. Default light/dark mode (MODE1 + legacy aliases; only when the user has not chosen a local preference)
    const defaultMode = getFirstValue(['MODE1', 'THEME_DEFAULT_MODE', 'DEFAULT_THEME_MODE'], '').toLowerCase()
    const hasLocalTheme = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('theme'))
    if ((defaultMode === 'dark' || defaultMode === 'light') && !hasLocalTheme) {
      setThemeMode(defaultMode, { persist: false })
    }

    // 3. Semantic & table row highlight overrides
    const overrides = {}
    const semanticKeyGroups = {
      success: ['SUCCESS1', 'THEME_SUCCESS_COLOR'],
      warning: ['WARNING1', 'THEME_WARNING_COLOR'],
      danger: ['DANGER1', 'THEME_DANGER_COLOR'],
      info: ['INFO1', 'THEME_INFO_COLOR'],
      rowHighlight: ['ROWHIGHLIGHT1', 'THEME_ROW_HIGHLIGHT', 'ROW_HIGHLIGHT_COLOR']
    }
    for (const [overrideKey, keys] of Object.entries(semanticKeyGroups)) {
      const val = getFirstValue(keys, '')
      if (isValidHexColor(val)) {
        overrides[overrideKey] = normalizeHexColor(val)
      }
    }
    applySemanticColorOverrides(overrides, { persist: true })

    // 4. Dynamic titles, branding copy, logo/favicon paths, table page size & support contact
    appTitle.value = getFirstValue(['TITLE1', 'APP_TITLE', 'APP_NAME'], DEFAULT_APP_TITLE) || DEFAULT_APP_TITLE
    brandName.value = getFirstValue(['BRAND1', 'BRAND_NAME', 'SITE_NAME'], DEFAULT_BRAND_NAME) || DEFAULT_BRAND_NAME
    loginSubtitle.value = getFirstValue(['SUBTITLE1', 'LOGIN_SUBTITLE', 'TAGLINE'], DEFAULT_LOGIN_SUBTITLE) || DEFAULT_LOGIN_SUBTITLE
    landingSubtitle.value = getFirstValue(['LANDING1', 'LANDING_SUBTITLE', 'HERO_SUBTITLE'], DEFAULT_LANDING_SUBTITLE) || DEFAULT_LANDING_SUBTITLE
    footerText.value = getFirstValue(['FOOTER1', 'FOOTER_TEXT', 'COPYRIGHT_TEXT'], DEFAULT_FOOTER_TEXT) || DEFAULT_FOOTER_TEXT
    logoPath.value = getFirstValue(['LOGO1', 'LOGO_URL', 'APP_LOGO'], DEFAULT_LOGO_PATH) || DEFAULT_LOGO_PATH
    faviconPath.value = getFirstValue(['FAVICON1', 'FAVICON_URL', 'APP_FAVICON'], DEFAULT_FAVICON_PATH) || DEFAULT_FAVICON_PATH

    const rowsRaw = getFirstValue(['ROWS1', 'DEFAULT_TABLE_ROWS', 'PAGE_SIZE'], String(DEFAULT_TABLE_ROWS))
    const parsedRows = Number.parseInt(rowsRaw, 10)
    defaultTableRows.value = Number.isFinite(parsedRows) && parsedRows > 0 ? parsedRows : DEFAULT_TABLE_ROWS

    supportEmail.value = getFirstValue(['SUPPORT1', 'SUPPORT_EMAIL', 'CONTACT_EMAIL'], DEFAULT_SUPPORT_EMAIL) || DEFAULT_SUPPORT_EMAIL

    if (typeof document !== 'undefined') {
      const currentTitle = String(document.title || '')
      if (currentTitle.includes(' | ')) {
        const pageSuffix = currentTitle.split(' | ').slice(1).join(' | ').trim()
        document.title = pageSuffix ? `${appTitle.value} | ${pageSuffix}` : appTitle.value
      } else {
        document.title = appTitle.value
      }
      applyFavicon(resolveAssetUrl(faviconPath.value, getBaseUrl()))
    }

    writeCachedSiteSettings({
      appTitle: appTitle.value,
      brandName: brandName.value,
      loginSubtitle: loginSubtitle.value,
      landingSubtitle: landingSubtitle.value,
      footerText: footerText.value,
      logoPath: logoPath.value,
      faviconPath: faviconPath.value,
      defaultTableRows: defaultTableRows.value,
      supportEmail: supportEmail.value
    })
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

  // Gene - Nov, 26, 2026: Seed missing preset settings and reload runtime configuration
  const seedDefaults = async () => {
    isSaving.value = true
    error.value = null
    try {
      const result = await ApplicationConfigurationService.seedDefaultConfigs()
      await loadConfigs({ force: true })
      return result
    } catch (err) {
      error.value = err?.message || 'Failed to seed default settings.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  // Gene - Nov, 26, 2026: Batch-save website setup entries (TITLE1, BRAND1, etc.) in a single refresh cycle
  const saveSiteSetup = async (entries = {}) => {
    isSaving.value = true
    error.value = null
    const saved = []
    try {
      for (const [rawKey, rawVal] of Object.entries(entries)) {
        if (rawVal === undefined) continue
        const key = String(rawKey || '').trim()
        if (!key) continue
        const preset = findPresetByCode(key)
        const value = String(rawVal ?? '').trim()
        const existing = findConfig(key)
        if (existing) {
          await ApplicationConfigurationService.update(existing.id, existing.code, {
            name: existing.name,
            accountNo: existing.code || existing.accountNo || existing.name,
            value,
            description: existing.description || preset?.description || existing.name,
            isEnable: true
          })
        } else {
          await ApplicationConfigurationService.create({
            name: preset?.name || key,
            accountNo: preset?.name || key,
            value,
            description: preset?.description || preset?.label || key,
            isEnable: true
          })
        }
        saved.push(preset?.name || key)
      }
      await loadConfigs({ force: true })
      return saved
    } catch (err) {
      error.value = err?.message || 'Failed to save website setup.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  return {
    configs,
    isLoading,
    isLoaded,
    isSaving,
    error,
    appTitle,
    brandName,
    loginSubtitle,
    landingSubtitle,
    footerText,
    logoPath,
    logoUrl,
    faviconPath,
    defaultTableRows,
    supportEmail,
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
    upsertSetting,
    seedDefaults,
    saveSiteSetup
  }
})
