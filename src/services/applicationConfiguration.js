// Gene - Nov, 25, 2026: Centralized REST API service and presets for /api/ApplicationConfiguration
import apiClient from './api.js'

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
  }
}

export default ApplicationConfigurationService
