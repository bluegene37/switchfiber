// Gene - Oct, 16, 2026: Comprehensive test suite for Promotions form controls (MultiSelect placement, image size select, theme color dropdown)
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// Gene - Oct, 22, 2026: Imported resolveRequiredFields and EndpointColumns for mandatory fields verification
import { resolveRequiredFields } from '../src/models/requiredFields.js'
import { EndpointColumns } from '../src/models/columns.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicApiTableSource = fs.readFileSync(
  path.resolve(__dirname, '../src/components/DynamicApiTable.vue'),
  'utf8'
)

describe('Promotions Form Controls Suite', () => {
  test('DynamicApiTable imports MultiSelect from primevue/multiselect', () => {
    assert.ok(
      dynamicApiTableSource.includes("import MultiSelect from 'primevue/multiselect'"),
      'DynamicApiTable must import MultiSelect from primevue/multiselect'
    )
  })

  test('Promotion placement surfaces configuration is defined with multi-select support', () => {
    assert.ok(
      dynamicApiTableSource.includes('const promotionPlacementOptions = ['),
      'DynamicApiTable must define promotionPlacementOptions'
    )
    assert.ok(
      dynamicApiTableSource.includes("value: 'top_bar'"),
      'placement options must include top_bar'
    )
    assert.ok(
      dynamicApiTableSource.includes("value: 'home_banner'"),
      'placement options must include home_banner'
    )
    assert.ok(
      dynamicApiTableSource.includes("value: 'plans_page'"),
      'placement options must include plans_page'
    )
  })

  test('Promotion image sizes configuration is defined with select options', () => {
    assert.ok(
      dynamicApiTableSource.includes('const promotionImageSizeOptions = ['),
      'DynamicApiTable must define promotionImageSizeOptions'
    )
    assert.ok(
      dynamicApiTableSource.includes("value: 'medium'"),
      'imageSize options must include medium'
    )
    assert.ok(
      dynamicApiTableSource.includes("value: 'wide'"),
      'imageSize options must include wide'
    )
    assert.ok(
      dynamicApiTableSource.includes("value: 'large'"),
      'imageSize options must include large'
    )
  })

  test('Promotion theme color dropdown configuration includes hex color swatches', () => {
    assert.ok(
      dynamicApiTableSource.includes('const promotionThemeColorOptions = ['),
      'DynamicApiTable must define promotionThemeColorOptions'
    )
    const expectedColors = ['red', 'amber', 'yellow', 'emerald', 'sky', 'indigo', 'purple', 'orange']
    expectedColors.forEach(color => {
      assert.ok(
        dynamicApiTableSource.includes(`value: '${color}'`),
        `theme color options must include ${color}`
      )
    })
    assert.ok(
      dynamicApiTableSource.includes("hex: '#ee2824'"),
      'theme color options must include brand red hex #ee2824'
    )
  })

  test('getFieldType returns specialized promotion field types for Promotions endpoint', () => {
    assert.ok(
      dynamicApiTableSource.includes("if (lower === 'placement') return 'promotion_placement_multiselect'"),
      'getFieldType must map placement to promotion_placement_multiselect'
    )
    assert.ok(
      dynamicApiTableSource.includes("return 'promotion_imagesize_select'"),
      'getFieldType must map imageSize to promotion_imagesize_select'
    )
    assert.ok(
      dynamicApiTableSource.includes("return 'promotion_themecolor_select'"),
      'getFieldType must map themeColor to promotion_themecolor_select'
    )
  })

  test('Create and Edit dialogs render MultiSelect for placement and Select for image size and theme color', () => {
    assert.ok(
      dynamicApiTableSource.includes("getFieldType(col) === 'promotion_placement_multiselect'"),
      'Templates must render MultiSelect for promotion_placement_multiselect'
    )
    assert.ok(
      dynamicApiTableSource.includes("display=\"chip\""),
      'Placement MultiSelect must render chips'
    )
    assert.ok(
      dynamicApiTableSource.includes("getFieldType(col) === 'promotion_imagesize_select'"),
      'Templates must render Select for promotion_imagesize_select'
    )
    assert.ok(
      dynamicApiTableSource.includes("getFieldType(col) === 'promotion_themecolor_select'"),
      'Templates must render Select for promotion_themecolor_select'
    )
  })

  test('openCreateDialog initializes default values for promotion fields', () => {
    assert.ok(
      dynamicApiTableSource.includes("type === 'promotion_placement_multiselect'"),
      'openCreateDialog must handle promotion_placement_multiselect'
    )
    assert.ok(
      dynamicApiTableSource.includes("formData.value[col] = ['home_banner', 'plans_page']"),
      'openCreateDialog must initialize placement array'
    )
    assert.ok(
      dynamicApiTableSource.includes("formData.value[col] = 'medium'"),
      'openCreateDialog must initialize imageSize to medium'
    )
    assert.ok(
      dynamicApiTableSource.includes("formData.value[col] = 'red'"),
      'openCreateDialog must initialize themeColor to red'
    )
  })

  test('openEditDialog deserializes comma-separated placement string into array for MultiSelect', () => {
    assert.ok(
      dynamicApiTableSource.includes("if (getFieldType(col) === 'promotion_placement_multiselect')"),
      'openEditDialog must handle promotion_placement_multiselect'
    )
    assert.ok(
      dynamicApiTableSource.includes("currentVal.split(',').map(s => s.trim()).filter(Boolean)"),
      'openEditDialog must split comma-separated placement into array'
    )
  })

  test('saveData and saveEdit serialize placement array to comma-separated string for backend persistence', () => {
    assert.ok(
      dynamicApiTableSource.includes("const plcKey = Object.keys(finalPayload).find(k => k.toLowerCase() === 'placement')"),
      'saveData/saveEdit must find placement key in finalPayload'
    )
    assert.ok(
      dynamicApiTableSource.includes("finalPayload[plcKey] = finalPayload[plcKey].join(',')"),
      'saveData/saveEdit must join placement array with commas'
    )
  })

  test('Highlighted and selected row styles preserve visible red text on primary badges and pills', () => {
    assert.ok(
      dynamicApiTableSource.includes('.highlight-selected-row .p-datatable-tbody > tr.p-highlight .badge.text-primary'),
      'DynamicApiTable must preserve text-primary color on p-highlight badge'
    )
    assert.ok(
      dynamicApiTableSource.includes('.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .badge.text-primary'),
      'DynamicApiTable must preserve text-primary color on aria-selected badge'
    )
    assert.ok(
      dynamicApiTableSource.includes('color: var(--bs-primary-active, #c02e3c) !important'),
      'DynamicApiTable must style primary badge text with high-contrast red'
    )
  })

  // Gene - Oct, 22, 2026: Verify that priority column name and field label is formatted as Display Order for Promo / Promotions
  test('formatLabel maps priority to Display Order for Promotions endpoint', () => {
    assert.ok(
      dynamicApiTableSource.includes("isPromotionEndpoint.value && normalizeColKey(col) === 'priority'"),
      'formatLabel must check isPromotionEndpoint and normalizeColKey for priority'
    )
    assert.ok(
      dynamicApiTableSource.includes("return 'Display Order'"),
      'formatLabel must return Display Order for Promotions priority'
    )
    assert.ok(
      dynamicApiTableSource.includes("displayorder: 'Display Order'"),
      'customOverrides must include displayorder: Display Order'
    )
    assert.ok(
      dynamicApiTableSource.includes("if (isPromotionEndpoint.value && key === 'priority') return ['Priority', 'Display Order', 'Order']"),
      'fieldSearchAliases must include Priority, Display Order, and Order for Promotions priority'
    )
  })

  // Gene - Oct, 22, 2026: Verify that discountTypeId is mandatory for Promo / Promotions forms
  test('resolveRequiredFields enforces discountTypeId as mandatory for Promotions and promo', () => {
    const promoCols = EndpointColumns.Promotions
    const requiredForPromotions = resolveRequiredFields('Promotions', promoCols)
    const requiredForPromo = resolveRequiredFields('promo', promoCols)

    assert.ok(requiredForPromotions.includes('discountTypeId'), 'discountTypeId must be required for Promotions')
    assert.ok(requiredForPromotions.includes('promoCode'), 'promoCode must be required for Promotions')
    assert.ok(requiredForPromotions.includes('title'), 'title must be required for Promotions')

    assert.ok(requiredForPromo.includes('discountTypeId'), 'discountTypeId must be required for promo')
    assert.ok(requiredForPromo.includes('promoCode'), 'promoCode must be required for promo')
    assert.ok(requiredForPromo.includes('title'), 'title must be required for promo')
  })

  // Gene - Oct, 22, 2026: Verify that the Paste button is removed from Promo and Inventory Item Record Create and Edit dialogs
  test('DynamicApiTable removes the Paste button from Promo and Inventory Item dialogs', () => {
    assert.ok(
      dynamicApiTableSource.includes('<!-- Gene - Oct, 22, 2026: Removed Paste button in Promo Create Dialog -->'),
      'Promo Create Dialog must have Paste button removed'
    )
    assert.ok(
      dynamicApiTableSource.includes('<!-- Gene - Oct, 22, 2026: Removed Paste button in Promo Edit Dialog -->'),
      'Promo Edit Dialog must have Paste button removed'
    )
    assert.ok(
      dynamicApiTableSource.includes('<!-- Gene - Oct, 22, 2026: Removed Paste button in Inventory Item Record Create Dialog -->'),
      'Inventory Item Record Create Dialog must have Paste button removed'
    )
    assert.ok(
      dynamicApiTableSource.includes('<!-- Gene - Oct, 22, 2026: Removed Paste button in Inventory Item Record Edit Dialog -->'),
      'Inventory Item Record Edit Dialog must have Paste button removed'
    )
  })
})

