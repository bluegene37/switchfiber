import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const componentPath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const src = fs.readFileSync(componentPath, 'utf8')

describe('DynamicApiTable DevTools Class Identifiers (sfa-)', () => {
  test('table structure has predictable sfa- classes', () => {
    assert.match(src, /class="sfa-tracker-table-datatable"/, 'DataTable must have sfa-tracker-table-datatable')
    assert.match(src, /sfa-tracker-table-toolbar/, 'Toolbar must have sfa-tracker-table-toolbar')
    assert.match(src, /sfa-tracker-table-search/, 'Search box must have sfa-tracker-table-search')
    assert.match(src, /sfa-tracker-table-topbar-create-btn/, 'Create button must have sfa-tracker-table-topbar-create-btn')
    assert.match(src, /sfa-tracker-table-col-actions/, 'Actions column must have sfa-tracker-table-col-actions')
  })

  test('column headers and cells have dynamic sfa-header- and sfa-cell- classes', () => {
    assert.match(src, /`sfa-header-\$\{String\(col\)\.toLowerCase\(\)\}`/, 'Column header must have sfa-header-[col]')
    assert.match(src, /`sfa-cell-\$\{String\(col\)\.toLowerCase\(\)\}`/, 'Column body must have sfa-cell-[col]')
  })

  test('dialogs have predictable sfa-tracker-dialog- classes', () => {
    assert.match(src, /class="sfa-tracker-dialog-create"/, 'Create dialog must have sfa-tracker-dialog-create')
    assert.match(src, /class="sfa-tracker-dialog-edit"/, 'Edit dialog must have sfa-tracker-dialog-edit')
    assert.match(src, /class="sfa-tracker-dialog-view"/, 'View dialog must have sfa-tracker-dialog-view')
    assert.match(src, /class="sfa-tracker-dialog-delete"/, 'Delete dialog must have sfa-tracker-dialog-delete')
  })

  test('form fields have sfa-form-field and sfa-view-field classes with lowercase column suffix', () => {
    assert.match(src, /'sfa-form-field'/, 'Create/Edit fields must have sfa-form-field')
    assert.match(src, /`sfa-form-field-\$\{String\(col\)\.toLowerCase\(\)\}`/, 'Create/Edit fields must have sfa-form-field-[col]')
    assert.match(src, /'sfa-view-field'/, 'View details fields must have sfa-view-field')
    assert.match(src, /`sfa-view-field-\$\{String\(col\)\.toLowerCase\(\)\}`/, 'View details fields must have sfa-view-field-[col]')
  })
})
