// Gene - Oct 20, 2026: Comprehensive test suite for Inventory payload builders, field length constraints, base64 image sanitization, and 500 truncation error prevention
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicApiTableSource = fs.readFileSync(
  path.resolve(__dirname, '../src/components/DynamicApiTable.vue'),
  'utf8'
)

describe('Inventory Payload Normalization and SQL Length Protection Suite', () => {
  test('DynamicApiTable defines inventory endpoint computed flags', () => {
    assert.ok(
      dynamicApiTableSource.includes('const isInventoryCategoryEndpoint = computed('),
      'Must define isInventoryCategoryEndpoint'
    )
    assert.ok(
      dynamicApiTableSource.includes('const isInventoryItemEndpoint = computed('),
      'Must define isInventoryItemEndpoint'
    )
    assert.ok(
      dynamicApiTableSource.includes('const isInventoryLogEndpoint = computed('),
      'Must define isInventoryLogEndpoint'
    )
  })

  test('getFieldType returns inventory_item_image for InventoryItem image field', () => {
    assert.ok(
      dynamicApiTableSource.includes('if (isInventoryItemEndpoint.value) {'),
      'getFieldType must check isInventoryItemEndpoint.value'
    )
    assert.ok(
      dynamicApiTableSource.includes("return 'inventory_item_image'"),
      "getFieldType must return 'inventory_item_image' for InventoryItem image field"
    )
  })

  test('getFieldMaxLength enforces exact SQL Server column lengths for all inventory endpoints', () => {
    // InventoryItem limits
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'itemid' || lower === 'name' || lower === 'supplier' || lower === 'useremail' || lower === 'category') return 100"),
      'InventoryItem must limit itemId, name, supplier, userEmail, category to 100'
    )
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'description') return 200"),
      'InventoryItem must limit description to 200'
    )
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'image' || lower === 'imageurl') return 255"),
      'InventoryItem must limit image to 255'
    )

    // InventoryLogs limits
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'itemid') return 50"),
      'InventoryLogs must limit itemId to 50'
    )
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'status') return 20"),
      'InventoryLogs must limit status to 20'
    )
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'requestedby' || lower === 'requestedwith') return 100"),
      'InventoryLogs must limit requestedBy and requestedWith to 100'
    )
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'remarks') return 255"),
      'InventoryLogs must limit remarks to 255'
    )

    // InventoryCategory limits
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'name') return 150"),
      'InventoryCategory must limit name to 150'
    )
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'description') return 255"),
      'InventoryCategory must limit description to 255'
    )
  })

  test('DynamicApiTable implements dedicated buildInventoryItemPayload normalizer', () => {
    assert.ok(
      dynamicApiTableSource.includes('const buildInventoryItemPayload = (payload, mode, loggedInUserId) => {'),
      'Must define buildInventoryItemPayload normalizer'
    )
    // Check base64 sanitization
    assert.ok(
      dynamicApiTableSource.includes("if (imgStr.startsWith('data:')) {"),
      'Must sanitize base64 data URLs in image field'
    )
    // Check quantity numeric conversion
    assert.ok(
      dynamicApiTableSource.includes('parseInt(payload.quantity, 10)'),
      'Must convert quantity to integer'
    )
  })

  test('DynamicApiTable implements dedicated buildInventoryLogPayload normalizer', () => {
    assert.ok(
      dynamicApiTableSource.includes('const buildInventoryLogPayload = (payload, mode, loggedInUserId) => {'),
      'Must define buildInventoryLogPayload normalizer'
    )
    assert.ok(
      dynamicApiTableSource.includes("status: normStr(payload.status || 'Pending', 20)"),
      'Must default status to Pending and clamp to 20 chars'
    )
    assert.ok(
      dynamicApiTableSource.includes('editBaseSnapshot.value?.createdDate'),
      'Must preserve createdDate from snapshot on edit'
    )
  })

  test('DynamicApiTable implements dedicated buildInventoryCategoryPayload normalizer', () => {
    assert.ok(
      dynamicApiTableSource.includes('const buildInventoryCategoryPayload = (payload, mode, numericUserId) => {'),
      'Must define buildInventoryCategoryPayload normalizer'
    )
    assert.ok(
      dynamicApiTableSource.includes('modifiedBy: Number(numericUserId) || 1'),
      'Must enforce numeric int32 modifiedBy'
    )
  })

  test('saveData and saveEditedRecord wire up inventory normalizers', () => {
    assert.ok(
      dynamicApiTableSource.includes("finalPayload = buildInventoryItemPayload(finalPayload, 'create', loggedInUserId)"),
      'saveData must invoke buildInventoryItemPayload'
    )
    assert.ok(
      dynamicApiTableSource.includes("finalPayload = buildInventoryLogPayload(finalPayload, 'create', loggedInUserId)"),
      'saveData must invoke buildInventoryLogPayload'
    )
    assert.ok(
      dynamicApiTableSource.includes("finalPayload = buildInventoryCategoryPayload(finalPayload, 'create', numericUserId)"),
      'saveData must invoke buildInventoryCategoryPayload'
    )
    assert.ok(
      dynamicApiTableSource.includes("finalPayload = buildInventoryItemPayload(finalPayload, 'edit', loggedInUserId)"),
      'saveEditedRecord must invoke buildInventoryItemPayload'
    )
    assert.ok(
      dynamicApiTableSource.includes("finalPayload = buildInventoryLogPayload(finalPayload, 'edit', loggedInUserId)"),
      'saveEditedRecord must invoke buildInventoryLogPayload'
    )
    assert.ok(
      dynamicApiTableSource.includes("finalPayload = buildInventoryCategoryPayload(finalPayload, 'edit', numericUserId)"),
      'saveEditedRecord must invoke buildInventoryCategoryPayload'
    )
  })

  test('Template renders inventory_item_image in Table, Create dialog, Edit dialog, and View modal', () => {
    assert.ok(
      dynamicApiTableSource.includes("getFieldType(col) === 'inventory_item_image'"),
      'Template must handle inventory_item_image'
    )
    assert.ok(
      dynamicApiTableSource.includes("placeholder=\"https://example.com/item.png or /images/inventory/item.png\""),
      'Template must provide intuitive placeholder for inventory_item_image'
    )
  })
})
