// Regression: ISSUE-002, ISSUE-005, ISSUE-006, ISSUE-007, ISSUE-010
// Found by /qa on 2026-09-16
// Report: .gstack/qa-reports/qa-report-switchfiber-2026-09-16.md
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveRequiredFields } from '../src/models/requiredFields.js'
import { parseCoordinates } from '../src/services/lcpNapLocations.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8')

describe('ISSUE-002: Invoice and Payments cannot be saved blank', () => {
  test('Invoices demand account, amount and due date', () => {
    const cols = ['id', 'accountNo', 'amount', 'dueDate', 'status', 'created', 'createdBy']
    assert.deepEqual(resolveRequiredFields('Invoices', cols, 'create'), ['accountNo', 'amount', 'dueDate'])
  })

  test('Payments demand the fields the form labels Account #, Customer Name, Paid Amount, Payment Date, Payment Method', () => {
    const cols = ['id', 'transactionID', 'accountNo', 'fullName', 'contactNo', 'receivedPayment', 'paymentMethod', 'referenceNo', 'orNo', 'userEmail', 'status']
    assert.deepEqual(
      resolveRequiredFields('Payments', cols, 'create'),
      ['transactionID', 'accountNo', 'contactNo', 'receivedPayment', 'paymentMethod']
    )
  })

  test('the endpoint key is matched case-insensitively, like every other override', () => {
    assert.ok(resolveRequiredFields('invoices', ['accountNo']).includes('accountNo'))
    assert.ok(resolveRequiredFields('PAYMENTS', ['contactNo']).includes('contactNo'))
  })
})

describe('ISSUE-005: log screens send their date window upstream', () => {
  test('LogsView opts the table into server-side dates so DateFrom/DateTo are not stripped', () => {
    const view = read('../src/views/LogsView.vue')
    const tableTag = view.slice(view.indexOf('<DynamicApiTable'), view.indexOf('/>', view.indexOf('<DynamicApiTable')))
    assert.ok(tableTag.includes(':filter-params="activeFilterParams"'), 'the date params still come from the page')
    assert.ok(tableTag.includes('server-date-filter'), 'without server-date-filter the table drops DateFrom/DateTo and the API answers []')
  })

  test('DynamicApiTable strips the PascalCase date keys unless serverDateFilter is set (the trap this guards)', () => {
    const table = read('../src/components/DynamicApiTable.vue')
    const keys = table.match(/const DATE_FILTER_PARAM_KEYS = \[([^\]]*)\]/)
    assert.ok(keys && keys[1].includes("'DateFrom'") && keys[1].includes("'DateTo'"))
    assert.ok(table.includes('if (!props.serverDateFilter && DATE_FILTER_PARAM_KEYS.includes(k)) return'))
  })
})

describe('ISSUE-006: app routes under /api-* are not proxied to the backend', () => {
  test('the dev proxy key carries a trailing slash', () => {
    const cfg = read('../vite.config.js')
    assert.ok(cfg.includes("'/api/': {"), 'proxy key must be /api/ so /api-management/* stays with the SPA')
    assert.ok(!/['"]\/api['"]\s*:/.test(cfg), 'a bare /api key would swallow /api-management and /api-services')
  })

  test('the production rewrite only matches /api/<path>', () => {
    const vercel = JSON.parse(read('../vercel.json'))
    const api = vercel.rewrites.find(r => r.source.startsWith('/api'))
    assert.equal(api.source, '/api/:path*')
  })

  test('the app still owns routes that start with /api', () => {
    const router = read('../src/router/index.js')
    assert.ok(router.includes("path: '/api-management/services'"))
    assert.ok(router.includes("path: '/api-services'"))
  })
})

describe('ISSUE-007: API Viewer does not open on the unbounded Applications table', () => {
  test('the default endpoint is a small table', () => {
    const view = read('../src/views/Api.vue')
    assert.ok(view.includes("const DEFAULT_ENDPOINT = 'Plans'"))
    assert.ok(!view.includes('const selectedEndpoint = ref(apiEndpoints.value[0].endpoint)'), 'must not default to the first (Applications) entry')
    assert.ok(view.includes("apiEndpoints.value.some(e => e.endpoint === DEFAULT_ENDPOINT)"), 'falls back safely if the default is ever removed from the list')
  })
})

describe('ISSUE-010: GPS coordinates need latitude and longitude', () => {
  test('parseCoordinates rejects a lone number and accepts a pair', () => {
    assert.equal(parseCoordinates('14.4649'), null)
    assert.equal(parseCoordinates('121.1923'), null)
    assert.deepEqual(parseCoordinates('14.4649, 121.1923'), { lat: 14.4649, lng: 121.1923 })
    assert.deepEqual(parseCoordinates('14.4649 121.1923'), { lat: 14.4649, lng: 121.1923 })
    assert.equal(parseCoordinates('0, 0'), null, '(0,0) is the no-fix placeholder')
    assert.equal(parseCoordinates('95, 10'), null, 'latitude out of range')
  })

  test('validateRequired checks the coordinates field format, not just presence', () => {
    const table = read('../src/components/DynamicApiTable.vue')
    const fn = table.slice(table.indexOf('const validateRequired = (scope)'), table.indexOf('eitherOrGroups.value.forEach', table.indexOf('const validateRequired = (scope)')))
    assert.ok(fn.includes("type === 'coordinates' && !isBlank(val) && !parseCoordinates(val)"), 'a populated but half coordinate must be an error')
    assert.ok(fn.includes('must be latitude and longitude'), 'the message tells the user what a valid value looks like')
  })
})
