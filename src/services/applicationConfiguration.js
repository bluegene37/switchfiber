// Gene - Nov, 25, 2026: Centralized REST API service and presets for /api/ApplicationConfiguration
import apiClient from './api.js'

/*
export const APPLICATION_CONFIG_PRESETS = [
  {
    name: 'THEME_PRIMARY_COLOR',
    label: 'Primary Brand Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#e74c5a',
    description: 'Primary brand theme color applied across buttons, highlights, charts, and PDF exports'
  },
  {
    name: 'THEME_DEFAULT_MODE',
    label: 'Default Theme Mode',
    category: 'Theme & Colors',
    valueType: 'select',
    options: ['light', 'dark'],
    defaultValue: 'light',
    description: 'Default light or dark theme mode when a user has not chosen a local preference'
  },
  {
    name: 'THEME_ROW_HIGHLIGHT',
    label: 'Table Selected Row Highlight',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#e74c5a',
    description: 'Background highlight color used for active selected rows in data tables'
  },
  {
    name: 'THEME_SUCCESS_COLOR',
    label: 'Success Status Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#10b981',
    description: 'Semantic color for active statuses, online badges, and success indicators'
  },
  {
    name: 'THEME_WARNING_COLOR',
    label: 'Warning Status Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#f59e0b',
    description: 'Semantic color for pending statuses and warning notifications'
  },
  {
    name: 'THEME_DANGER_COLOR',
    label: 'Danger Status Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#ef4444',
    description: 'Semantic color for delete actions, errors, and offline alerts'
  },
  {
    name: 'THEME_INFO_COLOR',
    label: 'Info Status Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#0ea5e9',
    description: 'Semantic color for informational badges and helper banners'
  },
  {
    name: 'APP_TITLE',
    label: 'Application Title',
    category: 'General',
    valueType: 'text',
    defaultValue: 'SwitchFiber - Admin',
    description: 'Display title prefix shown in browser tabs across the admin console'
  }
]
*/
// Gene - Nov, 26, 2026: Standardize ApplicationConfiguration presets to short setting codes (TITLE1, BRAND1, COLOR1, etc.) with backward-compatible legacy aliases
export const APPLICATION_CONFIG_PRESETS = [
  {
    name: 'TITLE1',
    aliases: ['APP_TITLE', 'APP_NAME'],
    label: 'Page / Browser Title',
    category: 'Branding & General',
    valueType: 'text',
    defaultValue: 'SwitchFiber - Admin',
    description: 'Browser tab title prefix displayed across the admin portal'
  },
  {
    name: 'BRAND1',
    aliases: ['BRAND_NAME', 'SITE_NAME'],
    label: 'Brand / Portal Name',
    category: 'Branding & General',
    valueType: 'text',
    defaultValue: 'Switch Fiber',
    description: 'Primary brand title shown in the sidebar header, login screen, and omnibox'
  },
  {
    name: 'SUBTITLE1',
    aliases: ['LOGIN_SUBTITLE', 'TAGLINE'],
    label: 'Login Subtitle',
    category: 'Branding & General',
    valueType: 'text',
    defaultValue: 'Distributed Fiber Network Management',
    description: 'Subtitle displayed beneath the brand title on the login page'
  },
  {
    name: 'LANDING1',
    aliases: ['LANDING_SUBTITLE', 'HERO_SUBTITLE'],
    label: 'Landing Hero Subtitle',
    category: 'Branding & General',
    valueType: 'text',
    defaultValue: 'SwitchFiber Network Operations Hub. Real-time operations calendar, live field weather, and network telemetry.',
    description: 'Welcome subtitle displayed on the operations landing dashboard'
  },
  {
    name: 'FOOTER1',
    aliases: ['FOOTER_TEXT', 'COPYRIGHT_TEXT'],
    label: 'Footer / Copyright Text',
    category: 'Branding & General',
    valueType: 'text',
    defaultValue: 'Switch Fiber Network Operations',
    description: 'Organization name displayed in login and portal footers'
  },
  {
    name: 'LOGO1',
    aliases: ['LOGO_URL', 'APP_LOGO'],
    label: 'Logo URL / Path',
    category: 'Branding & General',
    valueType: 'text',
    defaultValue: 'logo.png',
    description: 'Relative asset path or full URL for the portal and login logo image'
  },
  {
    name: 'FAVICON1',
    aliases: ['FAVICON_URL', 'APP_FAVICON'],
    label: 'Favicon URL / Path',
    category: 'Branding & General',
    valueType: 'text',
    defaultValue: 'favicon.ico',
    description: 'Relative asset path or full URL for the browser tab icon'
  },
  {
    name: 'COLOR1',
    aliases: ['THEME_PRIMARY_COLOR', 'PRIMARY_COLOR', 'BRAND_COLOR'],
    label: 'Primary Brand Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#e74c5a',
    description: 'Primary brand theme color applied across buttons, highlights, charts, and PDF exports'
  },
  {
    name: 'MODE1',
    aliases: ['THEME_DEFAULT_MODE', 'DEFAULT_THEME_MODE'],
    label: 'Default Theme Mode',
    category: 'Theme & Colors',
    valueType: 'select',
    options: ['light', 'dark'],
    defaultValue: 'light',
    description: 'Default light or dark theme mode when a user has not set a local preference'
  },
  {
    name: 'ROWHIGHLIGHT1',
    aliases: ['THEME_ROW_HIGHLIGHT', 'ROW_HIGHLIGHT_COLOR'],
    label: 'Table Row Highlight Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#e74c5a',
    description: 'Highlight color used for active selected rows in data tables'
  },
  {
    name: 'SUCCESS1',
    aliases: ['THEME_SUCCESS_COLOR'],
    label: 'Success Status Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#10b981',
    description: 'Semantic color for active statuses, online badges, and success indicators'
  },
  {
    name: 'WARNING1',
    aliases: ['THEME_WARNING_COLOR'],
    label: 'Warning Status Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#f59e0b',
    description: 'Semantic color for pending statuses and warning notifications'
  },
  {
    name: 'DANGER1',
    aliases: ['THEME_DANGER_COLOR'],
    label: 'Danger Status Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#ef4444',
    description: 'Semantic color for delete actions, errors, and offline alerts'
  },
  {
    name: 'INFO1',
    aliases: ['THEME_INFO_COLOR'],
    label: 'Info Status Color',
    category: 'Theme & Colors',
    valueType: 'color',
    defaultValue: '#0ea5e9',
    description: 'Semantic color for informational badges and helper banners'
  },
  {
    name: 'ROWS1',
    aliases: ['DEFAULT_TABLE_ROWS', 'PAGE_SIZE'],
    label: 'Default Table Page Size',
    category: 'Operations & Tables',
    valueType: 'select',
    options: ['10', '25', '50', '100'],
    defaultValue: '50',
    description: 'Default number of rows per page in data tables (10, 25, 50, or 100)'
  },
  {
    name: 'SUPPORT1',
    aliases: ['SUPPORT_EMAIL', 'CONTACT_EMAIL'],
    label: 'Support / Admin Email',
    category: 'Operations & Tables',
    valueType: 'text',
    defaultValue: 'admin@switchfiber.com',
    description: 'Default support contact email shown when user profile email is absent'
  }
]

const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function isValidHexColor(value) {
  return typeof value === 'string' && HEX_COLOR_RE.test(value.trim())
}

export function normalizeHexColor(value) {
  if (!isValidHexColor(value)) return ''
  let hex = value.trim().toLowerCase()
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }
  return hex
}

export function normalizeConfigKey(key) {
  return String(key || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
}

// Gene - Nov, 26, 2026: Lookup preset metadata by short code or legacy alias, and resolve relative/absolute asset paths
export function findPresetByCode(key) {
  const target = normalizeConfigKey(key)
  if (!target) return null
  return APPLICATION_CONFIG_PRESETS.find((preset) => {
    if (normalizeConfigKey(preset.name) === target) return true
    return Array.isArray(preset.aliases) && preset.aliases.some(alias => normalizeConfigKey(alias) === target)
  }) || null
}

export function resolveAssetUrl(rawUrl, baseUrl = '/') {
  const trimmed = String(rawUrl ?? '').trim()
  if (!trimmed) return ''
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  const cleanBase = String(baseUrl || '/').endsWith('/') ? String(baseUrl || '/') : `${baseUrl}/`
  return `${cleanBase}${trimmed.replace(/^\/+/, '')}`
}

/**
 * Normalize payload to match the ASP.NET `AppCOnfig` request schema:
 * all 5 fields (`name`, `accountNo`, `value`, `description`, `isEnable`)
 * are non-nullable and required by the backend.
 */
export function normalizeAppConfigPayload(input = {}) {
  const trimmedName = String(input.name ?? '').trim()
  const trimmedAccountNo = String(input.accountNo ?? '').trim()
  const trimmedCode = String(input.code ?? '').trim()
  const trimmedValue = String(input.value ?? '').trim()
  const trimmedDescription = String(input.description ?? '').trim()

  return {
    name: trimmedName,
    accountNo: trimmedAccountNo || trimmedCode || trimmedName || 'SYSTEM',
    value: trimmedValue,
    description: trimmedDescription || trimmedName || 'Application configuration setting',
    isEnable: input.isEnable === undefined ? true : Boolean(input.isEnable)
  }
}

export const ApplicationConfigurationService = {
  getAll(config = {}) {
    return apiClient.get('/ApplicationConfiguration', { cancelOnNavigate: false, ...config })
  },
  getByIdAndCode(id, code, config = {}) {
    return apiClient.get(`/ApplicationConfiguration/${id}`, {
      ...config,
      params: { ...(config.params || {}), code }
    })
  },
  create(data, config = {}) {
    return apiClient.post('/ApplicationConfiguration', normalizeAppConfigPayload(data), config)
  },
  update(id, code, data, config = {}) {
    return apiClient.put(
      `/ApplicationConfiguration/${id}`,
      normalizeAppConfigPayload({ ...data, accountNo: data?.accountNo || code }),
      {
        ...config,
        params: { ...(config.params || {}), code }
      }
    )
  },
  remove(code, config = {}) {
    return apiClient.delete(`/ApplicationConfiguration/${encodeURIComponent(String(code))}`, config)
  },
  // Gene - Nov, 26, 2026: Seed missing canonical ApplicationConfiguration presets without overwriting existing customized values
  async seedDefaultConfigs() {
    const existingRaw = await this.getAll()
    let existingList = []
    if (Array.isArray(existingRaw)) {
      existingList = existingRaw
    } else if (existingRaw && typeof existingRaw === 'object') {
      const arrayKey = Object.keys(existingRaw).find(k => Array.isArray(existingRaw[k]))
      if (arrayKey) existingList = existingRaw[arrayKey]
    }

    const existingKeys = new Set()
    for (const row of existingList) {
      const normName = normalizeConfigKey(row?.name)
      const normCode = normalizeConfigKey(row?.code)
      if (normName) existingKeys.add(normName)
      if (normCode) existingKeys.add(normCode)
    }

    const created = []
    const skipped = []
    const failed = []

    for (const preset of APPLICATION_CONFIG_PRESETS) {
      const candidateKeys = [preset.name, ...(preset.aliases || [])].map(normalizeConfigKey).filter(Boolean)
      const alreadyExists = candidateKeys.some(k => existingKeys.has(k))
      if (alreadyExists) {
        skipped.push(preset.name)
        continue
      }

      try {
        await this.create({
          name: preset.name,
          accountNo: preset.name,
          value: preset.defaultValue,
          description: preset.description,
          isEnable: true
        })
        created.push(preset.name)
        existingKeys.add(normalizeConfigKey(preset.name))
      } catch (err) {
        failed.push({
          name: preset.name,
          error: err?.response?.data?.message || err?.response?.data || err?.message || 'Failed to seed setting'
        })
      }
    }

    return { created, skipped, failed }
  }
}

export default ApplicationConfigurationService
