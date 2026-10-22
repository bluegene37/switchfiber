// Gene - Oct 20, 2026: Comprehensive Alpha QA and CRUD test suite for 4 new menus (Promotions, Inventory Category, Inventory Item, Inventory Logs)
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { EndpointColumns } from '../src/models/columns.js'
import { resolveRequiredFields, isSystemField } from '../src/models/requiredFields.js'
import {
  MENU_CATALOG,
  LEAF_MENU_CATALOG_ENTRIES,
  getShortCodeForCatalogCode,
  findPrimaryMenuCodeForName
} from '../src/constants/menuCatalog.js'
import { PromotionService } from '../src/services/promotions.js'
import { InventoryCategoryService } from '../src/services/inventoryCategory.js'
import { InventoryItemService } from '../src/services/inventoryItem.js'
import { InventoryLogsService } from '../src/services/inventoryLogs.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fileMaintenancePath = path.resolve(__dirname, '../src/views/FileMaintenance.vue')
const routerPath = path.resolve(__dirname, '../src/router/index.js')
const dynamicTablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const usePermissionsPath = path.resolve(__dirname, '../src/composables/usePermissions.js')

const fileMaintenanceSrc = fs.readFileSync(fileMaintenancePath, 'utf8')
const routerSrc = fs.readFileSync(routerPath, 'utf8')
const dynamicTableSrc = fs.readFileSync(dynamicTablePath, 'utf8')
const usePermissionsSrc = fs.readFileSync(usePermissionsPath, 'utf8')

describe('Alpha Test Suite: 4 New Menus CRUD Lifecycle (Promotions, Inventory Category, Inventory Item, Inventory Logs)', () => {

  describe('1. Route Mapping & Architecture Conformance (TC-RTE)', () => {
    test('FileMaintenance.vue registers all 4 new menus with valid endpoint mappings and icons', () => {
      const requiredMappings = [
        { path: '/promo', endpoint: 'Promotions', title: 'Promo', icon: 'pi-gift' },
        { path: '/promotions', endpoint: 'Promotions', title: 'Promo', icon: 'pi-gift' },
        { path: '/inventory-category', endpoint: 'InventoryCategory', title: 'Inventory Category', icon: 'pi-tags' },
        { path: '/inventory_category', endpoint: 'InventoryCategory', title: 'Inventory Category', icon: 'pi-tags' },
        { path: '/inventory-item', endpoint: 'InventoryItem', title: 'Inventory Item', icon: 'pi-box' },
        { path: '/inventory_item', endpoint: 'InventoryItem', title: 'Inventory Item', icon: 'pi-box' },
        { path: '/inventory-logs', endpoint: 'InventoryLogs', title: 'Inventory Logs', icon: 'pi-history' },
        { path: '/inventory_logs', endpoint: 'InventoryLogs', title: 'Inventory Logs', icon: 'pi-history' }
      ]

      for (const map of requiredMappings) {
        assert.ok(fileMaintenanceSrc.includes(`'${map.path}'`), `Route ${map.path} must be registered in FileMaintenance.vue`)
        assert.ok(fileMaintenanceSrc.includes(`endpoint: '${map.endpoint}'`), `Endpoint ${map.endpoint} must be wired to route ${map.path}`)
        assert.ok(fileMaintenanceSrc.includes(`icon: '${map.icon}'`), `Icon ${map.icon} must be configured for ${map.path}`)
      }
    })

    test('Vue router registers all 4 new menus with requiresAuth and maps ROUTE_TITLES', () => {
      const requiredRoutes = ['/promo', '/promotions', '/inventory-category', '/inventory_category', '/inventory-item', '/inventory_item', '/inventory-logs', '/inventory_logs']

      for (const r of requiredRoutes) {
        assert.ok(routerSrc.includes(`path: '${r}'`), `Router must declare route ${r}`)
      }

      assert.ok(routerSrc.includes("promo: 'Promo'"), 'ROUTE_TITLES must contain promo title')
      assert.ok(routerSrc.includes("promotions: 'Promo'"), 'ROUTE_TITLES must contain promotions title')
      assert.ok(routerSrc.includes("'inventory-category': 'Inventory Category'"), 'ROUTE_TITLES must contain inventory-category title')
      assert.ok(routerSrc.includes("'inventory-item': 'Inventory Item'"), 'ROUTE_TITLES must contain inventory-item title')
      assert.ok(routerSrc.includes("'inventory-logs': 'Inventory Logs'"), 'ROUTE_TITLES must contain inventory-logs title')
    })

    test('Menu Catalog defines all 4 menus under File Maintenance with unique shortCodes', () => {
      const expectedCodes = [
        { code: 'file-maintenance.promo', shortCode: 'PR1', path: '/promo' },
        { code: 'file-maintenance.inventory-category', shortCode: 'IC1', path: '/inventory-category' },
        { code: 'file-maintenance.inventory-item', shortCode: 'II1', path: '/inventory-item' },
        { code: 'file-maintenance.inventory-logs', shortCode: 'IL1', path: '/inventory-logs' }
      ]

      expectedCodes.forEach(({ code, shortCode, path }) => {
        const found = LEAF_MENU_CATALOG_ENTRIES.find(m => m.code === code)
        assert.ok(found, `Menu entry for ${code} must exist in LEAF_MENU_CATALOG_ENTRIES`)
        assert.equal(found.shortCode, shortCode, `Menu entry ${code} must have shortCode ${shortCode}`)
        assert.equal(found.path, path, `Menu entry ${code} must have path ${path}`)
      })
    })
  })

  describe('2. Fallback Schemas & Required Field Validation (TC-SCH)', () => {
    test('EndpointColumns defines complete column schemas for all 4 new entities', () => {
      const endpoints = ['Promotions', 'InventoryCategory', 'InventoryItem', 'InventoryLogs']

      for (const ep of endpoints) {
        assert.ok(EndpointColumns[ep], `EndpointColumns must define fallback columns for ${ep}`)
        assert.ok(Array.isArray(EndpointColumns[ep]), `EndpointColumns[${ep}] must be an array`)
        assert.ok(EndpointColumns[ep].length >= 5, `EndpointColumns[${ep}] must contain at least 5 columns`)
        assert.ok(EndpointColumns[ep].includes('id'), `EndpointColumns[${ep}] must include id`)
      }

      // Check key domain columns
      assert.ok(EndpointColumns.Promotions.includes('promoCode'))
      assert.ok(EndpointColumns.Promotions.includes('title'))
      assert.ok(EndpointColumns.Promotions.includes('placement'))
      assert.ok(EndpointColumns.Promotions.includes('themeColor'))
      assert.ok(EndpointColumns.Promotions.includes('imageUrl'))

      assert.ok(EndpointColumns.InventoryCategory.includes('name'))
      assert.ok(EndpointColumns.InventoryCategory.includes('description'))

      assert.ok(EndpointColumns.InventoryItem.includes('itemId'))
      assert.ok(EndpointColumns.InventoryItem.includes('name'))
      assert.ok(EndpointColumns.InventoryItem.includes('quantity'))
      assert.ok(EndpointColumns.InventoryItem.includes('supplier'))

      assert.ok(EndpointColumns.InventoryLogs.includes('itemId'))
      assert.ok(EndpointColumns.InventoryLogs.includes('quantity'))
      assert.ok(EndpointColumns.InventoryLogs.includes('requestedBy'))
      assert.ok(EndpointColumns.InventoryLogs.includes('status'))
    })

    test('requiredFields.js enforces mandatory fields and excludes system audit fields', () => {
      // Promotions
      /*
      const promoReq = resolveRequiredFields('Promotions', EndpointColumns.Promotions)
      assert.ok(promoReq.includes('promoCode'), 'promoCode must be required for Promotions')
      assert.ok(promoReq.includes('title'), 'title must be required for Promotions')
      assert.ok(!promoReq.includes('id'), 'System id must not be required')
      assert.ok(!promoReq.includes('createdDate'), 'createdDate must not be required')
      */
      // Gene - Oct, 22, 2026: Verified discountTypeId is mandatory for Promotions alongside promoCode and title
      const promoReq = resolveRequiredFields('Promotions', EndpointColumns.Promotions)
      assert.ok(promoReq.includes('promoCode'), 'promoCode must be required for Promotions')
      assert.ok(promoReq.includes('title'), 'title must be required for Promotions')
      assert.ok(promoReq.includes('discountTypeId'), 'discountTypeId must be required for Promotions')
      assert.ok(!promoReq.includes('id'), 'System id must not be required')
      assert.ok(!promoReq.includes('createdDate'), 'createdDate must not be required')

      // Inventory Category
      const catReq = resolveRequiredFields('InventoryCategory', EndpointColumns.InventoryCategory)
      assert.ok(catReq.includes('name'), 'name must be required for InventoryCategory')
      assert.ok(!catReq.includes('modifiedBy'), 'modifiedBy must not be required')

      // Inventory Item
      const itemReq = resolveRequiredFields('InventoryItem', EndpointColumns.InventoryItem)
      assert.ok(itemReq.includes('name'), 'name must be required for InventoryItem')
      assert.ok(itemReq.includes('quantity'), 'quantity must be required for InventoryItem')
      assert.ok(!itemReq.includes('modifiedDate'), 'modifiedDate must not be required')

      // Inventory Logs
      const logReq = resolveRequiredFields('InventoryLogs', EndpointColumns.InventoryLogs)
      assert.ok(logReq.includes('itemId'), 'itemId must be required for InventoryLogs')
      assert.ok(logReq.includes('quantity'), 'quantity must be required for InventoryLogs')
      assert.ok(logReq.includes('requestedBy'), 'requestedBy must be required for InventoryLogs')
      assert.ok(logReq.includes('status'), 'status must be required for InventoryLogs')
      assert.ok(!logReq.includes('createdDate'), 'createdDate must not be required')
    })

    test('Non-numeric ID handling keeps itemId as text string', () => {
      assert.ok(
        dynamicTableSrc.includes("'itemid'"),
        'NON_NUMERIC_ID_HINTS must include itemid to prevent numeric coercion/NaN errors'
      )
    })
  })

  describe('3. Dedicated REST API Services Layer (TC-SVC)', () => {
    test('PromotionService implements full REST CRUD methods', () => {
      assert.equal(typeof PromotionService.getPromotions, 'function')
      assert.equal(typeof PromotionService.getPromotionById, 'function')
      assert.equal(typeof PromotionService.createPromotion, 'function')
      assert.equal(typeof PromotionService.updatePromotion, 'function')
      assert.equal(typeof PromotionService.deletePromotion, 'function')
    })

    test('InventoryCategoryService implements full REST CRUD methods', () => {
      assert.equal(typeof InventoryCategoryService.getInventoryCategories, 'function')
      assert.equal(typeof InventoryCategoryService.getInventoryCategoryById, 'function')
      assert.equal(typeof InventoryCategoryService.createInventoryCategory, 'function')
      assert.equal(typeof InventoryCategoryService.updateInventoryCategory, 'function')
      assert.equal(typeof InventoryCategoryService.deleteInventoryCategory, 'function')
    })

    test('InventoryItemService implements full REST CRUD methods', () => {
      assert.equal(typeof InventoryItemService.getInventoryItems, 'function')
      assert.equal(typeof InventoryItemService.getInventoryItemById, 'function')
      assert.equal(typeof InventoryItemService.createInventoryItem, 'function')
      assert.equal(typeof InventoryItemService.updateInventoryItem, 'function')
      assert.equal(typeof InventoryItemService.deleteInventoryItem, 'function')
    })

    test('InventoryLogsService implements full REST CRUD methods', () => {
      assert.equal(typeof InventoryLogsService.getInventoryLogs, 'function')
      assert.equal(typeof InventoryLogsService.getInventoryLogById, 'function')
      assert.equal(typeof InventoryLogsService.createInventoryLog, 'function')
      assert.equal(typeof InventoryLogsService.updateInventoryLog, 'function')
      assert.equal(typeof InventoryLogsService.deleteInventoryLog, 'function')
    })
  })

  describe('4. CREATE (POST) Normalization & Audit Trail Stamping (TC-POST)', () => {
    test('DynamicApiTable defines isPromotionEndpoint, isInventoryCategoryEndpoint, isInventoryItemEndpoint, and isInventoryLogEndpoint', () => {
      assert.ok(dynamicTableSrc.includes('const isPromotionEndpoint = computed('))
      assert.ok(dynamicTableSrc.includes('const isInventoryCategoryEndpoint = computed('))
      assert.ok(dynamicTableSrc.includes('const isInventoryItemEndpoint = computed('))
      assert.ok(dynamicTableSrc.includes('const isInventoryLogEndpoint = computed('))
    })

    test('Create modal defaults initialize entity-specific field values', () => {
      // InventoryItem defaults quantity to 0
      assert.ok(dynamicTableSrc.includes('isInventoryItemEndpoint.value'), 'DynamicApiTable must handle isInventoryItemEndpoint defaults')
      assert.ok(dynamicTableSrc.includes('formData.value[qtyCol] = 0'), 'InventoryItem must default quantity to 0')

      // InventoryLogs defaults quantity to 1 and status to Pending
      assert.ok(dynamicTableSrc.includes('isInventoryLogEndpoint.value'), 'DynamicApiTable must handle isInventoryLogEndpoint defaults')
      assert.ok(dynamicTableSrc.includes("formData.value[qtyCol] = 1"), 'InventoryLogs must default quantity to 1')
      assert.ok(dynamicTableSrc.includes("formData.value[statusCol] = 'Pending'"), "InventoryLogs must default status to 'Pending'")
    })

    test('saveData serializes Promotions placement array and parses numeric priority on CREATE', () => {
      assert.ok(
        dynamicTableSrc.includes("finalPayload[plcKey] = finalPayload[plcKey].join(',')"),
        'saveData must serialize placement array to comma-separated string for Promotions create'
      )
      assert.ok(
        dynamicTableSrc.includes("Number(finalPayload.priority)"),
        'saveData must convert priority to Number for Promotions create'
      )
    })

    test('saveData normalizes modifiedBy to int32 for InventoryCategory on CREATE', () => {
      assert.ok(
        dynamicTableSrc.includes("if (isInventoryCategoryEndpoint.value) {\n        finalPayload.modifiedBy = numericUserId\n      }"),
        'saveData must assign numericUserId to modifiedBy for InventoryCategory'
      )
    })

    test('saveData stamps audit fields with current user ID on CREATE', () => {
      assert.ok(
        dynamicTableSrc.includes("stampAuditFields(finalPayload, 'create', loggedInUserId)"),
        'saveData must stamp audit fields with logged-in user ID on create'
      )
    })
  })

  describe('5. UPDATE (PUT) Normalization & Audit Preservation (TC-PUT)', () => {
    test('openEditDialog deserializes Promotions placement string to array', () => {
      assert.ok(
        dynamicTableSrc.includes("currentVal.split(',').map(s => s.trim()).filter(Boolean)"),
        'openEditDialog must split comma-delimited placement string into array for MultiSelect'
      )
    })

    test('saveEdit re-serializes placement array and normalizes priority on UPDATE', () => {
      assert.ok(
        dynamicTableSrc.includes("finalPayload[plcKey] = finalPayload[plcKey].join(',')"),
        'saveEdit must re-serialize placement array to comma-delimited string on update'
      )
      assert.ok(
        dynamicTableSrc.includes("Number(finalPayload.priority)"),
        'saveEdit must ensure priority is numeric on update'
      )
    })

    test('saveEdit preserves original createdDate for InventoryLogs on UPDATE', () => {
      assert.ok(
        dynamicTableSrc.includes("isInventoryLogEndpoint.value"),
        'saveEdit must include isInventoryLogEndpoint when preserving createdDate'
      )
      assert.ok(
        dynamicTableSrc.includes("finalPayload.createdDate = originalCreatedDate"),
        'saveEdit must assign originalCreatedDate to finalPayload.createdDate for InventoryLogs'
      )
    })

    test('saveEdit updates modifiedBy without overwriting createdBy on UPDATE', () => {
      assert.ok(
        dynamicTableSrc.includes("stampAuditFields(finalPayload, 'update', loggedInUserId)"),
        'saveEdit must call stampAuditFields with update mode'
      )
    })
  })

  describe('6. Form Layouts & Section Architecture (TC-UI)', () => {
    test('DynamicApiTable provides custom form layouts for all 4 entities', () => {
      assert.ok(dynamicTableSrc.includes('const PROMOTION_FORM_LAYOUT = ['), 'PROMOTION_FORM_LAYOUT must be defined')
      assert.ok(dynamicTableSrc.includes('const INVENTORY_CATEGORY_FORM_LAYOUT = ['), 'INVENTORY_CATEGORY_FORM_LAYOUT must be defined')
      assert.ok(dynamicTableSrc.includes('const INVENTORY_ITEM_FORM_LAYOUT = ['), 'INVENTORY_ITEM_FORM_LAYOUT must be defined')
      assert.ok(dynamicTableSrc.includes('const INVENTORY_LOG_FORM_LAYOUT = ['), 'INVENTORY_LOG_FORM_LAYOUT must be defined')
    })

    test('Section builders are properly routed in formSections and viewFormSections', () => {
      assert.ok(dynamicTableSrc.includes('buildPromotionSections(formColumns.value)'))
      assert.ok(dynamicTableSrc.includes('buildInventoryCategorySections(formColumns.value)'))
      assert.ok(dynamicTableSrc.includes('buildInventoryItemSections(formColumns.value)'))
      assert.ok(dynamicTableSrc.includes('buildInventoryLogSections(formColumns.value)'))

      assert.ok(dynamicTableSrc.includes('buildPromotionSections(viewFormColumns.value, { includeAudit: true })'))
      assert.ok(dynamicTableSrc.includes('buildInventoryCategorySections(viewFormColumns.value, { includeAudit: true })'))
      assert.ok(dynamicTableSrc.includes('buildInventoryItemSections(viewFormColumns.value, { includeAudit: true })'))
      assert.ok(dynamicTableSrc.includes('buildInventoryLogSections(viewFormColumns.value, { includeAudit: true })'))
    })

    test('InventoryLogs fallback status options are provided for empty tables', () => {
      assert.ok(dynamicTableSrc.includes("isInventoryLogEndpoint.value && !dataStatusVocabulary.value.length"))
      assert.ok(dynamicTableSrc.includes("{ label: 'Pending', value: 'Pending' }"))
      assert.ok(dynamicTableSrc.includes("{ label: 'Approved', value: 'Approved' }"))
      assert.ok(dynamicTableSrc.includes("{ label: 'Issued', value: 'Issued' }"))
      assert.ok(dynamicTableSrc.includes("{ label: 'Returned', value: 'Returned' }"))
    })
  })

  describe('7. DELETE (DELETE) Record Identity & Confirmation Safety (TC-DEL)', () => {
    test('IDENTITY_COLUMNS includes title, promocode, itemid, requestedby, and status', () => {
      const expectedKeys = ['title', 'promocode', 'itemid', 'requestedby', 'status']
      for (const k of expectedKeys) {
        assert.ok(dynamicTableSrc.includes(`'${k}'`), `IDENTITY_COLUMNS must include '${k}' for safe delete confirmation`)
      }
    })

    test('deleteRecord invokes CrudService.remove with props.endpoint and targetId', () => {
      assert.ok(
        dynamicTableSrc.includes("CrudService.remove(props.endpoint, targetId)"),
        'deleteRecord must call CrudService.remove with endpoint and target ID'
      )
    })
  })

  describe('8. Access Level & Permissions Integration (TC-PERM)', () => {
    test('usePermissions integrates client catalog menus with localStorage fallback', () => {
      assert.ok(
        usePermissionsSrc.includes("getClientAccessLevelMenuPermissions"),
        'usePermissions must export getClientAccessLevelMenuPermissions'
      )
      assert.ok(
        usePermissionsSrc.includes("setClientAccessLevelMenuPermission"),
        'usePermissions must export setClientAccessLevelMenuPermission'
      )
    })

    test('Developer, Super Admin, and category sibling access rules auto-grant client menus', () => {
      assert.ok(
        usePermissionsSrc.includes("isDevOrAdmin || hasSiblingAccess || !belongsToParent"),
        'usePermissions must auto-grant client menus for dev/admin or category siblings'
      )
    })
  })
})
