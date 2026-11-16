// Gene - Nov, 16, 2026: Regression tests for the 6 QA and code review bug fixes
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8').replace(/\r\n/g, '\n')

const dynamicTableSrc = read('../src/components/DynamicApiTable.vue')
const jobOrderListSrc = read('../src/views/JobOrderList.vue')
const dashboardSrc = read('../src/views/Dashboard.vue')
const accountingDashboardSrc = read('../src/views/AccountingDashboard.vue')

const stripHtmlComments = (src) => src.replace(/<!--[\s\S]*?-->/g, '')
const stripBlockComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '')

const activeTableScript = stripBlockComments(dynamicTableSrc.slice(dynamicTableSrc.indexOf('<script')))
const activeJobOrderListScript = stripBlockComments(jobOrderListSrc.slice(jobOrderListSrc.indexOf('<script')))

function sliceBetween(source, startMarker, endMarker, includeEnd = false) {
  const start = source.indexOf(startMarker)
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`)
  const end = source.indexOf(endMarker, start)
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`)
  return source.slice(start, includeEnd ? end + endMarker.length : end)
}

describe('Finding 1: Clear locate, search, and date query params on Reset and post-locate', () => {
  test('DynamicApiTable.vue clearAllFilters resets consumedLocateKey and strips query params', () => {
    const clearFn = sliceBetween(activeTableScript, 'const clearAllFilters = () => {', '\n// Columns that can stand in')
    assert.ok(clearFn.includes("consumedLocateKey.value = ''"), 'clearAllFilters must reset consumedLocateKey')
    assert.ok(clearFn.includes('delete nextQuery.locateJobOrderId'), 'clearAllFilters must remove locateJobOrderId')
    assert.ok(clearFn.includes('delete nextQuery.locateApplicationId'), 'clearAllFilters must remove locateApplicationId')
    assert.ok(clearFn.includes('delete nextQuery.dateFrom'), 'clearAllFilters must remove dateFrom')
    assert.ok(clearFn.includes('delete nextQuery.dateTo'), 'clearAllFilters must remove dateTo')
    assert.ok(clearFn.includes('delete nextQuery.search'), 'clearAllFilters must remove search')
    assert.ok(clearFn.includes('router.replace'), 'clearAllFilters must call router.replace')
  })

  test('DynamicApiTable.vue locateTargetRecordFromRoute strips one-shot locate params after opening View dialog', () => {
    const locateFn = sliceBetween(activeTableScript, 'const locateTargetRecordFromRoute = async () => {', '\nwatch(() => [route?.query?.locateJobOrderId')
    const afterOpen = locateFn.slice(locateFn.indexOf('openViewDialog(match)'))
    assert.ok(afterOpen.includes('delete nextQuery.locateJobOrderId'), 'Must strip locateJobOrderId after opening View modal')
    assert.ok(afterOpen.includes('delete nextQuery.locateApplicationId'), 'Must strip locateApplicationId after opening View modal')
    assert.ok(afterOpen.includes('router.replace'), 'Must replace route without one-shot locate keys')
  })

  test('JobOrderList.vue clearAllFilters removes locate, date, and search query params from URL', () => {
    const clearFn = sliceBetween(activeJobOrderListScript, 'const clearAllFilters = () => {', '\n</script>')
    assert.ok(clearFn.includes('delete nextQuery.locateJobOrderId'))
    assert.ok(clearFn.includes('delete nextQuery.locateApplicationId'))
    assert.ok(clearFn.includes('delete nextQuery.dateFrom'))
    assert.ok(clearFn.includes('delete nextQuery.dateTo'))
    assert.ok(clearFn.includes('delete nextQuery.search'))
    assert.ok(clearFn.includes('router.replace'))
  })
})

describe('Finding 2: extractJobOrderDateWindow excludes time-only fields and pads by +/- 1 day', () => {
  test('extractJobOrderDateWindow ignores startTimeStamp/endTimeStamp and pads single-day Job Orders', () => {
    const parseDateStart = activeTableScript.lastIndexOf('const parseDateForPicker = (val) => {')
    const parseDateEnd = activeTableScript.indexOf('\n\nconst parseTimeForPicker', parseDateStart)
    const parseDateSrc = activeTableScript.slice(parseDateStart, parseDateEnd)

    const ymdAndWindowSrc = sliceBetween(
      activeTableScript,
      'const formatLocalYmd = (dateObj) => {',
      '\n\nconst goToLinkedJobOrder'
    )

    const extractJobOrderDateWindow = new Function(
      `${parseDateSrc}\n${ymdAndWindowSrc}\nreturn extractJobOrderDateWindow`
    )()

    // Even if startTimeStamp was set via "Now" in a different month, only calendar/audit date fields count
    const win = extractJobOrderDateWindow({
      createdDate: '2026-11-16T18:45:00',
      startTimeStamp: '2026-12-25T10:00:00',
      endTimeStamp: '2026-12-25T11:30:00'
    })

    assert.deepEqual(win, {
      dateFrom: '2026-11-15',
      dateTo: '2026-11-17'
    })
  })
})

describe('Finding 3: Global search indexes resolved user names and invalidates when usersMap updates', () => {
  test('rowMatchesTokens finds rows by displayed user name on assignedEmail and modifiedBy and refreshes after usersMap loads', () => {
    const searchBlockSrc = sliceBetween(
      activeTableScript,
      'const q = (filters.value.global?.value',
      '\n  return list'
    )

    let list = [
      { id: 1, assignedEmail: 'tech.lead@switchfiber.com', modifiedBy: 7 },
      { id: 2, assignedEmail: 'other@switchfiber.com', modifiedBy: 9 }
    ]
    const columns = { value: ['id', 'assignedEmail', 'modifiedBy'] }
    const filters = { value: { global: { value: 'Gene Medel' } } }
    const usersMap = { value: new Map() }

    const getFieldType = (col) => (col === 'assignedEmail' ? 'assignedemail_dropdown' : 'text')
    const isUserRefField = (col) => col === 'assignedEmail' || col === 'modifiedBy'
    const formatDisplayValue = (val, col) => {
      if (isUserRefField(col)) {
        return usersMap.value.get(val) ?? String(val)
      }
      return String(val)
    }

    const runSearch = () => new Function(
      'list',
      'filters',
      'columns',
      'usersMap',
      'getFieldType',
      'isUserRefField',
      'formatDisplayValue',
      `${searchBlockSrc}\nreturn list`
    )([...list], filters, columns, usersMap, getFieldType, isUserRefField, formatDisplayValue)

    // Before /Users finishes loading: searching by name matches nothing, caching version 0
    assert.equal(runSearch().length, 0)

    // After /Users loads into usersMap: cache version updates and "Gene Medel" matches row 1
    usersMap.value = new Map([
      ['tech.lead@switchfiber.com', 'Gene Ray Medel'],
      [7, 'Gene Ray Medel']
    ])
    const matchedByAssignedName = runSearch()
    assert.deepEqual(matchedByAssignedName.map(r => r.id), [1])

    // Searching by modifier name on modifiedBy also matches
    usersMap.value = new Map([
      ['tech.lead@switchfiber.com', 'Tech One'],
      [9, 'Maria Clara']
    ])
    filters.value.global.value = 'Maria Clara'
    const matchedByModifiedBy = runSearch()
    assert.deepEqual(matchedByModifiedBy.map(r => r.id), [2])
  })
})

describe('Finding 4: Avoid unbounded GET /JobOrders on initial table mount', () => {
  test('fetchJobOrderAssignedEmailsLookup harvests from loaded JobOrders rows and skips unbounded mount fetch', async () => {
    const lookupSrc = sliceBetween(
      activeTableScript,
      'let jobOrderEmailsLookupPromise = null',
      '\n// Drops every cached lookup'
    )

    let apiCalls = 0
    const CrudService = {
      async list() {
        apiCalls += 1
        return [{ id: 99, assignedEmail: 'fallback@switchfiber.com' }]
      }
    }
    const rowFieldOf = (row, field) => (row && row[field] ? String(row[field]).trim() : '')
    const unwrapList = (r) => (Array.isArray(r) ? r : [])
    const jobOrderSavedEmails = { value: [] }
    const isJobOrderEndpoint = { value: true }
    const data = { value: [] }

    const fetchLookup = new Function(
      'CrudService',
      'unwrapList',
      'rowFieldOf',
      'jobOrderSavedEmails',
      'isJobOrderEndpoint',
      'data',
      `${lookupSrc}\nreturn fetchJobOrderAssignedEmailsLookup`
    )(CrudService, unwrapList, rowFieldOf, jobOrderSavedEmails, isJobOrderEndpoint, data)

    // 1. Initial mount (!fromDialog) with empty data.value should NOT call GET /JobOrders
    await fetchLookup()
    assert.equal(apiCalls, 0, 'Must not call unbounded GET /JobOrders on initial table mount')

    // 2. When JobOrders rows are already loaded in data.value, even fromDialog harvests them without GET /JobOrders
    data.value = [
      { id: 1, assignedEmail: 'alpha@switchfiber.com' },
      { id: 2, assignedEmail: 'ALPHA@switchfiber.com' }
    ]
    await fetchLookup({ fromDialog: true })
    assert.equal(apiCalls, 0, 'Must reuse loaded JobOrders rows instead of refetching /JobOrders')
    assert.deepEqual(jobOrderSavedEmails.value, ['alpha@switchfiber.com'])

    // 3. On a non-JobOrders endpoint (e.g. ServiceOrders) when opening a dialog, it fetches /JobOrders on demand
    isJobOrderEndpoint.value = false
    await fetchLookup({ fromDialog: true })
    assert.equal(apiCalls, 1)
    assert.deepEqual(jobOrderSavedEmails.value, ['alpha@switchfiber.com', 'fallback@switchfiber.com'])
  })

  test('fetchData harvests assignedEmail from loaded JobOrders rows', () => {
    const fetchDataSrc = sliceBetween(activeTableScript, 'const fetchData = async', '\nconst refreshData = async')
    assert.ok(
      fetchDataSrc.includes("if (isJobOrderEndpoint.value && Array.isArray(data.value) && data.value.length > 0)") &&
      fetchDataSrc.includes("recordSavedAssignedEmail(email)"),
      'fetchData must harvest assignedEmail from loaded JobOrders rows'
    )
  })
})

describe('Finding 5: Consistent local date parsing and edit conflict comparison', () => {
  test('openEditDialog uses parseDateForPicker for date fields instead of raw new Date()', () => {
    const openEditSrc = sliceBetween(activeTableScript, 'const openEditDialog = async (record) => {', '\nconst normalizeCompareValue')
    assert.ok(
      openEditSrc.includes("else if (type === 'date' && record[col]) {\n      const parsed = parseDateForPicker(record[col])\n      editFormData.value[col] = parsed || record[col]"),
      'openEditDialog must parse date columns via parseDateForPicker'
    )
  })

  test('normalizeCompareValue compares local midnight Date objects against ISO timestamps without UTC-8 day shift', () => {
    const parseDateStart = activeTableScript.lastIndexOf('const parseDateForPicker = (val) => {')
    const parseDateEnd = activeTableScript.indexOf('\n\nconst parseTimeForPicker', parseDateStart)
    const parseDateSrc = activeTableScript.slice(parseDateStart, parseDateEnd)

    const formatYmdSrc = sliceBetween(
      activeTableScript,
      'const formatLocalYmd = (dateObj) => {',
      '\n}\n',
      true
    )

    const normCompareSrc = sliceBetween(
      activeTableScript,
      'const normalizeCompareValue = (col, val) => {',
      '\n\nconst detectEditConflict'
    )

    const normalizeCompareValue = new Function(
      'getFieldType',
      'isPhoneField',
      'normalizePhoneNumber',
      'parseTimeForPicker',
      'normalizeOnsiteStatus',
      'isAgreementChecked',
      `${parseDateSrc}\n${formatYmdSrc}\n${normCompareSrc}\nreturn normalizeCompareValue`
    )(
      (col) => (col === 'dateInstalled' ? 'date' : 'text'),
      () => false,
      (v) => String(v || ''),
      () => null,
      (v) => String(v || ''),
      () => false
    )

    const localMidnightDate = new Date(2026, 10, 16, 0, 0, 0, 0)
    assert.equal(normalizeCompareValue('dateInstalled', localMidnightDate), '2026-11-16')
    assert.equal(normalizeCompareValue('dateInstalled', '2026-11-16'), '2026-11-16')
    assert.equal(normalizeCompareValue('dateInstalled', '2026-11-16T09:30:00'), '2026-11-16')
  })
})

describe('Finding 6: Dashboard & AccountingDashboard row actions preserve row search context', () => {
  test('Dashboard.vue Recent Applications row action passes row name/id in search query', () => {
    const activeTpl = stripHtmlComments(dashboardSrc.slice(0, dashboardSrc.indexOf('<script')))
    assert.match(
      activeTpl,
      /router\.push\(\{\s*path:\s*'\/application',\s*query:\s*\(data\?\.name \|\| data\?\.id\)\s*\?\s*\{\s*search:\s*String\(data\.name \|\| data\.id\)\.trim\(\)\s*\}\s*:\s*\{\}\s*\}\)/
    )
  })

  test('AccountingDashboard.vue Settled Payments and Receivables row actions pass search query', () => {
    const activeTpl = stripHtmlComments(accountingDashboardSrc.slice(0, accountingDashboardSrc.indexOf('<script')))
    assert.match(
      activeTpl,
      /router\.push\(\{\s*path:\s*'\/payments',\s*query:\s*\(data\?\.invoiceNo \|\| data\?\.accountNo\)\s*\?\s*\{\s*search:\s*String\(data\.invoiceNo \|\| data\.accountNo\)\.trim\(\)\s*\}\s*:\s*\{\}\s*\}\)/
    )
    assert.match(
      activeTpl,
      /router\.push\(\{\s*path:\s*'\/billing',\s*query:\s*\(data\?\.accountNo \|\| data\?\.fullName\)\s*\?\s*\{\s*search:\s*String\(data\.accountNo \|\| data\.fullName\)\.trim\(\)\s*\}\s*:\s*\{\}\s*\}\)/
    )
  })
})
