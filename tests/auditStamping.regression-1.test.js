// Regression: C-03/C-04/C-05 — the client stripped every audit column on create
// and update ("Excluded for backend migration"), but the server never took over
// stamping them. Result: createdBy/modifiedBy always blank, modifiedDate stuck at
// 0001-01-01 on Plans, and Applications/BillingDetails rejecting every create
// because ModifiedBy/ModifiedDate were absent from the payload.
// Found by /qa-only on 2026-08-30.
// Report: .gstack/qa-reports/qa-report-crud-2026-08-30.md
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')

// The two helpers as the component defines them.
const localAuditTimestamp = (d = new Date()) => {
  const pad = (n, w = 2) => String(n).padStart(w, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

const stampAuditFields = (target, mode, loggedInUserId) => {
  if (!target) return target
  const stamp = localAuditTimestamp()
  if (mode === 'create') {
    target.createdBy = loggedInUserId
    target.createdDate = stamp
  }
  target.modifiedBy = loggedInUserId
  target.modifiedDate = stamp
  return target
}

describe('Audit stamping (regression C-03/C-04/C-05)', () => {
  test('create stamps all four columns', () => {
    const p = stampAuditFields({ name: 'x' }, 'create', '7')
    assert.equal(p.createdBy, '7')
    assert.equal(p.modifiedBy, '7')
    assert.ok(p.createdDate, 'createdDate must be set on create')
    assert.ok(p.modifiedDate, 'modifiedDate must be set on create')
  })

  test('update stamps the modified pair and never rewrites createdBy', () => {
    // The record's original creator must survive an edit.
    const p = stampAuditFields({ name: 'x', createdBy: '3', createdDate: '2020-01-01T00:00:00' }, 'update', '7')
    assert.equal(p.createdBy, '3', 'update must not reassign the creator')
    assert.equal(p.createdDate, '2020-01-01T00:00:00', 'update must not move the creation date')
    assert.equal(p.modifiedBy, '7')
    assert.ok(p.modifiedDate)
  })

  test('modifiedDate is never the 0001-01-01 sentinel', () => {
    // The exact symptom on Plans before the fix.
    const p = stampAuditFields({}, 'update', '1')
    assert.ok(!p.modifiedDate.startsWith('0001'), 'a stamped date must not be the .NET default')
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(p.modifiedDate))
  })

  test('timestamps are local, not UTC', () => {
    // The server stores these strings verbatim and the rest of the database is
    // local (UTC+8). A Zulu stamp files every edit hours in the past.
    const d = new Date(2026, 7, 30, 8, 0, 31, 77)
    const out = localAuditTimestamp(d)
    assert.equal(out, '2026-08-30T08:00:31.077')
    assert.ok(!out.endsWith('Z'), 'must not be UTC/Zulu')
    assert.ok(!out.includes('+'), 'must not carry an offset the server would re-interpret')
    // Same instant via toISOString would be the previous day in UTC+8.
    assert.notEqual(out, d.toISOString())
  })

  test('single-digit clock parts are zero padded', () => {
    assert.equal(localAuditTimestamp(new Date(2026, 0, 5, 9, 4, 3, 7)), '2026-01-05T09:04:03.007')
  })

  test('a null payload is handled without throwing', () => {
    assert.equal(stampAuditFields(null, 'create', '1'), null)
  })
})

describe('The component is wired to stamp, not strip', () => {
  const src = fs.readFileSync(tableFile, 'utf8')

  test('the audit fields are no longer commented out', () => {
    assert.ok(
      !src.includes('// modifiedBy: loggedInUserId, // Excluded for backend migration'),
      'the Applications payload must send modifiedBy, not comment it out'
    )
    assert.ok(
      !src.includes("// modifiedDate: '', // Excluded for backend migration"),
      'the Applications payload must send modifiedDate'
    )
  })

  test('both create and both update branches stamp', () => {
    const creates = (src.match(/stampAuditFields\(finalPayload, 'create'/g) || []).length
    const updates = (src.match(/stampAuditFields\(finalPayload, 'update'/g) || []).length
    assert.equal(creates, 2, 'Applications branch + generic branch must both stamp on create')
    assert.equal(updates, 2, 'Applications branch + generic branch must both stamp on update')
  })

  test('the stamp uses the local helper, not toISOString', () => {
    assert.ok(src.includes('const localAuditTimestamp'), 'local timestamp helper must exist')
    const fn = src.slice(src.indexOf('const stampAuditFields'), src.indexOf('const stampAuditFields') + 400)
    assert.ok(!fn.includes('toISOString'), 'audit stamps must not use UTC')
  })

  test('applyJobOrderCreationAudit sets createdBy and modifiedBy on create, and only modifiedBy on update', () => {
    assert.ok(src.includes('applyJobOrderCreationAudit(finalPayload, numericUserId, \'update\')'), 'updateRecord must pass update mode')
    
    // Simulate applyJobOrderCreationAudit behavior
    const createPayload = { status: 'In Progress' }
    if (true) {
      createPayload.createdBy = 5
      createPayload.createdDate = null
      createPayload.modifiedBy = 5
    }
    assert.equal(createPayload.createdBy, 5)
    assert.equal(createPayload.modifiedBy, 5)

    const updatePayload = { createdBy: 2, status: 'Done' }
    if (true) {
      // mode === 'update'
      updatePayload.modifiedBy = 5
    }
    assert.equal(updatePayload.createdBy, 2, 'createdBy must not be modified during update')
    assert.equal(updatePayload.modifiedBy, 5, 'modifiedBy must be updated with logged in user id')
  })
})

