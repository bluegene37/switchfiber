// Service Orders' Assigned filter shows a user's name but matches rows on the email
// the record stores (`assignedEmail`). Technician accounts and staff who handle service orders
// are selected from /Users and their email address is stored.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (p) => fs.readFileSync(path.resolve(__dirname, p), 'utf8')

const view = read('../src/views/ServiceOrderList.vue')
const table = read('../src/components/DynamicApiTable.vue')

describe('Service Orders Assigned filter and column wiring', () => {
  test('the view offers an Assigned dropdown with search bound to the table client filter', () => {
    assert.match(view, /Assigned:<\/span>/)
    assert.match(view, /v-model="selectedAssignedEmail"/)
    assert.match(view, /:options="assignedOptions"/)
    assert.match(view, /:client-filters="clientFilters"/)
    assert.match(view, /assignedEmail: selectedAssignedEmail\.value/)
    assert.match(view, /filterPlaceholder="Search by name or email"/)
  })

  test('the options come from the table, which owns the /Users lookup', () => {
    assert.match(view, /apiTableRef\.value\?\.assignedEmailFilterOptions/)
    assert.match(table, /assignedEmailFilterOptions/)
  })

  test('Reset clears the assignee too', () => {
    const body = view.slice(view.indexOf('const clearAllFilters'))
    assert.match(body, /selectedAssignedEmail\.value = null/)
  })

  test('SERVICE_ORDER_COLUMNS includes assignedEmail', () => {
    assert.match(table, /const SERVICE_ORDER_COLUMNS = \[[\s\S]*?'assignedEmail'[\s\S]*?\]/)
  })

  test('needsUserLookup inspects columns and formColumns for assignedemail_dropdown', () => {
    assert.match(table, /needsUserLookup = computed\(\(\) =>[\s\S]*?assignedemail_dropdown/)
  })
})

describe('Service Orders Assigned filter semantics', () => {
  const rowFieldOf = (row, field) => {
    const want = field.toLowerCase()
    const key = Object.keys(row).find(k => k.toLowerCase() === want)
    return key ? String(row[key] ?? '').trim() : ''
  }

  const applyClientFilters = (rows, filters) => {
    const active = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    return rows.filter(row => active.every(([field, value]) =>
      rowFieldOf(row, field).toLowerCase() === String(value).trim().toLowerCase()
    ))
  }

  const rows = [
    { id: 1, visitStatus: 'In Progress', assignedEmail: 'tech1@switchfiber.ph' },
    { id: 2, visitStatus: 'Scheduled', assignedEmail: 'TECH2@switchfiber.ph' },
    { id: 3, visitStatus: 'Done', assignedEmail: 'bluegene37@gmail.com' },
    { id: 4, visitStatus: 'Done', assignedEmail: '' }
  ]

  test('picking a user filters by their email, case-insensitively', () => {
    assert.deepEqual(applyClientFilters(rows, { assignedEmail: 'bluegene37@gmail.com' }).map(r => r.id), [3])
    assert.deepEqual(applyClientFilters(rows, { assignedEmail: 'tech2@switchfiber.ph' }).map(r => r.id), [2])
  })

  test('a blank selection is no filter, and blank assignees never match a pick', () => {
    assert.equal(applyClientFilters(rows, { assignedEmail: '' }).length, 4)
    assert.equal(applyClientFilters(rows, { assignedEmail: null }).length, 4)
    assert.deepEqual(applyClientFilters(rows, { assignedEmail: 'nobody@switchfiber.ph' }), [])
  })
})
