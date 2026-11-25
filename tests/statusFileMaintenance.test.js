// Gene - Nov, 25, 2026: Comprehensive test suite for Status File Maintenance (/status), /api/Status service, and dropdown wiring
import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'

import apiClient from '../src/services/api.js'
import {
  StatusService,
  STATUS_TYPES,
  DEFAULT_STATUSES,
  normalizeStatusType,
  normalizeStatusToken,
  normalizeStatusPayload,
  mapStatusesToDropdownOptions,
  groupStatusesByType,
  resolveStatusLabel
} from '../src/services/status.js'
import { useStatusStore } from '../src/stores/statuses.js'
import {
  MENU_CATALOG,
  LEAF_MENU_CATALOG_ENTRIES,
  menuCodeForPath,
  resolveMenuCodesFromName
} from '../src/constants/menuCatalog.js'
import { EndpointColumns } from '../src/models/columns.js'
import { resolveRequiredFields } from '../src/models/requiredFields.js'
import { MONITORED_ENDPOINTS } from '../src/models/monitoredEndpoints.js'
import { EndpointSchemaMeta } from '../src/models/schemaMeta.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

const routerSrc = read('src/router/index.js')
const fileMaintenanceSrc = read('src/views/FileMaintenance.vue')
const useSearchSrc = read('src/composables/useSearch.js')
const apiViewSrc = read('src/views/Api.vue')
const appVueSrc = read('src/App.vue')
const dynamicTableSrc = read('src/components/DynamicApiTable.vue')

describe('Status Service, Types & Default Catalog', () => {
  /*
  test('STATUS_TYPES and DEFAULT_STATUSES cover all 11 module status types cleanly', () => {
    assert.equal(STATUS_TYPES.length, 11)
    const typeSet = new Set(STATUS_TYPES.map(t => t.code))
    for (const expectedType of [
      'APPLICATION',
      'JOB_ORDER',
      'JO_ONSITE',
      'SO_SUPPORT',
      'SO_VISIT',
      'BILLING',
      'DELIVERY',
      'INVOICE',
      'PAYMENT',
      'DISCOUNT',
      'INVENTORY_LOG'
    ]) {
      assert.ok(typeSet.has(expectedType), `STATUS_TYPES must include ${expectedType}`)
      assert.ok(
        DEFAULT_STATUSES.some(s => s.type === expectedType),
        `DEFAULT_STATUSES must include entries for ${expectedType}`
      )
    }

    for (const item of DEFAULT_STATUSES) {
      assert.ok(item.type && item.type.trim().length > 0)
      assert.ok(item.name && item.name.trim().length > 0)
      assert.ok(item.description && item.description.trim().length > 0)
    }
  })
  */
  // Gene - Nov, 26, 2026: Verify all 22 STATUS_TYPES and 154 DEFAULT_STATUSES entries (including 'inprogress' -> 'In Progress' & all form dropdowns)
  test('STATUS_TYPES and DEFAULT_STATUSES cover all 22 status & dropdown types cleanly (154 items)', () => {
    assert.equal(STATUS_TYPES.length, 22)
    assert.equal(DEFAULT_STATUSES.length, 154)
    const typeSet = new Set(STATUS_TYPES.map(t => t.code))
    for (const expectedType of [
      'APPLICATION',
      'JOB_ORDER',
      'JO_ONSITE',
      'SO_SUPPORT',
      'SO_VISIT',
      'BILLING',
      'DELIVERY',
      'INVOICE',
      'PAYMENT',
      'DISCOUNT',
      'INVENTORY_LOG',
      'RENTER',
      'APPLYING_FOR',
      'CONTRACT_TEMPLATE',
      'USAGE_TYPE',
      'PRIORITY',
      'REPAIR_CATEGORY',
      'CONCERN',
      'CONNECTION_TYPE',
      'PROMO_PLACEMENT',
      'PROMO_IMAGE_SIZE',
      'PROMO_THEME_COLOR'
    ]) {
      assert.ok(typeSet.has(expectedType), `STATUS_TYPES must include ${expectedType}`)
      assert.ok(
        DEFAULT_STATUSES.some(s => s.type === expectedType),
        `DEFAULT_STATUSES must include entries for ${expectedType}`
      )
    }

    for (const item of DEFAULT_STATUSES) {
      assert.ok(item.type && item.type.trim().length > 0)
      assert.ok(item.name && item.name.trim().length > 0)
      assert.ok(item.description && item.description.trim().length > 0)
    }

    for (const inProgressType of ['APPLICATION', 'JOB_ORDER', 'JO_ONSITE', 'SO_SUPPORT', 'SO_VISIT']) {
      const entry = DEFAULT_STATUSES.find(s => s.type === inProgressType && s.name === 'inprogress')
      assert.ok(entry, `${inProgressType} must define code 'inprogress'`)
      assert.equal(entry.description, 'In Progress')
    }
  })

  test('normalizeStatusToken and resolveStatusLabel map stored codes to human descriptions', () => {
    assert.equal(normalizeStatusToken('In Progress'), 'inprogress')
    assert.equal(normalizeStatusToken('in_progress'), 'inprogress')
    assert.equal(normalizeStatusToken('inprogress'), 'inprogress')

    const grouped = groupStatusesByType([
      { type: 'APPLICATION', name: 'inprogress', description: 'In Progress' },
      { type: 'CONNECTION_TYPE', name: 'Fiber', description: 'Fiber Optic' },
      { type: 'RENTER', name: 'No', description: 'No (Owner)' },
      { type: 'PROMO_PLACEMENT', name: 'top_bar', description: 'Top Announcement Bar (top_bar)' }
    ])

    assert.equal(resolveStatusLabel(grouped, 'APPLICATION', 'inprogress'), 'In Progress')
    assert.equal(resolveStatusLabel(grouped, 'APPLICATION', 'Inprogress'), 'In Progress')
    assert.equal(resolveStatusLabel(grouped, 'CONNECTION_TYPE', 'Fiber'), 'Fiber Optic')
    assert.equal(resolveStatusLabel(grouped, 'RENTER', 'No'), 'No (Owner)')
    assert.equal(resolveStatusLabel(grouped, 'PROMO_PLACEMENT', 'top_bar'), 'Top Announcement Bar (top_bar)')
  })

  test('normalizeStatusType and normalizeStatusPayload conform to StatusRequest schema', () => {
    assert.equal(normalizeStatusType('job-order'), 'JOB_ORDER')
    assert.equal(normalizeStatusType('  so visit '), 'SO_VISIT')

    assert.deepEqual(
      normalizeStatusPayload({ type: 'application', name: 'Inprogress', description: 'In Progress' }, '7'),
      {
        type: 'APPLICATION',
        name: 'Inprogress',
        description: 'In Progress',
        createdBy: '7'
      }
    )

    assert.deepEqual(
      normalizeStatusPayload({ type: 'billing', name: 'Active', createdBy: '1' }),
      {
        type: 'BILLING',
        name: 'Active',
        description: 'Active',
        createdBy: '1'
      }
    )
  })

  test('mapStatusesToDropdownOptions and groupStatusesByType use name as value and description as label', () => {
    const sample = [
      { id: 1, code: 'ST-001', type: 'APPLICATION', name: 'Inprogress', description: 'In Progress' },
      { id: 2, code: 'ST-002', type: 'APPLICATION', name: 'Schedule', description: 'Scheduled' },
      { id: 3, code: 'ST-003', type: 'APPLICATION', name: 'schedule', description: 'Duplicate Case' },
      { id: 4, code: 'ST-004', type: 'SO_VISIT', name: 'Reschedule', description: 'Reschedule Visit' }
    ]

    const appOpts = mapStatusesToDropdownOptions(sample, 'APPLICATION')
    assert.deepEqual(appOpts, [
      { label: 'In Progress', value: 'Inprogress' },
      { label: 'Scheduled', value: 'Schedule' }
    ])

    const grouped = groupStatusesByType(sample)
    assert.deepEqual(grouped.APPLICATION, appOpts)
    assert.deepEqual(grouped.SO_VISIT, [{ label: 'Reschedule Visit', value: 'Reschedule' }])

    // Gene - Nov, 26, 2026: Ensure disabled Status rows (isEnable: false / isActive: false) are excluded from dropdowns
    const withDisabled = [
      ...sample,
      { id: 5, code: 'ST-005', type: 'APPLICATION', name: 'HiddenA', description: 'Hidden A', isEnable: false },
      { id: 6, code: 'ST-006', type: 'SO_VISIT', name: 'HiddenB', description: 'Hidden B', isActive: false }
    ]
    assert.deepEqual(mapStatusesToDropdownOptions(withDisabled, 'APPLICATION'), appOpts)
    assert.deepEqual(groupStatusesByType(withDisabled).SO_VISIT, [{ label: 'Reschedule Visit', value: 'Reschedule' }])
  })

  describe('StatusService REST contract (mocked client)', () => {
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

    test('calls /Status and /Status/{code} endpoints with URL-encoded code and normalized payload', async () => {
      const calls = []
      apiClient.get = async (url, cfg) => { calls.push(['get', url, cfg]); return [] }
      apiClient.post = async (url, body, cfg) => { calls.push(['post', url, body, cfg]); return { code: 'ST-1' } }
      apiClient.put = async (url, body, cfg) => { calls.push(['put', url, body, cfg]); return { code: 'ST/1' } }
      apiClient.delete = async (url, cfg) => { calls.push(['delete', url, cfg]); return {} }

      await StatusService.getAll()
      await StatusService.getByCode('ST/1')
      await StatusService.create({ type: 'application', name: 'Done', description: 'Completed App' })
      await StatusService.update('ST/1', { type: 'application', name: 'Done', description: 'Done Label', createdBy: '1' })
      await StatusService.remove('ST/1')

      assert.equal(calls[0][1], '/Status')
      assert.equal(calls[0][2].cancelOnNavigate, false)
      assert.equal(calls[1][1], '/Status/ST%2F1')
      assert.equal(calls[2][1], '/Status')
      assert.equal(calls[2][2].type, 'APPLICATION')
      assert.equal(calls[3][1], '/Status/ST%2F1')
      assert.equal(calls[3][2].description, 'Done Label')
      assert.equal(calls[4][1], '/Status/ST%2F1')
    })
  })

  test('useStatusStore loads statuses, deduplicates compact tokens cleanly, resolves labels, and seeds missing entries', async () => {
    setActivePinia(createPinia())
    const originalGet = apiClient.get
    const originalPost = apiClient.post
    try {
      let storeRows = [
        { type: 'APPLICATION', name: 'inprogress', description: 'In Progress' },
        { type: 'RENTER', name: 'No', description: 'No (Owner)' }
      ]
      const posted = []
      apiClient.get = async () => storeRows
      apiClient.post = async (_url, body) => {
        posted.push(body)
        storeRows = [...storeRows, body]
        return body
      }

      const store = useStatusStore()
      await store.loadStatuses()
      assert.equal(store.isLoaded, true)
      assert.equal(store.getLabel('APPLICATION', 'inprogress'), 'In Progress')
      assert.equal(store.getLabel('RENTER', 'No'), 'No (Owner)')

      const overlaid = store.getOptions('APPLICATION', [
        { label: 'Inprogress', value: 'Inprogress' },
        { label: 'Done', value: 'Done' }
      ])
      assert.deepEqual(overlaid, [
        { label: 'In Progress', value: 'inprogress' },
        { label: 'Done', value: 'Done' }
      ])

      const seedRes = await store.seedDefaults('1')
      assert.equal(seedRes.skipped.length, 2)
      assert.equal(seedRes.created.length, DEFAULT_STATUSES.length - 2)
      assert.equal(posted.length, DEFAULT_STATUSES.length - 2)
    } finally {
      apiClient.get = originalGet
      apiClient.post = originalPost
    }
  })
})

describe('Status File Maintenance Menu, Routing, Metadata & DynamicApiTable Wiring', () => {
  test('Menu catalog registers Status (ST1, /status) under File Maintenance and Access Level leaf entries', () => {
    const fmGroup = MENU_CATALOG.find(item => item.code === 'file-maintenance')
    assert.ok(fmGroup && Array.isArray(fmGroup.children))
    const statusEntry = fmGroup.children.find(c => c.code === 'file-maintenance.status')
    assert.ok(statusEntry, 'Status must be registered under file-maintenance')
    assert.equal(statusEntry.shortCode, 'ST1')
    assert.equal(statusEntry.path, '/status')

    assert.ok(LEAF_MENU_CATALOG_ENTRIES.some(e => e.code === 'file-maintenance.status'))
    assert.equal(menuCodeForPath('/status'), 'file-maintenance.status')
    assert.ok(resolveMenuCodesFromName('Status').includes('file-maintenance.status'))
  })

  test('Router, FileMaintenance, useSearch, Api.vue, and model registries include Status', () => {
    assert.match(routerSrc, /status:\s*'Status'/)
    assert.match(routerSrc, /path:\s*'\/status'/)
    assert.match(fileMaintenanceSrc, /'\/status':\s*\{[\s\S]*endpoint:\s*'Status'/)
    assert.match(useSearchSrc, /route:\s*'\/status'/)
    assert.ok(apiViewSrc.includes("endpoint: 'Status'"))

    assert.deepEqual(EndpointColumns.Status, [
      'id', 'code', 'type', 'name', 'description', 'createdBy', 'createdDate'
    ])
    assert.deepEqual(
      resolveRequiredFields('Status', EndpointColumns.Status),
      ['type', 'name', 'description']
    )
    assert.ok(MONITORED_ENDPOINTS.some(e => e.path === '/Status'))
    assert.equal(EndpointSchemaMeta.Status?.create?.schema, 'StatusRequest')
    assert.equal(EndpointSchemaMeta.Status?.update?.schema, 'StatusRequest')
  })

  test('DynamicApiTable integrates Status CRUD by code, Type Code selector, all dynamic dropdowns, and Seed All Statuses action', () => {
    assert.ok(appVueSrc.includes('useStatusStore') && appVueSrc.includes('statusStore.loadStatuses()'))
    assert.ok(dynamicTableSrc.includes('const isStatusEndpoint = computed'))
    assert.ok(dynamicTableSrc.includes('const STATUS_COLUMNS = ['))
    assert.ok(dynamicTableSrc.includes('const STATUS_FORM_LAYOUT = ['))
    assert.ok(dynamicTableSrc.includes('const buildStatusSections ='))
    assert.ok(dynamicTableSrc.includes("return 'status_type_dropdown'"))
    assert.ok(dynamicTableSrc.includes('const fetchStatusesLookup ='))
    assert.ok(dynamicTableSrc.includes('const syncDropdownOptionsFromStatuses ='))
    assert.ok(dynamicTableSrc.includes('promotionPlacementSelectOptions'))
    assert.ok(dynamicTableSrc.includes('promotionImageSizeSelectOptions'))
    assert.ok(dynamicTableSrc.includes('promotionThemeColorSelectOptions'))
    assert.ok(dynamicTableSrc.includes('const getStatusDisplayLabel ='))
    /*
    assert.ok(dynamicTableSrc.includes('seedStatusesViaApi'))
    assert.ok(dynamicTableSrc.includes('sfa-tracker-seed-statuses-btn'))
    */
    // Gene - Nov, 26, 2026: Seed All Statuses button must remain hidden/commented in active template
    const activeTableTemplate = dynamicTableSrc.split('<script setup>')[0].replace(/<!--[\s\S]*?-->/g, '')
    assert.equal(activeTableTemplate.includes('sfa-tracker-seed-statuses-btn'), false)
    assert.equal(activeTableTemplate.includes('Seed All Statuses'), false)
    assert.ok(dynamicTableSrc.includes("editBaseSnapshot.value?.code || editFormData.value?.code || editingRecordId.value"))
    assert.ok(dynamicTableSrc.includes("recordToDelete.value?.code || rawTargetId"))
  })
})
