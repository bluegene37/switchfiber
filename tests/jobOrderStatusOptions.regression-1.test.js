import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicTablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const dynamicTableSrc = fs.readFileSync(dynamicTablePath, 'utf8')

describe('Job Orders In Progress and Completed Status Dropdown Scoping (Regression)', () => {
  test('DynamicApiTable defines route/filter detection helpers for In Progress and Completed', () => {
    assert.match(dynamicTableSrc, /const isJobOrderInProgress = computed\(/, 'Must define isJobOrderInProgress')
    assert.match(dynamicTableSrc, /const isJobOrderCompleted = computed\(/, 'Must define isJobOrderCompleted')
    assert.match(dynamicTableSrc, /const isJobOrderActivated = computed\(/, 'Must define isJobOrderActivated')
  })

  test('statusOptions on In Progress menu contains exclusively Inprogress and Scheduled (same in value and label)', () => {
    const m = dynamicTableSrc.match(/if\s*\(isJobOrderInProgress\.value\)\s*\{\s*return\s*(\[[^\]]*\])/)
    assert.ok(m, 'statusOptions must contain an isJobOrderInProgress return array')
    
    const arrayText = m[1]
    assert.match(arrayText, /label:\s*'Inprogress',\s*value:\s*'Inprogress'/, 'Must contain Inprogress option')
    assert.match(arrayText, /label:\s*'Scheduled',\s*value:\s*'Scheduled'/, 'Must contain Scheduled option')
    assert.doesNotMatch(arrayText, /value:\s*'Completed'/, 'In Progress menu must NOT contain Completed')
    assert.doesNotMatch(arrayText, /value:\s*'Activated'/, 'In Progress menu must NOT contain Activated')
  })

  test('statusOptions on Completed menu contains exclusively Completed and Activated', () => {
    const m = dynamicTableSrc.match(/if\s*\(isJobOrderCompleted\.value\)\s*\{\s*return\s*(\[[^\]]*\])/)
    assert.ok(m, 'statusOptions must contain an isJobOrderCompleted return array')
    
    const arrayText = m[1]
    assert.match(arrayText, /label:\s*'Completed',\s*value:\s*'Completed'/, 'Must contain Completed option')
    assert.match(arrayText, /label:\s*'Activated',\s*value:\s*'Activated'/, 'Must contain Activated option')
    assert.doesNotMatch(arrayText, /value:\s*'Scheduled'/, 'Completed menu must NOT contain Scheduled')
    assert.doesNotMatch(arrayText, /value:\s*'Inprogress'/, 'Completed menu must NOT contain Inprogress')
  })

  test('editStatusOptions delegates to getStableOptionsWithCurrent with scoped statusOptions', () => {
    const editStatusBlock = dynamicTableSrc.match(/const editStatusOptions = computed\(\(\) => \{([\s\S]*?return getStableOptionsWithCurrent\(statusOptions\.value,\s*current\)\s*\})/)
    assert.ok(editStatusBlock, 'Must define editStatusOptions delegating to getStableOptionsWithCurrent')
    assert.doesNotMatch(editStatusBlock[1], /if\s*\(isJobOrderEndpoint\.value\)\s*return/, 'Must not bypass getStableOptionsWithCurrent for Job Orders')
  })

  test('openCreateDialog sets context-sensitive default status for Job Orders', () => {
    assert.match(dynamicTableSrc, /if\s*\(isJobOrderCompleted\.value\)\s*\{\s*formData\.value\[statusCol\] = 'Completed'/, 'Completed menu Create dialog must default to Completed')
    assert.match(dynamicTableSrc, /if\s*\(isJobOrderInProgress\.value\)\s*\{\s*formData\.value\[statusCol\] = 'Inprogress'/, 'In Progress menu Create dialog must default to Inprogress')
  })

  test('buildJobOrderPayload normalizes status to backend database values', () => {
    assert.match(dynamicTableSrc, /cleanKey === 'inprogress'\)\s*return 'Inprogress'/, 'Must normalize In Progress variants to Inprogress')
    assert.match(dynamicTableSrc, /cleanKey === 'scheduled'\)\s*return 'Scheduled'/, 'Must normalize Scheduled variants to Scheduled')
    assert.match(dynamicTableSrc, /cleanKey === 'completed'\)\s*return 'Completed'/, 'Must normalize Completed variants to Completed')
    assert.match(dynamicTableSrc, /cleanKey === 'activated'\)\s*return 'Activated'/, 'Must normalize Activated variants to Activated')
  })

  test('openEditDialog normalizes existing Job Order status values to prevent mismatch', () => {
    assert.match(dynamicTableSrc, /isJobOrderEndpoint\.value && curStatus/, 'openEditDialog must handle Job Orders status normalization')
    assert.match(dynamicTableSrc, /editFormData\.value\[statusCol\] = 'Inprogress'/, 'Must normalize to Inprogress on edit open')
    assert.match(dynamicTableSrc, /editFormData\.value\[statusCol\] = 'Completed'/, 'Must normalize to Completed on edit open')
  })
})
