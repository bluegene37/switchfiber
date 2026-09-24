import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const serviceFile = path.resolve(__dirname, '../src/services/accessLevels.js')

describe('AccessLevel create and update payload formatting', () => {
  const tableSrc = fs.readFileSync(tableFile, 'utf8')
  const serviceSrc = fs.readFileSync(serviceFile, 'utf8')

  test('isAccessLevelEndpoint is defined in DynamicApiTable.vue', () => {
    assert.ok(
      tableSrc.includes('const isAccessLevelEndpoint = computed'),
      'DynamicApiTable must define isAccessLevelEndpoint'
    )
    assert.ok(
      tableSrc.includes("ep === 'accesslevel'") &&
      tableSrc.includes("ep === 'accesslevels'") &&
      tableSrc.includes("ep === 'access_level'"),
      'isAccessLevelEndpoint must match singular, plural, and underscore variants'
    )
  })

  test('ACCESS_LEVEL_FORM_LAYOUT isolates name and description fields', () => {
    assert.ok(
      tableSrc.includes('const ACCESS_LEVEL_FORM_LAYOUT'),
      'ACCESS_LEVEL_FORM_LAYOUT must be defined'
    )
    assert.ok(
      tableSrc.includes("columns: ['name', 'description']"),
      'Form columns must only contain name and description'
    )
  })

  test('formSections and viewFormSections are wired to buildAccessLevelSections', () => {
    assert.ok(
      tableSrc.includes('if (isAccessLevelEndpoint.value) {\n    return buildAccessLevelSections(formColumns.value)\n  }'),
      'formSections must route isAccessLevelEndpoint to buildAccessLevelSections'
    )
    assert.ok(
      tableSrc.includes('if (isAccessLevelEndpoint.value) {\n    return buildAccessLevelSections(viewFormColumns.value, { includeAudit: true })\n  }'),
      'viewFormSections must route isAccessLevelEndpoint to buildAccessLevelSections with audit'
    )
  })

  test('saveData sets createdBy/modifiedBy to string user login id and dates to null', () => {
    assert.ok(
      tableSrc.includes('} else if (isAccessLevelEndpoint.value) {'),
      'saveData must have a dedicated branch for isAccessLevelEndpoint'
    )
    
    // Extract the isAccessLevelEndpoint block in saveData
    const saveIdx = tableSrc.indexOf('const saveData = async')
    const branchIdx = tableSrc.indexOf('} else if (isAccessLevelEndpoint.value) {', saveIdx)
    const blockEndIdx = tableSrc.indexOf('} else {', branchIdx)
    const block = tableSrc.slice(branchIdx, blockEndIdx)

    assert.ok(block.includes('createdBy: loggedInUserId'), 'createdBy must use string loggedInUserId')
    assert.ok(block.includes('createdDate: null'), 'createdDate must explicitly be null')
    assert.ok(block.includes('modifiedBy: loggedInUserId'), 'modifiedBy must use string loggedInUserId')
    assert.ok(block.includes('modifiedDate: null'), 'modifiedDate must explicitly be null')
  })

  test('updateData sets modifiedBy to string user login id and modifiedDate to null without overwriting createdBy/createdDate', () => {
    const updateIdx = tableSrc.indexOf('const updateRecord = async') !== -1 
      ? tableSrc.indexOf('const updateRecord = async') 
      : tableSrc.indexOf('displayEditDialog.value = true') // inside edit save flow

    const branchIdx = tableSrc.indexOf('} else if (isAccessLevelEndpoint.value) {', updateIdx)
    const blockEndIdx = tableSrc.indexOf('} else {', branchIdx)
    const block = tableSrc.slice(branchIdx, blockEndIdx)

    assert.ok(block.includes('modifiedBy: loggedInUserId'), 'modifiedBy must be set to loggedInUserId')
    assert.ok(block.includes('modifiedDate: null'), 'modifiedDate must explicitly be null')
    assert.ok(!block.includes('createdBy'), 'update must not touch createdBy')
    assert.ok(!block.includes('createdDate'), 'update must not touch createdDate')
  })

  test('AccessLevelService formats createAccessLevel payload with string user login id and null dates', () => {
    assert.ok(
      serviceSrc.includes('createdDate: null'),
      'createAccessLevel must explicitly set createdDate to null'
    )
    assert.ok(
      serviceSrc.includes('modifiedDate: null'),
      'createAccessLevel must explicitly set modifiedDate to null'
    )
    assert.ok(
      serviceSrc.includes('createdBy:'),
      'createAccessLevel must populate createdBy'
    )
    assert.ok(
      serviceSrc.includes('modifiedBy:'),
      'createAccessLevel must populate modifiedBy'
    )
  })

  test('AccessLevelService formats updateAccessLevel payload with modifiedBy and null modifiedDate', () => {
    assert.ok(
      serviceSrc.includes('updateAccessLevel(id, data = {})'),
      'updateAccessLevel must accept id and data'
    )
    assert.ok(
      serviceSrc.includes('modifiedDate: null'),
      'updateAccessLevel must set modifiedDate to null'
    )
  })
})
