// Regression: a Job Order with a blank Installation Fee or Billing Day could
// not be saved at all, and the dialog gave no clue which field to fix.
//
// The API refuses both spellings of a blank for those two numeric columns —
// null answers 400 "BillingDay: The BillingDay field is required. |
// InstallationFee: The InstallationFee field is required.", '' answers 500 —
// so the form has to demand them before submitting. And when the server does
// reject a field, saveEdit/saveData only raised a banner above an 80-field
// dialog, leaving the user to find "BillingDay" by eye: nothing marked the
// field and nothing scrolled to it.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveRequiredFields } from '../src/models/requiredFields.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableSrc = fs.readFileSync(path.resolve(__dirname, '../src/components/DynamicApiTable.vue'), 'utf8')
const apiSrc = fs.readFileSync(path.resolve(__dirname, '../src/services/api.js'), 'utf8')

const JOB_ORDER_COLUMNS = [
  'id', 'firstName', 'lastName', 'contactNumber', 'address', 'region', 'city',
  'barangay', 'planId', 'installationFee', 'contractTemplate', 'billingDay',
  'preferredDay', 'status', 'applicationId'
]

// Extract applyServerFieldErrors and run it against a stubbed form scope.
const start = tableSrc.indexOf('const applyServerFieldErrors = ')
assert.ok(start > -1, 'applyServerFieldErrors must be defined in DynamicApiTable.vue')
const tail = '\n  return inFormOrder\n}'
const end = tableSrc.indexOf(tail, start)
assert.ok(end > -1, 'applyServerFieldErrors must end with `return inFormOrder`')
const fnSrc = tableSrc.slice(start, end + tail.length)

const makeMapper = () => {
  const fieldErrors = { value: { create: {}, edit: {} } }
  const focused = []
  const applyServerFieldErrors = new Function(
    'formColumns', 'fieldErrors', 'focusFirstInvalid',
    `${fnSrc}\nreturn applyServerFieldErrors`
  )(
    { value: JOB_ORDER_COLUMNS },
    fieldErrors,
    async (scope, col) => { focused.push([scope, col]) }
  )
  return { applyServerFieldErrors, fieldErrors, focused }
}

describe('Blank numeric Job Order fields are demanded up front (regression: 400/500 with no field marked)', () => {
  test('installationFee and billingDay are required on the Job Order form', () => {
    const required = resolveRequiredFields('JobOrders', JOB_ORDER_COLUMNS, 'update')
    assert.ok(required.includes('installationFee'), 'installationFee must be required')
    assert.ok(required.includes('billingDay'), 'billingDay must be required')
  })

  test('the requirement holds on create too, where the same 500 applies', () => {
    const required = resolveRequiredFields('JobOrders', JOB_ORDER_COLUMNS, 'create')
    assert.ok(required.includes('installationFee'))
    assert.ok(required.includes('billingDay'))
  })

  test('api.js hands the per-field errors to the caller, not just a flattened sentence', () => {
    assert.ok(apiSrc.includes('customError.fieldErrors = fieldErrors'),
      'the rejected error must carry a fieldErrors map')
  })

  test('server field names map onto form columns and the first one is focused', async () => {
    const { applyServerFieldErrors, fieldErrors, focused } = makeMapper()
    const matched = await applyServerFieldErrors('edit', {
      fieldErrors: {
        BillingDay: 'The BillingDay field is required.',
        InstallationFee: 'The InstallationFee field is required.'
      }
    })
    // Form order, not the order the server listed them: installationFee sits
    // higher up the dialog, so that is where the user is sent.
    assert.deepEqual(matched, ['installationFee', 'billingDay'])
    assert.deepEqual(focused, [['edit', 'installationFee']])
    assert.equal(fieldErrors.value.edit.billingDay, 'The BillingDay field is required.')
    assert.equal(fieldErrors.value.edit.installationFee, 'The InstallationFee field is required.')
  })

  test('a $-prefixed JSON path from the model binder matches too', async () => {
    const { applyServerFieldErrors, fieldErrors } = makeMapper()
    const matched = await applyServerFieldErrors('create', { fieldErrors: { '$.preferred_day': 'bad value' } })
    assert.deepEqual(matched, ['preferredDay'])
    assert.equal(fieldErrors.value.create.preferredDay, 'bad value')
  })

  test('an error naming no field this form shows falls back to the banner', async () => {
    const { applyServerFieldErrors, fieldErrors, focused } = makeMapper()
    assert.deepEqual(await applyServerFieldErrors('edit', { fieldErrors: { Nonexistent: 'x' } }), [])
    assert.deepEqual(await applyServerFieldErrors('edit', { message: 'plain 500' }), [])
    assert.deepEqual(focused, [], 'nothing to focus, so the caller scrolls the banner instead')
    assert.deepEqual(fieldErrors.value.edit, {})
  })

  test('the dialog scrolls its own pane instead of relying on smooth scrollIntoView', () => {
    const start = tableSrc.indexOf('const scrollIntoDialog = ')
    assert.ok(start > -1, 'scrollIntoDialog must be defined')
    const fn = tableSrc.slice(start, tableSrc.indexOf('\n}', start))
    // Measured in the running dialog: a smooth call left scrollTop at 0 while
    // the same instant call moved it to 869, so the field was never brought
    // into view.
    assert.ok(!fn.includes("behavior: 'smooth'"), 'smooth scrolling is dropped inside the dialog panes')
    assert.ok(fn.includes('container.scrollTop ='), 'the container itself must be scrolled')
    assert.ok(tableSrc.includes('const scrollableAncestor = '), 'the scrollable pane must be resolved from the element')
  })

  test('a blank number is handed to InputNumber as null, so it renders no fake 0', () => {
    // InputNumber renders '' as 0 but null as its placeholder, so a record with
    // no billing day showed "0" and one with no fee showed "₱0.00" — fields
    // that read as filled while the row held nothing. Measured in the running
    // dialog: '' displayed "0", null displayed "".
    const bindings = tableSrc.match(/:model-value="(formData|editFormData)\[col\] === '' \? null : \1\[col\]"/g) || []
    assert.equal(bindings.length, 4, 'both dialogs must guard both their currency and number inputs')
    const writeBacks = tableSrc.match(/@update:model-value="(formData|editFormData)\[col\] = \$event"/g) || []
    assert.equal(writeBacks.length, 4, 'each guarded input must still write the value back')
  })

  test('both save paths mark the fields before falling back to the banner', () => {
    const edit = tableSrc.includes("const marked = await applyServerFieldErrors('edit', err)")
    const create = tableSrc.includes("const marked = await applyServerFieldErrors('create', err)")
    assert.ok(edit, 'saveEdit must map server field errors')
    assert.ok(create, 'saveData must map server field errors')
    assert.equal((tableSrc.match(/if \(!marked\.length\) await scrollErrorBannerIntoView/g) || []).length, 2)
  })
})
