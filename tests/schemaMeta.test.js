import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { MONITORED_ENDPOINTS, labelForPath } from '../src/models/monitoredEndpoints.js'
import { EndpointColumns } from '../src/models/columns.js'
import { resolveRequiredFields, isSystemField, hasRequiredOverride } from '../src/models/requiredFields.js'

describe('Domain Models & Schema Meta Suite', () => {
  test('Monitored Endpoints has valid configuration and labels', () => {
    assert.ok(Array.isArray(MONITORED_ENDPOINTS), 'MONITORED_ENDPOINTS should be an array')
    assert.ok(MONITORED_ENDPOINTS.length >= 10, 'Expected at least 10 monitored endpoints')

    for (const endpoint of MONITORED_ENDPOINTS) {
      assert.ok(endpoint.key, 'Endpoint must have a key')
      assert.ok(endpoint.path.startsWith('/'), 'Endpoint path must start with /')
      assert.ok(endpoint.label, 'Endpoint must have a label')
    }
  })

  test('labelForPath resolves human-readable labels', () => {
    assert.strictEqual(labelForPath('/Applications'), 'Applications')
    assert.strictEqual(labelForPath('/Plans'), 'Active Plans')
    assert.strictEqual(labelForPath('/UnknownEndpoint'), '/UnknownEndpoint')
  })

  test('EndpointColumns contains fallback definitions for core entities', () => {
    assert.ok(EndpointColumns['Applications'], 'Should have column fallbacks for Applications')
    assert.ok(EndpointColumns['JobOrders'], 'Should have column fallbacks for JobOrders')
    assert.ok(EndpointColumns['Lcps'], 'Should have column fallbacks for Lcps')
    assert.ok(EndpointColumns['Plans'], 'Should have column fallbacks for Plans')
    assert.ok(EndpointColumns['Users'], 'Should have column fallbacks for Users')
    assert.ok(EndpointColumns['DiscountTypes'], 'Should have column fallbacks for DiscountTypes')
    assert.ok(Array.isArray(EndpointColumns['DiscountTypes']), 'DiscountTypes columns should be an array')
    assert.deepStrictEqual(EndpointColumns['DiscountTypes'].slice(0, 5), ['id', 'name', 'description', 'amount', 'planId'])
    assert.ok(Array.isArray(EndpointColumns['Applications']), 'Applications columns should be an array')
  })

  test('Required fields engine filters system fields and validates overrides', () => {
    assert.ok(isSystemField('id'), 'id should be treated as system field')
    assert.ok(isSystemField('createdDate'), 'createdDate should be treated as system field')
    assert.ok(isSystemField('modifiedBy'), 'modifiedBy should be treated as system field')
    assert.ok(!isSystemField('firstName'), 'firstName is not a system field')

    assert.ok(hasRequiredOverride('Applications'), 'Applications should have custom required overrides')
    const reqCols = resolveRequiredFields('Applications', ['firstName', 'lastName', 'mobileNumber', 'id'])
    assert.ok(reqCols.includes('firstName'), 'firstName should be required in Applications')
    assert.ok(!reqCols.includes('id'), 'System field id should not be required')

    assert.ok(hasRequiredOverride('DiscountTypes'), 'DiscountTypes should have custom required overrides')
    const reqDiscountTypeCols = resolveRequiredFields('DiscountTypes', ['id', 'name', 'amount', 'planId', 'createdDate'])
    assert.deepStrictEqual(reqDiscountTypeCols, ['name', 'amount'])
  })
})
