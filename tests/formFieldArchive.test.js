// Gene - Nov, 28, 2026: Tests for AppSheet field alignment archive partitioning, disabled/non-required behavior, and DynamicApiTable wiring
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ARCHIVED_SECTION_KEY,
  ARCHIVED_FORM_FIELDS_BY_ENDPOINT,
  normalizeArchiveEndpoint,
  getArchivedFieldSet,
  isArchivedFormField,
  filterNonArchivedColumns,
  partitionArchivedFormSections
} from '../src/utils/formFieldArchive.js'
import { EndpointColumns } from '../src/models/columns.js'
import { resolveEitherOrGroups } from '../src/models/requiredFields.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const rawTable = fs.readFileSync(tablePath, 'utf8')

const tplStart = rawTable.indexOf('<template>')
const scriptStart = rawTable.indexOf('<script setup>')
const scriptEnd = rawTable.indexOf('</script>', scriptStart)
assert.notEqual(tplStart, -1)
assert.notEqual(scriptStart, -1)
assert.notEqual(scriptEnd, -1)

const activeTemplate = rawTable.slice(tplStart, scriptStart).replace(/<!--[\s\S]*?-->/g, '')
const activeScript = rawTable.slice(scriptStart, scriptEnd).replace(/\/\*[\s\S]*?\*\//g, '')

function loadFormSectionBuilders() {
  const appStart = activeScript.indexOf('const APPLICATION_FORM_LAYOUT = [')
  const svcStart = activeScript.indexOf('const SERVICE_ORDER_FORM_LAYOUT = [')
  const billingStart = activeScript.indexOf('const BILLING_FORM_LAYOUT = [', svcStart)
  const joStart = activeScript.indexOf('const JOB_ORDER_FORM_LAYOUT = [')
  const planStart = activeScript.indexOf('const PLAN_FORM_LAYOUT = [', joStart)
  const layoutBuilderStart = activeScript.indexOf('const buildLayoutSections =')
  const planBuilderStart = activeScript.indexOf('const buildPlanSections =', layoutBuilderStart)

  assert.notEqual(appStart, -1)
  assert.notEqual(svcStart, -1)
  assert.notEqual(billingStart, -1)
  assert.notEqual(joStart, -1)
  assert.notEqual(planStart, -1)
  assert.notEqual(layoutBuilderStart, -1)
  assert.notEqual(planBuilderStart, -1)

  const appCode = activeScript.slice(appStart, activeScript.indexOf('const buildLcpNapSections =', appStart))
  const svcCode = activeScript.slice(svcStart, billingStart)
  const joLayoutCode = activeScript.slice(joStart, planStart)
  const joBuilderCode = activeScript.slice(layoutBuilderStart, planBuilderStart)

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
    `${appCode}\n${svcCode}\n${joLayoutCode}\n${joBuilderCode}\nreturn { buildApplicationSections, buildServiceOrderSections, buildJobOrderSections }`
  )(normalizeColKey, isAuditField, SECTION_META, getSectionTitle)
}

test('normalizeArchiveEndpoint and getArchivedFieldSet target only Applications, JobOrders, and ServiceOrders', () => {
  assert.equal(normalizeArchiveEndpoint('Applications'), 'applications')
  assert.equal(normalizeArchiveEndpoint('application'), 'applications')
  assert.equal(normalizeArchiveEndpoint('JobOrders'), 'joborders')
  assert.equal(normalizeArchiveEndpoint('job_order'), 'joborders')
  assert.equal(normalizeArchiveEndpoint('ServiceOrders'), 'serviceorders')
  assert.equal(normalizeArchiveEndpoint('service_order'), 'serviceorders')

  assert.equal(getArchivedFieldSet('BillingDetails').size, 0)
  assert.equal(getArchivedFieldSet('Payments').size, 0)
  assert.equal(getArchivedFieldSet('Users').size, 0)
  assert.equal(isArchivedFormField('BillingDetails', 'priorityLevel'), false)
  assert.ok(ARCHIVED_FORM_FIELDS_BY_ENDPOINT.applications.size > 0)
  assert.ok(ARCHIVED_FORM_FIELDS_BY_ENDPOINT.joborders.size > 0)
  assert.ok(ARCHIVED_FORM_FIELDS_BY_ENDPOINT.serviceorders.size > 0)
})

test('Applications form keeps AppSheet fields active and moves unused fields into bottom Archive section', () => {
  const { buildApplicationSections } = loadFormSectionBuilders()
  const formCols = EndpointColumns.Applications.filter(c => !['id', 'timestamp', 'modifiedBy', 'modifiedDate'].includes(c))
  const rawSections = buildApplicationSections(formCols)
  const partitioned = partitionArchivedFormSections(rawSections, 'Applications')

  const archived = partitioned.find(s => s.key === ARCHIVED_SECTION_KEY)
  assert.ok(archived, 'Applications must produce a bottom Archive section')
  assert.equal(archived.isArchived, true)
  assert.equal(archived.collapsible, true)
  assert.equal(partitioned[partitioned.length - 1].key, ARCHIVED_SECTION_KEY)

  const activeCols = partitioned.filter(s => !s.isArchived).flatMap(s => s.columns)
  assert.deepEqual(
    activeCols,
    [
      'firstName', 'middleName', 'lastName', 'emailAddress', 'mobileNumber', 'secondaryMobileNumber',
      'region', 'city', 'barangay', 'installationAddress', 'firstNearestLandmark', 'secondNearestLandmark',
      'desiredPlan', 'applicablePromo', 'termsAndConditionsAgreement', 'referredBy',
      'governmentValidId', 'secondGovernmentValidId', 'houseFrontPicture', 'documentPicture',
      'status', 'remarks'
    ]
  )
  assert.deepEqual(
    archived.columns,
    [
      'barangay1',
      'landmark',
      'applyingFor',
      'referrersAccountNumber',
      'proofOfBilling',
      'pictureofstatmentbillingfromotherprovider',
      'visitBy',
      'visitWith',
      'visitWithOther'
    ]
  )

  // Archived proofOfBilling must no longer form an either-or validation requirement with documentPicture
  const nonArchivedCols = filterNonArchivedColumns('Applications', formCols)
  assert.deepEqual(resolveEitherOrGroups('Applications', nonArchivedCols), [])
})

test('Job Orders form keeps AppSheet fields active and moves unused fields into bottom Archive section', () => {
  const { buildJobOrderSections } = loadFormSectionBuilders()
  const formCols = EndpointColumns.JobOrders.filter(
    c => !['id', 'timestamp', 'created', 'createdBy', 'lastModified', 'lastModifiedBy', 'modifiedBy', 'modifiedDate', 'rowVersion', 'remarks', 'statusRemarks'].includes(c)
  )
  const partitioned = partitionArchivedFormSections(buildJobOrderSections(formCols), 'JobOrders')

  const archived = partitioned.find(s => s.key === ARCHIVED_SECTION_KEY)
  assert.ok(archived, 'JobOrders must produce a bottom Archive section')
  assert.equal(partitioned[partitioned.length - 1].key, ARCHIVED_SECTION_KEY)

  const activeCols = partitioned.filter(s => !s.isArchived).flatMap(s => s.columns)
  for (const expectedActive of [
    'firstName', 'middleInitial', 'lastName', 'contactNumber', 'secondContactNumber',
    'applicantEmailAddress', 'referredBy', 'addressCoordinates', 'region', 'city', 'barangay',
    'address', 'planId', 'contractTemplate', 'contractLink', 'provider', 'connectionType',
    'routerModel', 'modemRouterSN', 'username', 'ip', 'lcpId', 'napId', 'portId', 'vlanId',
    'status', 'onsiteStatus', 'dateInstalled', 'usageType', 'visitBy', 'visitWith', 'visitWithOther',
    'assignedEmail', 'onsiteRemarks', 'itemName1', 'itemQuantity1', 'signedContractImage',
    'setupImage', 'boxReadingImage', 'routerReadingImage', 'clientSignature'
  ]) {
    assert.ok(activeCols.includes(expectedActive), `JobOrders active columns should include ${expectedActive}`)
  }

  for (const expectedArchived of [
    'accountNo', 'emailAddress', 'referrersAccountNumber', 'location', 'installationLandmark',
    'installationFee', 'billingDay', 'preferredDay', 'billingStatus', 'lcpnapId', 'lcpnapportId',
    'verifiedBy', 'startTimeStamp', 'endTimeStamp', 'duration', 'renter', 'usernameStatus',
    'externalId', 'applicationId', 'applicationIdValue', 'joRemarks', 'houseFront',
    'speedtestImage', 'portLabelImage'
  ]) {
    assert.ok(archived.columns.includes(expectedArchived), `JobOrders Archive section should include ${expectedArchived}`)
    assert.equal(activeCols.includes(expectedArchived), false, `JobOrders active sections must exclude ${expectedArchived}`)
  }
})

test('Service Orders form keeps AppSheet fields active, drops empty location section, and places Archive before Audit', () => {
  const { buildServiceOrderSections } = loadFormSectionBuilders()
  const viewCols = [...EndpointColumns.ServiceOrders, 'region']
  const formCols = viewCols.filter(c => !['id', 'createdDate', 'modifiedBy', 'modifiedDate', 'techModifiedDate'].includes(c))

  const partitionedForm = partitionArchivedFormSections(buildServiceOrderSections(formCols), 'ServiceOrders')
  assert.equal(partitionedForm.some(s => s.key === 'location'), false, 'Empty location section must be dropped from ServiceOrders active form')
  const archived = partitionedForm.find(s => s.key === ARCHIVED_SECTION_KEY)
  assert.ok(archived, 'ServiceOrders must produce a bottom Archive section')
  assert.equal(partitionedForm[partitionedForm.length - 1].key, ARCHIVED_SECTION_KEY)

  const activeCols = partitionedForm.filter(s => !s.isArchived).flatMap(s => s.columns)
  for (const expectedActive of [
    'accountNumber', 'dateInstalled', 'fullName', 'contactNumber', 'emailAddress',
    'plan', 'provider', 'username', 'connectionType', 'routerModel', 'routerModemSN',
    'lcp', 'nap', 'port', 'vlan', 'supportStatus', 'concern', 'connectionRemarks',
    'repairCategory', 'assignedEmail', 'supportRemarks', 'visitStatus', 'visitBy', 'visitWith',
    'visitWithOthers', 'visitRemarks', 'serviceCharge', 'newPLAN', 'newRouterModemSN',
    'newLCP', 'newNAP', 'newPORT', 'newVLAN', 'itemName1', 'itemQuantity1',
    'clientSignature', 'image1', 'image2', 'image3'
  ]) {
    assert.ok(activeCols.includes(expectedActive), `ServiceOrders active columns should include ${expectedActive}`)
  }

  for (const expectedArchived of [
    'addressCoordinates', 'region', 'city', 'barangay', 'address', 'priorityLevel',
    'requestedBy', 'userEmail', 'assignedBy', 'assignedDate', 'startTimestamp', 'stopTimestamp',
    'duration', 'pulloutRouterModel', 'pulloutRouterModelSN', 'pulloutCPESN', 'pulloutRemarks',
    'itemName', 'itemQuantity', 'houseFrontPicture'
  ]) {
    assert.ok(archived.columns.includes(expectedArchived), `ServiceOrders Archive section should include ${expectedArchived}`)
    assert.equal(activeCols.includes(expectedArchived), false, `ServiceOrders active sections must exclude ${expectedArchived}`)
  }
  assert.equal(isArchivedFormField('ServiceOrders', 'techModifiedDate'), true)

  const partitionedView = partitionArchivedFormSections(buildServiceOrderSections(viewCols, { includeAudit: true }), 'ServiceOrders')
  assert.deepEqual(
    partitionedView.slice(-2).map(s => s.key),
    [ARCHIVED_SECTION_KEY, 'audit'],
    'View Details should place Archive section immediately before System Metadata & Audit Trail'
  )
})

test('partitionArchivedFormSections leaves unrelated endpoints unchanged', () => {
  const sample = [{ key: 'customer', title: 'Customer', columns: ['accountNo', 'fullName', 'billingDay'] }]
  assert.equal(partitionArchivedFormSections(sample, 'BillingDetails'), sample)
  assert.equal(partitionArchivedFormSections(sample, 'Payments'), sample)
})

test('DynamicApiTable.vue wires formFieldArchive, disabled Create/Edit states, collapsible headers, and clean Quick Fields', () => {
  assert.ok(activeScript.includes("from '../utils/formFieldArchive'"))
  assert.ok(activeScript.includes('function isArchivedField(col)'))
  assert.ok(activeScript.includes('function isFieldDisabledInCreate(col)'))
  assert.ok(activeScript.includes('if (isArchivedFormField(props.endpoint, col)) return true'))
  assert.ok(activeScript.includes('if (isArchivedFormField(props.endpoint, col)) return false'))
  assert.ok(activeScript.includes('filterNonArchivedColumns(props.endpoint, formColumns.value)'))
  assert.ok(activeScript.includes('partitionArchivedFormSections(buildApplicationSections('))
  assert.ok(activeScript.includes('partitionArchivedFormSections(buildJobOrderSections('))
  assert.ok(activeScript.includes('partitionArchivedFormSections(buildServiceOrderSections('))
  assert.ok(activeScript.includes("resetArchivedSectionState('create')"))
  assert.ok(activeScript.includes("resetArchivedSectionState('view')"))
  assert.ok(activeScript.includes("resetArchivedSectionState('edit')"))
  assert.ok(activeScript.includes("['barangay2', 'userEmail'].forEach"))

  // Verify DEFAULT_PINNED_FIELDS no longer defaults archived fields
  const pinnedMatch = activeScript.match(/const DEFAULT_PINNED_FIELDS = \{([\s\S]*?)\}/)
  assert.ok(pinnedMatch, 'DEFAULT_PINNED_FIELDS must exist')
  assert.equal(pinnedMatch[1].includes('installationFee'), false)
  assert.equal(pinnedMatch[1].includes('billingDay'), false)
  assert.equal(pinnedMatch[1].includes('priorityLevel'), false)

  // Verify template bindings for collapsible Archive cards and disabled Create/Edit controls
  assert.ok(activeTemplate.includes("toggleSectionCollapse('create', sec)"))
  assert.ok(activeTemplate.includes("toggleSectionCollapse('view', sec)"))
  assert.ok(activeTemplate.includes("toggleSectionCollapse('edit', sec)"))
  assert.ok(activeTemplate.includes(':disabled="isSectionCollapsible(sec)"'))
  assert.ok(activeTemplate.includes(':disabled="isFieldDisabledInCreate(col)"'))
  assert.ok(activeTemplate.includes(':readonly="isFieldDisabledInEdit(col)"'))
  assert.equal((activeTemplate.match(/v-if="!isJobOrderEndpoint"/g) || []).length, 3)
})
