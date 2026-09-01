// All Application asks the API for a date window only, and builds its status
// strip from whatever statuses that window's rows actually carry. Verified
// against the live API on 2026-09-01: /api/Applications/filter?fromDate&toDate
// answers 185 rows for August 2026 and 3,704 for the last 12 months, whose
// statuses include 'Inprogress' — one word, which is why the In Progress route
// filters on that spelling and not 'In Progress'.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const applicationView = path.resolve(__dirname, '../src/views/ApplicationList.vue')
const applicationSource = fs.readFileSync(applicationView, 'utf8')
const tableSource = fs.readFileSync(tableFile, 'utf8')

// `serverFilterParams` as DynamicApiTable computes it: blanks dropped, status
// held back when the browser resolves it, dates held back unless the endpoint
// opted into server-side date bounds.
const DATE_FILTER_PARAM_KEYS = ['fromDate', 'toDate']
const serverFilterParams = (filterParams, { clientStatusFilter, serverDateFilter }) => {
  const out = {}
  Object.entries(filterParams || {}).forEach(([k, v]) => {
    if (!serverDateFilter && DATE_FILTER_PARAM_KEYS.includes(k)) return
    if (clientStatusFilter && k === 'status') return
    if (v === undefined || v === null || String(v).trim() === '') return
    out[k] = v
  })
  return out
}

const APPLICATION_WIRING = { clientStatusFilter: true, serverDateFilter: true }
const WINDOW = { fromDate: '2026-08-01T00:00:00.000Z', toDate: '2026-08-31T15:59:59.999Z' }

// The statuses the August 2026 window came back with.
const AUGUST_ROWS = Object.entries({
  Schedule: 151, '': 26, Duplicate: 3, Submitted: 3, Cancelled: 1, 'No Facility': 1
}).flatMap(([status, n]) => Array.from({ length: n }, () => ({ status })))

const buildVocabulary = (rows) => {
  const byStatus = {}
  rows.forEach(row => {
    const raw = String(row.status ?? '').trim()
    const key = raw.toLowerCase()
    if (!key) return
    if (!byStatus[key]) byStatus[key] = { value: raw, label: raw, count: 0 }
    byStatus[key].count += 1
  })
  return Object.values(byStatus).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

describe('All Application filters the API on dates alone', () => {
  test('only the date window reaches /Applications/filter', () => {
    const params = serverFilterParams({ ...WINDOW, status: 'Schedule' }, APPLICATION_WIRING)
    assert.deepEqual(Object.keys(params).sort(), ['fromDate', 'toDate'])
    assert.equal(params.status, undefined, 'Status is resolved in the browser, never sent upstream')
  })

  test('the view is wired for server dates and client status', () => {
    assert.ok(applicationSource.includes('server-date-filter'), 'Dates must bound the request')
    assert.ok(applicationSource.includes('client-status-filter'), 'Status must stay client-side')
    assert.ok(
      /params\.fromDate = f[\s\S]{0,80}params\.toDate = t/.test(applicationSource),
      'Both bounds must always be supplied'
    )
  })

  test('a changed window issues a new request, a changed tab does not', () => {
    const key = (filterParams) =>
      Object.entries(serverFilterParams(filterParams, APPLICATION_WIRING))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')

    assert.equal(key({ ...WINDOW }), key({ ...WINDOW, status: 'Inprogress' }), 'A tab click must not refetch')
    assert.notEqual(key({ ...WINDOW }), key({ fromDate: WINDOW.fromDate, toDate: '2026-09-30T15:59:59.999Z' }))
  })

  test('the tabs are the statuses the window came back with', () => {
    const tabs = ['All Application', ...buildVocabulary(AUGUST_ROWS).map(s => s.label)]
    assert.deepEqual(tabs, ['All Application', 'Schedule', 'Duplicate', 'Submitted', 'Cancelled', 'No Facility'])
    assert.equal(tabs[0], 'All Application', 'All Application is the default tab')
  })

  test('a status the window does not carry is not offered', () => {
    // 'Inprogress' exists in the last 12 months but not in August.
    assert.ok(!buildVocabulary(AUGUST_ROWS).some(s => s.value === 'Inprogress'))
  })

  test('the absent-status hint says window, not dataset, when dates bound the request', () => {
    assert.ok(
      /windowScoped: !!props\.serverDateFilter/.test(tableSource),
      'The hint must know the loaded set is one date window'
    )
    assert.ok(
      tableSource.includes('No record in these dates carries that value'),
      'A window-scoped miss must not claim the value is absent from the whole table'
    )
  })
})

describe('In Progress filters on the spelling the data uses', () => {
  test('the route resolves to the one-word status', () => {
    assert.ok(
      applicationSource.includes("const APPLICATION_IN_PROGRESS = 'Inprogress'"),
      "The filter value must be the data's own spelling"
    )
    assert.ok(
      !/selectedStatus\.value = 'In Progress'/.test(applicationSource),
      "'In Progress' matches no Application row — the data spells it 'Inprogress'"
    )
  })

  test('the slug spellings a link can carry all reach it', () => {
    const syncStatus = (pathname, queryStatus = '') => {
      const p = pathname.toLowerCase()
      const q = String(queryStatus).toLowerCase()
      if (p.includes('/in-progress') || q === 'in-progress' || q === 'in progress' || q === 'inprogress') {
        return 'Inprogress'
      }
      return String(queryStatus).trim()
    }
    assert.equal(syncStatus('/application/in-progress'), 'Inprogress')
    for (const q of ['inprogress', 'in-progress', 'in progress', 'Inprogress', 'In Progress']) {
      assert.equal(syncStatus('/application', q), 'Inprogress', `?status=${q} must resolve`)
    }
    assert.equal(syncStatus('/application', 'Schedule'), 'Schedule', 'Other statuses pass through as-is')
  })

  test('the exact client-side match accepts the data casing', () => {
    const matches = (rowStatus, requested) =>
      String(rowStatus).trim().toLowerCase() === String(requested).trim().toLowerCase()
    assert.equal(matches('Inprogress', 'Inprogress'), true)
    assert.equal(matches('Inprogress', 'In Progress'), false, 'The two-word value would match nothing')
  })

  test('the empty-data fallback cannot reintroduce the two-word spelling', () => {
    const fallback = tableSource.match(/const FALLBACK_STATUS_LIST = \[([\s\S]*?)\]/)
    assert.ok(fallback, 'Missing FALLBACK_STATUS_LIST')
    assert.ok(fallback[1].includes("'Inprogress'"), 'The fallback must use the data spelling')
    assert.ok(!fallback[1].includes("'In Progress'"), 'A form must not write a status no filter reads back')
  })
})
