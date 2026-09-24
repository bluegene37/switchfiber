// Regression: after creating an Application the list could show "no records"
// even though the save succeeded. The table refetches with the page's current
// status tab and date window, so a record whose status is not the active tab
// (an Inprogress application created from /application/done) or one created
// while a past date range is pinned never appears. The page now drops those
// filters when, and only when, the new record would be hidden.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createdRecordHiddenBy } from '../src/utils/createdRecordVisibility.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8')

const NOW = new Date(2026, 8, 16, 18, 37, 0) // 2026-09-16 18:37 local

describe('createdRecordHiddenBy: status tab', () => {
  test('the All tab never hides a new record', () => {
    const r = createdRecordHiddenBy({ createdStatus: 'Inprogress', activeStatus: '', now: NOW })
    assert.equal(r.status, false)
    assert.equal(r.hidden, false)
  })

  test('the same status spelled differently is still the same tab', () => {
    for (const active of ['Inprogress', 'In Progress', 'in-progress', 'IN_PROGRESS']) {
      const r = createdRecordHiddenBy({ createdStatus: 'Inprogress', activeStatus: active, now: NOW })
      assert.equal(r.status, false, `${active} must match Inprogress`)
    }
  })

  test('a different active tab hides the record', () => {
    for (const active of ['Cancelled', 'Done', 'Approved', 'Schedule']) {
      const r = createdRecordHiddenBy({ createdStatus: 'Inprogress', activeStatus: active, now: NOW })
      assert.equal(r.status, true, `${active} tab cannot show an Inprogress record`)
      assert.equal(r.hidden, true)
    }
  })

  test('an unknown created status on a filtered tab counts as hidden', () => {
    const r = createdRecordHiddenBy({ createdStatus: undefined, activeStatus: 'Schedule', now: NOW })
    assert.equal(r.status, true)
  })
})

describe('createdRecordHiddenBy: date window', () => {
  test('a window that contains today does not hide the record', () => {
    const r = createdRecordHiddenBy({
      createdStatus: 'Inprogress', activeStatus: '',
      fromDate: new Date(2026, 8, 14), toDate: new Date(2026, 8, 20), now: NOW
    })
    assert.equal(r.window, false)
    assert.equal(r.hidden, false)
  })

  test('the window is inclusive of its edge days', () => {
    const r = createdRecordHiddenBy({
      createdStatus: 'Inprogress', activeStatus: '',
      fromDate: new Date(2026, 8, 16), toDate: new Date(2026, 8, 16), now: NOW
    })
    assert.equal(r.window, false, 'a same-day range must include a record saved that evening')
  })

  test('a past range hides the record', () => {
    const r = createdRecordHiddenBy({
      createdStatus: 'Inprogress', activeStatus: '',
      fromDate: new Date(2026, 7, 1), toDate: new Date(2026, 7, 31), now: NOW
    })
    assert.equal(r.window, true)
    assert.equal(r.hidden, true)
  })

  test('a future range hides the record', () => {
    const r = createdRecordHiddenBy({
      createdStatus: 'Inprogress', activeStatus: '',
      fromDate: new Date(2026, 9, 1), toDate: new Date(2026, 9, 31), now: NOW
    })
    assert.equal(r.window, true)
  })

  test('no window (default week) and string dates both work', () => {
    assert.equal(createdRecordHiddenBy({ createdStatus: 'Inprogress', activeStatus: '', fromDate: null, toDate: null, now: NOW }).hidden, false)
    assert.equal(createdRecordHiddenBy({ createdStatus: 'Inprogress', activeStatus: '', fromDate: '2026-09-14', toDate: '2026-09-20', now: NOW }).hidden, false)
    assert.equal(createdRecordHiddenBy({ createdStatus: 'Inprogress', activeStatus: '', fromDate: '2026-08-01', toDate: '2026-08-31', now: NOW }).hidden, true)
  })

  test('an unparseable date is treated as no bound, never as hidden', () => {
    const r = createdRecordHiddenBy({ createdStatus: 'Inprogress', activeStatus: '', fromDate: 'not a date', toDate: 'nope', now: NOW })
    assert.equal(r.window, false)
  })
})

describe('the create event is wired end to end', () => {
  const table = read('../src/components/DynamicApiTable.vue')
  const page = read('../src/views/ApplicationList.vue')

  test('DynamicApiTable declares and emits `created` after a successful save', () => {
    const emits = table.match(/defineEmits\(\[([^\]]*)\]\)/)
    assert.ok(emits, 'defineEmits not found')
    assert.ok(emits[1].includes("'created'"), '`created` must be a declared emit')
    const saveData = table.slice(table.indexOf('const saveData = async'), table.indexOf('const getRecordId'))
    assert.ok(saveData.includes('await CrudService.create(props.endpoint, finalPayload)'), 'create call moved')
    assert.ok(saveData.includes("emit('created', { endpoint: props.endpoint, payload: finalPayload })"), 'saveData must emit the saved payload')
    assert.ok(
      saveData.indexOf('await fetchData()') < saveData.indexOf("emit('created'"),
      'the emit must follow the refetch so the page reacts to settled data'
    )
    assert.ok(
      saveData.indexOf("emit('created'") < saveData.indexOf('} catch (err)'),
      'a failed create must not announce a record'
    )
  })

  test('ApplicationList listens and drops its filters only when the record would be hidden', () => {
    assert.ok(page.includes('@created="onCreated"'), 'the page must listen for the event')
    assert.ok(page.includes("from '../utils/createdRecordVisibility'"), 'the decision lives in the shared helper')
    const handler = page.slice(page.indexOf('const onCreated'), page.indexOf('const formatDateParam'))
    assert.ok(handler.includes('createdRecordHiddenBy({'), 'handler must consult the helper')
    assert.ok(handler.includes('if (!hidden) return'), 'a visible record must leave the filters alone')
    assert.ok(handler.includes('clearAllFilters()'), 'a hidden record resets status and date window')
    assert.ok(handler.includes("router.push({ path: '/application' })"), 'a dedicated status route must move to the All page')
  })

  test('the Done and Approved menu entries are untouched (they explain themselves in the empty state)', () => {
    const catalog = read('../src/constants/menuCatalog.js')
    for (const route of ['/application/done', '/application/approved']) {
      assert.ok(catalog.includes(`path: '${route}'`), `${route} must stay in the menu catalog`)
    }
  })
})
