// The Service Orders sidebar entry is a group with an All / In Progress /
// Scheduled / Done sub-menu, and the list page filters on `visitStatus` — the
// column Service Orders keep their lifecycle in. There is no `status` column on
// that table, so a filter reading `status` (the table's default) matched nothing.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MENU_CATALOG, menuCodeForPath, resolveMenuCodesFromName } from '../src/constants/menuCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (p) => fs.readFileSync(path.resolve(__dirname, p), 'utf8')

describe('Service Orders sidebar sub-menu', () => {
  const group = MENU_CATALOG.find(i => i.code === 'service-orders')

  test('is a group with the four status children in menu order', () => {
    assert.ok(group, 'service-orders must be in the catalog')
    assert.ok(Array.isArray(group.children), 'service-orders must be a group')
    assert.equal(group.path, undefined, 'a group has no path of its own')
    assert.deepEqual(
      group.children.map(c => [c.code, c.name, c.path]),
      [
        ['service-orders.all', 'All Service Orders', '/service-orders'],
        ['service-orders.in-progress', 'In Progress', '/service-orders/inprogress'],
        ['service-orders.scheduled', 'Scheduled', '/service-orders/scheduled'],
        ['service-orders.done', 'Done', '/service-orders/done']
      ]
    )
  })

  test('the stored "Service Orders" permission still grants the whole group', () => {
    const codes = resolveMenuCodesFromName('Service Orders')
    assert.ok(codes.includes('service-orders'))
    for (const child of group.children) {
      assert.ok(codes.includes(child.code), `${child.code} must be granted by the parent name`)
    }
  })

  test('each child path is governed by its own code', () => {
    assert.equal(menuCodeForPath('/service-orders'), 'service-orders.all')
    assert.equal(menuCodeForPath('/service-orders/inprogress'), 'service-orders.in-progress')
    assert.equal(menuCodeForPath('/service-orders/scheduled'), 'service-orders.scheduled')
    assert.equal(menuCodeForPath('/service-orders/done'), 'service-orders.done')
  })

  test('the router serves every child path', () => {
    const router = read('../src/router/index.js')
    for (const child of group.children) {
      assert.ok(router.includes(`path: '${child.path}'`), `router must define ${child.path}`)
    }
  })
})

describe('Service Orders list filters on visitStatus', () => {
  const view = read('../src/views/ServiceOrderList.vue')
  const table = read('../src/components/DynamicApiTable.vue')

  test('the view points the table at visitStatus', () => {
    assert.match(view, /status-field="visitStatus"/)
    assert.match(view, /client-status-filter/)
  })

  test('the tabs are All / In Progress / Scheduled / Done, spelled as the data is', () => {
    assert.match(view, /value: 'In Progress', routePath: '\/service-orders\/inprogress'/)
    assert.match(view, /value: 'Scheduled', routePath: '\/service-orders\/scheduled'/)
    assert.match(view, /value: 'Done', routePath: '\/service-orders\/done'/)
    assert.doesNotMatch(view, /value: 'Pending', routePath/)
  })

  test('the table honours statusField on the filter, counts and vocabulary', () => {
    assert.match(table, /statusField:\s*\{\s*type: String/)
    const usesFilterStatus = (table.match(/rowFilterStatusOf\(row\)/g) || []).length
    assert.ok(usesFilterStatus >= 3, 'filter, statusCounts and statusVocabulary must read rowFilterStatusOf')
  })

  // The filter as the table applies it, against the live shape of the data
  // (visitStatus carries the status; there is no status column).
  test('a visitStatus filter matches the rows the sidebar promises', () => {
    const rowFieldOf = (row, field) => {
      const want = field.toLowerCase()
      const key = Object.keys(row).find(k => k.toLowerCase() === want)
      return key ? String(row[key] ?? '').trim() : ''
    }
    const normS = (s) => String(s || '').trim().toLowerCase().replace(/[\s_-]+/g, '')
    const rows = [
      { id: 1, visitStatus: 'In Progress' },
      { id: 2, visitStatus: 'Done' },
      { id: 3, visitStatus: 'Reschedule' },
      { id: 4, visitStatus: '' },
      { id: 5, visitStatus: 'in progress' }
    ]
    const filterBy = (status, field) => rows.filter(r => normS(rowFieldOf(r, field)) === normS(status))

    assert.deepEqual(filterBy('In Progress', 'visitStatus').map(r => r.id), [1, 5])
    assert.deepEqual(filterBy('Done', 'visitStatus').map(r => r.id), [2])
    assert.deepEqual(filterBy('Scheduled', 'visitStatus').map(r => r.id), [])
    // The old behaviour: reading `status` finds nothing at all.
    assert.deepEqual(filterBy('In Progress', 'status'), [])
  })
})
