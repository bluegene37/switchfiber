import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const src = fs.readFileSync(tableFile, 'utf8')

// Emulate helper function matching implementation in DynamicApiTable.vue
function isReadOnlyField(col) {
  if (!col) return false
  const lower = col.toLowerCase().replace(/_/g, '')
  return lower === 'accountbalance' || lower === 'accountbal'
}

describe('Account Balance Read-Only Integrity: Field Detection', () => {
  test('isReadOnlyField identifies account balance variations', () => {
    assert.equal(isReadOnlyField('accountBalance'), true, 'accountBalance must be read-only')
    assert.equal(isReadOnlyField('accountbalance'), true, 'accountbalance must be read-only')
    assert.equal(isReadOnlyField('account_balance'), true, 'account_balance must be read-only')
    assert.equal(isReadOnlyField('AccountBalance'), true, 'AccountBalance must be read-only')
    assert.equal(isReadOnlyField('ACCOUNT_BALANCE'), true, 'ACCOUNT_BALANCE must be read-only')
    assert.equal(isReadOnlyField('accountBal'), true, 'accountBal must be read-only')
    assert.equal(isReadOnlyField('account_bal'), true, 'account_bal must be read-only')
  })

  test('isReadOnlyField does not affect other currency or numeric fields', () => {
    assert.equal(isReadOnlyField('amount'), false, 'amount must not be read-only')
    assert.equal(isReadOnlyField('monthlyFee'), false, 'monthlyFee must not be read-only')
    assert.equal(isReadOnlyField('installationFee'), false, 'installationFee must not be read-only')
    assert.equal(isReadOnlyField('billingDay'), false, 'billingDay must not be read-only')
    assert.equal(isReadOnlyField('balance'), false, 'generic balance must not be affected')
    assert.equal(isReadOnlyField(''), false, 'empty field is false')
    assert.equal(isReadOnlyField(null), false, 'null is false')
    assert.equal(isReadOnlyField(undefined), false, 'undefined is false')
  })
})

describe('Account Balance Read-Only Integrity: DynamicApiTable Template & UI', () => {
  test('DynamicApiTable.vue defines isReadOnlyField helper', () => {
    assert.ok(
      src.includes('function isReadOnlyField(col) {'),
      'DynamicApiTable must define isReadOnlyField helper'
    )
    assert.ok(
      src.includes("lower === 'accountbalance' || lower === 'accountbal'"),
      'DynamicApiTable must check accountbalance and accountbal'
    )
  })

  test('Create Dialog label renders Read Only badge', () => {
    assert.ok(
      src.includes('v-else-if="isReadOnlyField(col)" class="badge bg-secondary-subtle text-secondary border rounded-pill ms-1 fw-normal" style="font-size: 0.65rem;">Read Only</span>'),
      'Create form must render Read Only badge on label'
    )
  })

  test('Edit Dialog label renders Read Only badge', () => {
    const matches = src.match(/v-else-if="isReadOnlyField\(col\)" class="badge bg-secondary-subtle text-secondary border rounded-pill ms-1 fw-normal" style="font-size: 0.65rem;">Read Only<\/span>/g)
    assert.ok(matches && matches.length >= 2, 'Both Create and Edit forms must render Read Only badge on labels')
  })

  test('Input fields bind disabled, readonly, and p-disabled bg-light classes for read-only fields', () => {
    assert.ok(
      src.includes(":disabled=\"isReadOnlyField(col)\""),
      'Inputs must bind :disabled="isReadOnlyField(col)"'
    )
    assert.ok(
      src.includes(":readonly=\"isReadOnlyField(col)\""),
      'Inputs must bind :readonly="isReadOnlyField(col)"'
    )
    assert.ok(
      src.includes(":class=\"{ 'p-disabled bg-light': isReadOnlyField(col) }\""),
      'Inputs must bind p-disabled bg-light when read-only'
    )
  })
})

describe('Account Balance Read-Only Integrity: Validation & Submission Logic', () => {
  test('isFieldRequired returns false for read-only fields to prevent submission blockers', () => {
    assert.ok(
      src.includes('if (isReadOnlyField(col)) return false'),
      'isFieldRequired must bypass validation for read-only fields'
    )
  })

  test('openCreateDialog initializes read-only fields to 0', () => {
    assert.ok(
      src.includes('} else if (isReadOnlyField(col)) {\n      formData.value[col] = 0'),
      'openCreateDialog must default read-only fields to 0'
    )
  })

  test('saveData resets read-only fields in payload to 0', () => {
    assert.ok(
      src.includes('if (isReadOnlyField(col)) {\n        payload[col] = 0\n      }'),
      'saveData must lock read-only fields to 0 in create payload'
    )
  })

  test('openEditDialog converts existing read-only field value to Number or defaults to 0', () => {
    assert.ok(
      src.includes('if (isReadOnlyField(col)) {\n      const bal = editFormData.value[col]\n      editFormData.value[col] = (bal === null || bal === undefined || bal === \'\') ? 0 : Number(bal)\n    }'),
      'openEditDialog must preserve existing balance as Number'
    )
  })

  test('saveEditedRecord locks read-only fields from editBaseSnapshot', () => {
    assert.ok(
      src.includes('if (isReadOnlyField(col) && editBaseSnapshot.value && editBaseSnapshot.value[col] !== undefined) {\n        payload[col] = editBaseSnapshot.value[col]\n      }'),
      'saveEditedRecord must lock read-only fields from snapshot in edit payload'
    )
  })
})
