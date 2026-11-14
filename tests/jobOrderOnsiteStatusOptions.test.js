import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(__dirname, '../src/components/DynamicApiTable.vue'), 'utf8')

function loadOnsiteStatusHelpers(initialEditRecord = {}) {
  const startMarker = '// Gene - Nov, 14, 2026: Added Rescheduled and InProgress'
  const start = src.indexOf(startMarker)
  assert.notEqual(start, -1, 'active onsiteStatusOptions block marker should exist')
  const end = src.indexOf('const billingStatusOptions', start)
  assert.notEqual(end, -1, 'billingStatusOptions delimiter should exist after onsiteStatusOptions block')

  const block = src.slice(start, end)
  const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')
  const getStableOptionsWithCurrent = (optionsList, currentVal) => {
    const list = Array.isArray(optionsList) ? optionsList : []
    const raw = currentVal === null || currentVal === undefined ? '' : String(currentVal).trim()
    if (!raw) return list
    const norm = (s) => String(s).trim().toLowerCase().replace(/[\s_-]+/g, '')
    const exists = list.some(o => norm(o.value ?? o.label) === norm(raw))
    return exists ? list : [{ label: raw, value: raw }, ...list]
  }

  const factory = new Function(
    'ref',
    'computed',
    'editFormData',
    'normalizeColKey',
    'getStableOptionsWithCurrent',
    `${block}\nreturn { onsiteStatusOptions, normalizeOnsiteStatus, editOnsiteStatusOptions }`
  )

  return factory(
    (v) => ({ value: v }),
    (fn) => ({ get value() { return fn() } }),
    { value: initialEditRecord },
    normalizeColKey,
    getStableOptionsWithCurrent
  )
}

function loadGetStatusBadgeConfig() {
  const marker = '// Gene - Oct 3, 2026: Differentiated Rescheduled'
  const start = src.indexOf(marker)
  assert.notEqual(start, -1, 'active getStatusBadgeConfig marker should exist')
  const fnStart = src.indexOf('const getStatusBadgeConfig', start)
  const end = src.indexOf('\n}\n', fnStart)
  assert.notEqual(fnStart, -1, 'getStatusBadgeConfig declaration should exist')
  assert.notEqual(end, -1, 'getStatusBadgeConfig closing brace should exist')

  const fnCode = src.slice(fnStart, end + 3)
  return new Function(`${fnCode}\nreturn getStatusBadgeConfig`)()
}

test('getFieldType maps onsiteStatus column to onsitestatus_dropdown', () => {
  const fnStart = src.indexOf('function getFieldType(col)')
  assert.notEqual(fnStart, -1, 'getFieldType declaration should exist')
  const fnEnd = src.indexOf('\nfunction ', fnStart + 1)
  const bodySlice = src.slice(fnStart, fnEnd === -1 ? fnStart + 18000 : fnEnd)
  assert.match(
    bodySlice,
    /if\s*\(\s*lower\s*===\s*'onsitestatus'\s*\)\s*\{\s*return\s*'onsitestatus_dropdown'\s*\}/
  )
})

test('onsiteStatusOptions includes Done, Failed, Rescheduled, and InProgress in order', () => {
  const { onsiteStatusOptions } = loadOnsiteStatusHelpers()
  assert.deepEqual(
    onsiteStatusOptions.value.map(o => o.value),
    ['Done', 'Failed', 'Rescheduled', 'InProgress']
  )
  assert.deepEqual(
    onsiteStatusOptions.value.map(o => o.label),
    ['Done', 'Failed', 'Rescheduled', 'InProgress']
  )
})

test('Create and Edit modal templates bind onsitestatus_dropdown to expected options', () => {
  const tplStart = src.indexOf('<template>')
  const scriptStart = src.indexOf('<script setup>')
  assert.notEqual(tplStart, -1, 'DynamicApiTable.vue should contain a template block')
  assert.notEqual(scriptStart, -1, 'DynamicApiTable.vue should contain script setup')
  const activeTemplate = src.slice(tplStart, scriptStart).replace(/<!--[\s\S]*?-->/g, '')

  const onsiteSelectMatches = [
    ...activeTemplate.matchAll(/<Select\b[^>]*v-else-if="getFieldType\(col\)\s*===\s*'onsitestatus_dropdown'"[^>]*\/>/g)
  ].map(m => m[0])

  assert.equal(onsiteSelectMatches.length, 2, 'Expected Create and Edit onsiteStatus Select elements')
  const [createSelect, editSelect] = onsiteSelectMatches

  assert.match(createSelect, /v-model="formData\[col\]"/)
  assert.match(createSelect, /:options="onsiteStatusOptions"/)

  assert.match(editSelect, /v-model="editFormData\[col\]"/)
  assert.match(editSelect, /:options="editOnsiteStatusOptions"/)
})

test('normalizeOnsiteStatus canonicalizes casing/spacing variants and preserves legacy values', () => {
  const { normalizeOnsiteStatus } = loadOnsiteStatusHelpers()

  assert.equal(normalizeOnsiteStatus('InProgress'), 'InProgress')
  assert.equal(normalizeOnsiteStatus('inprogress'), 'InProgress')
  assert.equal(normalizeOnsiteStatus('In Progress'), 'InProgress')
  assert.equal(normalizeOnsiteStatus('in-progress'), 'InProgress')
  assert.equal(normalizeOnsiteStatus('Rescheduled'), 'Rescheduled')
  assert.equal(normalizeOnsiteStatus('Reschedule'), 'Rescheduled')
  assert.equal(normalizeOnsiteStatus('rescheduled'), 'Rescheduled')
  assert.equal(normalizeOnsiteStatus('done'), 'Done')
  assert.equal(normalizeOnsiteStatus('FAILED'), 'Failed')
  assert.equal(normalizeOnsiteStatus(''), '')
  assert.equal(normalizeOnsiteStatus(null), '')
  assert.equal(normalizeOnsiteStatus('Waiting Parts'), 'Waiting Parts')
})

test('editOnsiteStatusOptions preserves unknown legacy status while keeping standard options', () => {
  const { editOnsiteStatusOptions } = loadOnsiteStatusHelpers({ onsiteStatus: 'Waiting Parts' })
  assert.deepEqual(
    editOnsiteStatusOptions.value.map(o => o.value),
    ['Waiting Parts', 'Done', 'Failed', 'Rescheduled', 'InProgress']
  )

  const canonical = loadOnsiteStatusHelpers({ onsiteStatus: 'In Progress' })
  assert.deepEqual(
    canonical.editOnsiteStatusOptions.value.map(o => o.value),
    ['Done', 'Failed', 'Rescheduled', 'InProgress']
  )
})

test('openEditDialog and normalizeCompareValue normalize onsitestatus_dropdown', () => {
  const openEditStart = src.lastIndexOf('const openEditDialog = async (record) => {')
  assert.notEqual(openEditStart, -1, 'openEditDialog should exist')
  const normCompareStart = src.indexOf('const normalizeCompareValue =', openEditStart)
  assert.notEqual(normCompareStart, -1, 'normalizeCompareValue should exist')
  const openEditSlice = src.slice(openEditStart, normCompareStart)
  assert.match(
    openEditSlice,
    /getFieldType\(col\)\s*===\s*'onsitestatus_dropdown'[\s\S]*?normalizeOnsiteStatus/
  )
  assert.match(
    openEditSlice,
    /type\s*===\s*'onsitestatus_dropdown'[\s\S]*?normalizeOnsiteStatus/
  )

  const normCompareSlice = src.slice(normCompareStart, normCompareStart + 2500)
  assert.match(
    normCompareSlice,
    /if\s*\(\s*type\s*===\s*'onsitestatus_dropdown'\s*\)\s*\{\s*return\s+normalizeOnsiteStatus\(val\)\s*\}/
  )
})

test('getStatusBadgeConfig styles Done, Failed, Rescheduled, and InProgress distinctly', () => {
  const getStatusBadgeConfig = loadGetStatusBadgeConfig()

  const done = getStatusBadgeConfig('Done')
  const failed = getStatusBadgeConfig('Failed')
  const rescheduled = getStatusBadgeConfig('Rescheduled')
  const inProgress = getStatusBadgeConfig('InProgress')

  assert.match(done.class, /text-success/)
  assert.match(failed.class, /text-danger/)
  assert.match(rescheduled.class, /sfa-status-rescheduled/)
  assert.match(inProgress.class, /text-warning-emphasis/)
  assert.equal(rescheduled.label, 'Rescheduled')
  assert.equal(inProgress.label, 'InProgress')
})
