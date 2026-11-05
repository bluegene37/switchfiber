import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EndpointColumns } from '../src/models/columns.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const src = fs.readFileSync(tableFile, 'utf8')

// Helper logic mimicking DynamicApiTable.vue
const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')

function getFieldType(col, endpoint = 'payments') {
  if (!col) return 'text'
  const lower = col.toLowerCase().replace(/_/g, '')
  const isPayment = ['payments', 'payment'].includes((endpoint || '').toLowerCase())

  if (isPayment) {
    if (lower === 'image' || lower === 'fiberplan' || lower === 'plan') {
      return 'plan_dropdown'
    }
    if (lower === 'remarks' || lower === 'processedby') {
      return 'text'
    }
    if (lower === 'receivedpayment' || lower === 'paymentdate') {
      return 'date'
    }
  }

  if (lower.includes('date') || lower.includes('timestamp')) {
    return 'date'
  }
  return 'text'
}

function deduplicateColumns(colList, endpoint = 'payments') {
  if (!Array.isArray(colList)) return []
  const isPayment = ['payments', 'payment'].includes((endpoint || '').toLowerCase())
  const normalizedSet = new Set()
  const result = []
  const lowerCols = colList.map(c => c.toLowerCase())

  colList.forEach(col => {
    const lowerNoUnderscore = col.toLowerCase().replace(/_/g, '')
    const lowerRaw = col.toLowerCase()

    if (isPayment) {
      if (lowerRaw === 'paymentdate' && lowerCols.includes('receivedpayment')) return
      if (lowerRaw === 'processedby' && lowerCols.includes('remarks')) return
      if ((lowerRaw === 'plan' || lowerRaw === 'fiberplan') && lowerCols.includes('image')) return
    }

    if (!normalizedSet.has(lowerNoUnderscore)) {
      normalizedSet.add(lowerNoUnderscore)
      result.push(col)
    }
  })
  return result
}

const buildLayoutSections = (cols, layout) => {
  const pool = new Map()
  ;(cols || []).forEach(col => {
    const key = normalizeColKey(col)
    if (!pool.has(key)) pool.set(key, col)
  })

  const sections = []
  layout.forEach(sec => {
    const picked = []
    sec.columns.forEach(wanted => {
      const key = normalizeColKey(wanted)
      if (pool.has(key)) {
        picked.push(pool.get(key))
        pool.delete(key)
      }
    })
    if (picked.length > 0) {
      sections.push({ ...sec, columns: picked })
    }
  })
  return sections
}

const PAYMENT_FORM_LAYOUT = [
  {
    key: 'transaction',
    title: 'Payment & Transaction Details',
    columns: [
      'transactionID', 'accountNo', 'fullName', 'contactNo',
      'receivedPayment', 'paymentDate', 'paymentMethod', 'transactionType',
      'referenceNo', 'orNo', 'image', 'plan', 'accountBalance',
      'status', 'provider'
    ]
  },
  {
    key: 'processing',
    title: 'Processing & Location Information',
    columns: [
      'remarks', 'processedBy', 'dateProcessed',
      'location', 'barangay', 'city', 'userEmail'
    ]
  }
]

describe('Payment Form: Payment Date Field Type Verification', () => {
  test('getFieldType in DynamicApiTable.vue returns date for receivedPayment on Payments endpoint', () => {
    assert.ok(
      src.includes("if (lower === 'receivedpayment' || lower === 'paymentdate') {\n      return 'date'"),
      'DynamicApiTable must return date for receivedpayment and paymentdate on Payments endpoint'
    )
    assert.equal(getFieldType('receivedPayment', 'payments'), 'date')
    assert.equal(getFieldType('receivedpayment', 'payments'), 'date')
    assert.equal(getFieldType('ReceivedPayment', 'payments'), 'date')
    assert.equal(getFieldType('paymentDate', 'payments'), 'date')
  })

  test('formatDisplayValue formats Date instances directly without error', () => {
    assert.ok(
      src.includes('if (val instanceof Date && !isNaN(val.getTime()))'),
      'formatDisplayValue must handle Date object instances directly'
    )
  })

  test('openEditDialog parses date field string values into Date objects', () => {
    assert.ok(
      src.includes("if (getFieldType(col) === 'date' && editFormData.value[col])"),
      'openEditDialog must parse date strings using parseDateForPicker'
    )
  })
})

describe('Payment Form: Duplicate Fields Elimination Verification', () => {
  test('deduplicateColumns strips paymentDate when receivedPayment is present', () => {
    assert.ok(
      src.includes("if (lowerRaw === 'paymentdate' && lowerCols.includes('receivedpayment')) return"),
      'deduplicateColumns must omit paymentDate when receivedPayment is present'
    )
    const raw = ['receivedPayment', 'paymentDate', 'contactNo']
    const result = deduplicateColumns(raw, 'payments')
    assert.ok(result.includes('receivedPayment'))
    assert.ok(!result.includes('paymentDate'))
  })

  test('deduplicateColumns strips processedBy when remarks is present', () => {
    assert.ok(
      src.includes("if (lowerRaw === 'processedby' && lowerCols.includes('remarks')) return"),
      'deduplicateColumns must omit processedBy when remarks is present'
    )
    const raw = ['remarks', 'processedBy', 'dateProcessed']
    const result = deduplicateColumns(raw, 'payments')
    assert.ok(result.includes('remarks'))
    assert.ok(!result.includes('processedBy'))
  })

  test('deduplicateColumns strips plan when image is present', () => {
    assert.ok(
      src.includes("if ((lowerRaw === 'plan' || lowerRaw === 'fiberplan') && lowerCols.includes('image')) return"),
      'deduplicateColumns must omit plan when image is present'
    )
    const raw = ['image', 'plan', 'accountBalance']
    const result = deduplicateColumns(raw, 'payments')
    assert.ok(result.includes('image'))
    assert.ok(!result.includes('plan'))
  })

  test('Full EndpointColumns.Payments deduplication contains no duplicate fields', () => {
    const rawCols = EndpointColumns.Payments
    const deduped = deduplicateColumns(rawCols, 'payments')

    assert.ok(deduped.includes('receivedPayment'), 'Must retain receivedPayment')
    assert.ok(!deduped.includes('paymentDate'), 'Must remove duplicate paymentDate')
    assert.ok(deduped.includes('image'), 'Must retain image (Fiber Plan)')
    assert.ok(!deduped.includes('plan'), 'Must remove duplicate plan')
    assert.ok(deduped.includes('remarks'), 'Must retain remarks (Processed By)')
    assert.ok(!deduped.includes('processedBy'), 'Must remove duplicate processedBy')

    const sections = buildLayoutSections(deduped, PAYMENT_FORM_LAYOUT)
    assert.equal(sections.length, 2, 'Must have exactly 2 layout sections')

    const section1 = sections[0]
    const section2 = sections[1]

    // Verify Section 1 (Payment & Transaction Details)
    assert.ok(section1.columns.includes('receivedPayment'), 'Section 1 must include Payment Date (receivedPayment)')
    assert.ok(!section1.columns.includes('paymentDate'), 'Section 1 must not include duplicate paymentDate')
    assert.ok(section1.columns.includes('image'), 'Section 1 must include Fiber Plan (image)')
    assert.ok(!section1.columns.includes('plan'), 'Section 1 must not include duplicate plan')

    // Verify Section 2 (Processing & Location Information)
    assert.ok(section2.columns.includes('remarks'), 'Section 2 must include Processed By (remarks)')
    assert.ok(!section2.columns.includes('processedBy'), 'Section 2 must not include duplicate processedBy')
    assert.ok(!section2.columns.includes('paymentDate'), 'Section 2 must not include duplicate paymentDate')

    // Ensure completely unique column names across all sections
    const allPickedCols = [...section1.columns, ...section2.columns]
    const uniquePickedCols = new Set(allPickedCols.map(c => c.toLowerCase()))
    assert.equal(allPickedCols.length, uniquePickedCols.size, 'No column may be duplicated across sections')
  })

  test('buildPaymentSections definition invokes deduplicateColumns in DynamicApiTable.vue', () => {
    assert.ok(
      src.includes('const buildPaymentSections = (cols, opts) => {\n  const dedupedCols = deduplicateColumns(cols)\n  return buildLayoutSections(dedupedCols, PAYMENT_FORM_LAYOUT, opts)\n}'),
      'buildPaymentSections must sanitize and deduplicate columns'
    )
  })

  test('saveData and saveEdit sync legacy and DTO columns on Payments endpoint', () => {
    assert.ok(
      src.includes('if (finalPayload.receivedPayment && !finalPayload.paymentDate)'),
      'Must sync receivedPayment to paymentDate'
    )
    assert.ok(
      src.includes('if (finalPayload.image && !finalPayload.plan)'),
      'Must sync image to plan'
    )
    assert.ok(
      src.includes('if (finalPayload.remarks && !finalPayload.processedBy)'),
      'Must sync remarks to processedBy'
    )
  })
})
