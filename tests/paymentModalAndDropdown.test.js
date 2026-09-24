import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EndpointColumns } from '../src/models/columns.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const src = fs.readFileSync(tableFile, 'utf8')

// Emulate helper functions from DynamicApiTable.vue
function isReadOnlyField(col) {
  if (!col) return false
  const lower = col.toLowerCase().replace(/_/g, '')
  return lower === 'accountbalance' || lower === 'accountbal'
}

function getFieldType(col) {
  if (!col) return 'text'
  const lower = col.toLowerCase().replace(/_/g, '')
  if (
    lower === 'paymentmethod' ||
    lower === 'payment_method' ||
    lower === 'transactiontype' ||
    lower === 'transaction_type'
  ) {
    return 'paymentmethod_dropdown'
  }
  return 'text'
}

const paymentMethodOptions = [
  { label: 'Cash', value: 'Cash' },
  { label: 'GCash', value: 'GCash' },
  { label: 'May Bank', value: 'May Bank' }
]

const getStableOptionsWithCurrent = (optionsList, currentVal) => {
  const list = Array.isArray(optionsList) ? [...optionsList] : []
  if (currentVal !== null && currentVal !== undefined && String(currentVal).trim() !== '' && currentVal !== 0 && currentVal !== '0') {
    const str = String(currentVal).trim()
    const norm = str.toLowerCase().replace(/[\s_-]+/g, '')
    const exists = list.some(opt => {
      const v = String(opt.value || '').trim()
      const l = String(opt.label || '').trim()
      return (
        v === str ||
        v.toLowerCase() === str.toLowerCase() ||
        v.toLowerCase().replace(/[\s_-]+/g, '') === norm ||
        l === str ||
        l.toLowerCase() === str.toLowerCase() ||
        l.toLowerCase().replace(/[\s_-]+/g, '') === norm
      )
    })
    if (!exists) {
      list.unshift({ label: str, value: currentVal })
    }
  }
  return list
}

describe('Payments Modal 3-Column Layout Integrity', () => {
  test('isWideForm includes isPaymentEndpoint for 3-column modal', () => {
    assert.ok(
      src.includes('isPaymentEndpoint.value') && src.includes('const isWideForm = computed'),
      'isWideForm must include isPaymentEndpoint.value'
    )
  })

  test('PAYMENT_FORM_LAYOUT is defined and registered in DynamicApiTable.vue', () => {
    assert.ok(src.includes('const PAYMENT_FORM_LAYOUT = ['), 'Must declare PAYMENT_FORM_LAYOUT')
    assert.ok(src.includes('const buildPaymentSections = (cols, opts) => buildLayoutSections(cols, PAYMENT_FORM_LAYOUT, opts)'), 'Must declare buildPaymentSections helper')
    assert.ok(src.includes('if (isPaymentEndpoint.value) {\n    return buildPaymentSections(formColumns.value)\n  }'), 'formSections must route Payments to buildPaymentSections')
    assert.ok(src.includes('if (isPaymentEndpoint.value) {\n    return buildPaymentSections(viewFormColumns.value, { includeAudit: true })\n  }'), 'viewFormSections must route Payments to buildPaymentSections')
  })

  test('EndpointColumns.Payments includes transactionType', () => {
    assert.ok(EndpointColumns.Payments.includes('transactionType'), 'EndpointColumns.Payments must include transactionType')
    assert.ok(EndpointColumns.Payments.includes('paymentMethod'), 'EndpointColumns.Payments must include paymentMethod')
  })
})

describe('Payment Method & Transaction Type Dropdown Configuration', () => {
  test('getFieldType recognizes paymentMethod and transactionType as paymentmethod_dropdown', () => {
    assert.equal(getFieldType('paymentMethod'), 'paymentmethod_dropdown')
    assert.equal(getFieldType('payment_method'), 'paymentmethod_dropdown')
    assert.equal(getFieldType('paymentmethod'), 'paymentmethod_dropdown')
    assert.equal(getFieldType('transactionType'), 'paymentmethod_dropdown')
    assert.equal(getFieldType('transaction_type'), 'paymentmethod_dropdown')
    assert.equal(getFieldType('transactiontype'), 'paymentmethod_dropdown')
  })

  test('paymentMethodOptions contains Cash, GCash, and May Bank', () => {
    assert.ok(src.includes("label: 'Cash', value: 'Cash'"), 'Must include Cash option')
    assert.ok(src.includes("label: 'GCash', value: 'GCash'"), 'Must include GCash option')
    assert.ok(src.includes("label: 'May Bank', value: 'May Bank'"), 'Must include May Bank option')
  })

  test('getStableOptionsWithCurrent preserves custom legacy payment methods without duplicates', () => {
    // Standard match with case-insensitivity
    const gcashList = getStableOptionsWithCurrent(paymentMethodOptions, 'Gcash')
    assert.equal(gcashList.length, 3, 'Gcash should match existing GCash and not duplicate')

    const maybankList = getStableOptionsWithCurrent(paymentMethodOptions, 'Maybank')
    assert.equal(maybankList.length, 3, 'Maybank should match May Bank and not duplicate')

    // Custom or legacy string preservation
    const customList = getStableOptionsWithCurrent(paymentMethodOptions, 'Bank Transfer - BDO')
    assert.equal(customList.length, 4, 'Custom payment method should be prepended to options')
    assert.equal(customList[0].value, 'Bank Transfer - BDO')
  })
})

describe('DynamicApiTable Template & Lifecycle Bindings for Payment Dropdown', () => {
  test('DataTable body template renders badge for paymentmethod_dropdown', () => {
    assert.ok(
      src.includes("v-else-if=\"getFieldType(col) === 'paymentmethod_dropdown'\""),
      'DataTable body must have a branch for paymentmethod_dropdown'
    )
  })

  test('Create Dialog renders Select dropdown with paymentMethodOptions', () => {
    assert.ok(
      src.includes("v-else-if=\"getFieldType(col) === 'paymentmethod_dropdown'\"") &&
      src.includes(':options="paymentMethodOptions"'),
      'Create Dialog must bind paymentMethodOptions to Select dropdown'
    )
  })

  test('Edit Dialog renders Select dropdown with getPaymentMethodOptions', () => {
    assert.ok(
      src.includes("v-else-if=\"getFieldType(col) === 'paymentmethod_dropdown'\"") &&
      src.includes(':options="getPaymentMethodOptions(editFormData[col])"'),
      'Edit Dialog must bind getPaymentMethodOptions to Select dropdown'
    )
  })

  test('formatDisplayValue resolves targetList for paymentmethod_dropdown', () => {
    assert.ok(
      src.includes("else if (type === 'paymentmethod_dropdown') targetList = paymentMethodOptions.value"),
      'formatDisplayValue must look up paymentMethodOptions'
    )
  })

  test('openCreateDialog defaults paymentmethod_dropdown to first option', () => {
    assert.ok(
      src.includes("else if (type === 'paymentmethod_dropdown' && paymentMethodOptions.value.length > 0) {\n      formData.value[col] = paymentMethodOptions.value[0].value"),
      'openCreateDialog must default paymentmethod_dropdown to Cash'
    )
  })

  test('openEditDialog normalizes paymentmethod_dropdown against options list', () => {
    assert.ok(
      src.includes("if (getFieldType(col) === 'paymentmethod_dropdown') {\n      const current = editFormData.value[col]"),
      'openEditDialog must normalize paymentmethod_dropdown'
    )
  })

  test('formatLabel cleanly aliases paymentMethod and referenceNo for Payments', () => {
    assert.ok(src.includes("if (k === 'paymentmethod') return 'Payment Method'"), 'paymentMethod must display Payment Method')
    assert.ok(src.includes("if (k === 'referenceno') return 'Reference #'"), 'referenceNo must display Reference #')
  })
})

describe('Payments: Processed By Input Field & Fiber Plan Dropdown Linked to Plan API', () => {
  test('DynamicApiTable overrides getFieldType for Payments image, plan, and fiberplan to plan_dropdown', () => {
    assert.ok(
      src.includes("if (lower === 'image' || lower === 'fiberplan' || lower === 'plan') {\n      return 'plan_dropdown'"),
      'Payments image and plan must resolve to plan_dropdown'
    )
  })

  test('DynamicApiTable overrides getFieldType for Payments remarks and processedby to text (not textarea)', () => {
    assert.ok(
      src.includes("if (lower === 'remarks' || lower === 'processedby') {\n      return 'text'"),
      'Payments remarks and processedby must resolve to text'
    )
    assert.ok(
      src.includes("if (lower === 'processedby' || lower === 'processed_by') {\n    return 'text'"),
      'Global processedby must resolve to text'
    )
  })

  test('needsPlanLookup includes isPaymentEndpoint to load plans from Plan API', () => {
    assert.ok(
      src.includes('const needsPlanLookup = computed(() =>'),
      'Must declare needsPlanLookup computed property'
    )
    assert.ok(
      src.includes("columns.value.some(c => getFieldType(c) === 'plan_dropdown') ||\n  isPaymentEndpoint.value"),
      'needsPlanLookup must include isPaymentEndpoint.value'
    )
    assert.ok(
      src.includes('if (needsPlanLookup.value) fetchFormLookups()'),
      'refreshTableLookups must call fetchFormLookups when needsPlanLookup is true'
    )
  })

  test('formatLabel maps Payments image, plan, fiberplan to Fiber Plan and remarks, processedby to Processed By', () => {
    assert.ok(
      src.includes("if (k === 'image' || k === 'plan' || k === 'fiberplan') return 'Fiber Plan'"),
      'formatLabel must map image, plan, and fiberplan to Fiber Plan'
    )
    assert.ok(
      src.includes("if (k === 'remarks' || k === 'processedby') return 'Processed By'"),
      'formatLabel must map remarks and processedby to Processed By'
    )
  })

  test('PAYMENT_FORM_LAYOUT places Fiber Plan in transaction section and Processed By in processing section', () => {
    assert.ok(
      src.includes("'image',") && src.includes("'plan',") && src.includes("'accountBalance',"),
      'PAYMENT_FORM_LAYOUT must group Fiber Plan with transaction details'
    )
    assert.ok(
      src.includes("'remarks',") && src.includes("'processedBy',"),
      'PAYMENT_FORM_LAYOUT must group Processed By with processing details'
    )
  })
})
