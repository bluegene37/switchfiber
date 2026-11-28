// Gene - Nov, 28, 2026: Comprehensive unit and wiring tests for centralized /api/Status integration and multi-table inline quick-status editing
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  normalizeQuickStatusEndpoint,
  resolveStatusTypeCodeForColumn,
  isQuickStatusEditableCell,
  normalizeQuickStatusValue,
  mergeStatusOptionsWithData,
  buildStatusFilterTabs,
  formatQuickStatusTitle,
  formatGenericQuickStatusSubtitle,
  applyQuickStatusLocally,
  buildJobOrderQuickStatusFormData,
  buildPaymentQuickStatusPayload,
  buildInvoiceQuickStatusPayload,
  buildDiscountQuickStatusPayload,
  buildInventoryLogQuickStatusPayload,
  buildQuickStatusUpdateRequest
} from '../src/utils/tableQuickStatus.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

describe('Status Type Resolution & Editable Cell Guardrails', () => {
  test('resolveStatusTypeCodeForColumn maps every writable status column across endpoints and rejects non-status columns', () => {
    assert.equal(resolveStatusTypeCodeForColumn('Applications', 'status'), 'APPLICATION')
    assert.equal(resolveStatusTypeCodeForColumn('JobOrders', 'status'), 'JOB_ORDER')
    assert.equal(resolveStatusTypeCodeForColumn('JobOrders', 'onsiteStatus'), 'JO_ONSITE')
    assert.equal(resolveStatusTypeCodeForColumn('JobOrders', 'billingStatus'), 'BILLING')
    assert.equal(resolveStatusTypeCodeForColumn('ServiceOrders', 'supportStatus'), 'SO_SUPPORT')
    assert.equal(resolveStatusTypeCodeForColumn('ServiceOrders', 'visitStatus'), 'SO_VISIT')
    assert.equal(resolveStatusTypeCodeForColumn('BillingDetails', 'status'), 'BILLING')
    assert.equal(resolveStatusTypeCodeForColumn('BillingDetails', 'billingStatus'), 'BILLING')
    assert.equal(resolveStatusTypeCodeForColumn('BillingDetails', 'deliveryStatus'), 'DELIVERY')
    assert.equal(resolveStatusTypeCodeForColumn('Invoices', 'status'), 'INVOICE')
    assert.equal(resolveStatusTypeCodeForColumn('Invoices', 'invoiceStatus'), 'INVOICE')
    assert.equal(resolveStatusTypeCodeForColumn('BillingStatements', 'status'), 'INVOICE')
    assert.equal(resolveStatusTypeCodeForColumn('Payments', 'status'), 'PAYMENT')
    assert.equal(resolveStatusTypeCodeForColumn('Discounts', 'discountStatus'), 'DISCOUNT')
    assert.equal(resolveStatusTypeCodeForColumn('Discounts', 'status'), 'DISCOUNT')
    assert.equal(resolveStatusTypeCodeForColumn('InventoryLogs', 'status'), 'INVENTORY_LOG')

    // Excluded non-status *status* fields must resolve to ''
    for (const excluded of ['statusRemarks', 'usernameStatus', 'responseStatus', 'emailStatus', 'smsStatus']) {
      assert.equal(resolveStatusTypeCodeForColumn('JobOrders', excluded), '', `${excluded} must not map to a Status type`)
      assert.equal(resolveStatusTypeCodeForColumn('Invoices', excluded), '', `${excluded} must not map to a Status type`)
    }
  })

  test('isQuickStatusEditableCell allows writable tables and blocks readOnly, RadiusUser, Logs, Status maintenance, and non-status cols', () => {
    assert.equal(normalizeQuickStatusEndpoint('/ServiceOrders/'), 'serviceorders')

    // Editable cells
    const editableCases = [
      ['Applications', 'status'],
      ['JobOrders', 'status'],
      ['JobOrders', 'onsiteStatus'],
      ['JobOrders', 'billingStatus'],
      ['ServiceOrders', 'supportStatus'],
      ['ServiceOrders', 'visitStatus'],
      ['BillingDetails', 'status'],
      ['BillingDetails', 'billingStatus'],
      ['BillingDetails', 'deliveryStatus'],
      ['Invoices', 'status'],
      ['Invoices', 'invoiceStatus'],
      ['Payments', 'status'],
      ['Discounts', 'discountStatus'],
      ['InventoryLogs', 'status']
    ]
    for (const [endpoint, col] of editableCases) {
      assert.equal(isQuickStatusEditableCell({ endpoint, col, readOnly: false }), true, `${endpoint}.${col} should be editable`)
      assert.equal(isQuickStatusEditableCell({ endpoint, col, readOnly: true }), false, `${endpoint}.${col} must block readOnly`)
    }

    // Blocked tables and excluded columns
    const blockedCases = [
      ['RadiusUser', 'status'],
      ['RadiusUser', 'billingStatus'],
      ['RadiusUser', 'deliveryStatus'],
      ['LogTrail', 'responseStatus'],
      ['LogTrail', 'status'],
      ['LogError', 'responseStatus'],
      ['Status', 'status'],
      ['Statuses', 'status'],
      ['JobOrders', 'statusRemarks'],
      ['JobOrders', 'usernameStatus'],
      ['Invoices', 'emailStatus'],
      ['Invoices', 'smsStatus'],
      ['Plans', 'status'],
      ['Users', 'status']
    ]
    for (const [endpoint, col] of blockedCases) {
      assert.equal(isQuickStatusEditableCell({ endpoint, col, readOnly: false }), false, `${endpoint}.${col} must remain non-clickable`)
    }
  })
})

describe('Option Normalization, Filter Merging & Tab Builders', () => {
  test('normalizeQuickStatusValue aligns casing/token variants to /api/Status values and preserves unknown legacy statuses', () => {
    const joOpts = [
      { label: 'In Progress', value: 'inprogress' },
      { label: 'Scheduled', value: 'Scheduled' },
      { label: 'For Confirmation', value: 'For Confirmation' }
    ]
    assert.equal(normalizeQuickStatusValue('Inprogress', joOpts, 'JOB_ORDER'), 'inprogress')
    assert.equal(normalizeQuickStatusValue('In Progress', joOpts, 'JOB_ORDER'), 'inprogress')
    assert.equal(normalizeQuickStatusValue('for confirmation', joOpts, 'JOB_ORDER'), 'For Confirmation')
    assert.equal(normalizeQuickStatusValue('Legacy Hold', joOpts, 'JOB_ORDER'), 'Legacy Hold')
    assert.equal(normalizeQuickStatusValue('', joOpts, 'JOB_ORDER'), '')

    // Application canonical mapping when option missing from list
    assert.equal(normalizeQuickStatusValue('nofacility', [], 'APPLICATION'), 'No Facility')
  })

  test('mergeStatusOptionsWithData prioritizes /api/Status options, deduplicates by token, and keeps extra live data statuses', () => {
    const apiOpts = [
      { label: 'In Progress', value: 'inprogress' },
      { label: 'Scheduled', value: 'Scheduled' }
    ]
    const merged = mergeStatusOptionsWithData(apiOpts, ['Inprogress', 'In Progress', 'Legacy Applied', ''], 'JOB_ORDER')
    assert.deepEqual(merged, [
      { label: 'In Progress', value: 'inprogress' },
      { label: 'Scheduled', value: 'Scheduled' },
      { label: 'Legacy Applied', value: 'Legacy Applied' }
    ])

    // Empty API falls back to saved JSON catalog for the typeCode
    const fallbackMerged = mergeStatusOptionsWithData([], ['Custom Row Value'], 'SO_VISIT')
    assert.ok(fallbackMerged.some(o => o.value === 'inprogress' && o.label === 'In Progress'))
    assert.ok(fallbackMerged.some(o => o.value === 'Custom Row Value'))
  })

  test('buildStatusFilterTabs builds All tab + /api/Status tabs + missing vocabulary statuses without duplicating tokens', () => {
    const tabs = buildStatusFilterTabs({
      allLabel: 'All Service Orders',
      apiOptions: [
        { label: 'In Progress', value: 'inprogress' },
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'Done', value: 'Done' }
      ],
      vocabulary: [
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Awaiting Parts', value: 'Awaiting Parts' }
      ],
      tabMetaByToken: {
        inprogress: { icon: 'pi-clock' },
        scheduled: { icon: 'pi-calendar' },
        done: { icon: 'pi-check-circle' }
      }
    })

    assert.deepEqual(tabs, [
      { id: 'all', label: 'All Service Orders', value: '', icon: 'pi-list' },
      { id: 'inprogress', label: 'In Progress', value: 'inprogress', icon: 'pi-clock' },
      { id: 'scheduled', label: 'Scheduled', value: 'Scheduled', icon: 'pi-calendar' },
      { id: 'done', label: 'Done', value: 'Done', icon: 'pi-check-circle' },
      { id: 'awaitingparts', label: 'Awaiting Parts', value: 'Awaiting Parts', icon: '' }
    ])
  })

  test('formatQuickStatusTitle and formatGenericQuickStatusSubtitle format readable popover headers across entities', () => {
    assert.equal(formatQuickStatusTitle('visitStatus'), 'Update Visit Status')
    assert.equal(formatQuickStatusTitle('supportStatus'), 'Update Support Status')
    assert.equal(formatQuickStatusTitle('onsiteStatus'), 'Update Onsite Status')
    assert.equal(formatQuickStatusTitle('billingStatus'), 'Update Billing Status')
    assert.equal(formatQuickStatusTitle('deliveryStatus'), 'Update Delivery Status')
    assert.equal(formatQuickStatusTitle('discountStatus'), 'Update Discount Status')
    assert.equal(formatQuickStatusTitle('invoiceStatus'), 'Update Invoice Status')
    assert.equal(formatQuickStatusTitle('status'), 'Update Status')

    assert.equal(
      formatGenericQuickStatusSubtitle('Applications', { id: 5, applicationid: 'APP-5', firstName: 'Ana', lastName: 'Reyes' }),
      '#APP-5 • Ana Reyes'
    )
    assert.equal(
      formatGenericQuickStatusSubtitle('Payments', { id: 9, transactionID: 'TXN999', fullName: 'Juan Cruz' }),
      '#TXN999 • Juan Cruz'
    )
    assert.equal(
      formatGenericQuickStatusSubtitle('BillingDetails', { id: 12, accountNo: '2026001', fullName: 'Maria Santos' }),
      '#2026001 • Maria Santos'
    )
    assert.equal(
      formatGenericQuickStatusSubtitle('InventoryLogs', { id: 44, itemId: 'ONT-01', requestedBy: 'Tech One' }),
      '#44 • ONT-01 • Tech One'
    )
  })

  test('applyQuickStatusLocally updates only the target row status and audit fields immutably', () => {
    const rows = [
      { id: 1, visitStatus: 'Scheduled', modifiedBy: '1' },
      { id: 2, visitStatus: 'Done', modifiedBy: '1' }
    ]
    const next = applyQuickStatusLocally(rows, 1, 'visitStatus', 'In Progress', {
      modifiedBy: '8',
      modifiedDate: '2026-11-28T11:30:00.000Z'
    })
    assert.equal(rows[0].visitStatus, 'Scheduled')
    assert.equal(next[0].visitStatus, 'In Progress')
    assert.equal(next[0].modifiedBy, '8')
    assert.strictEqual(next[1], rows[1])
  })
})

describe('Per-Endpoint Quick-Status PUT Builders', () => {
  test('Applications quick-status builds multipart FormData preserving fields and omitting Created/File/Remove keys', () => {
    const { payload, config, effectiveStatus } = buildQuickStatusUpdateRequest({
      endpoint: 'Applications',
      record: {
        id: 101,
        firstName: 'Lito',
        lastName: 'Lapid',
        mobileNumber: '9171234567',
        status: 'Schedule',
        termsAndConditionsAgreement: true,
        createdBy: '99'
      },
      recordId: 101,
      col: 'status',
      nextStatus: 'Confirmed',
      context: { loggedInUserId: '5', currentUserEmail: 'ops@switchfiber.com', nowIso: '2026-11-28T03:00:00.000Z' }
    })

    assert.equal(payload instanceof FormData, true)
    assert.deepEqual(config, {})
    assert.equal(effectiveStatus, 'Confirmed')
    assert.equal(payload.get('Status'), 'Confirmed')
    assert.equal(payload.get('ModifiedBy'), '5')
    assert.equal(payload.has('CreatedBy'), false)
  })

  test('JobOrders quick-status updates status/onsiteStatus/billingStatus as FormData while preserving existing photos', () => {
    const joRecord = {
      id: 202,
      status: 'Inprogress',
      onsiteStatus: 'InProgress',
      billingStatus: 'Pending',
      firstName: 'Romy',
      lastName: 'Puyot',
      preferredDay: '',
      applicationId: 'APP-202',
      billingDay: '',
      installationFee: null,
      createdBy: 3,
      createdDate: '2026-10-10T08:00:00.000Z'
    }

    const { payload, effectiveStatus } = buildQuickStatusUpdateRequest({
      endpoint: 'JobOrders',
      record: joRecord,
      recordId: 202,
      col: 'onsiteStatus',
      nextStatus: 'Done',
      context: {
        loggedInUserId: '9',
        numericUserId: 9,
        existingImages: {
          setupImage: 'data:image/png;base64,iVBORw0KGgo='
        },
        buildJobOrderPayload: (merged) => ({ ...merged, status: 'Inprogress', modifiedBy: '9' }),
        applyJobOrderCreationAudit: (p, uid) => { p.modifiedBy = String(uid) }
      }
    })

    assert.equal(payload instanceof FormData, true)
    assert.equal(effectiveStatus, 'Done')
    assert.equal(payload.get('onsiteStatus'), 'Done')
    assert.equal(payload.get('status'), 'Inprogress')
    assert.equal(payload.get('createdBy'), '3')
    assert.equal(payload.get('modifiedBy'), '9')
    assert.equal(payload.has('billingDay'), false, 'blank numeric billingDay must be omitted')
    assert.equal(payload.has('installationFee'), false, 'null installationFee must be omitted')
    const setupFile = payload.get('SetupImage')
    assert.ok(setupFile && typeof setupFile === 'object', 'existing photo must be preserved as Blob')

    // Direct helper check for SpeedtestImage string pass-through
    const speedForm = buildJobOrderQuickStatusFormData({
      joPayload: { id: 1, speedtestImage: 'speed.png' },
      existingImages: {}
    })
    assert.equal(speedForm.get('speedtestImage'), 'speed.png')
  })

  test('ServiceOrders quick-status updates visitStatus/supportStatus as FormData while preserving createdDate and photos', () => {
    const { payload, effectiveStatus } = buildQuickStatusUpdateRequest({
      endpoint: 'ServiceOrders',
      record: {
        id: 303,
        accountNumber: '2026001',
        fullName: 'Elena Cruz',
        supportStatus: 'Pending',
        visitStatus: 'Scheduled',
        createdDate: '2026-11-01T09:00:00.000Z'
      },
      recordId: 303,
      col: 'visitStatus',
      nextStatus: 'Done',
      context: {
        loggedInUserId: '12',
        authUserEmail: 'tech@switchfiber.com',
        nowIso: '2026-11-28T03:00:00.000Z',
        existingImages: {
          image1: 'data:image/png;base64,iVBORw0KGgo='
        },
        isAuditField: (k) => ['createdby', 'createddate', 'modifiedby', 'modifieddate'].includes(k.toLowerCase()),
        getFieldType: () => 'text'
      }
    })

    assert.equal(payload instanceof FormData, true)
    assert.equal(effectiveStatus, 'Done')
    assert.equal(payload.get('visitStatus'), 'Done')
    assert.equal(payload.get('supportStatus'), 'Pending')
    assert.equal(payload.get('createdDate'), '2026-11-01T09:00:00.000Z')
    assert.equal(payload.get('modifiedBy'), '12')
    assert.equal(payload.get('userEmail'), 'tech@switchfiber.com')
    assert.ok(payload.get('Image1'), 'existing Image1 must be preserved as Blob')
  })

  test('BillingDetails quick-status updates status/billingStatus/deliveryStatus without clobbering sibling statuses', () => {
    const rec = {
      id: 404,
      accountNo: '2026005',
      status: 'Active',
      billingStatus: 'Pending',
      deliveryStatus: 'Pending'
    }
    const { payload, effectiveStatus } = buildQuickStatusUpdateRequest({
      endpoint: 'BillingDetails',
      record: rec,
      recordId: 404,
      col: 'deliveryStatus',
      nextStatus: 'Delivered',
      context: {
        loggedInUserId: '4',
        buildBillingPayload: (merged, _mode, uid) => ({
          ...merged,
          modifiedBy: String(uid)
        })
      }
    })

    assert.equal(effectiveStatus, 'Delivered')
    assert.equal(payload.deliveryStatus, 'Delivered')
    assert.equal(payload.status, 'Active')
    assert.equal(payload.billingStatus, 'Pending')
    assert.equal(payload.modifiedBy, '4')
  })

  test('Payments quick-status preserves 26-digit transactionID, sends query param, parses decimal amount, and strips created audit', () => {
    const txn = '20261128000000000000001234'
    const { payload, config } = buildPaymentQuickStatusPayload({
      record: {
        id: 505,
        transactionID: txn,
        accountNo: '2026009',
        receivedPayment: '1,499.00',
        paymentDate: '2026-11-28',
        plan: 'Fiber 1499',
        status: 'Pending',
        createdBy: '1',
        createdDate: '2026-11-01T00:00:00.000Z'
      },
      recordId: 505,
      statusKey: 'status',
      nextStatus: 'Verified',
      loggedInUserId: '7',
      processedBy: 'Gene Medel',
      currentUserEmail: 'cashier@switchfiber.com',
      localTimestamp: '2026-11-28T11:30:00.000'
    })

    assert.deepEqual(config, { params: { transactionid: txn } })
    assert.equal(payload.transactionID, txn)
    assert.equal(payload.status, 'Verified')
    assert.equal(payload.receivedPayment, 1499)
    assert.equal(payload.processedBy, 'Gene Medel')
    assert.equal(payload.modifiedBy, '7')
    assert.equal(payload.createdBy, undefined)
    assert.equal(payload.createdDate, undefined)

    assert.throws(
      () => buildPaymentQuickStatusPayload({ record: { id: 1 }, recordId: 1, nextStatus: 'Paid' }),
      /Account # is required/
    )
  })

  test('Invoices, Discounts, and InventoryLogs quick-status builders preserve schema rules and audit fields', () => {
    const inv = buildInvoiceQuickStatusPayload({
      record: { id: 606, invoiceNo: 'INV-606', invoiceStatus: 'Unpaid', lastModified: 'old', lastModifiedBy: 'old' },
      recordId: 606,
      statusKey: 'invoiceStatus',
      nextStatus: 'Paid',
      loggedInUserId: '6',
      currentUserEmail: 'billing@switchfiber.com',
      localTimestamp: '2026-11-28T11:30:00.000'
    })
    assert.equal(inv.payload.invoiceStatus, 'Paid')
    assert.equal(inv.payload.modifiedBy, '6')
    assert.equal(inv.payload.lastModified, undefined)

    const disc = buildDiscountQuickStatusPayload({
      record: { id: 707, fullName: 'Test Sub', discountStatus: 'Pending', createdBy: '2', createdDate: '2026-10-01T00:00:00.000Z' },
      recordId: 707,
      statusKey: 'discountStatus',
      nextStatus: 'Approved',
      loggedInUserId: '8',
      processedBy: 'Approver A',
      currentUserEmail: 'approver@switchfiber.com',
      localTimestamp: '2026-11-28T11:30:00.000'
    })
    assert.equal(disc.payload.discountStatus, 'Approved')
    assert.equal(disc.payload.createdBy, '2')
    assert.equal(disc.payload.createdDate, '2026-10-01T00:00:00.000Z')
    assert.equal(disc.payload.processedBy, 'Approver A')
    assert.equal(disc.payload.modifiedBy, '8')

    const log = buildInventoryLogQuickStatusPayload({
      record: { id: 808, itemId: 'ITEM-1', quantity: '3', requestedBy: 'Tech A', status: 'Pending', createdDate: '2026-11-15T10:00:00.000Z' },
      recordId: 808,
      nextStatus: 'Issued',
      userDisplayName: 'Admin'
    })
    assert.deepEqual(log.payload, {
      id: 808,
      itemId: 'ITEM-1',
      quantity: 3,
      requestedBy: 'Tech A',
      requestedWith: null,
      status: 'Issued',
      remarks: null,
      createdDate: '2026-11-15T10:00:00.000Z'
    })
  })
})

describe('Source Wiring Verification Across DynamicApiTable and List Views', () => {
  const tableSrc = read('src/components/DynamicApiTable.vue')
  const appViewSrc = read('src/views/ApplicationList.vue')
  const joViewSrc = read('src/views/JobOrderList.vue')
  const soViewSrc = read('src/views/ServiceOrderList.vue')

  test('DynamicApiTable wires statusStore-backed filters, INVOICE/DISCOUNT overlays, and multi-table quick-status', () => {
    assert.ok(tableSrc.includes('mergeStatusOptionsWithData'))
    assert.ok(tableSrc.includes('resolveStatusTypeCodeForColumn'))
    assert.ok(tableSrc.includes('isQuickStatusEditableCell'))
    assert.ok(tableSrc.includes('buildQuickStatusUpdateRequest'))
    assert.ok(tableSrc.includes("overlayApiStatusOptions(fallbackMapped, 'INVOICE')"))
    assert.ok(tableSrc.includes("overlayApiStatusOptions(fallbackMapped, 'DISCOUNT')"))
  })

  test('ApplicationList, JobOrderList, and ServiceOrderList wire /api/Status store and buildStatusFilterTabs', () => {
    for (const [name, src, typeCode] of [
      ['ApplicationList', appViewSrc, 'APPLICATION'],
      ['JobOrderList', joViewSrc, 'JOB_ORDER'],
      ['ServiceOrderList', soViewSrc, 'SO_VISIT']
    ]) {
      assert.ok(src.includes('useStatusStore'), `${name} must import/use useStatusStore`)
      assert.ok(src.includes(`statusStore.getOptions('${typeCode}')`), `${name} must read ${typeCode} options from statusStore`)
      assert.ok(src.includes('buildStatusFilterTabs'), `${name} must build statusTabs via buildStatusFilterTabs`)
      assert.ok(src.includes('statusStore.loadStatuses()'), `${name} must preload statuses on mount`)
    }
  })
})
