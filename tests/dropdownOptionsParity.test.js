import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const rawSource = fs.readFileSync(tablePath, 'utf8')

const tplStart = rawSource.indexOf('<template>')
const scriptStart = rawSource.indexOf('<script setup>')
const scriptEnd = rawSource.indexOf('</script>', scriptStart)
assert.notEqual(tplStart, -1, 'DynamicApiTable.vue must contain <template>')
assert.notEqual(scriptStart, -1, 'DynamicApiTable.vue must contain <script setup>')
assert.notEqual(scriptEnd, -1, 'DynamicApiTable.vue must contain </script>')

const activeTemplate = rawSource
  .slice(tplStart, scriptStart)
  .replace(/<!--[\s\S]*?-->/g, '')

const activeScript = rawSource
  .slice(scriptStart, scriptEnd)
  .replace(/\/\*[\s\S]*?\*\//g, '')

function loadStatusOptions({
  isJobOrder = false,
  isInProgress = false,
  isCompleted = false,
  isActivated = false,
  isInventoryLog = false,
  isApplication = false,
  vocabulary = []
} = {}) {
  /*
  const startMarker = '// Gene - Nov, 21, 2026: Ensure For Confirmation, Confirmed, and Cancelled'
  */
  // Gene - Nov, 23, 2026: Point startMarker at updated APPLICATION_REQUIRED_STATUSES marker
  const startMarker = '// Gene - Nov, 23, 2026: Ensure No Facility, Cancelled, No Slot, Duplicate, For Confirmation, and Confirmed'
  const start = activeScript.indexOf(startMarker)
  assert.notEqual(start, -1, 'active statusOptions block marker should exist')
  const end = activeScript.indexOf('const editStatusOptions', start)
  assert.notEqual(end, -1, 'editStatusOptions delimiter should exist after statusOptions')

  const block = activeScript.slice(start, end)
  const FALLBACK_STATUS_LIST = ['Inprogress', 'Done', 'Approved']

  const factory = new Function(
    'computed',
    'isJobOrderEndpoint',
    'isJobOrderInProgress',
    'isJobOrderCompleted',
    'isJobOrderActivated',
    'isInventoryLogEndpoint',
    'isApplicationEndpoint',
    'dataStatusVocabulary',
    'FALLBACK_STATUS_LIST',
    `${block}\nreturn { APPLICATION_REQUIRED_STATUSES, statusOptions }`
  )

  return factory(
    (fn) => ({ get value() { return fn() } }),
    { value: isJobOrder },
    { value: isInProgress },
    { value: isCompleted },
    { value: isActivated },
    { value: isInventoryLog },
    { value: isApplication },
    { value: vocabulary },
    FALLBACK_STATUS_LIST
  )
}

function loadServiceOrderDropdownHelpers(initialEditRecord = {}) {
  const startMarker = '// Gene - Nov, 21, 2026: Add For Visit to Service Order Support Status'
  const start = activeScript.indexOf(startMarker)
  assert.notEqual(start, -1, 'active Service Order dropdown block marker should exist')
  const end = activeScript.indexOf('const connectionTypeOptions', start)
  assert.notEqual(end, -1, 'connectionTypeOptions delimiter should exist after concernOptions')

  const block = activeScript.slice(start, end)
  const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')
  const getStableOptionsWithCurrent = (optionsList, currentVal) => {
    const list = Array.isArray(optionsList) ? optionsList : []
    const raw = currentVal === null || currentVal === undefined ? '' : String(currentVal).trim()
    if (!raw) return list
    const norm = (s) => String(s).trim().toLowerCase().replace(/[\s_-]+/g, '')
    const exists = list.some(o => norm(o.value ?? o.label) === norm(raw))
    return exists ? list : [{ label: raw, value: raw }, ...list]
  }

  const factory = new Function(
    'ref',
    'computed',
    'editFormData',
    'normalizeColKey',
    'getStableOptionsWithCurrent',
    `${block}\nreturn { supportStatusOptions, normalizeSupportStatus, editSupportStatusOptions, visitStatusOptions, normalizeVisitStatus, editVisitStatusOptions, repairCategoryOptions, concernOptions }`
  )

  return factory(
    (v) => ({ value: v }),
    (fn) => ({ get value() { return fn() } }),
    { value: initialEditRecord },
    normalizeColKey,
    getStableOptionsWithCurrent
  )
}

function loadGetFieldType() {
  const fnStart = activeScript.indexOf('function getFieldType(col)')
  assert.notEqual(fnStart, -1, 'getFieldType declaration should exist')
  const fnEnd = activeScript.indexOf('\nfunction ', fnStart + 1)
  assert.notEqual(fnEnd, -1, 'next function after getFieldType should exist')
  const fnCode = activeScript.slice(fnStart, fnEnd)

  const falseRef = { value: false }
  const isNonNumericIdField = () => false
  const factory = new Function(
    'isPromotionEndpoint',
    'isInventoryItemEndpoint',
    'isPaymentEndpoint',
    'isJobOrderEndpoint',
    'isInvoiceEndpoint',
    'isDiscountEndpoint',
    'isNonNumericIdField',
    `${fnCode}\nreturn getFieldType`
  )
  return factory(falseRef, falseRef, falseRef, falseRef, falseRef, falseRef, isNonNumericIdField)
}

function loadActiveGetStatusBadgeConfig() {
  const marker = '// Gene - Nov, 21, 2026: Style Confirmed/Resolved as green'
  const start = activeScript.indexOf(marker)
  assert.notEqual(start, -1, 'active getStatusBadgeConfig marker should exist')
  const fnStart = activeScript.indexOf('const getStatusBadgeConfig', start)
  const end = activeScript.indexOf('\n}\n', fnStart)
  assert.notEqual(fnStart, -1, 'active getStatusBadgeConfig declaration should exist')
  assert.notEqual(end, -1, 'active getStatusBadgeConfig closing brace should exist')

  const fnCode = activeScript.slice(fnStart, end + 3)
  return new Function(`${fnCode}\nreturn getStatusBadgeConfig`)()
}

describe('Dropdown options parity & manual entry across Applications, Job Orders, and Service Orders', () => {
  /*
  test('Applications statusOptions merges For Confirmation, Confirmed, Cancelled without duplicating Cancelled and preserves empty fallback', () => {
    const withData = loadStatusOptions({
      isApplication: true,
      vocabulary: ['Schedule', 'Duplicate', 'Cancelled', 'No Facility']
    })
    const values = withData.statusOptions.value.map(o => o.value)
    assert.deepEqual(values, [
      'Schedule',
      'Duplicate',
      'Cancelled',
      'No Facility',
      'For Confirmation',
      'Confirmed'
    ])
    assert.equal(values.filter(v => v.toLowerCase() === 'cancelled').length, 1)

    const emptyData = loadStatusOptions({
      isApplication: true,
      vocabulary: []
    })
    assert.deepEqual(emptyData.statusOptions.value.map(o => o.value), [
      'Inprogress',
      'Done',
      'Approved',
      'For Confirmation',
      'Confirmed',
      'Cancelled'
    ])
  })
  */
  // Gene - Nov, 23, 2026: Verify Applications statusOptions merges No Facility, Cancelled, No Slot, Duplicate, For Confirmation, and Confirmed without Clear Status
  test('Applications statusOptions merges No Facility, Cancelled, No Slot, Duplicate, For Confirmation, Confirmed without duplicates or Clear Status', () => {
    const withData = loadStatusOptions({
      isApplication: true,
      vocabulary: ['Schedule', 'Duplicate', 'Cancelled', 'No Facility']
    })
    const values = withData.statusOptions.value.map(o => o.value)
    assert.deepEqual(values, [
      'Schedule',
      'Duplicate',
      'Cancelled',
      'No Facility',
      'For Confirmation',
      'Confirmed',
      'No Slot'
    ])
    assert.equal(values.filter(v => v.toLowerCase() === 'cancelled').length, 1)
    assert.equal(values.filter(v => v.toLowerCase() === 'duplicate').length, 1)
    assert.equal(values.filter(v => v.toLowerCase() === 'no facility').length, 1)
    assert.ok(!values.some(v => v.toLowerCase() === 'clear status'), 'Clear Status must not be included')

    const emptyData = loadStatusOptions({
      isApplication: true,
      vocabulary: []
    })
    assert.deepEqual(emptyData.statusOptions.value.map(o => o.value), [
      'Inprogress',
      'Done',
      'Approved',
      'For Confirmation',
      'Confirmed',
      'No Facility',
      'Cancelled',
      'No Slot',
      'Duplicate'
    ])
    assert.ok(!emptyData.statusOptions.value.some(o => o.value.toLowerCase() === 'clear status'))
  })

  test('Job Orders statusOptions includes For Confirmation, Confirmed, Cancelled while preserving route scoping and payload normalization', () => {
    const allJo = loadStatusOptions({ isJobOrder: true })
    assert.deepEqual(allJo.statusOptions.value.map(o => o.value), [
      'Inprogress',
      'Scheduled',
      'Completed',
      'Activated',
      'Failed',
      'For Confirmation',
      'Confirmed',
      'Cancelled'
    ])

    const inProgJo = loadStatusOptions({ isJobOrder: true, isInProgress: true })
    const inProgVals = inProgJo.statusOptions.value.map(o => o.value)
    assert.ok(inProgVals.includes('Inprogress'))
    assert.ok(inProgVals.includes('Scheduled'))
    assert.ok(inProgVals.includes('For Confirmation'))
    assert.ok(inProgVals.includes('Confirmed'))
    assert.ok(inProgVals.includes('Cancelled'))
    assert.ok(!inProgVals.includes('Completed'))
    assert.ok(!inProgVals.includes('Activated'))

    const completedJo = loadStatusOptions({ isJobOrder: true, isCompleted: true })
    const completedVals = completedJo.statusOptions.value.map(o => o.value)
    assert.ok(completedVals.includes('Completed'))
    assert.ok(completedVals.includes('Activated'))
    assert.ok(completedVals.includes('For Confirmation'))
    assert.ok(completedVals.includes('Confirmed'))
    assert.ok(completedVals.includes('Cancelled'))
    assert.ok(!completedVals.includes('Scheduled'))
    assert.ok(!completedVals.includes('Inprogress'))

    assert.match(activeScript, /cleanKey === 'forconfirmation'\)\s*return 'For Confirmation'/)
    assert.match(activeScript, /cleanKey === 'confirmed'\)\s*return 'Confirmed'/)
    assert.match(activeScript, /cleanKey === 'cancelled' \|\| cleanKey === 'canceled'\)\s*return 'Cancelled'/)
  })

  test('Service Orders supportStatusOptions includes For Visit + existing values, normalizes variants, and binds Edit Select to editSupportStatusOptions', () => {
    const {
      supportStatusOptions,
      normalizeSupportStatus,
      editSupportStatusOptions
    } = loadServiceOrderDropdownHelpers({ supportStatus: 'Custom Legacy Support' })

    const values = supportStatusOptions.value.map(o => o.value)
    for (const expected of ['Pending', 'In Progress', 'For Visit', 'Resolved', 'Closed', 'Cancelled', 'Failed']) {
      assert.ok(values.includes(expected), `supportStatusOptions must include ${expected}`)
    }

    assert.equal(normalizeSupportStatus('for visit'), 'For Visit')
    assert.equal(normalizeSupportStatus('For Visit'), 'For Visit')
    assert.equal(normalizeSupportStatus('inprogress'), 'In Progress')
    assert.equal(normalizeSupportStatus('canceled'), 'Cancelled')
    assert.equal(normalizeSupportStatus('resolved'), 'Resolved')
    assert.equal(normalizeSupportStatus('Custom Legacy Support'), 'Custom Legacy Support')

    assert.equal(editSupportStatusOptions.value[0].value, 'Custom Legacy Support')

    const editMatches = [
      ...activeTemplate.matchAll(/<Select\b[^>]*v-else-if="getFieldType\(col\)\s*===\s*'supportstatus_dropdown'"[^>]*\/>/g)
    ].map(m => m[0])
    assert.equal(editMatches.length, 2, 'Expected Create and Edit supportStatus Select elements')
    assert.match(editMatches[1], /:options="editSupportStatusOptions"/)
  })

  test('Service Orders visitStatusOptions includes Done and Reschedule + existing values, normalizes variants, and binds Edit Select to editVisitStatusOptions', () => {
    const {
      visitStatusOptions,
      normalizeVisitStatus,
      editVisitStatusOptions
    } = loadServiceOrderDropdownHelpers({ visitStatus: 'Awaiting Parts' })

    const values = visitStatusOptions.value.map(o => o.value)
    for (const expected of ['Scheduled', 'Dispatched', 'In Progress', 'Done', 'Completed', 'Reschedule', 'Cancelled', 'Failed']) {
      assert.ok(values.includes(expected), `visitStatusOptions must include ${expected}`)
    }

    assert.equal(normalizeVisitStatus('done'), 'Done')
    assert.equal(normalizeVisitStatus('reschedule'), 'Reschedule')
    assert.equal(normalizeVisitStatus('Rescheduled'), 'Reschedule')
    assert.equal(normalizeVisitStatus('in progress'), 'In Progress')
    assert.equal(normalizeVisitStatus('canceled'), 'Cancelled')
    assert.equal(normalizeVisitStatus('Awaiting Parts'), 'Awaiting Parts')

    assert.equal(editVisitStatusOptions.value[0].value, 'Awaiting Parts')

    const editMatches = [
      ...activeTemplate.matchAll(/<Select\b[^>]*v-else-if="getFieldType\(col\)\s*===\s*'visitstatus_dropdown'"[^>]*\/>/g)
    ].map(m => m[0])
    assert.equal(editMatches.length, 2, 'Expected Create and Edit visitStatus Select elements')
    assert.match(editMatches[1], /:options="editVisitStatusOptions"/)
  })

  test('Service Orders repairCategoryOptions includes all 13 target categories + legacy options, and both Create & Edit Selects are editable and filterable', () => {
    const { repairCategoryOptions } = loadServiceOrderDropdownHelpers()
    const values = repairCategoryOptions.value.map(o => o.value)

    const requested = [
      'Resplice',
      'Replace Patch Cord',
      'Fiber Relaying',
      'Replace Router',
      'Transfer LCP / NAP / PORT',
      'Relocate Router',
      'Update VLAN',
      'Reboot/Reconfig Router',
      'Migrate',
      'Pullout',
      'Others',
      'Reconfig',
      'Retain'
    ]
    for (const item of requested) {
      assert.ok(values.includes(item), `repairCategoryOptions must include "${item}"`)
    }
    for (const legacy of ['Fiber Cut', 'Modem Replacement', 'Port Reassignment', 'Configuration Issue', 'Hardware Defect', 'Relocation', 'Maintenance', 'Other']) {
      assert.ok(values.includes(legacy), `repairCategoryOptions must preserve legacy "${legacy}"`)
    }

    const selects = [
      ...activeTemplate.matchAll(/<Select\b[^>]*v-else-if="getFieldType\(col\)\s*===\s*'repaircategory_dropdown'"[^>]*\/>/g)
    ].map(m => m[0])
    assert.equal(selects.length, 2, 'Expected Create and Edit repairCategory Select elements')
    for (const sel of selects) {
      assert.match(sel, /:editable="true"/)
      assert.match(sel, /:filter="true"/)
    }
  })

  test('Service Orders concern field resolves to concern_dropdown, includes all 17 target items, and supports manual typing in Create & Edit', () => {
    const getFieldType = loadGetFieldType()
    assert.equal(getFieldType('concern'), 'concern_dropdown')
    assert.equal(getFieldType('Concern'), 'concern_dropdown')

    const { concernOptions } = loadServiceOrderDropdownHelpers()
    const values = concernOptions.value.map(o => o.value)

    const requested = [
      'New',
      'No Internet',
      'Slow Internet',
      'Others',
      'Migrate',
      'Pullout',
      'Upgrade/Downgrade Plan',
      'Reconnect',
      'Disconnect',
      'Update Info',
      'Relocation',
      'Change Password',
      'High Loss',
      'Low Optical Reading',
      'Retain',
      'High Power',
      'Statement of Account'
    ]
    assert.equal(values.length, requested.length)
    assert.deepEqual(values, requested)

    const selects = [
      ...activeTemplate.matchAll(/<Select\b[^>]*v-else-if="getFieldType\(col\)\s*===\s*'concern_dropdown'"[^>]*\/>/g)
    ].map(m => m[0])
    assert.equal(selects.length, 2, 'Expected Create and Edit concern Select elements')
    for (const sel of selects) {
      assert.match(sel, /:editable="true"/)
      assert.match(sel, /:filter="true"/)
    }
  })

  test('Active getStatusBadgeConfig styles Confirmed/Resolved green, For Confirmation/For Visit amber, Reschedule purple, and Cancelled red', () => {
    const getStatusBadgeConfig = loadActiveGetStatusBadgeConfig()

    assert.match(getStatusBadgeConfig('Confirmed').class, /text-success/)
    assert.match(getStatusBadgeConfig('Resolved').class, /text-success/)
    assert.match(getStatusBadgeConfig('For Confirmation').class, /text-warning-emphasis/)
    assert.match(getStatusBadgeConfig('For Visit').class, /text-warning-emphasis/)
    assert.match(getStatusBadgeConfig('Reschedule').class, /sfa-status-rescheduled/)
    assert.match(getStatusBadgeConfig('Cancelled').class, /text-danger/)
  })
})
