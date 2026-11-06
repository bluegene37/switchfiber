import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const tableSrc = fs.readFileSync(tableFile, 'utf8')
const apiFile = path.resolve(__dirname, '../src/services/api.js')
const apiSrc = fs.readFileSync(apiFile, 'utf8')

// Emulate helper logic from DynamicApiTable.vue
function getFieldType(col, endpoint = 'payments') {
  if (!col) return 'text'
  const lower = col.toLowerCase().replace(/_/g, '')
  const isPayment = ['payments', 'payment'].includes((endpoint || '').toLowerCase())

  if (isPayment) {
    if (lower === 'accountno') {
      return 'account_dropdown'
    }
    if (lower === 'transactionid') {
      return 'text'
    }
    if (lower === 'receivedpayment') {
      return 'currency'
    }
    if (lower === 'paymentdate' || lower === 'dateprocessed') {
      return 'date'
    }
    if (lower === 'image' || lower === 'fiberplan' || lower === 'plan') {
      return 'plan_dropdown'
    }
    if (lower === 'remarks' || lower === 'processedby') {
      return 'text'
    }
  }
  return 'text'
}

function sanitizePaymentPayload(payload) {
  const finalPayload = { ...payload }

  // 1. Account # validation
  if (finalPayload.accountNo !== undefined && finalPayload.accountNo !== null) {
    finalPayload.accountNo = String(finalPayload.accountNo).trim()
  }
  if (!finalPayload.accountNo) {
    throw new Error('Account # is required. Please select or enter a valid subscriber account from Billing Details.')
  }

  // 2. Format paymentDate as ISO string
  if (finalPayload.paymentDate instanceof Date) {
    finalPayload.paymentDate = finalPayload.paymentDate.toISOString()
  } else if (finalPayload.paymentDate) {
    const d = new Date(finalPayload.paymentDate)
    finalPayload.paymentDate = isNaN(d.getTime()) ? finalPayload.paymentDate : d.toISOString()
  } else {
    finalPayload.paymentDate = new Date().toISOString()
  }

  // 3. Decimal receivedPayment parsing
  if (finalPayload.receivedPayment === null || finalPayload.receivedPayment === undefined || finalPayload.receivedPayment === '') {
    finalPayload.receivedPayment = null
  } else {
    const cleanPaymentStr = String(finalPayload.receivedPayment).replace(/[^0-9.-]/g, '')
    const numVal = Number(cleanPaymentStr)
    finalPayload.receivedPayment = (!isNaN(numVal) && cleanPaymentStr !== '') ? numVal : null
  }

  // 4. String format for image and plan (never numeric)
  if (finalPayload.image && !finalPayload.plan) {
    finalPayload.plan = String(finalPayload.image)
    finalPayload.image = String(finalPayload.image)
  } else if (finalPayload.plan && !finalPayload.image) {
    finalPayload.image = String(finalPayload.plan)
    finalPayload.plan = String(finalPayload.plan)
  } else {
    if (finalPayload.image !== undefined && finalPayload.image !== null) {
      finalPayload.image = String(finalPayload.image)
    }
    if (finalPayload.plan !== undefined && finalPayload.plan !== null) {
      finalPayload.plan = String(finalPayload.plan)
    }
  }

  // 5. Sync remarks and processedBy
  if (finalPayload.remarks && !finalPayload.processedBy) {
    finalPayload.processedBy = String(finalPayload.remarks)
  } else if (finalPayload.processedBy && !finalPayload.remarks) {
    finalPayload.remarks = String(finalPayload.processedBy)
  }

  // 6. Delete empty/null transactionID
  if (!finalPayload.transactionID || !String(finalPayload.transactionID).trim()) {
    delete finalPayload.transactionID
  } else {
    finalPayload.transactionID = String(finalPayload.transactionID).trim()
  }

  // 7. Strip non-schema audit fields
  delete finalPayload.createdBy
  delete finalPayload.createdDate

  // 8. Ensure accountBalance is numeric
  if (finalPayload.accountBalance !== undefined && finalPayload.accountBalance !== null && finalPayload.accountBalance !== '') {
    finalPayload.accountBalance = Number(String(finalPayload.accountBalance).replace(/[^0-9.-]/g, '')) || 0
  }

  return finalPayload
}

describe('Payment API Create Audit & 400 Bad Request Prevention Suite', () => {
  test('getFieldType returns account_dropdown for accountNo on Payments endpoint', () => {
    assert.equal(getFieldType('accountNo', 'payments'), 'account_dropdown')
    assert.equal(getFieldType('accountno', 'payments'), 'account_dropdown')
    assert.equal(getFieldType('AccountNo', 'payments'), 'account_dropdown')
    assert.ok(
      tableSrc.includes("if (lower === 'accountno') {\n      return 'account_dropdown'"),
      'DynamicApiTable.vue must map accountno to account_dropdown for Payments'
    )
  })

  test('DynamicApiTable template renders Select with editable for account_dropdown in Create Dialog', () => {
    assert.ok(
      tableSrc.includes("v-else-if=\"getFieldType(col) === 'account_dropdown'\""),
      'DynamicApiTable.vue must render account_dropdown branch'
    )
    assert.ok(
      tableSrc.includes(":options=\"getAccountOptions(formData[col])\""),
      'Create modal must bind options to getAccountOptions'
    )
    assert.ok(
      tableSrc.includes("@change=\"onPaymentAccountChange($event.value)\""),
      'Create modal must hook @change to onPaymentAccountChange'
    )
    assert.ok(
      tableSrc.includes(':editable="true"'),
      'Select must support editable for typing or selecting'
    )
  })

  test('DynamicApiTable defines billingAccountsList and fetches BillingDetails for Payments', () => {
    assert.ok(
      tableSrc.includes('const billingAccountsList = ref([])'),
      'DynamicApiTable must define billingAccountsList reactive reference'
    )
    assert.ok(
      tableSrc.includes("const billingRes = await CrudService.list('BillingDetails')"),
      'fetchFormLookups must fetch BillingDetails when isPaymentEndpoint is active'
    )
    assert.ok(
      tableSrc.includes('const onPaymentAccountChange = (acctNo) => {'),
      'DynamicApiTable must define onPaymentAccountChange helper'
    )
  })

  test('DynamicApiTable auto-disables transactionID in Create modal with placeholder', () => {
    assert.ok(
      tableSrc.includes("(isPaymentEndpoint && normalizeColKey(col) === 'transactionid')"),
      'transactionID must be disabled in Create modal for Payments'
    )
    assert.ok(
      tableSrc.includes("isPaymentEndpoint && normalizeColKey(col) === 'transactionid' ? 'Auto-generated upon save'"),
      'transactionID must carry Auto-generated upon save placeholder'
    )
  })

  test('sanitizePaymentPayload strips whitespace from accountNo and throws on empty', () => {
    const withSpace = { accountNo: '  202311819  ', receivedPayment: 1500 }
    const cleaned = sanitizePaymentPayload(withSpace)
    assert.equal(cleaned.accountNo, '202311819')

    assert.throws(() => {
      sanitizePaymentPayload({ accountNo: '   ', receivedPayment: 1500 })
    }, /Account # is required/)

    assert.throws(() => {
      sanitizePaymentPayload({ accountNo: '', receivedPayment: 1500 })
    }, /Account # is required/)
  })

  test('sanitizePaymentPayload parses receivedPayment with commas and currency symbols', () => {
    const payloadWithComma = { accountNo: '202311819', receivedPayment: '1,500.50' }
    const cleaned = sanitizePaymentPayload(payloadWithComma)
    assert.equal(cleaned.receivedPayment, 1500.50)

    const payloadWithPeso = { accountNo: '202311819', receivedPayment: '₱2,000.00' }
    const cleanedPeso = sanitizePaymentPayload(payloadWithPeso)
    assert.equal(cleanedPeso.receivedPayment, 2000.00)
  })

  test('sanitizePaymentPayload ensures image and plan are strings, never numeric', () => {
    const payloadNumericPlan = { accountNo: '202311819', plan: 2, image: 2 }
    const cleaned = sanitizePaymentPayload(payloadNumericPlan)
    assert.equal(cleaned.plan, '2')
    assert.equal(cleaned.image, '2')
    assert.equal(typeof cleaned.plan, 'string')
    assert.equal(typeof cleaned.image, 'string')
  })

  test('sanitizePaymentPayload omits empty transactionID and strips non-schema audit fields', () => {
    const payloadWithAudit = {
      accountNo: '202311819',
      transactionID: '',
      createdBy: '2',
      createdDate: '2026-11-06T00:00:00Z',
      modifiedBy: '2'
    }
    const cleaned = sanitizePaymentPayload(payloadWithAudit)
    assert.equal(cleaned.transactionID, undefined, 'empty transactionID must be deleted')
    assert.equal(cleaned.createdBy, undefined, 'createdBy must be deleted')
    assert.equal(cleaned.createdDate, undefined, 'createdDate must be deleted')
    assert.equal(cleaned.modifiedBy, '2', 'modifiedBy must be retained')
  })

  test('api.js provides actionable error message for Payments 400 Bad Request', () => {
    assert.ok(
      apiSrc.includes("error.response?.status === 400 && String(error.config?.url || '').includes('Payment')"),
      'api.js must check status 400 on Payment endpoint'
    )
    assert.ok(
      apiSrc.includes('The Account # must match an active subscriber account from Billing Details'),
      'api.js must provide actionable guidance on Account #'
    )
  })
})
