// The status tab strips on Applications and Job Orders are built from the
// statuses present in the loaded data instead of a hand-written lifecycle, so a
// tab can never promise a value the data does not carry.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const applicationView = path.resolve(__dirname, '../src/views/ApplicationList.vue')
const jobOrderView = path.resolve(__dirname, '../src/views/JobOrderList.vue')

// `statusVocabulary` as DynamicApiTable computes it: every status in the loaded
// set, most common first, in the casing the data uses, blanks dropped.
// Deliberately NOT date-scoped — see the tab-stability test below.
const buildVocabulary = (rows, clientStatusFilter = true) => {
  if (!clientStatusFilter) return []
  const byStatus = {}
  rows.forEach(row => {
    const raw = String(row.status ?? '').trim()
    const key = raw.toLowerCase()
    if (!key) return
    if (!byStatus[key]) byStatus[key] = { value: raw, label: raw, count: 0 }
    byStatus[key].count += 1
  })
  return Object.values(byStatus).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

const buildTabs = (allLabel, vocabulary) => [
  { label: allLabel, value: '' },
  ...vocabulary.map(s => ({ label: s.label, value: s.value }))
]

const isActiveTab = (selected, value) =>
  String(selected || '').trim().toLowerCase() === String(value || '').trim().toLowerCase()

const rowsWith = (spec) =>
  Object.entries(spec).flatMap(([status, n]) => Array.from({ length: n }, () => ({ status })))

// The live vocabularies on 2026-08-30.
const APPLICATION_ROWS = rowsWith({
  Schedule: 4578, Duplicate: 271, Cancelled: 113, 'No Facility': 31, 'No Slot': 1, '': 6
})
const JOB_ORDER_ROWS = rowsWith({ Activated: 3937, Applied: 1, status: 1 })

describe('Status tabs are built from the data', () => {
  test('Applications offers the real vocabulary, not the old lifecycle', () => {
    const tabs = buildTabs('All Application', buildVocabulary(APPLICATION_ROWS))
    assert.deepEqual(
      tabs.map(t => t.label),
      ['All Application', 'Schedule', 'Duplicate', 'Cancelled', 'No Facility', 'No Slot']
    )
    for (const gone of ['In Progress', 'Done', 'Approved']) {
      assert.ok(!tabs.some(t => t.label === gone), `${gone} must not be offered — no row carries it`)
    }
  })

  test('Job Orders offers the real vocabulary', () => {
    const tabs = buildTabs('All Job Orders', buildVocabulary(JOB_ORDER_ROWS))
    assert.deepEqual(tabs.map(t => t.label), ['All Job Orders', 'Activated', 'Applied', 'status'])
    for (const gone of ['In Progress', 'Completed']) {
      assert.ok(!tabs.some(t => t.label === gone), `${gone} must not be offered`)
    }
  })

  test('every tab except All can actually match a row', () => {
    for (const rows of [APPLICATION_ROWS, JOB_ORDER_ROWS]) {
      const vocabulary = buildVocabulary(rows)
      for (const tab of buildTabs('All', vocabulary).slice(1)) {
        const matches = rows.filter(
          r => String(r.status).trim().toLowerCase() === tab.value.toLowerCase()
        )
        assert.ok(matches.length > 0, `${tab.label} must match at least one row`)
      }
    }
  })

  test('tabs are ordered by how common the status is', () => {
    const vocabulary = buildVocabulary(APPLICATION_ROWS)
    const counts = vocabulary.map(s => s.count)
    assert.deepEqual(counts, [...counts].sort((a, b) => b - a), 'Most common first')
    assert.equal(vocabulary[0].label, 'Schedule')
  })

  test('a blank status never becomes a tab', () => {
    // 6 application rows have an empty status; there is nothing to label them.
    const vocabulary = buildVocabulary(APPLICATION_ROWS)
    assert.ok(vocabulary.every(s => s.label.trim().length > 0))
    assert.equal(
      vocabulary.reduce((n, s) => n + s.count, 0),
      APPLICATION_ROWS.length - 6
    )
  })

  test('the tab set does not shrink when the date window narrows', () => {
    // Counts are window-scoped, but the vocabulary is drawn from the whole
    // loaded set: a tab strip that reshuffled itself every time the user changed
    // the date range would be unusable.
    const thisWeek = [{ status: 'status' }, { status: 'Applied' }]
    const wholeSet = JOB_ORDER_ROWS
    assert.equal(buildVocabulary(wholeSet).length, 3)
    assert.equal(buildVocabulary(thisWeek).length, 2, 'the window alone would lose Activated')
    // The view passes the whole set, so Activated survives a narrow window.
    assert.ok(buildVocabulary(wholeSet).some(s => s.value === 'Activated'))
  })

  test('casing differences between a route slug and the data still match', () => {
    // /job-orders/activated carries 'activated'; the data stores 'Activated'.
    assert.equal(isActiveTab('activated', 'Activated'), true)
    assert.equal(isActiveTab('Activated', 'activated'), true)
    assert.equal(isActiveTab('  Schedule ', 'schedule'), true)
    assert.equal(isActiveTab('In Progress', 'Schedule'), false)
    // The All tab is active only when nothing is selected.
    assert.equal(isActiveTab('', ''), true)
    assert.equal(isActiveTab('Schedule', ''), false)
  })

  test('a status the backend starts emitting appears without a code change', () => {
    const withNewStatus = [...JOB_ORDER_ROWS, ...rowsWith({ Dispatched: 12 })]
    const tabs = buildTabs('All Job Orders', buildVocabulary(withNewStatus))
    assert.ok(tabs.some(t => t.label === 'Dispatched'), 'A new status must show up on its own')
  })

  test('an empty or unfiltered set yields no tabs beyond All', () => {
    assert.deepEqual(buildVocabulary([]), [])
    // Without clientStatusFilter the loaded set is one status deep, so the
    // vocabulary would be a lie.
    assert.deepEqual(buildVocabulary(APPLICATION_ROWS, false), [])
  })
})

describe('Both views are wired to the dynamic strip', () => {
  test('DynamicApiTable exposes the vocabulary', () => {
    const content = fs.readFileSync(tableFile, 'utf8')
    assert.ok(content.includes('const statusVocabulary = computed'), 'Missing statusVocabulary')
    assert.ok(/defineExpose\(\{[^}]*statusVocabulary/s.test(content), 'statusVocabulary must be exposed')
  })

  test('neither view hardcodes a status list any more', () => {
    for (const [name, file] of [['ApplicationList', applicationView], ['JobOrderList', jobOrderView]]) {
      const content = fs.readFileSync(file, 'utf8')
      assert.ok(
        content.includes('statusVocabulary'),
        `${name} must build its tabs from the data`
      )
      assert.ok(
        content.includes('const statusTabs = computed('),
        `${name} statusTabs must be computed, not a static array`
      )
      assert.ok(
        !/\{ id: 'in_progress'|\{ id: 'inprogress'/.test(content),
        `${name} must not keep the old hand-written tab list`
      )
      assert.ok(
        content.includes('isActiveTab'),
        `${name} must compare the active tab case-insensitively`
      )
    }
  })

  test('the dynamic strip is scoped to the All pages', () => {
    // The per-status menu entries stay until the backend team settles the real
    // vocabulary, so those routes keep their own titles and are not re-tabbed.
    for (const [name, file] of [['ApplicationList', applicationView], ['JobOrderList', jobOrderView]]) {
      const content = fs.readFileSync(file, 'utf8')
      assert.ok(
        content.includes('v-if="!isDedicatedStatusRoute && statusTabs.length > 1"'),
        `${name} must render the strip only on its All page`
      )
    }
  })

  test('the per-status menu entries and their routes are intact', () => {
    const sidebar = fs.readFileSync(path.resolve(__dirname, '../src/components/Sidebar.vue'), 'utf8')
    const search = fs.readFileSync(path.resolve(__dirname, '../src/composables/useSearch.js'), 'utf8')
    const router = fs.readFileSync(path.resolve(__dirname, '../src/router/index.js'), 'utf8')
    for (const route of [
      '/application/in-progress', '/application/done', '/application/approved',
      '/job-orders/inprogress', '/job-orders/completed', '/job-orders/activated'
    ]) {
      assert.ok(router.includes(`path: '${route}'`), `${route} must keep working for existing links`)
      assert.ok(sidebar.includes(`path: '${route}'`), `${route} must stay in the sidebar`)
      assert.ok(search.includes(`route: '${route}'`), `${route} must stay searchable`)
    }
  })

  test('a dead status route still explains itself in the empty state', () => {
    // Without the strip there, the absent-status hint is the only way out.
    const table = fs.readFileSync(tableFile, 'utf8')
    assert.ok(table.includes('absentStatusHint'), 'Missing the absent-status hint')
    assert.ok(table.includes("'select-status'"), 'The hint chips must stay actionable')
  })
})
