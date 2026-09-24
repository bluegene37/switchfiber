import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EndpointColumns } from '../src/models/columns.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const src = fs.readFileSync(tableFile, 'utf8')

// Replicate normalization and helper logic from DynamicApiTable.vue
const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')

const PAYMENT_EDITABLE_COLUMNS = new Set([
  'transactiontype',
  'receivedpayment',
  'referenceno',
  'orno',
  'remarks',
  'image'
])

function isReadOnlyField(col) {
  if (!col) return false
  const lower = col.toLowerCase().replace(/_/g, '')
  return lower === 'accountbalance' || lower === 'accountbal'
}

function isFieldDisabledInEdit(col, isPayment = false) {
  if (!col) return false
  if (isReadOnlyField(col)) return true
  if (isPayment) {
    const key = normalizeColKey(col)
    return !PAYMENT_EDITABLE_COLUMNS.has(key)
  }
  return false
}

describe('Payments Edit Modal Field Whitelist Configuration', () => {
  test('PAYMENT_EDITABLE_COLUMNS is defined in DynamicApiTable.vue with exact 6 whitelist fields', () => {
    assert.ok(src.includes('const PAYMENT_EDITABLE_COLUMNS = new Set(['), 'Must define PAYMENT_EDITABLE_COLUMNS')
    assert.ok(src.includes("'transactiontype',"), 'Must whitelist transactiontype')
    assert.ok(src.includes("'receivedpayment',"), 'Must whitelist receivedpayment')
    assert.ok(src.includes("'referenceno',"), 'Must whitelist referenceno')
    assert.ok(src.includes("'orno',"), 'Must whitelist orno')
    assert.ok(src.includes("'remarks',"), 'Must whitelist remarks')
    assert.ok(src.includes("'image'"), 'Must whitelist image (Fiber Plan)')
  })

  test('isFieldDisabledInEdit function is defined and checks PAYMENT_EDITABLE_COLUMNS for payments', () => {
    assert.ok(src.includes('function isFieldDisabledInEdit(col)'), 'Must define isFieldDisabledInEdit')
    assert.ok(
      src.includes('if (isPaymentEndpoint.value) {') &&
      src.includes('return !PAYMENT_EDITABLE_COLUMNS.has(key)'),
      'Must check isPaymentEndpoint and PAYMENT_EDITABLE_COLUMNS in isFieldDisabledInEdit'
    )
  })

  test('Whitelist columns return false (enabled) in isFieldDisabledInEdit for payments', () => {
    const enabledPaymentFields = [
      'transactionType',
      'TransactionType',
      'transaction_type',
      'receivedPayment',
      'ReceivedPayment',
      'received_payment',
      'referenceNo',
      'ReferenceNo',
      'reference_no',
      'orNo',
      'orno',
      'OrNo',
      'or_no',
      'remarks',
      'Remarks',
      'image',
      'Image'
    ]

    for (const field of enabledPaymentFields) {
      assert.equal(
        isFieldDisabledInEdit(field, true),
        false,
        `Field "${field}" must be enabled in edit mode for Payments`
      )
    }
  })

  test('All other Payments endpoint columns return true (disabled/read-only)', () => {
    const disabledPaymentFields = [
      'id',
      'transactionID',
      'accountNo',
      'fullName',
      'contactNo',
      'paymentMethod',
      'userEmail',
      'status',
      'provider',
      'plan',
      'accountBalance',
      'dateProcessed',
      'processedBy',
      'location',
      'paymentDate',
      'barangay',
      'city',
      'createdBy',
      'createdDate',
      'modifiedBy',
      'modifiedDate'
    ]

    for (const field of disabledPaymentFields) {
      assert.equal(
        isFieldDisabledInEdit(field, true),
        true,
        `Field "${field}" must be disabled in edit mode for Payments`
      )
    }
  })

  test('Non-payment endpoints are unaffected by PAYMENT_EDITABLE_COLUMNS', () => {
    assert.equal(isFieldDisabledInEdit('fullName', false), false)
    assert.equal(isFieldDisabledInEdit('contactNo', false), false)
    assert.equal(isFieldDisabledInEdit('status', false), false)
    // Account balance is globally read-only
    assert.equal(isFieldDisabledInEdit('accountBalance', false), true)
  })

  test('All fields in EndpointColumns.Payments are properly partitioned into whitelisted vs disabled', () => {
    const paymentCols = EndpointColumns.Payments || []
    assert.ok(paymentCols.length > 0, 'EndpointColumns.Payments must not be empty')

    const whitelistedInSchema = paymentCols.filter(c => !isFieldDisabledInEdit(c, true))
    const disabledInSchema = paymentCols.filter(c => isFieldDisabledInEdit(c, true))

    // Check that expected editable fields exist in schema and are whitelisted
    assert.ok(whitelistedInSchema.includes('transactionType'), 'transactionType should be in whitelisted schema cols')
    assert.ok(whitelistedInSchema.includes('receivedPayment'), 'receivedPayment should be in whitelisted schema cols')
    assert.ok(whitelistedInSchema.includes('referenceNo'), 'referenceNo should be in whitelisted schema cols')
    assert.ok(whitelistedInSchema.includes('orNo') || whitelistedInSchema.includes('orno'), 'orNo should be in whitelisted schema cols')
    assert.ok(whitelistedInSchema.includes('remarks'), 'remarks should be in whitelisted schema cols')
    assert.ok(whitelistedInSchema.includes('image'), 'image should be in whitelisted schema cols')

    // Check that all other schema columns are disabled
    assert.ok(disabledInSchema.includes('transactionID'), 'transactionID must be disabled')
    assert.ok(disabledInSchema.includes('accountNo'), 'accountNo must be disabled')
    assert.ok(disabledInSchema.includes('fullName'), 'fullName must be disabled')
    assert.ok(disabledInSchema.includes('paymentMethod'), 'paymentMethod must be disabled')
    assert.ok(disabledInSchema.includes('accountBalance'), 'accountBalance must be disabled')
    assert.ok(disabledInSchema.includes('dateProcessed'), 'dateProcessed must be disabled')
    assert.ok(disabledInSchema.includes('processedBy'), 'processedBy must be disabled')
  })
})

describe('Edit Form UI & Validation Integration for Disabled Fields', () => {
  test('isFieldRequired returns false for disabled fields during edit', () => {
    assert.ok(
      src.includes("if (scope === 'edit' && isFieldDisabledInEdit(col)) return false"),
      'isFieldRequired must return false for disabled fields in edit scope'
    )
  })

  test('Edit Dialog shows Read Only pill badge for disabled fields', () => {
    assert.ok(
      src.includes('isFieldDisabledInEdit(col)') &&
      src.includes('Read Only</span>'),
      'Edit dialog template must display Read Only badge for isFieldDisabledInEdit(col)'
    )
  })

  test('Edit Dialog inputs bind :disabled="isFieldDisabledInEdit(col)"', () => {
    assert.ok(
      src.includes(':disabled="isFieldDisabledInEdit(col)"'),
      'Edit dialog inputs must bind :disabled="isFieldDisabledInEdit(col)"'
    )
    assert.ok(
      src.includes("'bg-light text-muted': isFieldDisabledInEdit(col)"),
      'Edit dialog inputs must have disabled styling class when isFieldDisabledInEdit(col)'
    )
  })

  test('saveEdit preserves snapshot values for disabled fields', () => {
    assert.ok(
      src.includes('if (isFieldDisabledInEdit(col) && editBaseSnapshot.value && editBaseSnapshot.value[col] !== undefined)'),
      'saveEdit must preserve snapshot values for isFieldDisabledInEdit fields'
    )
  })

  test('saveEdit sets numeric ID and stamps audit fields for Payments PUT', () => {
    assert.ok(
      src.includes('if (isPaymentEndpoint.value) {\n        finalPayload.id = Number(editingRecordId.value) || editingRecordId.value\n      }'),
      'saveEdit must ensure payload.id is included for Payments'
    )
    assert.ok(
      src.includes("stampAuditFields(finalPayload, 'update', loggedInUserId)"),
      'saveEdit must call stampAuditFields'
    )
  })
})
