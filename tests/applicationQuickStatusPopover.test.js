// Gene - Nov, 23, 2026: Unit & structural tests for Applications statuses and DataTable quick-status popover
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  APPLICATION_CANONICAL_STATUS_MAP,
  normalizeApplicationStatusValue,
  buildApplicationQuickStatusFormData,
  applyApplicationStatusLocally,
  formatQuickStatusSubtitle
} from '../src/utils/applicationQuickStatus.js'

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

function loadApplicationRequiredStatuses() {
  const startMarker = '// Gene - Nov, 23, 2026: Ensure No Facility, Cancelled, No Slot, Duplicate, For Confirmation, and Confirmed'
  const start = activeScript.indexOf(startMarker)
  assert.notEqual(start, -1, 'active APPLICATION_REQUIRED_STATUSES marker should exist')
  const end = activeScript.indexOf('const statusOptions', start)
  assert.notEqual(end, -1, 'statusOptions delimiter should exist')
  const block = activeScript.slice(start, end)
  return new Function(`${block}\nreturn APPLICATION_REQUIRED_STATUSES`)()
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

describe('Applications Required Statuses & Normalization', () => {
  test('APPLICATION_REQUIRED_STATUSES includes No Facility, Cancelled, No Slot, Duplicate, For Confirmation, Confirmed and excludes Clear Status', () => {
    const required = loadApplicationRequiredStatuses()
    for (const status of ['No Facility', 'Cancelled', 'No Slot', 'Duplicate', 'For Confirmation', 'Confirmed']) {
      assert.ok(required.includes(status), `APPLICATION_REQUIRED_STATUSES must include "${status}"`)
    }
    assert.ok(!required.some(s => String(s).toLowerCase() === 'clear status'), 'Clear Status must NOT be present')
    assert.equal(APPLICATION_CANONICAL_STATUS_MAP.nofacility, 'No Facility')
    assert.equal(APPLICATION_CANONICAL_STATUS_MAP.noslot, 'No Slot')
    assert.equal(APPLICATION_CANONICAL_STATUS_MAP.duplicate, 'Duplicate')
    assert.equal(APPLICATION_CANONICAL_STATUS_MAP.cancelled, 'Cancelled')
  })

  test('normalizeApplicationStatusValue normalizes casing/spacing/spelling variants and preserves unknown legacy statuses', () => {
    const opts = [
      { label: 'Schedule', value: 'Schedule' },
      { label: 'No Facility', value: 'No Facility' },
      { label: 'Cancelled', value: 'Cancelled' },
      { label: 'No Slot', value: 'No Slot' },
      { label: 'Duplicate', value: 'Duplicate' },
      { label: 'For Confirmation', value: 'For Confirmation' },
      { label: 'Confirmed', value: 'Confirmed' }
    ]

    assert.equal(normalizeApplicationStatusValue('no facility', opts), 'No Facility')
    assert.equal(normalizeApplicationStatusValue('nofacility', opts), 'No Facility')
    assert.equal(normalizeApplicationStatusValue('NO SLOT', opts), 'No Slot')
    assert.equal(normalizeApplicationStatusValue('no_slot', opts), 'No Slot')
    assert.equal(normalizeApplicationStatusValue('canceled', opts), 'Cancelled')
    assert.equal(normalizeApplicationStatusValue('cancelled', opts), 'Cancelled')
    assert.equal(normalizeApplicationStatusValue('duplicate', opts), 'Duplicate')
    assert.equal(normalizeApplicationStatusValue('for confirmation', opts), 'For Confirmation')
    assert.equal(normalizeApplicationStatusValue('confirmed', opts), 'Confirmed')
    assert.equal(normalizeApplicationStatusValue('Pending Review', opts), 'Pending Review')
    assert.equal(normalizeApplicationStatusValue('', opts), '')
    assert.equal(normalizeApplicationStatusValue(null, opts), '')
  })

  test('active getStatusBadgeConfig styles No Facility, Cancelled, No Slot, and Duplicate as danger badges', () => {
    const getStatusBadgeConfig = loadActiveGetStatusBadgeConfig()
    for (const status of ['No Facility', 'Cancelled', 'No Slot', 'Duplicate']) {
      const cfg = getStatusBadgeConfig(status)
      assert.match(cfg.class, /text-danger/, `${status} must render with danger styling`)
      assert.equal(cfg.label, status)
    }
  })
})

describe('Applications Quick-Status FormData & Local Update Helpers', () => {
  test('buildApplicationQuickStatusFormData sets Status + Modified audit, preserves fields/phones/agreement, and omits Created/File/Remove keys', () => {
    const record = {
      id: 4512,
      applicationid: 'APP-4512',
      emailAddress: 'juan@example.com',
      region: 'Region IV-A',
      city: 'Binangonan',
      barangay: 'Calumpang',
      referredBy: 'None',
      firstName: 'Juan',
      middleName: 'D',
      lastName: 'Cruz',
      mobileNumber: '9171234567',
      secondaryMobileNumber: '+639187654321',
      installationAddress: '123 Mabini St.',
      landmark: 'Near Plaza',
      desiredPlan: 'Fiber Unli 1299',
      termsAndConditionsAgreement: true,
      firstNearestLandmark: 'School',
      secondNearestLandmark: 'Church',
      applicablePromo: 'None',
      barangay1: '',
      barangay2: 'Bilibiran',
      referrersAccountNumber: 'ACC-100',
      applyingFor: 'Residential Fiber',
      status: 'Schedule',
      visitBy: 'Agent A',
      visitWith: 'Agent B',
      visitWithOther: '',
      remarks: 'Original remark',
      userEmail: 'agent@switchfiber.com',
      createdBy: '99',
      createdDate: '2026-10-01T00:00:00.000Z'
    }

    const nowIso = '2026-11-23T12:30:00.000Z'
    const form = buildApplicationQuickStatusFormData(record, 'No Facility', {
      loggedInUserId: '42',
      currentUserEmail: 'admin@switchfiber.com',
      nowIso
    })

    assert.equal(form.get('Status'), 'No Facility')
    assert.equal(form.get('ModifiedBy'), '42')
    assert.equal(form.get('ModifiedDate'), nowIso)
    assert.equal(form.get('FirstName'), 'Juan')
    assert.equal(form.get('LastName'), 'Cruz')
    assert.equal(form.get('EmailAddress'), 'juan@example.com')
    assert.equal(form.get('Region'), 'Region IV-A')
    assert.equal(form.get('City'), 'Binangonan')
    assert.equal(form.get('Barangay'), 'Calumpang')
    assert.equal(form.get('barangay1'), 'Calumpang')
    assert.equal(form.get('InstallationAddress'), '123 Mabini St.')
    assert.equal(form.get('DesiredPlan'), 'Fiber Unli 1299')
    assert.equal(form.get('MobileNumber'), '09171234567')
    assert.equal(form.get('SecondaryMobileNumber'), '09187654321')
    assert.equal(form.get('TermsAndConditionsAgreement'), 'Yes, I Agree')
    assert.equal(form.get('Remarks'), 'Original remark')
    assert.equal(form.get('UserEmail'), 'agent@switchfiber.com')

    assert.equal(form.has('CreatedBy'), false)
    assert.equal(form.has('CreatedDate'), false)

    for (const key of form.keys()) {
      assert.ok(!key.startsWith('Remove'), `Must not include removal flag "${key}"`)
      assert.ok(!key.endsWith('File'), `Must not include file upload field "${key}"`)
    }
  })

  test('applyApplicationStatusLocally immutably updates only the matching row and its audit fields', () => {
    const rows = [
      { id: 10, applicationid: 'APP-10', status: 'Schedule', modifiedBy: '1', modifiedDate: '2026-11-01T00:00:00.000Z' },
      { id: 11, applicationid: 'APP-11', status: 'Confirmed', modifiedBy: '2', modifiedDate: '2026-11-02T00:00:00.000Z' }
    ]

    const updated = applyApplicationStatusLocally(rows, 10, 'status', 'No Slot', {
      modifiedBy: '7',
      modifiedDate: '2026-11-23T12:30:00.000Z'
    })

    assert.notEqual(updated, rows)
    assert.equal(rows[0].status, 'Schedule', 'original array row must stay unchanged')
    assert.equal(updated[0].status, 'No Slot')
    assert.equal(updated[0].modifiedBy, '7')
    assert.equal(updated[0].modifiedDate, '2026-11-23T12:30:00.000Z')
    assert.strictEqual(updated[1], rows[1], 'unrelated rows should keep identity')
  })

  test('formatQuickStatusSubtitle formats Application identifier and applicant name cleanly', () => {
    assert.equal(
      formatQuickStatusSubtitle({ id: 5, applicationid: 'APP-500', firstName: 'Maria', lastName: 'Santos' }),
      '#APP-500 • Maria Santos'
    )
    assert.equal(formatQuickStatusSubtitle({ id: 77 }), '#77')
    assert.equal(formatQuickStatusSubtitle(null, 88), '#88')
  })
})

// Gene - Nov, 28, 2026: Updated wiring checks to verify multi-table quick-status popover across all writable endpoints via isQuickStatusCell & buildQuickStatusUpdateRequest
/*
describe('DynamicApiTable Quick-Status Popover Wiring (Applications Only)', () => {
  test('status cell makes only Applications non-readOnly status column clickable with @click.stop', () => {
    assert.match(
      activeScript,
      /const isApplicationQuickStatusCell = \(col\) =>\s*isApplicationEndpoint\.value && !props\.readOnly && String\(col \|\| ''\)\.trim\(\)\.toLowerCase\(\) === 'status'/
    )
    assert.match(
      activeTemplate,
      /<button\s+v-if="isApplicationQuickStatusCell\(col\)"[\s\S]*?@click\.stop="openQuickStatusPopover\(\$event, slotProps\.data, col\)"/
    )
    // Non-Applications status cells must retain their non-clickable badge fallback
    assert.match(
      activeTemplate,
      /v-else-if="slotProps\.data\[col\] !== null && slotProps\.data\[col\] !== undefined && slotProps\.data\[col\] !== ''"[\s\S]*?class="badge rounded-pill sfa-status-badge border"/
    )
  })

  test('renders a single shared Popover with quickStatusOptions, Cancel, and Save bound to saveQuickStatus', () => {
    const popovers = [
      ...activeTemplate.matchAll(/<Popover\b[^>]*ref="quickStatusPopover"[^>]*>/g)
    ]
    assert.equal(popovers.length, 1, 'Expected exactly one shared quickStatusPopover in DynamicApiTable template')
    assert.match(popovers[0][0], /class="sfa-tracker-table-quick-status-popover"/)
    assert.match(activeTemplate, /v-for="opt in quickStatusOptions"/)
    assert.match(activeTemplate, /@click="selectQuickStatusOption\(opt\.value\)"/)
    assert.match(activeTemplate, /@click="closeQuickStatusPopover"/)
    assert.match(activeTemplate, /label="Save"[\s\S]*?:disabled="!canSaveQuickStatus"[\s\S]*?@click="saveQuickStatus"/)
  })

  test('saveQuickStatus sends FormData via CrudService.update, patches local data, and refreshes silently', () => {
    assert.match(activeScript, /const saveQuickStatus = async \(\) => \{/)
    assert.match(activeScript, /buildApplicationQuickStatusFormData\(record, nextStatus,/)
    assert.match(activeScript, /await CrudService\.update\(props\.endpoint, recordId, form\)/)
    assert.match(activeScript, /applyApplicationStatusLocally\(data\.value, recordId, col, nextStatus,/)
    assert.match(activeScript, /fetchData\(\{ silent: true \}\)/)
  })
})
*/
describe('DynamicApiTable Quick-Status Popover Wiring (Multi-Table via /api/Status)', () => {
  test('status cell routes editable status columns through isQuickStatusCell(col) with @click.stop and keeps read-only badge fallback', () => {
    assert.match(
      activeScript,
      /const isQuickStatusCell = \(col\) =>\s*isQuickStatusEditableCell\(\{\s*endpoint:\s*props\.endpoint,\s*col,\s*readOnly:\s*props\.readOnly\s*\}\)/
    )
    assert.match(
      activeScript,
      /const isQuickStatusActiveCell = \(row, col\) =>/
    )
    assert.match(
      activeScript,
      /const isQuickStatusCellSaving = \(row, col\) =>/
    )
    assert.match(
      activeTemplate,
      /<button\s+v-if="isQuickStatusCell\(col\)"[\s\S]*?@click\.stop="openQuickStatusPopover\(\$event, slotProps\.data, col\)"/
    )
    assert.match(
      activeTemplate,
      /v-else-if="slotProps\.data\[col\] !== null && slotProps\.data\[col\] !== undefined && slotProps\.data\[col\] !== ''"[\s\S]*?class="badge rounded-pill sfa-status-badge border"/
    )
  })

  test('renders a single shared Popover with quickStatusTitle, quickStatusOptions, Cancel, and Save bound to saveQuickStatus', () => {
    const popovers = [
      ...activeTemplate.matchAll(/<Popover\b[^>]*ref="quickStatusPopover"[^>]*>/g)
    ]
    assert.equal(popovers.length, 1, 'Expected exactly one shared quickStatusPopover in DynamicApiTable template')
    assert.match(popovers[0][0], /class="sfa-tracker-table-quick-status-popover"/)
    assert.match(activeTemplate, /\{\{\s*quickStatusTitle\s*\}\}/)
    assert.match(activeTemplate, /v-for="opt in quickStatusOptions"/)
    assert.match(activeTemplate, /@click="selectQuickStatusOption\(opt\.value\)"/)
    assert.match(activeTemplate, /@click="closeQuickStatusPopover"/)
    assert.match(activeTemplate, /label="Save"[\s\S]*?:disabled="!canSaveQuickStatus"[\s\S]*?@click="saveQuickStatus"/)
  })

  test('saveQuickStatus delegates payload building to buildQuickStatusUpdateRequest, sends CrudService.update, patches locally, and refreshes silently', () => {
    assert.match(activeScript, /const saveQuickStatus = async \(\) => \{/)
    assert.match(activeScript, /buildQuickStatusUpdateRequest\(\{/)
    assert.match(activeScript, /await CrudService\.update\(props\.endpoint, recordId, payload, config\)/)
    assert.match(activeScript, /applyQuickStatusLocally\(data\.value, recordId, col, effectiveStatus,/)
    assert.match(activeScript, /fetchData\(\{ silent: true \}\)/)
  })
})
