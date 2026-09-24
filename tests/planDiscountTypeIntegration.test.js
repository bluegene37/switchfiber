import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EndpointColumns } from '../src/models/columns.js'
import { resolveRequiredFields, hasRequiredOverride } from '../src/models/requiredFields.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicTablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const dynamicTableSrc = fs.readFileSync(dynamicTablePath, 'utf8')

describe('Plan & Discount Type Integration Suite', () => {
  test('EndpointColumns.Plans includes discountId and core plan fields', () => {
    assert.ok(Array.isArray(EndpointColumns.Plans), 'EndpointColumns.Plans must be defined')
    assert.ok(EndpointColumns.Plans.includes('id'), 'Plans must include id')
    assert.ok(EndpointColumns.Plans.includes('name'), 'Plans must include name')
    assert.ok(EndpointColumns.Plans.includes('description'), 'Plans must include description')
    assert.ok(EndpointColumns.Plans.includes('amount'), 'Plans must include amount')
    assert.ok(EndpointColumns.Plans.includes('discountId'), 'Plans must include discountId')
  })

  test('Required fields configuration requires name and amount for plans, leaving discountId optional', () => {
    assert.ok(hasRequiredOverride('Plans'), 'plans should have a required override')
    const required = resolveRequiredFields('Plans', ['id', 'name', 'description', 'amount', 'discountId'])
    assert.deepEqual(required, ['name', 'amount'], 'Plans required fields should be name and amount only')
  })

  test('DynamicApiTable defines concise PLAN_COLUMNS with discountId', () => {
    assert.ok(
      dynamicTableSrc.includes('const PLAN_COLUMNS = [') &&
      dynamicTableSrc.includes("'discountId'"),
      'DynamicApiTable must define PLAN_COLUMNS with discountId'
    )
    assert.ok(
      dynamicTableSrc.includes('Plans: PLAN_COLUMNS'),
      'CONCISE_ENDPOINT_COLUMNS must register Plans: PLAN_COLUMNS'
    )
    assert.ok(
      dynamicTableSrc.includes('plans: PLAN_COLUMNS'),
      'CONCISE_ENDPOINT_COLUMNS must register plans: PLAN_COLUMNS'
    )
  })

  test('defaultVisibleColumns checks isPlanEndpoint and filters against PLAN_COLUMNS', () => {
    assert.ok(
      dynamicTableSrc.includes('if (isPlanEndpoint.value) {'),
      'defaultVisibleColumns must check isPlanEndpoint.value'
    )
    assert.ok(
      dynamicTableSrc.includes('PLAN_COLUMNS.some(pref => normalizeColKey(pref) === normalizeColKey(col))'),
      'defaultVisibleColumns must match against PLAN_COLUMNS'
    )
  })

  test('needsDiscountTypeLookup triggers lookup for Plan endpoints and discounttype_dropdown', () => {
    assert.ok(
      dynamicTableSrc.includes('isPlanEndpoint.value ||'),
      'needsDiscountTypeLookup must include isPlanEndpoint.value'
    )
    assert.ok(
      dynamicTableSrc.includes("columns.value.some(c => getFieldType(c) === 'discounttype_dropdown')"),
      'needsDiscountTypeLookup must check discounttype_dropdown'
    )
  })

  test('DataTable renders discounttype_dropdown with badge and tooltip', () => {
    assert.ok(
      dynamicTableSrc.includes(":title=\"getDiscountTypeTooltip(slotProps.data[col])\""),
      'discounttype_dropdown cell must bind getDiscountTypeTooltip'
    )
    assert.ok(
      dynamicTableSrc.includes("badge bg-primary bg-opacity-10 text-primary"),
      'discounttype_dropdown cell must use styled badge'
    )
  })

  test('getDiscountTypeTooltip helper function is implemented in script', () => {
    assert.ok(
      dynamicTableSrc.includes('const getDiscountTypeTooltip = (val) =>'),
      'getDiscountTypeTooltip must be defined in script'
    )
  })

  test('Create and Edit dropdowns for discounttype_dropdown include showClear', () => {
    const matches = dynamicTableSrc.match(/v-else-if="getFieldType\(col\) === 'discounttype_dropdown'"[\s\S]*?showClear/g)
    assert.ok(matches && matches.length >= 2, 'Both Create and Edit Select dropdowns must have showClear')
  })

  test('Search filter tokenization includes discount type and plan dropdown label indexing', () => {
    assert.ok(
      dynamicTableSrc.includes("if (fType === 'discounttype_dropdown' || fType === 'plan_dropdown')"),
      'applyFilters must check discounttype_dropdown'
    )
    assert.ok(
      dynamicTableSrc.includes('const labelVal = formatDisplayValue(val, cols[i])'),
      'applyFilters must index resolved label value'
    )
  })

  test('formatDisplayValue returns dash for 0 or missing discountId and resolves discount type name', () => {
    assert.ok(
      dynamicTableSrc.includes("if (type === 'discounttype_dropdown' && (val === 0 || val === '0')) return '-'"),
      'formatDisplayValue must return - for 0 or string 0'
    )
    assert.ok(
      dynamicTableSrc.includes("type === 'discounttype_dropdown' ? (found.name || found.label) : found.label"),
      'formatDisplayValue must resolve to found.name or found.label'
    )
  })

  test('Payload builders parse amount and discountId as numbers and clear blank discountId on update', () => {
    assert.ok(
      dynamicTableSrc.includes('if (isPlanEndpoint.value) {'),
      'saveData and saveEditRecord must handle isPlanEndpoint'
    )
    assert.ok(
      dynamicTableSrc.includes('finalPayload.amount = Number(finalPayload.amount)'),
      'saveData must convert amount to Number'
    )
    assert.ok(
      dynamicTableSrc.includes('finalPayload.discountId = Number(finalPayload.discountId)'),
      'saveData and saveEditRecord must convert discountId to Number'
    )
    assert.ok(
      dynamicTableSrc.includes('finalPayload.discountId = null'),
      'saveEditRecord must reset cleared discountId to null'
    )
  })
})
