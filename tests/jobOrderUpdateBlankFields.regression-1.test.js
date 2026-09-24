// Regression: saving a Job Order failed on blank fields, in two different ways.
//
// 1. PUT /api/JobOrders/860 → 400
//      "PreferredDay: The PreferredDay field is required. |
//       ApplicationId: The ApplicationId field is required."
//    buildJobOrderPayload was sending blank text fields as null.
// 2. Sending '' for every blank field instead then broke the two In Progress
//    rows: PUT /api/JobOrders/3976 → 500 "An error occurred while updating job
//    order with ID: 3976", because installationFee and billingDay back numeric
//    columns and '' cannot be converted.
//
// The OpenAPI spec is not the contract here: it marks all 80+ properties
// `required`, but a PUT carrying nulls everywhere was rejected for exactly two
// of them. So this test encodes what the live API was observed to do on
// 2026-09-02, not what the spec claims.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableSrc = fs.readFileSync(path.resolve(__dirname, '../src/components/DynamicApiTable.vue'), 'utf8')

// Blank must be '': null answers 400 "The X field is required."
const EMPTY_STRING_WHEN_BLANK = ['preferredDay', 'applicationId']
// Blank must be null: '' answers 500 (numeric columns — job orders read back
// installationFee: 0 and billingDay: 22 as JSON numbers).
const NULL_WHEN_BLANK = ['installationFee', 'billingDay']
// Nullable int32 on create, plain string on update.
const INT_IDS = ['lcpId', 'napId', 'vlanId']

// Pull buildJobOrderPayload out of the component and evaluate it with stubs for
// the component-scope helpers it closes over.
const start = tableSrc.indexOf('const buildJobOrderPayload = ')
assert.ok(start > -1, 'buildJobOrderPayload must be defined in DynamicApiTable.vue')
const tail = '\n  return jobOrder\n}'
const end = tableSrc.indexOf(tail, start)
assert.ok(end > -1, 'buildJobOrderPayload must end with `return jobOrder`')
const fnSrc = tableSrc.slice(start, end + tail.length)

const buildJobOrderPayload = new Function(
  'normalizePhoneNumber', 'editingRecordId', 'defaultNewStatus', 'localAuditTimestamp', 'applyJobOrderCreationAudit',
  `${fnSrc}\nreturn buildJobOrderPayload`
)(
  (v) => (v === null || v === undefined ? '' : String(v).trim()),
  { value: 3976 },
  { value: 'Scheduled' },
  () => '2026-09-02T10:00:00.000',
  (p, uid, mode) => { if (mode === 'create') { p.createdBy = uid; p.createdDate = null } p.modifiedBy = String(uid) }
)

// Job Order 3976 as the API returns it: an In Progress row created without an
// installation fee or billing day. This is the record the 500 came from.
const inProgressRow = {
  id: 3976,
  firstName: 'test',
  lastName: 'test',
  emailAddress: 'test@gmail.com',
  status: 'Inprogress',
  planId: 'SwitchConnect - P799',
  preferredDay: '',
  installationFee: null,
  billingDay: null,
  lcpId: '0',
  napId: '0',
  vlanId: '0'
}

describe('Job Order save with blank fields (regressions: 400 required / 500 numeric)', () => {
  for (const mode of ['update', 'create']) {
    const payload = buildJobOrderPayload(inProgressRow, mode, 7, '7')

    test(`${mode}: blank preferredDay and applicationId go out as '' (null → 400)`, () => {
      for (const k of EMPTY_STRING_WHEN_BLANK) {
        assert.equal(payload[k], '', `${k} must be '' when blank, not ${JSON.stringify(payload[k])}`)
      }
    })

    test(`${mode}: blank installationFee and billingDay go out as null ('' → 500)`, () => {
      for (const k of NULL_WHEN_BLANK) {
        assert.equal(payload[k], null, `${k} must be null when blank, not ${JSON.stringify(payload[k])}`)
      }
    })

    test(`${mode}: populated numeric fields are passed through, not nulled`, () => {
      const p = buildJobOrderPayload({ ...inProgressRow, installationFee: 0, billingDay: 22 }, mode, 7, '7')
      assert.equal(p.installationFee, '0')
      assert.equal(p.billingDay, '22')
    })

    test(`${mode}: no other field regresses to null`, () => {
      const unexpected = Object.keys(payload).filter(k =>
        payload[k] === null &&
        !NULL_WHEN_BLANK.includes(k) &&
        !['createdDate', 'startTimeStamp', 'endTimeStamp', 'dateInstalled'].includes(k) &&
        !(mode === 'create' && INT_IDS.includes(k))
      )
      assert.deepEqual(unexpected, [], `these would fail "The X field is required.": ${unexpected.join(', ')}`)
    })
  }

  test('int ids keep their stored value on both verbs', () => {
    for (const mode of ['update', 'create']) {
      const p = buildJobOrderPayload({ ...inProgressRow, lcpId: 'LCP 060', napId: 12, vlanId: '1000' }, mode, 7, '7')
      assert.equal(p.lcpId, 'LCP 060', `${mode} lcpId`)
      assert.equal(p.napId, '12', `${mode} napId`)
      assert.equal(p.vlanId, '1000', `${mode} vlanId`)
    }
  })

  test('a blank int id is null on create (nullable int32) and \'\' on update (string)', () => {
    const blank = { ...inProgressRow, lcpId: '', napId: '', vlanId: '' }
    const created = buildJobOrderPayload(blank, 'create', 7, '7')
    const updated = buildJobOrderPayload(blank, 'update', 7, '7')
    for (const k of INT_IDS) {
      assert.equal(created[k], null, `create ${k}`)
      assert.equal(updated[k], '', `update ${k}`)
    }
  })
})
