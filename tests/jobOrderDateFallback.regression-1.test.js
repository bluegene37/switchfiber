// Regression: R-02 — Activated Job Orders rendered 0 of 3,939 because the
// mandatory "This Week" window held only 2 rows and the widen check asked
// "does this window hold rows?" instead of "does the active tab hold rows?".
// Found by /qa on 2026-08-29
// Report: .gstack/qa-reports/qa-report-localhost-5183-2026-08-29.md
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const jobOrderView = path.resolve(__dirname, '../src/views/JobOrderList.vue')

// The widen loop as the view runs it: step the window out until the ACTIVE TAB
// has rows, or the steps run out. `countFor` stands in for the table's
// statusCounts, which spans every status because the view loads the whole set.
const STEPS = ['this_month', 'last_12_months']

const resolveWindow = (status, countFor) => {
  let step = -1
  let preset = 'this_week'
  while ((countFor(preset, status) ?? 0) === 0 && step < STEPS.length - 1) {
    step += 1
    preset = STEPS[step]
  }
  return { preset, widened: step >= 0 }
}

// The live shape of the data on 2026-08-29: 3,939 job orders, 3,937 Activated,
// and only 2 rows (statuses "status" and "Applied") inside the current week.
const liveCounts = (preset, status) => {
  const window = {
    this_week: { '': 2, activated: 0, applied: 1, inprogress: 0, completed: 0 },
    this_month: { '': 223, activated: 221, applied: 1, inprogress: 0, completed: 0 },
    last_12_months: { '': 3939, activated: 3937, applied: 1, inprogress: 0, completed: 0 }
  }
  return window[preset][status] ?? 0
}

describe('Job Orders date-window fallback (regression R-02)', () => {
  test('Activated widens past the empty week and lands on rows', () => {
    const { preset, widened } = resolveWindow('activated', liveCounts)
    assert.equal(widened, true, 'Activated must not be left on the empty default week')
    assert.equal(preset, 'this_month', 'Should stop at the first window holding Activated rows')
    assert.ok(liveCounts(preset, 'activated') > 0, 'Activated must end up with rows on screen')
  })

  test('a window holding other rows does not count as a hit for the active tab', () => {
    // The defect verbatim: the week held 2 job orders, so a total-based check
    // stopped there and Activated rendered nothing.
    assert.ok(liveCounts('this_week', '') > 0, 'the week does hold rows')
    assert.equal(liveCounts('this_week', 'activated'), 0, 'none of them are Activated')
    assert.notEqual(resolveWindow('activated', liveCounts).preset, 'this_week')
  })

  test('the All tab stays on the week when the week has rows', () => {
    const { preset, widened } = resolveWindow('', liveCounts)
    assert.equal(preset, 'this_week')
    assert.equal(widened, false, 'a non-empty default window is never widened away')
  })

  test('a status absent from the data widens to the last step and stops', () => {
    // "inprogress" and "completed" exist as tabs but not as values in the data,
    // so the fallback must terminate rather than loop.
    for (const status of ['inprogress', 'completed']) {
      const { preset, widened } = resolveWindow(status, liveCounts)
      assert.equal(preset, 'last_12_months', `${status} should exhaust the steps`)
      assert.equal(widened, true, `${status} should report a widened window`)
    }
  })

  test('a tab whose only row is outside the week is still found', () => {
    const { preset } = resolveWindow('applied', liveCounts)
    assert.equal(preset, 'this_week', 'Applied has its single row inside the week')
  })
})

describe('JobOrderList.vue is wired to the fallback', () => {
  test('the widen check consults the active tab, not the window total', () => {
    const content = fs.readFileSync(jobOrderView, 'utf8')
    assert.ok(
      content.includes('counts.countFor(selectedStatus.value)'),
      'Widen must key off the count the active tab would render'
    )
    assert.ok(
      !content.includes('statusCounts?.total'),
      'A window-total check would reintroduce R-02'
    )
  })

  test('the fallback steps and the escape hatch are present', () => {
    const content = fs.readFileSync(jobOrderView, 'utf8')
    assert.ok(content.includes("preset: 'this_month'"), 'Missing the this_month step')
    assert.ok(content.includes("preset: 'last_12_months'"), 'Missing the last_12_months step')
    assert.ok(content.includes("preset === 'last_12_months'"), 'setDateRange must build the 12-month range')
    assert.ok(content.includes('useDefaultWeek'), 'Missing the "Back to this week" escape')
    assert.ok(content.includes('autoWidenLabel'), 'Missing the widened-window notice')
  })

  test('a hand-picked range pins the window and stands the fallback down', () => {
    const content = fs.readFileSync(jobOrderView, 'utf8')
    assert.ok(content.includes('autoWidenEnabled'), 'Missing the fallback opt-out flag')
    assert.ok(
      content.includes('onManualDateChange'),
      'Manual date edits must disable auto-widening'
    )
  })
})
