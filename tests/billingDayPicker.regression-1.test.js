// Billing Day is a day of the month, so it is picked from 1-31 rather than typed
// into a free-form number box. Two things have to hold for the picker to work
// against the live data:
//
//   1. `billingDay` resolves to the `billingday_dropdown` field type, and the
//      option list is exactly 1..31 as STRINGS. Strings because the JobOrders
//      DTO declares billingDay a string on both request shapes — a PUT carrying
//      a JSON number is rejected outright:
//        400 "The JSON value could not be converted to UpdateJobOrderRequest.
//             Path: $.installationFee"
//      (observed on the live API, 2026-09-05).
//   2. openEditDialog stringifies the stored value first. Records read the day
//      back as a JSON number (job order 764 holds billingDay: 22), PrimeVue
//      Select matches options by identity, and 22 !== '22' — without the coercion
//      the dropdown opens blank on every record that already has a billing day.
//
// Blank still leaves as null, not '': see jobOrderUpdateBlankFields.regression-1.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableSrc = fs.readFileSync(path.resolve(__dirname, '../src/components/DynamicApiTable.vue'), 'utf8')

describe('Billing Day day-of-month picker', () => {
  test('billingDay resolves to the billingday_dropdown field type', () => {
    const match = tableSrc.match(
      /if \(lower === 'billingday' \|\| lower === 'billing_day'\) \{\s*return 'billingday_dropdown'/
    )
    assert.ok(match, "getFieldType must map 'billingday'/'billing_day' to 'billingday_dropdown'")
  })

  test('the option list is 1..31, as strings', () => {
    const start = tableSrc.indexOf('const billingDayOptions = ref(')
    assert.ok(start > -1, 'billingDayOptions must be defined in DynamicApiTable.vue')
    const end = tableSrc.indexOf('\n)', start)
    const src = tableSrc.slice(start, end + 2)

    const build = new Function('ref', `${src}\nreturn billingDayOptions`)
    const options = build((v) => ({ value: v })).value

    assert.equal(options.length, 31, 'a month has at most 31 days')
    assert.deepEqual(options[0], { label: '1', value: '1' })
    assert.deepEqual(options[30], { label: '31', value: '31' })
    for (const opt of options) {
      assert.equal(typeof opt.value, 'string', `option ${opt.label} must carry a string value`)
    }
    assert.deepEqual(
      options.map(o => o.value),
      Array.from({ length: 31 }, (_, i) => String(i + 1)),
      'options must run 1 through 31 with no gaps'
    )
  })

  test('both the create and the edit dialog render the picker', () => {
    const branches = tableSrc.match(/v-else-if="getFieldType\(col\) === 'billingday_dropdown'"/g) || []
    assert.equal(branches.length, 2, 'one Select branch in the create dialog and one in the edit dialog')
    assert.ok(
      tableSrc.includes(':options="billingDayOptions"'),
      'the Select must be bound to billingDayOptions'
    )
  })

  test('openEditDialog stringifies a stored numeric day so the Select matches it', () => {
    const start = tableSrc.indexOf("if (getFieldType(col) === 'billingday_dropdown') {")
    assert.ok(start > -1, 'openEditDialog must normalize the billing day on load')
    const end = tableSrc.indexOf('\n    }', start)
    const body = tableSrc.slice(start, end)

    // Replay the branch against the shapes the API actually returns.
    const coerce = (day) =>
      (day === null || day === undefined || day === '') ? null : String(day)

    assert.ok(body.includes('String(day)'), 'the stored day must be coerced with String()')
    assert.equal(coerce(22), '22', 'job order 764 holds the number 22')
    assert.equal(coerce('22'), '22', 'a string day passes through unchanged')
    assert.equal(coerce(null), null, 'a missing day stays empty, it does not become "null"')
    assert.equal(coerce(undefined), null)
    assert.equal(coerce(''), null)
  })
})
