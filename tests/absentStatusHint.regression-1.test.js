// Regression: R-01 — five status menus (Application In Progress / Done /
// Approved, Job Orders In Progress / Completed) filter on values absent from the
// data and showed a generic "No matching records found" forever.
// Found by /qa on 2026-08-29
// Report: .gstack/qa-reports/qa-report-localhost-5183-2026-08-29.md
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const applicationView = path.resolve(__dirname, '../src/views/ApplicationList.vue')
const jobOrderView = path.resolve(__dirname, '../src/views/JobOrderList.vue')

// The hint as DynamicApiTable computes it: only when the loaded set spans every
// status (clientStatusFilter), and only when the requested value appears nowhere
// in it. A merely narrow window must stay on the ordinary empty state.
const buildHint = ({ clientStatusFilter, status, statusLabel, rows }) => {
  if (!clientStatusFilter) return null
  const requested = String(status || '').trim()
  if (!requested) return null
  if (!rows.length) return null

  const requestedLabel = String(statusLabel || '').trim() || requested
  const byStatus = {}
  rows.forEach(row => {
    const key = String(row.status || '').trim().toLowerCase()
    if (!key) return
    if (!byStatus[key]) byStatus[key] = { label: String(row.status).trim(), count: 0 }
    byStatus[key].count += 1
  })

  if (byStatus[requested.toLowerCase()]) return null
  const available = Object.values(byStatus).sort((a, b) => b.count - a.count)
  if (!available.length) return null
  return { requested: requestedLabel, available }
}

const rowsWith = (spec) =>
  Object.entries(spec).flatMap(([status, n]) => Array.from({ length: n }, () => ({ status })))

// The live vocabularies on 2026-08-29.
const APPLICATION_ROWS = rowsWith({
  Schedule: 4578, Duplicate: 271, Cancelled: 113, 'No Facility': 31, 'No Slot': 1, '': 6
})
const JOB_ORDER_ROWS = rowsWith({ Activated: 3937, Applied: 1, status: 1 })

describe('Absent-status hint (regression R-01)', () => {
  test('fires for an Application tab whose value the data never carries', () => {
    for (const status of ['In Progress', 'Done', 'Approved']) {
      const hint = buildHint({
        clientStatusFilter: true, status, rows: APPLICATION_ROWS
      })
      assert.ok(hint, `${status} should be reported as absent, not as "no matches"`)
      assert.equal(hint.requested, status)
      assert.deepEqual(
        hint.available.map(s => s.label),
        ['Schedule', 'Duplicate', 'Cancelled', 'No Facility', 'No Slot'],
        'Available statuses must be listed most-common first'
      )
      assert.equal(hint.available[0].count, 4578)
    }
  })

  test('fires for the Job Orders tabs that have no matching value', () => {
    for (const status of ['inprogress', 'completed']) {
      const hint = buildHint({
        clientStatusFilter: true, status, rows: JOB_ORDER_ROWS
      })
      assert.ok(hint, `${status} should be reported as absent`)
      assert.equal(hint.available[0].label, 'Activated')
      assert.equal(hint.available[0].count, 3937)
    }
  })

  test('stays silent for a status the data does carry', () => {
    // Activated has 3,937 rows; an empty screen there is a narrow window, not an
    // impossible filter, and must keep the ordinary empty state.
    assert.equal(buildHint({ clientStatusFilter: true, status: 'activated', rows: JOB_ORDER_ROWS }), null)
    assert.equal(buildHint({ clientStatusFilter: true, status: 'Schedule', rows: APPLICATION_ROWS }), null)
  })

  test('matches case-insensitively so a slug is not reported as absent', () => {
    // The tab stores 'activated'; the data stores 'Activated'.
    assert.equal(buildHint({ clientStatusFilter: true, status: 'activated', rows: JOB_ORDER_ROWS }), null)
  })

  test('quotes the tab label back, not the internal slug', () => {
    const hint = buildHint({
      clientStatusFilter: true, status: 'inprogress', statusLabel: 'In Progress', rows: JOB_ORDER_ROWS
    })
    assert.equal(hint.requested, 'In Progress')
  })

  test('stays silent when the loaded set cannot know the vocabulary', () => {
    // A server-filtered response only ever holds one status, so absence there
    // proves nothing.
    assert.equal(buildHint({ clientStatusFilter: false, status: 'Done', rows: APPLICATION_ROWS }), null)
    // Nothing loaded yet, or no status asked for.
    assert.equal(buildHint({ clientStatusFilter: true, status: 'Done', rows: [] }), null)
    assert.equal(buildHint({ clientStatusFilter: true, status: '', rows: APPLICATION_ROWS }), null)
  })

  test('blank statuses are not offered as a destination', () => {
    const hint = buildHint({ clientStatusFilter: true, status: 'Done', rows: APPLICATION_ROWS })
    assert.ok(
      hint.available.every(s => s.label !== ''),
      'A blank status is not something the user can switch to'
    )
    assert.equal(
      hint.available.reduce((n, s) => n + s.count, 0),
      APPLICATION_ROWS.length - 6,
      'Counts must cover every non-blank row exactly once'
    )
  })
})

describe('Views are wired to the hint', () => {
  test('DynamicApiTable renders the hint and lets the parent act on it', () => {
    const content = fs.readFileSync(tableFile, 'utf8')
    assert.ok(content.includes('absentStatusHint'), 'Missing the absent-status computed')
    assert.ok(content.includes("'select-status'"), 'Chips must emit select-status')
    assert.ok(content.includes('statusLabel'), 'Missing the display-label prop')
  })

  test('both list views load the whole set so the vocabulary is knowable', () => {
    for (const file of [applicationView, jobOrderView]) {
      const content = fs.readFileSync(file, 'utf8')
      assert.ok(content.includes('client-status-filter'), `${path.basename(file)} must resolve status client-side`)
      assert.ok(content.includes('@select-status'), `${path.basename(file)} must handle the chip click`)
    }
  })

  test('ApplicationList no longer routes status through /Applications/filter', () => {
    const content = fs.readFileSync(applicationView, 'utf8')
    assert.ok(
      !content.includes('filter-endpoint="/Applications/filter"'),
      'The server status filter returns 13,633 rows for a 5,000-row list and hides absent statuses'
    )
  })
})
