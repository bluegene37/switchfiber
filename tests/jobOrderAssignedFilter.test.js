// Job Orders' Assigned filter shows a user's name but matches rows on the email
// the record stores (`assignedEmail`). Technician accounts hold most job orders
// and have no /Users row, so those emails must still be offered — as themselves.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (p) => fs.readFileSync(path.resolve(__dirname, p), 'utf8')

const view = read('../src/views/JobOrderList.vue')
const table = read('../src/components/DynamicApiTable.vue')

describe('Job Orders Assigned filter wiring', () => {
  test('the view offers an Assigned dropdown bound to the table client filter', () => {
    assert.match(view, /Assigned:<\/span>/)
    assert.match(view, /v-model="selectedAssignedEmail"/)
    assert.match(view, /:options="assignedOptions"/)
    assert.match(view, /:client-filters="clientFilters"/)
    assert.match(view, /assignedEmail: selectedAssignedEmail\.value/)
  })

  test('the options come from the table, which owns the /Users lookup', () => {
    assert.match(view, /apiTableRef\.value\?\.assignedEmailFilterOptions/)
    assert.match(table, /assignedEmailFilterOptions,\s*\n\s*hasFetched/)
  })

  test('Reset clears the assignee too', () => {
    const body = view.slice(view.indexOf('const clearAllFilters'))
    assert.match(body, /selectedAssignedEmail\.value = null/)
  })

  test('the table declares clientFilters and applies it to rows and tab counts', () => {
    assert.match(table, /clientFilters:\s*\{\s*type: Object/)
    assert.match(table, /list = list\.filter\(matchesClientFilters\)/)
    assert.match(table, /dated\.filter\(matchesClientFilters\)/)
  })
})

describe('Assigned filter semantics', () => {
  // The option builder and the row matcher as the table implements them.
  const rowFieldOf = (row, field) => {
    const want = field.toLowerCase()
    const key = Object.keys(row).find(k => k.toLowerCase() === want)
    return key ? String(row[key] ?? '').trim() : ''
  }
  const buildOptions = (users, rows) => {
    const byEmail = new Map()
    users.forEach(u => {
      const name = [u.fname, u.lname].filter(Boolean).join(' ').trim() || u.username || u.email
      byEmail.set(u.email.toLowerCase(), { label: name, value: u.email, email: u.email })
    })
    rows.forEach(row => {
      const email = rowFieldOf(row, 'assignedEmail')
      if (!email) return
      const key = email.toLowerCase()
      if (!byEmail.has(key)) byEmail.set(key, { label: email, value: email, email })
    })
    return Array.from(byEmail.values()).sort((a, b) => a.label.localeCompare(b.label))
  }
  const applyClientFilters = (rows, filters) => {
    const active = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    return rows.filter(row => active.every(([field, value]) =>
      rowFieldOf(row, field).toLowerCase() === String(value).trim().toLowerCase()
    ))
  }

  const users = [
    { fname: 'Gene Ray', lname: 'Medel', email: 'bluegene37@gmail.com' },
    { fname: 'Blaine Ivory', lname: 'Medel', email: 'blainei.medel@gmail.com' }
  ]
  const rows = [
    { id: 1, assignedEmail: 'tech1@switchfiber.ph', status: 'Activated' },
    { id: 2, assignedEmail: 'TECH1@switchfiber.ph', status: 'Inprogress' },
    { id: 3, assignedEmail: 'bluegene37@gmail.com', status: 'Activated' },
    { id: 4, assignedEmail: '', status: 'Activated' }
  ]

  test('options show a name for users and the email itself for unknown assignees', () => {
    const options = buildOptions(users, rows)
    assert.deepEqual(options.map(o => [o.label, o.value]), [
      ['Blaine Ivory Medel', 'blainei.medel@gmail.com'],
      ['Gene Ray Medel', 'bluegene37@gmail.com'],
      ['tech1@switchfiber.ph', 'tech1@switchfiber.ph']
    ])
  })

  test('picking a name filters by its email, case-insensitively', () => {
    assert.deepEqual(applyClientFilters(rows, { assignedEmail: 'bluegene37@gmail.com' }).map(r => r.id), [3])
    assert.deepEqual(applyClientFilters(rows, { assignedEmail: 'tech1@switchfiber.ph' }).map(r => r.id), [1, 2])
  })

  test('a blank selection is no filter, and blank assignees never match a pick', () => {
    assert.equal(applyClientFilters(rows, { assignedEmail: '' }).length, 4)
    assert.equal(applyClientFilters(rows, { assignedEmail: null }).length, 4)
    assert.deepEqual(applyClientFilters(rows, { assignedEmail: 'nobody@switchfiber.ph' }), [])
  })
})
