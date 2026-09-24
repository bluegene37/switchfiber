// The Users grid offers an Access Level filter in the table's own filter bar:
// levels are listed by name (from the /AccessLevel lookup the grid already
// loads) and rows are matched on accesslevel_id.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const table = fs.readFileSync(path.resolve(__dirname, '../src/components/DynamicApiTable.vue'), 'utf8')

describe('Access Level filter wiring', () => {
  test('the filter bar offers it only where accesslevel_id is a column', () => {
    assert.match(table, /v-if="hasAccessLevelFilter"/)
    assert.match(table, /Access Level:<\/span>/)
    assert.match(table, /v-model="selectedAccessLevelFilter"/)
    assert.match(table, /normalizeColKey\(c\) === 'accesslevelid'\) \|\| ''/)
  })

  test('options are named from the access level lookup', () => {
    assert.match(table, /accessLevelFilterOptions = computed\(\(\) =>\s*\n\s*\(accessLevels\.value \|\| \[\]\)/)
    assert.match(table, /label: l\.nameOnly \|\| l\.label, value: l\.value/)
  })

  test('the pick narrows rows, counts as a filter, and Reset clears it', () => {
    assert.match(table, /list = list\.filter\(row => String\(row\?\.\[col\] \?\? ''\) === wanted\)/)
    assert.match(table, /if \(hasAccessLevelFilter\.value && selectedAccessLevelFilter\.value !== ''\) count\+\+/)
    const reset = table.slice(table.indexOf('const clearAllFilters'))
    assert.match(reset, /selectedAccessLevelFilter\.value = ''/)
  })
})

describe('Access Level filter semantics', () => {
  const rows = [
    { id: 1, accesslevel_id: 3 },
    { id: 2, accesslevel_id: 3 },
    { id: 3, accesslevel_id: 11 },
    { id: 4, accesslevel_id: null }
  ]
  const apply = (selected) => {
    if (selected === '') return rows
    const wanted = String(selected)
    return rows.filter(row => String(row?.accesslevel_id ?? '') === wanted)
  }

  test('a level id keeps only its users; the select value is a string, the row value a number', () => {
    assert.deepEqual(apply('3').map(r => r.id), [1, 2])
    assert.deepEqual(apply('11').map(r => r.id), [3])
  })

  test('All keeps every row, and users with no level never match a pick', () => {
    assert.equal(apply('').length, 4)
    assert.deepEqual(apply('9'), [])
  })
})
