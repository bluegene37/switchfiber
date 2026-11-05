import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PaymentMethodService } from '../src/services/paymentMethods.js'
import { PaymentTypeService } from '../src/services/paymentTypes.js'
import { toPath } from '../src/services/crud.js'
import { EndpointColumns } from '../src/models/columns.js'
import { resolveRequiredFields } from '../src/models/requiredFields.js'
import {
  ALL_MENU_CODES,
  ALL_MENU_ENTRIES,
  MENU_CATALOG,
  MENU_CODE_MAP,
  getShortCodeForCatalogCode
} from '../src/constants/menuCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicTablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const dynamicTableSrc = fs.readFileSync(dynamicTablePath, 'utf8')
const fileMaintenancePath = path.resolve(__dirname, '../src/views/FileMaintenance.vue')
const fileMaintenanceSrc = fs.readFileSync(fileMaintenancePath, 'utf8')
const routerPath = path.resolve(__dirname, '../src/router/index.js')
const routerSrc = fs.readFileSync(routerPath, 'utf8')
const apiServicePath = path.resolve(__dirname, '../src/services/api.js')
const apiServiceSrc = fs.readFileSync(apiServicePath, 'utf8')

// Gene - Nov 5, 2026: Comprehensive test suite for PaymentMethods and PaymentTypes integration under Transaction
describe('Payment Methods & Payment Types Transaction API Integration Suite', () => {
  test('PaymentMethodService exposes complete REST methods', () => {
    assert.equal(typeof PaymentMethodService.getPaymentMethods, 'function')
    assert.equal(typeof PaymentMethodService.getPaymentMethodById, 'function')
    assert.equal(typeof PaymentMethodService.createPaymentMethod, 'function')
    assert.equal(typeof PaymentMethodService.updatePaymentMethod, 'function')
    assert.equal(typeof PaymentMethodService.deletePaymentMethod, 'function')
  })

  test('PaymentTypeService exposes complete REST methods', () => {
    assert.equal(typeof PaymentTypeService.getPaymentTypes, 'function')
    assert.equal(typeof PaymentTypeService.getPaymentTypeById, 'function')
    assert.equal(typeof PaymentTypeService.createPaymentType, 'function')
    assert.equal(typeof PaymentTypeService.updatePaymentType, 'function')
    assert.equal(typeof PaymentTypeService.deletePaymentType, 'function')
  })

  test('Plural Payments endpoint preservation in crud.js toPath and api.js', () => {
    assert.equal(toPath('Payments'), '/Payments', 'toPath must preserve plural /Payments')
    assert.equal(toPath('/Payments'), '/Payments', 'toPath must preserve plural /Payments')
    assert.equal(toPath('PaymentMethods'), '/PaymentMethods', 'toPath must preserve /PaymentMethods')
    assert.equal(toPath('PaymentTypes'), '/PaymentTypes', 'toPath must preserve /PaymentTypes')

    // Verify api.js no longer actively executes singular Payment rewrite
    const activeRewriteLines = apiServiceSrc
      .split('\n')
      .filter(line => line.includes('Payments([/?#]|$)') && !line.trim().startsWith('//') && !line.trim().startsWith('*'))
    assert.equal(activeRewriteLines.length, 0, 'api.js must not contain active rewrite lines for Payments')
  })

  test('Menu Catalog registers Payment Methods and Payment Types under Transaction group', () => {
    const txnGroup = MENU_CATALOG.find(item => item.code === 'transaction')
    assert.ok(txnGroup, 'Transaction group must exist in MENU_CATALOG')
    assert.ok(Array.isArray(txnGroup.children), 'Transaction group must have children')

    const pmChild = txnGroup.children.find(c => c.code === 'transaction.payment-methods')
    assert.ok(pmChild, 'Payment Methods must be a child of Transaction')
    assert.equal(pmChild.shortCode, 'PM1', 'Payment Methods shortCode must be PM1')
    assert.equal(pmChild.path, '/payment-methods', 'Payment Methods path must be /payment-methods')

    const ptChild = txnGroup.children.find(c => c.code === 'transaction.payment-types')
    assert.ok(ptChild, 'Payment Types must be a child of Transaction')
    assert.equal(ptChild.shortCode, 'PT1', 'Payment Types shortCode must be PT1')
    assert.equal(ptChild.path, '/payment-types', 'Payment Types path must be /payment-types')

    assert.ok(ALL_MENU_CODES.includes('transaction.payment-methods'))
    assert.ok(ALL_MENU_CODES.includes('transaction.payment-types'))

    assert.equal(MENU_CODE_MAP.get('pm1'), 'transaction.payment-methods')
    assert.equal(MENU_CODE_MAP.get('pt1'), 'transaction.payment-types')
    assert.equal(getShortCodeForCatalogCode('transaction.payment-methods'), 'PM1')
    assert.equal(getShortCodeForCatalogCode('transaction.payment-types'), 'PT1')
  })

  test('Router registers routes and titles for payment-methods and payment-types', () => {
    assert.ok(routerSrc.includes("path: '/payment-methods'"), 'Router must have /payment-methods')
    assert.ok(routerSrc.includes("path: '/payment-types'"), 'Router must have /payment-types')
    assert.ok(routerSrc.includes("'payment-methods': 'Payment Methods'"), 'ROUTE_TITLE_MAP must have payment-methods')
    assert.ok(routerSrc.includes("'payment-types': 'Payment Types'"), 'ROUTE_TITLE_MAP must have payment-types')
  })

  test('FileMaintenance.vue configures endpoints for PaymentMethods and PaymentTypes', () => {
    assert.ok(fileMaintenanceSrc.includes("'/payment-methods': {"), 'FileMaintenance must configure /payment-methods')
    assert.ok(fileMaintenanceSrc.includes("endpoint: 'PaymentMethods'"), 'FileMaintenance must point to PaymentMethods')
    assert.ok(fileMaintenanceSrc.includes("'/payment-types': {"), 'FileMaintenance must configure /payment-types')
    assert.ok(fileMaintenanceSrc.includes("endpoint: 'PaymentTypes'"), 'FileMaintenance must point to PaymentTypes')
  })

  test('EndpointColumns defines fallback columns for PaymentMethods and PaymentTypes', () => {
    assert.ok(Array.isArray(EndpointColumns.PaymentMethods), 'EndpointColumns.PaymentMethods must be an array')
    assert.deepEqual(EndpointColumns.PaymentMethods, ['id', 'name', 'description', 'createdBy', 'modifiedBy'])

    assert.ok(Array.isArray(EndpointColumns.PaymentTypes), 'EndpointColumns.PaymentTypes must be an array')
    assert.deepEqual(EndpointColumns.PaymentTypes, ['id', 'name', 'description', 'createdBy', 'modifiedBy'])
  })

  test('resolveRequiredFields enforces name as mandatory for PaymentMethods and PaymentTypes', () => {
    const pmReq = resolveRequiredFields('PaymentMethods', ['name', 'description', 'createdBy', 'modifiedBy'])
    assert.deepEqual(pmReq, ['name'], 'PaymentMethods mandatory field must be name')

    const ptReq = resolveRequiredFields('PaymentTypes', ['name', 'description', 'createdBy', 'modifiedBy'])
    assert.deepEqual(ptReq, ['name'], 'PaymentTypes mandatory field must be name')
  })

  test('DynamicApiTable wires concise columns, endpoint flags, layouts and payload handling', () => {
    assert.ok(dynamicTableSrc.includes('const isPaymentMethodEndpoint = computed'), 'DynamicApiTable must define isPaymentMethodEndpoint')
    assert.ok(dynamicTableSrc.includes('const isPaymentTypeEndpoint = computed'), 'DynamicApiTable must define isPaymentTypeEndpoint')
    assert.ok(dynamicTableSrc.includes('const PAYMENT_METHOD_COLUMNS = ['), 'DynamicApiTable must define PAYMENT_METHOD_COLUMNS')
    assert.ok(dynamicTableSrc.includes('const PAYMENT_TYPE_COLUMNS = ['), 'DynamicApiTable must define PAYMENT_TYPE_COLUMNS')
    assert.ok(dynamicTableSrc.includes('PaymentMethods: PAYMENT_METHOD_COLUMNS'), 'CONCISE_ENDPOINT_COLUMNS must include PaymentMethods')
    assert.ok(dynamicTableSrc.includes('PaymentTypes: PAYMENT_TYPE_COLUMNS'), 'CONCISE_ENDPOINT_COLUMNS must include PaymentTypes')
    assert.ok(dynamicTableSrc.includes('const PAYMENT_METHOD_FORM_LAYOUT = ['), 'DynamicApiTable must define PAYMENT_METHOD_FORM_LAYOUT')
    assert.ok(dynamicTableSrc.includes('const PAYMENT_TYPE_FORM_LAYOUT = ['), 'DynamicApiTable must define PAYMENT_TYPE_FORM_LAYOUT')
    assert.ok(dynamicTableSrc.includes('buildPaymentMethodSections'), 'DynamicApiTable must define buildPaymentMethodSections')
    assert.ok(dynamicTableSrc.includes('buildPaymentTypeSections'), 'DynamicApiTable must define buildPaymentTypeSections')
    assert.ok(dynamicTableSrc.includes('isPaymentMethodEndpoint.value || isPaymentTypeEndpoint.value'), 'DynamicApiTable must format payloads for PaymentMethods and PaymentTypes')
  })
})
