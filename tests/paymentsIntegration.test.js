import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EndpointColumns } from '../src/models/columns.js'
import { ALL_MENU_CODES, ALL_MENU_ENTRIES } from '../src/constants/menuCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicTablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const dynamicTableSrc = fs.readFileSync(dynamicTablePath, 'utf8')
const fileMaintenancePath = path.resolve(__dirname, '../src/views/FileMaintenance.vue')
const fileMaintenanceSrc = fs.readFileSync(fileMaintenancePath, 'utf8')
const routerPath = path.resolve(__dirname, '../src/router/index.js')
const routerSrc = fs.readFileSync(routerPath, 'utf8')
const accountingDashboardPath = path.resolve(__dirname, '../src/views/AccountingDashboard.vue')
const accountingDashboardSrc = fs.readFileSync(accountingDashboardPath, 'utf8')

describe('Payments & Accounting API Integration Suite', () => {
  test('EndpointColumns.Payments is defined with expected payment fields', () => {
    assert.ok(Array.isArray(EndpointColumns.Payments), 'EndpointColumns.Payments must be an array')
    assert.ok(EndpointColumns.Payments.includes('id'), 'Payments must include id')
    assert.ok(EndpointColumns.Payments.includes('transactionID'), 'Payments must include transactionID')
    assert.ok(EndpointColumns.Payments.includes('accountNo'), 'Payments must include accountNo')
    assert.ok(EndpointColumns.Payments.includes('fullName'), 'Payments must include fullName')
    assert.ok(EndpointColumns.Payments.includes('contactNo'), 'Payments must include contactNo')
    assert.ok(EndpointColumns.Payments.includes('receivedPayment'), 'Payments must include receivedPayment')
    assert.ok(EndpointColumns.Payments.includes('paymentMethod'), 'Payments must include paymentMethod')
    assert.ok(EndpointColumns.Payments.includes('userEmail'), 'Payments must include userEmail')
  })

  test('Menu Catalog registers transaction.payments under Transaction group', () => {
    assert.ok(ALL_MENU_CODES.includes('transaction.payments'), 'transaction.payments must be in ALL_MENU_CODES')
    const paymentEntry = ALL_MENU_ENTRIES.find(e => e.code === 'transaction.payments')
    assert.ok(paymentEntry, 'transaction.payments must be in ALL_MENU_ENTRIES')
    assert.strictEqual(paymentEntry.path, '/payments', 'transaction.payments must map to /payments')
  })

  test('Router defines /payments route mapped to FileMaintenance', () => {
    assert.ok(routerSrc.includes("path: '/payments'"), 'router must define /payments path')
    assert.ok(routerSrc.includes("payments: 'Payments'"), 'router must define pageTitle for payments')
  })

  test('FileMaintenance.vue registers /payments route mapping to Payments endpoint', () => {
    assert.ok(fileMaintenanceSrc.includes("'/payments': {"), 'FileMaintenance must register /payments')
    assert.ok(fileMaintenanceSrc.includes("endpoint: 'Payments'"), 'FileMaintenance must point to Payments endpoint')
  })

  test('DynamicApiTable defines PAYMENT_COLUMNS and column aliases', () => {
    assert.ok(dynamicTableSrc.includes('const PAYMENT_COLUMNS = ['), 'DynamicApiTable must define PAYMENT_COLUMNS')
    assert.ok(dynamicTableSrc.includes('Payments: PAYMENT_COLUMNS'), 'CONCISE_ENDPOINT_COLUMNS must register Payments')
    assert.ok(dynamicTableSrc.includes("k === 'contactno') return 'Paid Amount'"), 'formatLabel must alias contactNo to Paid Amount')
    assert.ok(dynamicTableSrc.includes("k === 'accountno') return 'Customer Name'"), 'formatLabel must alias accountNo to Customer Name')
    assert.ok(dynamicTableSrc.includes("k === 'transactionid') return 'Account #'"), 'formatLabel must alias transactionID to Account #')
  })

  test('DynamicApiTable formats Payments contactNo as currency and handles default columns', () => {
    assert.ok(dynamicTableSrc.includes("isPaymentEndpoint.value && lower === 'contactno'"), 'formatDisplayValue must format contactNo for Payments')
    assert.ok(dynamicTableSrc.includes('if (isPaymentEndpoint.value) {'), 'defaultVisibleColumns must handle isPaymentEndpoint')
  })

  test('AccountingDashboard loads /Payments and processes live transactions', () => {
    assert.ok(accountingDashboardSrc.includes("apiClient.get('/Payments')"), 'AccountingDashboard must call apiClient.get(/Payments)')
    assert.ok(accountingDashboardSrc.includes('loadedPayments'), 'AccountingDashboard must process loadedPayments')
    assert.ok(accountingDashboardSrc.includes('/payments'), 'AccountingDashboard must link to /payments')
  })

  test('AccountingDashboard renders separate tables for Settled Payments and Outstanding Balances at bottom', () => {
    assert.ok(accountingDashboardSrc.includes('Settled Payments & Collections'), 'Must render Settled Payments table')
    assert.ok(accountingDashboardSrc.includes('Outstanding Balances & Receivables'), 'Must render Outstanding Balances table at bottom')
    assert.ok(accountingDashboardSrc.includes('paymentsSearchQuery'), 'Must support independent paymentsSearchQuery')
    assert.ok(accountingDashboardSrc.includes('receivablesSearchQuery'), 'Must support independent receivablesSearchQuery')
    assert.ok(accountingDashboardSrc.includes('const filteredOutstandingAccounts = computed('), 'Must compute filteredOutstandingAccounts')
    assert.ok(accountingDashboardSrc.includes('/billing'), 'Must provide direct navigation to /billing')
    assert.ok(accountingDashboardSrc.includes('/payments'), 'Must provide direct navigation to /payments')
  })

  test('AccountingDashboard computes AR Aging and Geographical Revenue charts', () => {
    assert.ok(accountingDashboardSrc.includes('const arAgingChartOption = computed('), 'Must compute arAgingChartOption')
    assert.ok(accountingDashboardSrc.includes('const geoRevenueChartOption = computed('), 'Must compute geoRevenueChartOption')
    assert.ok(accountingDashboardSrc.includes('AR Aging & Debt Severity Risk'), 'Must render AR Aging risk card')
    assert.ok(accountingDashboardSrc.includes('Geographical Subscriber & MRR Coverage'), 'Must render Geographical coverage card')
  })

  test('AccountingDashboard export generates unified PDF containing both Settled Payments and Receivables', () => {
    assert.ok(accountingDashboardSrc.includes('Settled Payment #'), 'PDF must include settled payment section')
    assert.ok(accountingDashboardSrc.includes('Account # (Overdue)'), 'PDF must include overdue receivables section')
    assert.ok(accountingDashboardSrc.includes('SwitchFiber_Accounting_Summary'), 'Export must use standard naming')
  })
})

