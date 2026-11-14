import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EndpointColumns } from '../src/models/columns.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(__dirname, '../src/components/DynamicApiTable.vue'), 'utf8')
const activeSrc = src.replace(/\/\*[\s\S]*?\*\//g, '')

function loadIsHiddenJobOrderFormField(isJobOrder = true) {
  const start = activeSrc.indexOf('const isHiddenJobOrderFormField =')
  assert.notEqual(start, -1, 'isHiddenJobOrderFormField declaration should exist')
  const end = activeSrc.indexOf('\n// Filter out', start)
  assert.notEqual(end, -1, 'end delimiter after isHiddenJobOrderFormField should exist')
  const fnCode = activeSrc.slice(start, end)
  const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')
  return new Function(
    'isJobOrderEndpoint',
    'normalizeColKey',
    `${fnCode}\nreturn isHiddenJobOrderFormField`
  )({ value: isJobOrder }, normalizeColKey)
}

function loadJobOrderLayoutAndBuilder() {
  const layoutMatch = activeSrc.match(/const JOB_ORDER_FORM_LAYOUT = (\[[\s\S]*?\])\n\nconst PLAN_FORM_LAYOUT/m)
  assert.ok(layoutMatch, 'active JOB_ORDER_FORM_LAYOUT should exist')

  const builderStart = activeSrc.indexOf('const buildLayoutSections =')
  const builderEnd = activeSrc.indexOf('const buildPlanSections =', builderStart)
  assert.notEqual(builderStart, -1, 'buildLayoutSections should exist')
  assert.notEqual(builderEnd, -1, 'buildPlanSections delimiter should exist')
  const builderCode = activeSrc.slice(builderStart, builderEnd)

  const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')
  const isAuditField = (col) => {
    const k = normalizeColKey(col)
    return (
      k === 'id' ||
      k === 'timestamp' ||
      k === 'rowversion' ||
      k.includes('created') ||
      k.includes('modified') ||
      k.includes('updated')
    )
  }
  const SECTION_META = {
    audit: { icon: 'pi pi-history', badgeClass: 'text-purple-500 text-dark' }
  }
  const getSectionTitle = (key) => (key === 'audit' ? 'System Metadata & Audit Trail' : key)

  return new Function(
    'normalizeColKey',
    'isAuditField',
    'SECTION_META',
    'getSectionTitle',
    `const JOB_ORDER_FORM_LAYOUT = ${layoutMatch[1]}\n${builderCode}\nreturn { JOB_ORDER_FORM_LAYOUT, buildJobOrderSections }`
  )(normalizeColKey, isAuditField, SECTION_META, getSectionTitle)
}

test('active JOB_ORDER_FORM_LAYOUT omits remarks and statusRemarks while keeping joRemarks and onsiteRemarks', () => {
  const { JOB_ORDER_FORM_LAYOUT } = loadJobOrderLayoutAndBuilder()
  const dispatchSection = JOB_ORDER_FORM_LAYOUT.find(sec => sec.key === 'dispatch')
  assert.ok(dispatchSection, 'dispatch section should exist in JOB_ORDER_FORM_LAYOUT')

  assert.equal(dispatchSection.columns.includes('remarks'), false, 'remarks must be omitted from dispatch columns')
  assert.equal(dispatchSection.columns.includes('statusRemarks'), false, 'statusRemarks must be omitted from dispatch columns')
  assert.equal(dispatchSection.columns.includes('joRemarks'), true, 'joRemarks must remain in dispatch columns')
  assert.equal(dispatchSection.columns.includes('onsiteRemarks'), true, 'onsiteRemarks must remain in dispatch columns')
})

test('isHiddenJobOrderFormField hides only Job Order remarks/statusRemarks and leaves other endpoints intact', () => {
  const hideOnJobOrder = loadIsHiddenJobOrderFormField(true)
  assert.equal(hideOnJobOrder('remarks'), true)
  assert.equal(hideOnJobOrder('Remarks'), true)
  assert.equal(hideOnJobOrder('statusRemarks'), true)
  assert.equal(hideOnJobOrder('status_remarks'), true)
  assert.equal(hideOnJobOrder('joRemarks'), false)
  assert.equal(hideOnJobOrder('onsiteRemarks'), false)
  assert.equal(hideOnJobOrder('status'), false)

  const hideOnOtherEndpoint = loadIsHiddenJobOrderFormField(false)
  assert.equal(hideOnOtherEndpoint('remarks'), false)
  assert.equal(hideOnOtherEndpoint('statusRemarks'), false)
  assert.equal(hideOnOtherEndpoint('joRemarks'), false)
  assert.equal(hideOnOtherEndpoint('onsiteRemarks'), false)
})

test('buildJobOrderSections excludes remarks and statusRemarks cleanly without leaking into Additional Details', () => {
  const { buildJobOrderSections } = loadJobOrderLayoutAndBuilder()
  const cols = EndpointColumns.JobOrders
  assert.ok(cols.includes('remarks'), 'raw EndpointColumns.JobOrders still includes remarks')
  assert.ok(cols.includes('statusRemarks'), 'raw EndpointColumns.JobOrders still includes statusRemarks')

  for (const opts of [{}, { includeAudit: true }]) {
    const sections = buildJobOrderSections(cols, opts)
    const allRenderedCols = sections.flatMap(s => s.columns)

    assert.equal(allRenderedCols.includes('remarks'), false, 'remarks must not appear in any Job Order section')
    assert.equal(allRenderedCols.includes('statusRemarks'), false, 'statusRemarks must not appear in any Job Order section')
    assert.equal(allRenderedCols.includes('joRemarks'), true, 'joRemarks must appear in Job Order sections')
    assert.equal(allRenderedCols.includes('onsiteRemarks'), true, 'onsiteRemarks must appear in Job Order sections')

    const extraSection = sections.find(s => s.key === 'extra')
    if (extraSection) {
      assert.equal(extraSection.columns.includes('remarks'), false, 'remarks must not leak into extra section')
      assert.equal(extraSection.columns.includes('statusRemarks'), false, 'statusRemarks must not leak into extra section')
    }
    assert.equal(extraSection, undefined, 'full EndpointColumns.JobOrders should not spawn an Additional Details extra section')
  }
})

test('formColumns and viewFormColumns apply isHiddenJobOrderFormField while buildJobOrderPayload retains remarks fields', () => {
  assert.match(
    activeSrc,
    /const formColumns = computed\(\(\)\s*=>\s*\{[\s\S]*?allRawColumns\.value\.filter\(col => !isAuditField\(col\)\)\.filter\(col => !isHiddenJobOrderFormField\(col\)\)/
  )
  assert.match(
    activeSrc,
    /keys = deduplicateColumns\(keys\)\.filter\(col => !isHiddenJobOrderFormField\(col\)\)/
  )
  assert.match(activeSrc, /remarks:\s*normStr\(payload\.remarks\)/)
  assert.match(activeSrc, /statusRemarks:\s*normStr\(payload\.statusRemarks\)/)
})
