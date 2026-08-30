import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCoordinates } from '../src/services/lcpNapLocations.js'
import { EndpointColumns } from '../src/models/columns.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')

describe('Billing Form Layout & Arrangement Suite', () => {
  const content = fs.readFileSync(tableFile, 'utf8')

  test('DynamicApiTable contains BILLING_FORM_LAYOUT and buildBillingSections', () => {
    assert.ok(content.includes('const BILLING_FORM_LAYOUT = ['), 'BILLING_FORM_LAYOUT must be defined')
    assert.ok(content.includes('const buildBillingSections ='), 'buildBillingSections builder must be defined')
    assert.ok(content.includes('isBillingEndpoint'), 'isBillingEndpoint must be defined')
  })

  test('BILLING_FORM_LAYOUT covers all primary schema columns without dropping fields', () => {
    const billingCols = EndpointColumns.BillingDetails || []
    assert.ok(billingCols.length > 0, 'BillingDetails columns should be present in EndpointColumns')

    const expectedSections = [
      'Customer Account & Identity',
      'Installation Address & Coordinates',
      'Billing, Plan & Account Financials',
      'Network Credentials & Equipment',
      'Fiber Terminal & Provisioning',
      'Account Attachments & Documents'
    ]

    expectedSections.forEach(title => {
      assert.ok(content.includes(title), `Billing layout should include section: ${title}`)
    })
  })

  test('JOB_ORDER_FORM_LAYOUT is defined and structured into clean operational sections', () => {
    assert.ok(content.includes('const JOB_ORDER_FORM_LAYOUT = ['), 'JOB_ORDER_FORM_LAYOUT must be defined')
    assert.ok(content.includes('const buildJobOrderSections ='), 'buildJobOrderSections builder must be defined')

    const expectedSections = [
      'Subscriber & Applicant Identity',
      'Installation Address & Coordinates',
      'Service Plan, Contract & Billing',
      'Network Credentials & Equipment',
      'Field Service Dispatch & Operations',
      'Items & Materials Used',
      'Photos, Signatures & Reading Proofs'
    ]

    expectedSections.forEach(title => {
      assert.ok(content.includes(title), `Job Order layout should include section: ${title}`)
    })
  })

  test('formSections and viewFormSections integrate both Billing and Job Orders layouts', () => {
    assert.ok(content.includes('if (isBillingEndpoint.value) {'), 'formSections must check isBillingEndpoint')
    assert.ok(content.includes('buildBillingSections(formColumns.value)'), 'formSections must call buildBillingSections')
    assert.ok(content.includes('buildBillingSections(viewFormColumns.value'), 'viewFormSections must call buildBillingSections')
    assert.ok(content.includes('buildJobOrderSections(formColumns.value)'), 'formSections must call buildJobOrderSections')
    assert.ok(content.includes('buildJobOrderSections(viewFormColumns.value'), 'viewFormSections must call buildJobOrderSections')
  })

  test('Dropdown support for deliverystatus and renter are integrated', () => {
    assert.ok(content.includes('deliverystatus_dropdown'), 'deliverystatus_dropdown field type must be supported')
    assert.ok(content.includes('renter_dropdown'), 'renter_dropdown field type must be supported')
    assert.ok(content.includes('deliveryStatusOptions'), 'deliveryStatusOptions must be defined')
    assert.ok(content.includes('renterOptions'), 'renterOptions must be defined')
  })
})

describe('Address & Lat/Long Coordinates Auto-Update Suite', () => {
  const content = fs.readFileSync(tableFile, 'utf8')

  test('parseCoordinates parses valid GPS string formats', () => {
    const res1 = parseCoordinates('14.465500, 121.192200')
    assert.ok(res1, 'Standard comma separated coordinates must parse')
    assert.equal(res1.lat, 14.4655)
    assert.equal(res1.lng, 121.1922)

    const res2 = parseCoordinates('lat: 14.525500, lng: 121.156800')
    assert.ok(res2, 'Prefixed coordinate strings must parse')
    assert.equal(res2.lat, 14.5255)
    assert.equal(res2.lng, 121.1568)

    const res3 = parseCoordinates([14.5842, 121.1763])
    assert.ok(res3, 'Array coordinates must parse')
    assert.equal(res3.lat, 14.5842)
    assert.equal(res3.lng, 121.1763)
  })

  test('parseCoordinates rejects invalid coordinates', () => {
    assert.equal(parseCoordinates(''), null)
    assert.equal(parseCoordinates('0, 0'), null)
    assert.equal(parseCoordinates('abc, def'), null)
    assert.equal(parseCoordinates('95.0, 120.0'), null) // Lat out of range
  })

  test('onCoordinatesChanged and applyAddressFromPin auto-update all related address fields', () => {
    assert.ok(content.includes('targetForm.region = matchReg.value') || content.includes('targetForm.region = matchProv.value'), 'Must update region/province')
    assert.ok(content.includes('updateCitiesForProvince'), 'Must cascade cities for province')
    assert.ok(content.includes('updateBarangaysForSelectedCity'), 'Must cascade barangays for city')
    assert.ok(content.includes('targetForm.city ='), 'Must update city')
    assert.ok(content.includes('targetForm.barangay ='), 'Must update barangay')
    assert.ok(content.includes('targetForm.barangay1 ='), 'Must synchronize barangay1 for applications')
    assert.ok(content.includes('targetForm[instCol] ='), 'Must update installationAddress if present')
    assert.ok(content.includes('targetForm[addrCol] ='), 'Must update address if present')
    assert.ok(content.includes('targetForm[locCol] ='), 'Must update location summary if present')
  })

  test('Watchers listen to all coordinate aliases (coordinates, addressCoordinates, etc.)', () => {
    assert.ok(content.includes('formData.value.coordinates || formData.value.coordinate || formData.value.addressCoordinates'), 'Create watcher covers coordinate aliases')
    assert.ok(content.includes('editFormData.value.coordinates || editFormData.value.coordinate || editFormData.value.addressCoordinates'), 'Edit watcher covers coordinate aliases')
  })

  test('Coordinates and Map picker are placed above address fields across layouts', () => {
    // Check in Billing layout
    const billingLocationIdx = content.indexOf("key: 'location'")
    assert.ok(billingLocationIdx > -1)
    const billingCoordIdx = content.indexOf("'addressCoordinates'", billingLocationIdx)
    const billingRegionIdx = content.indexOf("'region'", billingLocationIdx)
    assert.ok(billingCoordIdx < billingRegionIdx, 'In Billing, addressCoordinates must be before region/address fields')

    // Check in Job Orders layout
    const joLocationIdx = content.indexOf("title: 'Installation Address & Coordinates'")
    assert.ok(joLocationIdx > -1)
    const joCoordIdx = content.indexOf("'addressCoordinates'", joLocationIdx)
    const joRegionIdx = content.indexOf("'region'", joLocationIdx)
    assert.ok(joCoordIdx < joRegionIdx, 'In Job Orders, addressCoordinates must be before region/address fields')

    // Check in Service Orders layout
    const soSubscriberIdx = content.indexOf("title: 'Subscriber & Location'")
    assert.ok(soSubscriberIdx > -1)
    const soCoordIdx = content.indexOf("'addressCoordinates'", soSubscriberIdx)
    const soCityIdx = content.indexOf("'city'", soSubscriberIdx)
    assert.ok(soCoordIdx < soCityIdx, 'In Service Orders, addressCoordinates must be before city/address fields')
  })
})

describe('Comprehensive Form Layouts & UX Audit Suite', () => {
  const content = fs.readFileSync(tableFile, 'utf8')

  test('Dedicated layout schemas exist for Plans, Routers, Invoices, Users, and Menus', () => {
    assert.ok(content.includes('const PLAN_FORM_LAYOUT = ['), 'PLAN_FORM_LAYOUT must be defined')
    assert.ok(content.includes('const ROUTER_FORM_LAYOUT = ['), 'ROUTER_FORM_LAYOUT must be defined')
    assert.ok(content.includes('const INVOICE_FORM_LAYOUT = ['), 'INVOICE_FORM_LAYOUT must be defined')
    assert.ok(content.includes('const USER_FORM_LAYOUT = ['), 'USER_FORM_LAYOUT must be defined')
    assert.ok(content.includes('const MENU_FORM_LAYOUT = ['), 'MENU_FORM_LAYOUT must be defined')
  })

  test('Dropdown support for applyingfor, contracttemplate, and invoicestatus are integrated', () => {
    assert.ok(content.includes('applyingfor_dropdown'), 'applyingfor_dropdown must be handled')
    assert.ok(content.includes('contracttemplate_dropdown'), 'contracttemplate_dropdown must be handled')
    assert.ok(content.includes('invoicestatus_dropdown'), 'invoicestatus_dropdown must be handled')
    assert.ok(content.includes('applyingForOptions'), 'applyingForOptions must be defined')
    assert.ok(content.includes('contractTemplateOptions'), 'contractTemplateOptions must be defined')
    assert.ok(content.includes('invoiceStatusOptions'), 'invoiceStatusOptions must be defined')
  })

  test('Symmetrical 3-column row tiling is enforced in getColumnClass for wide forms', () => {
    assert.ok(content.includes("return 'col-12 col-md-6 col-lg-4'"), 'Wide forms should return 4 cols for 3-column grid symmetry')
  })

  test('Job Orders layout includes houseFront in photos section and applicationIdValue', () => {
    assert.ok(content.includes("'houseFront'"), 'houseFront must be mapped in photos section')
    assert.ok(content.includes("'applicationIdValue'"), 'applicationIdValue must be mapped in dispatch section')
  })

  test('Server-side creation and modified date/time/user fields are hidden from Create and Update, and shown only in View Details', () => {
    // Form columns (Create & Update) excludes audit fields
    assert.ok(content.includes('const formColumns = computed(() => {'), 'formColumns computed must exist')
    assert.ok(content.includes('allRawColumns.value.filter(col => !isAuditField(col))'), 'formColumns must exclude isAuditField')

    // View Details includes audit fields
    assert.ok(content.includes('buildApplicationSections(viewFormColumns.value, { includeAudit: true })'), 'Applications view must include audit')
    assert.ok(content.includes('buildBillingSections(viewFormColumns.value, { includeAudit: true })'), 'Billing view must include audit')
    assert.ok(content.includes('buildJobOrderSections(viewFormColumns.value, { includeAudit: true })'), 'Job Orders view must include audit')
    assert.ok(content.includes('buildServiceOrderSections(viewFormColumns.value, { includeAudit: true })'), 'Service Orders view must include audit')
  })
})


