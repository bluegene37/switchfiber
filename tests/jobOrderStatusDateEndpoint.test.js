// Tests for /api/JobOrders/status-date endpoint integration in All Job Orders
// and dedicated status routes (In Progress, Completed, Activated).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JobOrderService } from '../src/services/jobOrders.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const jobOrderView = path.resolve(__dirname, '../src/views/JobOrderList.vue')
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const serviceFile = path.resolve(__dirname, '../src/services/jobOrders.js')

const jobOrderSource = fs.readFileSync(jobOrderView, 'utf8')
const tableSource = fs.readFileSync(tableFile, 'utf8')
const serviceSource = fs.readFileSync(serviceFile, 'utf8')

describe('JobOrderService status-date API method', () => {
  test('JobOrderService exports getJobOrdersByStatusDate', () => {
    assert.equal(typeof JobOrderService.getJobOrdersByStatusDate, 'function')
    assert.ok(serviceSource.includes("'/JobOrders/status-date'"))
  })
})

describe('JobOrderList.vue status-date endpoint wiring', () => {
  test('DynamicApiTable is configured with JobOrders/status-date and server-date-filter', () => {
    assert.ok(
      jobOrderSource.includes('filter-endpoint="JobOrders/status-date"'),
      'JobOrderList must configure filter-endpoint to JobOrders/status-date'
    )
    assert.ok(
      jobOrderSource.includes('server-date-filter'),
      'JobOrderList must enable server-date-filter for upstream date scoping'
    )
  })

  test('client-status-filter is enabled on All page and disabled on dedicated status routes', () => {
    assert.ok(
      jobOrderSource.includes(':client-status-filter="!isDedicatedStatusRoute"'),
      'All Job Orders must keep status client-side, while dedicated status routes send status upstream'
    )
  })

  test('activeFilterParams provides both dateFrom/dateTo and fromDate/toDate', () => {
    assert.ok(
      jobOrderSource.includes('params.dateFrom = f'),
      'activeFilterParams must supply dateFrom parameter'
    )
    assert.ok(
      jobOrderSource.includes('params.dateTo = t'),
      'activeFilterParams must supply dateTo parameter'
    )
    assert.ok(
      jobOrderSource.includes('params.fromDate = f'),
      'activeFilterParams must supply fromDate for backwards compatibility'
    )
    assert.ok(
      jobOrderSource.includes('params.toDate = t'),
      'activeFilterParams must supply toDate for backwards compatibility'
    )
  })

  test('status parameter in activeFilterParams maps slug to the data spelling, not the display label', () => {
    // The backend matches status case-insensitively but not space-insensitively:
    // 'In Progress' returns 0 rows while 'Inprogress' returns the real rows.
    assert.ok(
      jobOrderSource.includes('LEGACY_STATUS_VALUES[s.toLowerCase()] || s'),
      'activeFilterParams must resolve legacy slug to the data spelling for the backend query'
    )
    assert.ok(
      !jobOrderSource.includes('LEGACY_STATUS_LABELS[s.toLowerCase()] || s'),
      'the display label must not be sent upstream'
    )
  })
})

describe('DynamicApiTable date parameter handling', () => {
  test('DATE_FILTER_PARAM_KEYS includes dateFrom and dateTo variants', () => {
    assert.ok(
      tableSource.includes("'dateFrom'"),
      'DATE_FILTER_PARAM_KEYS must include dateFrom'
    )
    assert.ok(
      tableSource.includes("'dateTo'"),
      'DATE_FILTER_PARAM_KEYS must include dateTo'
    )
  })

  test('fetchData uses filterEndpoint when specified', () => {
    assert.ok(
      tableSource.includes('props.filterEndpoint'),
      'fetchData must resolve custom filterEndpoint'
    )
  })

  test('applyFilters and statusCounts inspect dateFrom as well as fromDate', () => {
    assert.ok(
      tableSource.includes('props.filterParams.dateFrom'),
      'applyFilters must support dateFrom property'
    )
    assert.ok(
      tableSource.includes('props.filterParams?.dateFrom'),
      'statusCounts must support dateFrom property'
    )
  })
})
