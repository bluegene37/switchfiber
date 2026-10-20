import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EndpointColumns } from '../src/models/columns.js'
import { resolveRequiredFields, isSystemField } from '../src/models/requiredFields.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fileMaintenancePath = path.resolve(__dirname, '../src/views/FileMaintenance.vue')
const dynamicTablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')

describe('CRUD Workflow & REST API Compliance Suite (TC-CRUD)', () => {
  const fileMaintenanceSrc = fs.readFileSync(fileMaintenancePath, 'utf8')
  const dynamicTableSrc = fs.readFileSync(dynamicTablePath, 'utf8')

  test('FileMaintenance registers all core CRUD routes with valid endpoints and descriptions', () => {
    /*
    const expectedRoutes = [
      '/lcp', '/lcnap', '/lcnap_port', '/nap', '/port', '/vlan',
      '/router', '/plan', '/discount-types', '/discounts', '/user',
      '/menu', '/access_level', '/access_level_menu', '/job_order',
      '/invoice', '/billing', '/disconnection', '/service-orders'
    ]
    */
    // Gene - Oct 20, 2026: Included new File Maintenance CRUD routes (/promo, /promotions, /inventory-category, /inventory-item, /inventory-logs)
    const expectedRoutes = [
      '/lcp', '/lcnap', '/lcnap_port', '/nap', '/port', '/vlan',
      '/router', '/plan', '/discount-types', '/discounts', '/user',
      '/menu', '/access_level', '/access_level_menu', '/job_order',
      '/invoice', '/billing', '/disconnection', '/service-orders',
      '/promo', '/promotions', '/inventory-category', '/inventory-item', '/inventory-logs'
    ]

    for (const route of expectedRoutes) {
      assert.ok(fileMaintenanceSrc.includes(`'${route}'`), `FileMaintenance must register route ${route}`)
    }
  })

  test('All registered FileMaintenance endpoints have column fallbacks in EndpointColumns', () => {
    /*
    const requiredEndpoints = [
      'Lcps', 'Lcpnaps', 'Lcpnapports', 'Naps', 'Ports', 'Vlans',
      'Routers', 'Plans', 'DiscountTypes', 'Discounts', 'Users',
      'Menus', 'AccessLevel', 'AccessLevelMenu', 'JobOrders',
      'Invoices', 'BillingDetails', 'ServiceOrders', 'Applications'
    ]
    */
    // Gene - Oct 20, 2026: Included new File Maintenance CRUD endpoints (Promotions, InventoryCategory, InventoryItem, InventoryLogs)
    const requiredEndpoints = [
      'Lcps', 'Lcpnaps', 'Lcpnapports', 'Naps', 'Ports', 'Vlans',
      'Routers', 'Plans', 'DiscountTypes', 'Discounts', 'Users',
      'Menus', 'AccessLevel', 'AccessLevelMenu', 'JobOrders',
      'Invoices', 'BillingDetails', 'ServiceOrders', 'Applications',
      'Promotions', 'InventoryCategory', 'InventoryItem', 'InventoryLogs'
    ]

    for (const ep of requiredEndpoints) {
      assert.ok(EndpointColumns[ep], `EndpointColumns must have column definition for ${ep}`)
      assert.ok(Array.isArray(EndpointColumns[ep]), `EndpointColumns[${ep}] must be an array`)
      assert.ok(EndpointColumns[ep].length > 0, `EndpointColumns[${ep}] must not be empty`)
    }
  })

  test('DynamicApiTable routes every REST call through CrudService', () => {
    assert.ok(dynamicTableSrc.includes("import { CrudService } from '../services/crud'"), 'DynamicApiTable must import CrudService')
    assert.ok(!dynamicTableSrc.includes('apiClient'), 'DynamicApiTable must not call the axios client directly')
    // GET /api/[Endpoint]
    assert.ok(dynamicTableSrc.includes('CrudService.list(url, params)'), 'DynamicApiTable must list records through CrudService.list')
    // POST /api/[Endpoint]
    assert.ok(dynamicTableSrc.includes('CrudService.create(props.endpoint, finalPayload)'), 'DynamicApiTable must create records through CrudService.create')
    // PUT /api/[Endpoint]/{id}
    assert.ok(dynamicTableSrc.includes('CrudService.update(props.endpoint, updatedId, finalPayload)'), 'DynamicApiTable must update records through CrudService.update')
    // DELETE /api/[Endpoint]/{id}
    assert.ok(dynamicTableSrc.includes('CrudService.remove(props.endpoint, targetId)'), 'DynamicApiTable must delete records through CrudService.remove')
  })

  test('System audit fields are classified as system fields and stripped from forms', () => {
    const auditFields = ['id', 'createdBy', 'modifiedBy', 'createdDate', 'modifiedDate', 'timestamp', 'rowVersion']
    for (const field of auditFields) {
      assert.ok(isSystemField(field), `${field} must be recognized as a system field`)
    }

    const appRequired = resolveRequiredFields('Applications', ['id', 'firstName', 'lastName', 'createdBy'])
    assert.ok(!appRequired.includes('id'), 'System field id must not be in required form fields')
    assert.ok(!appRequired.includes('createdBy'), 'System field createdBy must not be in required form fields')
    assert.ok(appRequired.includes('firstName'), 'Business field firstName must remain required')
  })

  test('Default sorting applies descending for Applications and ascending for master tables', () => {
    assert.ok(
      dynamicTableSrc.includes('isApplicationEndpoint.value ? -1 : 1'),
      'DynamicApiTable must default sortOrder to -1 (descending) for Applications and 1 (ascending) for other tables'
    )
  })

  test('Delete modal displays record ID and title in two-stage confirmation gate', () => {
    assert.ok(dynamicTableSrc.includes('displayDeleteDialog'), 'DynamicApiTable must have displayDeleteDialog')
    assert.ok(dynamicTableSrc.includes('recordToDelete'), 'DynamicApiTable must track recordToDelete')
    assert.ok(dynamicTableSrc.includes('deleteRecordIdentity'), 'DynamicApiTable must display deleteRecordIdentity')
    assert.ok(dynamicTableSrc.includes('deleteRecord'), 'DynamicApiTable must have deleteRecord handler')
  })
})
