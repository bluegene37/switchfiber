// Gene - Nov, 25, 2026: Unit and integration test suite for /api/ApplicationConfiguration settings, theme customization, and store/UI wiring
import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'

import apiClient from '../src/services/api.js'
import {
  ApplicationConfigurationService,
  APPLICATION_CONFIG_PRESETS,
  isValidHexColor,
  normalizeHexColor,
  normalizeConfigKey,
  normalizeAppConfigPayload
} from '../src/services/applicationConfiguration.js'
import { useTheme, MASTER_THEME_COLOR } from '../src/composables/useTheme.js'
import { useAppConfigStore } from '../src/stores/appConfig.js'
import { EndpointColumns } from '../src/models/columns.js'
import { resolveRequiredFields } from '../src/models/requiredFields.js'
import { MONITORED_ENDPOINTS } from '../src/models/monitoredEndpoints.js'
import { EndpointSchemaMeta } from '../src/models/schemaMeta.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

const settingsSrc = read('src/views/Settings.vue')
const appVueSrc = read('src/App.vue')
const routerSrc = read('src/router/index.js')
const apiViewSrc = read('src/views/Api.vue')
const dashboardSrc = read('src/views/Dashboard.vue')
const accountingDashboardSrc = read('src/views/AccountingDashboard.vue')
const dynamicTableSrc = read('src/components/DynamicApiTable.vue')
const openapiSpec = JSON.parse(read('openapi.json'))

describe('ApplicationConfiguration Service & Payload Normalization', () => {
  test('validates and normalizes hex colors', () => {
    assert.equal(isValidHexColor('#e74c5a'), true)
    assert.equal(isValidHexColor('#ABC'), true)
    assert.equal(isValidHexColor('e74c5a'), false)
    assert.equal(isValidHexColor('#12345'), false)

    assert.equal(normalizeHexColor('#ABC'), '#aabbcc')
    assert.equal(normalizeHexColor(' #E74C5A '), '#e74c5a')
    assert.equal(normalizeHexColor('invalid'), '')
  })

  test('normalizes configuration keys consistently', () => {
    assert.equal(normalizeConfigKey('theme-primary-color'), 'THEME_PRIMARY_COLOR')
    assert.equal(normalizeConfigKey('  app title '), 'APP_TITLE')
    assert.equal(normalizeConfigKey('THEME_PRIMARY_COLOR'), 'THEME_PRIMARY_COLOR')
  })

  test('normalizeAppConfigPayload supplies required non-empty ASP.NET AppCOnfig fields', () => {
    const minimal = normalizeAppConfigPayload({
      name: 'THEME_PRIMARY_COLOR',
      value: '#0284c7'
    })
    assert.deepEqual(minimal, {
      name: 'THEME_PRIMARY_COLOR',
      accountNo: 'THEME_PRIMARY_COLOR',
      value: '#0284c7',
      description: 'THEME_PRIMARY_COLOR',
      isEnable: true
    })

    const explicitDisabled = normalizeAppConfigPayload({
      name: 'APP_TITLE',
      code: '202611250010141',
      value: 'SwitchFiber Ops',
      description: 'Tab title prefix',
      isEnable: false
    })
    assert.deepEqual(explicitDisabled, {
      name: 'APP_TITLE',
      accountNo: '202611250010141',
      value: 'SwitchFiber Ops',
      description: 'Tab title prefix',
      isEnable: false
    })
  })

  test('APPLICATION_CONFIG_PRESETS includes theme color and general presets', () => {
    const names = APPLICATION_CONFIG_PRESETS.map(p => p.name)
    assert.ok(names.includes('THEME_PRIMARY_COLOR'))
    assert.ok(names.includes('THEME_DEFAULT_MODE'))
    assert.ok(names.includes('THEME_ROW_HIGHLIGHT'))
    assert.ok(names.includes('THEME_SUCCESS_COLOR'))
    assert.ok(names.includes('THEME_WARNING_COLOR'))
    assert.ok(names.includes('THEME_DANGER_COLOR'))
    assert.ok(names.includes('THEME_INFO_COLOR'))
    assert.ok(names.includes('APP_TITLE'))
  })

  describe('ApplicationConfigurationService REST contract (mocked client)', () => {
    const originalGet = apiClient.get
    const originalPost = apiClient.post
    const originalPut = apiClient.put
    const originalDelete = apiClient.delete

    afterEach(() => {
      apiClient.get = originalGet
      apiClient.post = originalPost
      apiClient.put = originalPut
      apiClient.delete = originalDelete
    })

    test('calls exact paths, ?code= query parameter, and DELETE by code', async () => {
      const calls = []
      apiClient.get = async (url, cfg) => { calls.push(['get', url, cfg]); return [] }
      apiClient.post = async (url, body, cfg) => { calls.push(['post', url, body, cfg]); return { id: 2 } }
      apiClient.put = async (url, body, cfg) => { calls.push(['put', url, body, cfg]); return { id: 2 } }
      apiClient.delete = async (url, cfg) => { calls.push(['delete', url, cfg]); return {} }

      await ApplicationConfigurationService.getAll()
      await ApplicationConfigurationService.getByIdAndCode(1, '202611250010141')
      await ApplicationConfigurationService.create({ name: 'THEME_PRIMARY_COLOR', value: '#10b981' })
      await ApplicationConfigurationService.update(2, 'CODE/1', { name: 'THEME_PRIMARY_COLOR', value: '#0284c7', isEnable: true })
      await ApplicationConfigurationService.remove('CODE/1')

      assert.equal(calls[0][0], 'get')
      assert.equal(calls[0][1], '/ApplicationConfiguration')
      assert.equal(calls[0][2].cancelOnNavigate, false)

      assert.equal(calls[1][0], 'get')
      assert.equal(calls[1][1], '/ApplicationConfiguration/1')
      assert.equal(calls[1][2].params.code, '202611250010141')

      assert.equal(calls[2][0], 'post')
      assert.equal(calls[2][1], '/ApplicationConfiguration')
      assert.equal(calls[2][2].accountNo, 'THEME_PRIMARY_COLOR')

      assert.equal(calls[3][0], 'put')
      assert.equal(calls[3][1], '/ApplicationConfiguration/2')
      assert.equal(calls[3][3].params.code, 'CODE/1')
      assert.equal(calls[3][2].accountNo, 'CODE/1')

      assert.equal(calls[4][0], 'delete')
      assert.equal(calls[4][1], '/ApplicationConfiguration/CODE%2F1')
    })
  })
})

describe('Theme Engine & Pinia AppConfig Store', () => {
  const originalGet = apiClient.get
  const originalPost = apiClient.post
  const originalPut = apiClient.put
  const originalDelete = apiClient.delete

  beforeEach(() => {
    setActivePinia(createPinia())
    const { resetThemeColors } = useTheme()
    resetThemeColors({ persist: false })
  })

  afterEach(() => {
    apiClient.get = originalGet
    apiClient.post = originalPost
    apiClient.put = originalPut
    apiClient.delete = originalDelete
    const { resetThemeColors } = useTheme()
    resetThemeColors({ persist: false })
  })

  test('useTheme tracks reactive activePrimaryHex, activePalette, semantic overrides, and reset', () => {
    const {
      activePrimaryHex,
      activePalette,
      semanticColorOverrides,
      setColorTheme,
      applySemanticColorOverrides,
      resetThemeColors
    } = useTheme()

    setColorTheme('#0284c7')
    assert.equal(activePrimaryHex.value, '#0284c7')
    assert.equal(activePalette.value.name, 'Ocean Blue')

    setColorTheme('#123456')
    assert.equal(activePrimaryHex.value, '#123456')
    assert.equal(activePalette.value.name, 'Custom Theme')

    applySemanticColorOverrides({ success: '#22c55e', danger: 'not-a-hex' })
    assert.deepEqual(semanticColorOverrides.value, { success: '#22c55e' })

    resetThemeColors({ persist: false })
    assert.equal(activePrimaryHex.value, MASTER_THEME_COLOR)
    assert.deepEqual(semanticColorOverrides.value, {})
  })

  test('useAppConfigStore loads configs, filters disabled items, applies theme colors, and upserts cleanly', async () => {
    let rows = [
      { id: 1, name: 'THEME_PRIMARY_COLOR', code: 'C001', value: '#7c3aed', description: 'Purple', isEnable: true },
      { id: 2, name: 'THEME_SUCCESS_COLOR', code: 'C002', value: '#22c55e', description: 'Success', isEnable: false },
      { id: 3, name: 'APP_TITLE', code: 'C003', value: 'SwitchFiber NOC', description: 'Title', isEnable: true }
    ]
    const mutations = []

    apiClient.get = async () => rows
    apiClient.post = async (_url, body) => {
      mutations.push(['post', body])
      const created = { ...body, id: rows.length + 1, code: `C00${rows.length + 1}` }
      rows = [...rows, created]
      return created
    }
    apiClient.put = async (url, body, cfg) => {
      mutations.push(['put', url, cfg?.params?.code, body])
      rows = rows.map(r => (r.code === cfg?.params?.code ? { ...r, ...body } : r))
      return body
    }
    apiClient.delete = async (url) => {
      mutations.push(['delete', url])
      return {}
    }

    const store = useAppConfigStore()
    await store.loadConfigs()

    assert.equal(store.isLoaded, true)
    assert.equal(store.getValue('theme-primary-color'), '#7c3aed')
    assert.equal(store.getValue('THEME_SUCCESS_COLOR', '#10b981'), '#10b981') // disabled entry falls back
    assert.ok(store.findConfig('THEME_SUCCESS_COLOR')) // findConfig still finds disabled records
    assert.equal(store.appTitle, 'SwitchFiber NOC')

    const { activePrimaryHex, semanticColorOverrides } = useTheme()
    assert.equal(activePrimaryHex.value, '#7c3aed')
    assert.deepEqual(semanticColorOverrides.value, {})

    // Upsert existing key -> PUT with ?code=C001
    await store.upsertSetting('THEME_PRIMARY_COLOR', { value: '#10b981', isEnable: true })
    assert.equal(mutations[0][0], 'put')
    assert.equal(mutations[0][1], '/ApplicationConfiguration/1')
    assert.equal(mutations[0][2], 'C001')
    assert.equal(activePrimaryHex.value, '#10b981')

    // Upsert new key -> POST
    await store.upsertSetting('THEME_WARNING_COLOR', { value: '#f59e0b', description: 'Warn', isEnable: true })
    assert.equal(mutations[1][0], 'post')
    assert.equal(mutations[1][1].name, 'THEME_WARNING_COLOR')
  })
})

describe('OpenAPI, Metadata Registries & UI Wiring', () => {
  test('openapi.json and schemaMeta.js include ApplicationConfiguration', () => {
    assert.ok(openapiSpec.paths?.['/api/ApplicationConfiguration'], 'openapi.json must have /api/ApplicationConfiguration')
    assert.ok(openapiSpec.paths?.['/api/ApplicationConfiguration/{id}'], 'openapi.json must have /api/ApplicationConfiguration/{id}')
    assert.ok(openapiSpec.paths?.['/api/ApplicationConfiguration/{code}'], 'openapi.json must have /api/ApplicationConfiguration/{code}')
    assert.ok(openapiSpec.components?.schemas?.AppCOnfig, 'openapi.json must define AppCOnfig schema')

    assert.equal(EndpointSchemaMeta.ApplicationConfiguration?.create?.schema, 'AppCOnfig')
    assert.equal(EndpointSchemaMeta.ApplicationConfiguration?.update?.schema, 'AppCOnfig')
  })

  test('columns, requiredFields, monitoredEndpoints, and Api.vue register ApplicationConfiguration', () => {
    assert.deepEqual(EndpointColumns.ApplicationConfiguration, [
      'id', 'name', 'code', 'value', 'description', 'isEnable', 'createdDate'
    ])
    assert.deepEqual(
      resolveRequiredFields('ApplicationConfiguration', EndpointColumns.ApplicationConfiguration),
      ['name', 'value']
    )
    assert.ok(MONITORED_ENDPOINTS.some(e => e.path === '/ApplicationConfiguration'))
    assert.ok(apiViewSrc.includes("endpoint: 'ApplicationConfiguration'"))
  })

  test('App.vue, router, dashboards, and DynamicApiTable wire global settings and reactive theme', () => {
    assert.ok(appVueSrc.includes('useAppConfigStore') && appVueSrc.includes('loadConfigs()'))
    assert.ok(routerSrc.includes('useAppConfigStore') && routerSrc.includes('appConfigStore?.appTitle'))
    assert.ok(dashboardSrc.includes('activePrimaryHex') && dashboardSrc.includes('BRAND.value.base'))
    assert.ok(accountingDashboardSrc.includes('activePrimaryHex') && accountingDashboardSrc.includes('brandRamp.value'))
    assert.ok(dynamicTableSrc.includes('activePalette') && dynamicTableSrc.includes('activePalette.value'))
  })

  test('Settings.vue includes Theme Customizer, Application Configuration CRUD, and read-only audit details', () => {
    assert.ok(settingsSrc.includes("activeSection === 'app-config'"))
    assert.ok(settingsSrc.includes('sfa-tracker-settings-theme-customizer'))
    assert.ok(settingsSrc.includes('sfa-tracker-settings-panel-app-config'))
    assert.ok(settingsSrc.includes('sfa-tracker-app-config-dialog'))
    assert.ok(settingsSrc.includes('sfa-tracker-app-config-view-dialog'))
    assert.ok(settingsSrc.includes('sfa-tracker-app-config-delete-dialog'))
    assert.ok(settingsSrc.includes('System Audit &amp; Timestamp Details'))
    assert.ok(settingsSrc.includes('Save to Application Configuration'))
  })
})
