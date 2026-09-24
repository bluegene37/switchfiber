// Regression: the "In Progress" Job Orders menu (/job-orders/inprogress) rendered
// nothing. The route slug was mapped to its display label 'In Progress' and that
// label was sent upstream as /JobOrders/status-date?status=In%20Progress. The data
// spells the status 'Inprogress' (one word); the backend matches case-insensitively
// but not space-insensitively, so the request returned 0 rows while 8 sat under
// 'Inprogress'. Probed live on 2026-09-03.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const viewPath = process.env.JOB_ORDER_VIEW || path.resolve(__dirname, '../src/views/JobOrderList.vue')
const src = fs.readFileSync(viewPath, 'utf8')

// Pull an object literal `const NAME = { ... }` out of the view's script.
const readMap = (name) => {
  const m = src.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\}`))
  if (!m) return null
  const out = {}
  for (const [, k, v] of m[1].matchAll(/(\w+):\s*'([^']*)'/g)) out[k] = v
  return out
}

// The request value the view derives for a selected status, as activeFilterParams does.
const requestStatus = (selected, values) => {
  const s = String(selected || '').trim()
  if (!s) return undefined
  return (values && values[s.toLowerCase()]) || s
}

// What the live backend accepts: case-insensitive, whitespace-sensitive.
const LIVE_STATUSES = ['Inprogress', 'Activated', 'Applied']
const backendMatches = (requested) =>
  LIVE_STATUSES.some(s => s.toLowerCase() === String(requested).toLowerCase())

describe('Job Orders In Progress route sends the data spelling upstream (regression)', () => {
  const values = readMap('LEGACY_STATUS_VALUES')
  const labels = readMap('LEGACY_STATUS_LABELS')

  test('the view keeps request values separate from display labels', () => {
    assert.ok(labels, 'LEGACY_STATUS_LABELS must exist for headings')
    assert.ok(values, 'LEGACY_STATUS_VALUES must exist for the upstream request')
    assert.equal(labels.inprogress, 'In Progress', 'the heading keeps the two-word wording')
    assert.equal(values.inprogress, 'Inprogress', 'the request uses the one-word data spelling')
  })

  test('activeFilterParams derives its status from the request map, not the label map', () => {
    const body = src.slice(src.indexOf('const activeFilterParams'))
    const statusLine = body.slice(0, body.indexOf('return params'))
    assert.match(statusLine, /LEGACY_STATUS_VALUES\[/, 'status must come from LEGACY_STATUS_VALUES')
    assert.doesNotMatch(statusLine, /LEGACY_STATUS_LABELS\[/, 'the display label must never go upstream')
  })

  test('the /job-orders/inprogress slug resolves to a status the backend can match', () => {
    const requested = requestStatus('inprogress', values)
    assert.equal(requested, 'Inprogress')
    assert.ok(backendMatches(requested), `backend has no status matching "${requested}"`)
  })

  test('the defect verbatim: the display label matches nothing on the backend', () => {
    assert.equal(backendMatches('In Progress'), false)
  })

  test('statuses learned from the data pass through untouched', () => {
    assert.equal(requestStatus('Applied', values), 'Applied')
    assert.equal(requestStatus('Activated', values), 'Activated')
    assert.equal(requestStatus('', values), undefined)
  })
})
