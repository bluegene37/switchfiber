// Gene - Nov, 25, 2026: Comprehensive test suite for Status File Maintenance (/status), /api/Status service, and dropdown wiring
import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import apiClient from '../src/services/api.js'
import {
  StatusService,
  STATUS_TYPES,
  DEFAULT_STATUSES,
  normalizeStatusType,
  normalizeStatusPayload,
  mapStatusesToDropdownOptions,
  groupStatusesByType
} from '../src/services/status.js'
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
const dynamicTableSrc = read('src/components/DynamicApiTable.vue')

describe('Status Service, Types & Default Catalog', () => {
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

  test('DynamicApiTable integrates Status CRUD by code, Type Code selector, and /api/Status dropdown lookup', () => {
    assert.ok(dynamicTableSrc.includes('const isStatusEndpoint = computed'))
    assert.ok(dynamicTableSrc.includes('const STATUS_COLUMNS = ['))
    assert.ok(dynamicTableSrc.includes('const STATUS_FORM_LAYOUT = ['))
    assert.ok(dynamicTableSrc.includes('const buildStatusSections ='))
    assert.ok(dynamicTableSrc.includes("return 'status_type_dropdown'"))
    assert.ok(dynamicTableSrc.includes('const fetchStatusesLookup ='))
    assert.ok(dynamicTableSrc.includes("editBaseSnapshot.value?.code || editFormData.value?.code || editingRecordId.value"))
    assert.ok(dynamicTableSrc.includes("recordToDelete.value?.code || rawTargetId"))
  })
})
