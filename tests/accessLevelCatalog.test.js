import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ACCESS_LEVEL_CATALOG,
  getAccessLevelDisplayName,
  stripAccessLevelCodeFromName,
  extractAccessLevelCode,
  getAccessLevelShortCode,
  getAccessLevelCode,
  hasAccessLevel,
  isSuperAdminAccessLevel
} from '../src/constants/accessLevelCatalog.js'

describe('Access Level Catalog & Code Suite', () => {
  it('defines shortCodes for all standard access levels', () => {
    assert.ok(ACCESS_LEVEL_CATALOG.length >= 18)
    const sa = ACCESS_LEVEL_CATALOG.find(a => a.code === 'super_admin')
    assert.equal(sa.shortCode, 'SA1')
    assert.equal(sa.name, 'Super Admin')

    const bm = ACCESS_LEVEL_CATALOG.find(a => a.code === 'billing_manager')
    assert.equal(bm.shortCode, 'BM1')

    const dev = ACCESS_LEVEL_CATALOG.find(a => a.code === 'developer')
    assert.equal(dev.shortCode, 'DEV1')
  })

  it('formats display names with codes in parentheses', () => {
    assert.equal(getAccessLevelDisplayName('Super Admin'), 'Super Admin (SA1)')
    assert.equal(getAccessLevelDisplayName('Super Admin (SA1)'), 'Super Admin (SA1)')
    assert.equal(getAccessLevelDisplayName('Developer'), 'Developer (DEV1)')
    assert.equal(getAccessLevelDisplayName('Billing Manager'), 'Billing Manager (BM1)')
    assert.equal(getAccessLevelDisplayName({ id: 3, name: 'Super Admin' }), 'Super Admin (SA1)')
    assert.equal(getAccessLevelDisplayName({ id: 5, name: 'Billing Manager' }), 'Billing Manager (BM1)')
  })

  it('strips codes cleanly from names', () => {
    assert.equal(stripAccessLevelCodeFromName('Super Admin (SA1)'), 'Super Admin')
    assert.equal(stripAccessLevelCodeFromName('(DEV1) Developer'), 'Developer')
    assert.equal(stripAccessLevelCodeFromName('Billing Manager'), 'Billing Manager')
  })

  it('extracts code from string or object', () => {
    assert.equal(extractAccessLevelCode('Super Admin (SA1)'), 'SA1')
    assert.equal(extractAccessLevelCode({ shortCode: 'BM1' }), 'BM1')
    assert.equal(extractAccessLevelCode({ name: 'Technical Support (TS1)' }), 'TS1')
  })

  it('retrieves canonical codes and short codes', () => {
    assert.equal(getAccessLevelShortCode('Super Admin'), 'SA1')
    assert.equal(getAccessLevelCode('Super Admin'), 'super_admin')
    assert.equal(getAccessLevelShortCode({ id: 4 }), 'DEV1')
    assert.equal(getAccessLevelCode({ id: 4 }), 'developer')
  })

  it('hasAccessLevel enables flexible conditions and if statements', () => {
    const userSA = { id: 1, accesslevel_id: 3, role: 'Super Admin' }
    const userBM = { id: 2, accesslevel_id: 5, role: 'Billing Manager' }
    const userDev = { id: 3, accesslevel_id: 4, role: 'Developer (DEV1)' }

    // Test with user object and short codes
    assert.ok(hasAccessLevel(userSA, 'SA1'))
    assert.ok(hasAccessLevel(userSA, 'SA1', 'DEV1'))
    assert.ok(!hasAccessLevel(userSA, 'BM1', 'TS1'))

    // Test with slug codes
    assert.ok(hasAccessLevel(userBM, 'billing_manager'))
    assert.ok(!hasAccessLevel(userBM, 'super_admin'))

    // Test with arrays
    assert.ok(hasAccessLevel(userDev, ['DEV1', 'SA1']))
    assert.ok(!hasAccessLevel(userDev, ['BM1', 'CS1']))

    // Test with raw string role names
    assert.ok(hasAccessLevel('Billing Manager', 'BM1'))
    assert.ok(hasAccessLevel('Billing Manager (BM1)', 'BM1'))
    assert.ok(hasAccessLevel('Technical Support (TS1)', 'TS1', 'SA1'))

    // Test with IDs
    assert.ok(hasAccessLevel(3, 'SA1'))
    assert.ok(hasAccessLevel(userSA, 3))
  })

  it('isSuperAdminAccessLevel checks for Super Admin', () => {
    assert.ok(isSuperAdminAccessLevel('Super Admin'))
    assert.ok(isSuperAdminAccessLevel('Super Admin (SA1)'))
    assert.ok(isSuperAdminAccessLevel({ id: 3, role: 'Super Admin' }))
    assert.ok(!isSuperAdminAccessLevel('Billing Manager'))
  })
})
