// Gene - Nov 7, 2026: Regression and schema verification suite for updated /api/Payments API (PaymentDto, /api/Payments/search, GET/PUT/DELETE transactionID query params, and canonical AccountingDashboard mapping)
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EndpointSchemaMeta } from '../src/models/schemaMeta.js'
import { MONITORED_ENDPOINTS } from '../src/models/monitoredEndpoints.js'
import { PaymentService } from '../src/services/payments.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const openapiSpec = JSON.parse(fs.readFileSync(path.join(rootDir, 'openapi.json'), 'utf8'))
const tableSrc = fs.readFileSync(path.join(rootDir, 'src/components/DynamicApiTable.vue'), 'utf8')
const accountingSrc = fs.readFileSync(path.join(rootDir, 'src/views/AccountingDashboard.vue'), 'utf8')
const apiViewerSrc = fs.readFileSync(path.join(rootDir, 'src/views/Api.vue'), 'utf8')
const typesSrc = fs.readFileSync(path.join(rootDir, 'src/models/types.js'), 'utf8')

describe('Updated Payments API & OpenAPI v1 Schema Verification Suite', () => {
  test('OpenAPI spec defines PaymentDto and binds POST and PUT /api/Payments to PaymentDto', () => {
    const paymentDto = openapiSpec.components?.schemas?.PaymentDto
    assert.ok(paymentDto, 'PaymentDto schema must exist in openapi.json')
    assert.ok(paymentDto.properties?.accountNo, 'PaymentDto must include accountNo')
    assert.ok(paymentDto.properties?.receivedPayment, 'PaymentDto must include receivedPayment')
    assert.equal(paymentDto.properties.receivedPayment.format, 'double', 'receivedPayment must be format double')
    assert.ok(paymentDto.properties?.paymentMethod, 'PaymentDto must include paymentMethod')
    assert.ok(paymentDto.properties?.transactionType, 'PaymentDto must include transactionType')

    const postRef = openapiSpec.paths?.['/api/Payments']?.post?.requestBody?.content?.['application/json']?.schema?.$ref
    assert.equal(postRef, '#/components/schemas/PaymentDto', 'POST /api/Payments must reference PaymentDto')

    const putRef = openapiSpec.paths?.['/api/Payments/{id}']?.put?.requestBody?.content?.['application/json']?.schema?.$ref
    assert.equal(putRef, '#/components/schemas/PaymentDto', 'PUT /api/Payments/{id} must reference PaymentDto')

    assert.equal(EndpointSchemaMeta.Payments?.create?.schema, 'PaymentDto')
    assert.equal(EndpointSchemaMeta.Payments?.update?.schema, 'PaymentDto')
  })

  test('OpenAPI spec defines transactionID query parameters on GET, PUT, and DELETE /api/Payments/{id} and /api/Payments/search', () => {
    const itemOps = openapiSpec.paths?.['/api/Payments/{id}']
    assert.ok(itemOps, '/api/Payments/{id} path must exist')

    const getParams = itemOps.get?.parameters || []
    assert.ok(getParams.some(p => p.name === 'transactionID' && p.in === 'query'), 'GET /api/Payments/{id} must declare transactionID query param')

    const putParams = itemOps.put?.parameters || []
    assert.ok(putParams.some(p => p.name === 'transactionid' && p.in === 'query'), 'PUT /api/Payments/{id} must declare transactionid query param')

    const delParams = itemOps.delete?.parameters || []
    assert.ok(delParams.some(p => p.name === 'transactionId' && p.in === 'query'), 'DELETE /api/Payments/{id} must declare transactionId query param')

    const searchOps = openapiSpec.paths?.['/api/Payments/search']?.get
    assert.ok(searchOps, 'GET /api/Payments/search must exist in openapi.json')
    const searchParamNames = (searchOps.parameters || []).map(p => p.name)
    assert.deepEqual(searchParamNames, ['transactionID', 'accountNo', 'fullName', 'contactNumber'])
  })

  test('PaymentService exposes getPayments, getPaymentById, searchPayments, createPayment, updatePayment, and deletePayment', () => {
    assert.equal(typeof PaymentService.getPayments, 'function')
    assert.equal(typeof PaymentService.getPaymentById, 'function')
    assert.equal(typeof PaymentService.searchPayments, 'function')
    assert.equal(typeof PaymentService.createPayment, 'function')
    assert.equal(typeof PaymentService.updatePayment, 'function')
    assert.equal(typeof PaymentService.deletePayment, 'function')
  })

  test('DynamicApiTable passes transactionId query parameter on DELETE /api/Payments/{id} and transactionID on GET /api/Payments/{id}', () => {
    assert.ok(
      tableSrc.includes('params: { transactionId: paymentDeleteTxnId }'),
      'deleteRecord in DynamicApiTable.vue must pass transactionId query parameter for Payments'
    )
    assert.ok(
      tableSrc.includes('await CrudService.remove(props.endpoint, targetId, deleteReqConfig)'),
      'deleteRecord must forward deleteReqConfig to CrudService.remove'
    )
    assert.ok(
      tableSrc.includes('params: { transactionID: base.transactionID || base.transactionid }'),
      'detectEditConflict must pass transactionID query parameter on GET /api/Payments/{id}'
    )
  })

  test('AccountingDashboard maps canonical /api/Payments fields without treating phone number contactNo as paid amount', () => {
    assert.ok(
      accountingSrc.includes('const isCanonicalAmt = typeof p.receivedPayment === \'number\''),
      'AccountingDashboard must prioritize numeric p.receivedPayment for paid amount'
    )
    assert.ok(
      accountingSrc.includes("accountNo: p.accountNo || p.transactionID || '—'"),
      'AccountingDashboard must map p.accountNo as primary accountNo'
    )
    assert.ok(
      accountingSrc.includes("fullName: p.fullName || p.accountNo || 'Subscriber'"),
      'AccountingDashboard must map p.fullName as primary fullName'
    )
    assert.ok(
      accountingSrc.includes('const resolvedDate = p.paymentDate || p.dateProcessed'),
      'AccountingDashboard must map p.paymentDate / p.dateProcessed as payment date'
    )
  })

  test('Monitored endpoints, API Viewer, and types.js include Payments, PaymentDto, and Payments/search', () => {
    assert.ok(MONITORED_ENDPOINTS.some(e => e.path === '/Payments'), 'MONITORED_ENDPOINTS must include /Payments')
    assert.ok(MONITORED_ENDPOINTS.some(e => e.path === '/PaymentMethods'), 'MONITORED_ENDPOINTS must include /PaymentMethods')
    assert.ok(MONITORED_ENDPOINTS.some(e => e.path === '/PaymentTypes'), 'MONITORED_ENDPOINTS must include /PaymentTypes')
    assert.ok(apiViewerSrc.includes("endpoint: 'Payments/search'"), 'Api.vue must include Payments/search')
    assert.ok(typesSrc.includes('@typedef {Object} PaymentDto'), 'types.js must define PaymentDto typedef')
  })
})
