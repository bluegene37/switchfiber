// Gene - Nov, 16, 2026: Regression & feature tests for hiding manual Job Order Create and adding per-row Application -> Job Order navigation
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JobOrderService } from '../src/services/jobOrders.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8')

const jobOrderListSrc = read('../src/views/JobOrderList.vue')
const fileMaintenanceSrc = read('../src/views/FileMaintenance.vue')
const dynamicTableSrc = read('../src/components/DynamicApiTable.vue')
const jobOrdersServiceSrc = read('../src/services/jobOrders.js')
const useSearchSrc = read('../src/composables/useSearch.js')

const stripHtmlComments = (src) => src.replace(/<!--[\s\S]*?-->/g, '')
const stripBlockComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '')

describe('Hide Job Order Create across all Job Order surfaces', () => {
  test('JobOrderList.vue removes active Create Job Order button and passes :hide-create-button="true"', () => {
    const activeTemplate = stripHtmlComments(jobOrderListSrc.slice(0, jobOrderListSrc.indexOf('<script')))
    assert.equal(
      activeTemplate.includes('aria-label="Create Job Order"'),
      false,
      'Active template in JobOrderList.vue must not render Create Job Order button'
    )
    assert.ok(
      activeTemplate.includes(':hide-create-button="true"'),
      'JobOrderList.vue must pass :hide-create-button="true" to DynamicApiTable'
    )
    assert.equal(
      activeTemplate.includes(':hide-create-button="false"'),
      false,
      'JobOrderList.vue must not leave active :hide-create-button="false"'
    )
  })

  test('FileMaintenance.vue configures hideCreate: true for /job_order', () => {
    const activeScript = stripBlockComments(fileMaintenanceSrc.slice(fileMaintenanceSrc.indexOf('<script')))
    const activeTemplate = stripHtmlComments(fileMaintenanceSrc.slice(0, fileMaintenanceSrc.indexOf('<script')))
    assert.ok(
      activeTemplate.includes(':hide-create-button="readOnly || hideCreate"'),
      'FileMaintenance.vue must bind :hide-create-button="readOnly || hideCreate"'
    )
    assert.match(
      activeScript,
      /'\/job_order':\s*\{[\s\S]*?hideCreate:\s*true/,
      '/job_order route config must enable hideCreate: true'
    )
  })

  test('DynamicApiTable.vue suppresses showCreateButton for JobOrders endpoint', () => {
    const activeScript = stripBlockComments(dynamicTableSrc.slice(dynamicTableSrc.indexOf('<script')))
    assert.ok(
      activeScript.includes('const showCreateButton = computed(() => !props.hideCreateButton && !props.readOnly && !isJobOrderEndpoint.value)'),
      'showCreateButton must exclude isJobOrderEndpoint so empty-state and toolbar Create never appear for JobOrders'
    )
  })

  test('useSearch.js comments out manual Dispatch New Job Order quick action', () => {
    const activeSearch = stripBlockComments(useSearchSrc)
    assert.equal(
      activeSearch.includes("id: 'act-new-job'"),
      false,
      'Global search quick actions must not advertise manual Job Order creation'
    )
  })
})

describe('Application per-row View Job Order button and auto-locate', () => {
  test('JobOrderService exposes getJobOrderByApplicationId targeting /JobOrders/applicationid/{applicationId}', () => {
    assert.equal(typeof JobOrderService.getJobOrderByApplicationId, 'function')
    assert.ok(
      jobOrdersServiceSrc.includes('/JobOrders/applicationid/${encodeURIComponent'),
      'JobOrderService.getJobOrderByApplicationId must call /JobOrders/applicationid/{applicationId}'
    )
  })

  test('DynamicApiTable.vue renders View Job Order row action button for Applications only', () => {
    const activeTemplate = stripHtmlComments(dynamicTableSrc.slice(0, dynamicTableSrc.indexOf('<script')))
    assert.ok(
      activeTemplate.includes('v-if="isApplicationEndpoint"'),
      'Row action button must be gated to isApplicationEndpoint'
    )
    assert.ok(
      activeTemplate.includes('aria-label="View Job Order"'),
      'Row action button must have View Job Order aria-label'
    )
    assert.ok(
      activeTemplate.includes('@click="goToLinkedJobOrder(slotProps.data)"'),
      'Row action button must invoke goToLinkedJobOrder(slotProps.data)'
    )
  })

  test('DynamicApiTable.vue defines goToLinkedJobOrder and locateTargetRecordFromRoute and hooks fetchData', () => {
    const activeScript = stripBlockComments(dynamicTableSrc.slice(dynamicTableSrc.indexOf('<script')))
    assert.ok(activeScript.includes('const goToLinkedJobOrder = async (record) =>'), 'goToLinkedJobOrder must be declared')
    assert.ok(activeScript.includes('const locateTargetRecordFromRoute = async () =>'), 'locateTargetRecordFromRoute must be declared')
    assert.ok(activeScript.includes('await locateTargetRecordFromRoute()'), 'fetchData must invoke locateTargetRecordFromRoute after data loads')
    assert.ok(activeScript.includes("path: '/job-orders'"), 'goToLinkedJobOrder must navigate to /job-orders')
    assert.ok(activeScript.includes('locateJobOrderId'), 'Navigation query must pass locateJobOrderId')
    assert.ok(activeScript.includes('openViewDialog(match)'), 'locateTargetRecordFromRoute must open View Details for the located Job Order')
  })

  test('JobOrderList.vue syncs date window from locate query params when arriving from Applications', () => {
    const activeScript = stripBlockComments(jobOrderListSrc.slice(jobOrderListSrc.indexOf('<script')))
    assert.ok(activeScript.includes('const syncLocateWindowFromRoute = () =>'), 'syncLocateWindowFromRoute must be defined')
    assert.ok(activeScript.includes('route.query.locateJobOrderId'), 'Must detect locateJobOrderId in route query')
    assert.ok(activeScript.includes('route.query.dateFrom'), 'Must honor dateFrom in route query')
    assert.ok(activeScript.includes("setDateRange('last_12_months')"), 'Must widen to last_12_months when locating without explicit dates')
  })
})
