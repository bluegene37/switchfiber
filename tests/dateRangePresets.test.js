import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DATE_PRESETS,
  CUSTOM_PRESET,
  resolveDatePreset,
  currentWeekBounds,
  startOfDay,
  endOfDay,
  isWideRange
} from '../src/utils/dateRangePresets.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VIEWS = ['ApplicationList', 'JobOrderList', 'ServiceOrderList', 'LogsView']

// Sunday 30 August 2026 — deliberately a Sunday, because the week runs Monday to
// Sunday and getDay() === 0 is the case a naive diff-to-Monday gets wrong.
const SUNDAY = new Date(2026, 7, 30, 14, 30, 0, 0)
// Midweek control.
const THURSDAY = new Date(2026, 7, 27, 9, 0, 0, 0)

const iso = (d) => [
  d.getFullYear(),
  String(d.getMonth() + 1).padStart(2, '0'),
  String(d.getDate()).padStart(2, '0')
].join('-')

describe('Date range presets', () => {
  test('every preset covers whole days at both ends', () => {
    // A `to` bound at midnight silently drops everything recorded that day.
    for (const { id } of DATE_PRESETS) {
      const range = resolveDatePreset(id, SUNDAY)
      if (!range) continue
      assert.equal(range.from.getHours(), 0, `${id} from must start at 00:00`)
      assert.equal(range.from.getMinutes(), 0)
      assert.equal(range.from.getSeconds(), 0)
      assert.equal(range.from.getMilliseconds(), 0)
      assert.equal(range.to.getHours(), 23, `${id} to must end at 23:59:59.999`)
      assert.equal(range.to.getMinutes(), 59)
      assert.equal(range.to.getSeconds(), 59)
      assert.equal(range.to.getMilliseconds(), 999)
      assert.ok(range.from <= range.to, `${id} must not invert`)
    }
  })

  test('today is a single day', () => {
    const { from, to } = resolveDatePreset('today', SUNDAY)
    assert.equal(iso(from), '2026-08-30')
    assert.equal(iso(to), '2026-08-30')
  })

  test('the week runs Monday to Sunday, including when today is Sunday', () => {
    const sunday = resolveDatePreset('this_week', SUNDAY)
    assert.equal(iso(sunday.from), '2026-08-24', 'Sunday belongs to the week that started Monday the 24th')
    assert.equal(iso(sunday.to), '2026-08-30')

    const thursday = resolveDatePreset('this_week', THURSDAY)
    assert.equal(iso(thursday.from), '2026-08-24')
    assert.equal(iso(thursday.to), '2026-08-30')

    // currentWeekBounds is the same range, exported for callers that need it directly.
    assert.deepEqual(currentWeekBounds(SUNDAY), sunday)
  })

  test('this_month covers the calendar month', () => {
    const { from, to } = resolveDatePreset('this_month', SUNDAY)
    assert.equal(iso(from), '2026-08-01')
    assert.equal(iso(to), '2026-08-31', 'August has 31 days')
    // February in a non-leap year is the off-by-one trap.
    const feb = resolveDatePreset('this_month', new Date(2026, 1, 10))
    assert.equal(iso(feb.to), '2026-02-28')
    const leapFeb = resolveDatePreset('this_month', new Date(2028, 1, 10))
    assert.equal(iso(leapFeb.to), '2028-02-29')
  })

  test('the wide presets actually span more than one month', () => {
    const twelve = resolveDatePreset('last_12_months', SUNDAY)
    assert.equal(iso(twelve.from), '2025-09-01')
    assert.equal(iso(twelve.to), '2026-08-30')

    const { from, to } = resolveDatePreset('last_12_months', SUNDAY)
    const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
    assert.ok(months >= 2, `last_12_months must reach past the current month, got ${months}`)
    assert.equal(from.getDate(), 1, 'last_12_months must start on a month boundary so the label stays honest')
  })

  test('the 12-month range still matches the auto-widen fallback it replaced', () => {
    // ApplicationList and JobOrderList step out to this range when a window comes
    // back empty; the bounds must not shift under them.
    const now = new Date(2026, 7, 29, 12, 0, 0)
    const { from, to } = resolveDatePreset('last_12_months', now)
    assert.deepEqual(from, new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0))
    assert.deepEqual(to, endOfDay(now))
  })

  test('a year boundary does not produce a negative month', () => {
    const january = new Date(2026, 0, 15)
    const twelve = resolveDatePreset('last_12_months', january)
    assert.equal(iso(twelve.from), '2025-02-01')
  })

  test('custom and unknown presets resolve to nothing', () => {
    // Custom must leave the pickers alone — they hold what the user chose.
    assert.equal(resolveDatePreset(CUSTOM_PRESET, SUNDAY), null)
    assert.equal(resolveDatePreset('', SUNDAY), null)
    assert.equal(resolveDatePreset(undefined, SUNDAY), null)
    assert.equal(resolveDatePreset('last_5_years', SUNDAY), null)
  })

  test('startOfDay and endOfDay bracket the same calendar day', () => {
    const noon = new Date(2026, 7, 30, 12, 0, 0, 0)
    assert.equal(iso(startOfDay(noon)), '2026-08-30')
    assert.equal(iso(endOfDay(noon)), '2026-08-30')
    assert.ok(startOfDay(noon) < noon && noon < endOfDay(noon))
  })

  test('isWideRange marks only the multi-month presets', () => {
    assert.equal(isWideRange('last_12_months'), true)
    assert.equal(isWideRange('this_month'), false)
    assert.equal(isWideRange('this_week'), false)
    assert.equal(isWideRange(CUSTOM_PRESET), false)
  })

  test('the button row offers a custom option and ends with it', () => {
    const ids = DATE_PRESETS.map(p => p.id)
    assert.ok(ids.includes(CUSTOM_PRESET), 'Custom must be offered')
    assert.equal(ids[ids.length - 1], CUSTOM_PRESET, 'Custom belongs after the fixed ranges')
    assert.ok(ids.includes('last_12_months'))
    assert.equal(new Set(ids).size, ids.length, 'Preset ids must be unique')
    for (const p of DATE_PRESETS) {
      assert.ok(p.label && p.label.trim().length, `${p.id} needs a label`)
    }
  })
})

describe('Every date toolbar uses the shared presets', () => {
  test('all four list views render the shared list, not their own copy', () => {
    for (const view of VIEWS) {
      const content = fs.readFileSync(path.resolve(__dirname, `../src/views/${view}.vue`), 'utf8')
      assert.ok(
        content.includes("from '../utils/dateRangePresets'"),
        `${view} must import the shared presets`
      )
      assert.ok(
        content.includes('v-for="preset in DATE_PRESETS"'),
        `${view} must render the shared list so a new range appears everywhere at once`
      )
      assert.ok(
        content.includes('CUSTOM_PRESET'),
        `${view} must handle the custom range`
      )
      assert.ok(
        content.includes('onManualDateChange'),
        `${view} must flip to Custom when a date is picked by hand`
      )
      assert.ok(
        !content.includes("preset === 'this_week'"),
        `${view} must not keep a private copy of the range arithmetic`
      )
    }
  })
})
