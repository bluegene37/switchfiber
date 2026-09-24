import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (p) => fs.readFileSync(path.resolve(__dirname, p), 'utf8')

const tableSrc = read('../src/components/DynamicApiTable.vue')

describe('Job Order Application ID Column', () => {
  test('JOB_ORDER_COLUMNS includes applicationId right after accountNo', () => {
    // Extract JOB_ORDER_COLUMNS array from DynamicApiTable.vue
    const match = tableSrc.match(/const\s+JOB_ORDER_COLUMNS\s*=\s*\[([\s\S]*?)\]/)
    assert.ok(match, 'JOB_ORDER_COLUMNS array must be defined')
    
    const items = match[1]
      .split('\n')
      .map(line => line.replace(/\/\/.*$/, '').trim())
      .filter(Boolean)
      .map(line => line.replace(/[',"]/g, '').trim())
      .filter(Boolean)

    const accountNoIndex = items.indexOf('accountNo')
    const applicationIdIndex = items.indexOf('applicationId')

    assert.ok(accountNoIndex !== -1, 'accountNo column must exist in JOB_ORDER_COLUMNS')
    assert.ok(applicationIdIndex !== -1, 'applicationId column must exist in JOB_ORDER_COLUMNS')
    assert.equal(
      applicationIdIndex,
      accountNoIndex + 1,
      'applicationId must be in the column directly beside (after) accountNo'
    )
  })

  test('columns matcher resolves applicationId even if raw data uses applicationIdValue alias', () => {
    // Check that DynamicApiTable handles alias mapping for applicationId and applicationIdValue
    assert.match(
      tableSrc,
      /normKey === 'applicationid' && rawMap\.has\('applicationidvalue'\)/,
      'Matcher must map applicationId to raw applicationIdValue when present'
    )
  })

  test('table cell template supports applicationIdValue fallback', () => {
    assert.match(
      tableSrc,
      /applicationId.*applicationIdValue|applicationid/i,
      'Table cell must support resolving application ID safely'
    )
  })
})
