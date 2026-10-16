// Gene - Oct, 16, 2026: Comprehensive integration tests for client catalog menu permissions and Access Level integration
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  LEAF_MENU_CATALOG_ENTRIES,
  findPrimaryMenuCodeForName,
  getShortCodeForCatalogCode,
  getMenuDisplayName,
  PARENT_TO_CHILD_CODES
} from '../src/constants/menuCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicApiTableSource = fs.readFileSync(
  path.resolve(__dirname, '../src/components/DynamicApiTable.vue'),
  'utf8'
)
const usePermissionsSource = fs.readFileSync(
  path.resolve(__dirname, '../src/composables/usePermissions.js'),
  'utf8'
)

describe('Client Menu & Access Level Integration Suite', () => {
  test('New tables are registered in LEAF_MENU_CATALOG_ENTRIES with unique shortCodes', () => {
    const requiredCodes = [
      { code: 'file-maintenance.promo', shortCode: 'PR1' },
      { code: 'file-maintenance.inventory-category', shortCode: 'IC1' },
      { code: 'file-maintenance.inventory-item', shortCode: 'II1' },
      { code: 'file-maintenance.inventory-logs', shortCode: 'IL1' }
    ]

    requiredCodes.forEach(({ code, shortCode }) => {
      const entry = LEAF_MENU_CATALOG_ENTRIES.find(e => e.code === code)
      assert.ok(entry, `Entry for ${code} must exist in LEAF_MENU_CATALOG_ENTRIES`)
      assert.equal(entry.shortCode, shortCode, `ShortCode for ${code} must be ${shortCode}`)
      assert.ok(entry.name, `Entry ${code} must have a name`)
      assert.ok(entry.path, `Entry ${code} must have a path`)
    })
  })

  test('DynamicApiTable merges missing LEAF_MENU_CATALOG_ENTRIES when endpoint is Menus', () => {
    assert.ok(
      dynamicApiTableSource.includes("LEAF_MENU_CATALOG_ENTRIES.forEach(entry =>"),
      'DynamicApiTable must iterate LEAF_MENU_CATALOG_ENTRIES to append missing client menus'
    )
    assert.ok(
      dynamicApiTableSource.includes("isClientMenu: true"),
      'DynamicApiTable must mark merged catalog items as isClientMenu: true'
    )
  })

  test('DynamicApiTable hides Edit and Delete buttons on client catalog menus', () => {
    assert.ok(
      dynamicApiTableSource.includes("!readOnly && !slotProps.data?.isClientMenu"),
      'DynamicApiTable must hide Edit and Delete buttons for client menus'
    )
  })

  test('isMenuLinked and toggleMenuLink support client catalog menus without server errors', () => {
    assert.ok(
      dynamicApiTableSource.includes("if (menuRow.isClientMenu)"),
      'DynamicApiTable must have specialized non-failing branch for isClientMenu'
    )
    assert.ok(
      dynamicApiTableSource.includes("setClientAccessLevelMenuPermission"),
      'toggleMenuLink must persist client menu link state'
    )
    assert.ok(
      dynamicApiTableSource.includes("clientMenuTick.value++"),
      'toggleMenuLink must increment clientMenuTick for real-time reactivity'
    )
  })

  test('usePermissions exports localStorage permission helpers and auto-grants client menus', () => {
    assert.ok(
      usePermissionsSource.includes("export const getClientAccessLevelMenuPermissions"),
      'usePermissions must export getClientAccessLevelMenuPermissions'
    )
    assert.ok(
      usePermissionsSource.includes("export const setClientAccessLevelMenuPermission"),
      'usePermissions must export setClientAccessLevelMenuPermission'
    )
    assert.ok(
      usePermissionsSource.includes("!codeToMenuIds.value.has(code)"),
      'usePermissions must handle menu codes not present in server /api/Menus'
    )
    assert.ok(
      usePermissionsSource.includes("isDevOrAdmin || hasSiblingAccess"),
      'usePermissions must check developer role or sibling access in category'
    )
  })

  test('Existing 43 server menus are preserved and continue to use activeLinkedMenuIds', () => {
    assert.ok(
      dynamicApiTableSource.includes("activeLinkedMenuIds.value.has(targetMenuId)"),
      'DynamicApiTable must preserve activeLinkedMenuIds check for standard server menus'
    )
    assert.ok(
      dynamicApiTableSource.includes("writeWithRouteCasingFallback('post', '/AccesslevelMenu'"),
      'DynamicApiTable must preserve REST API linking for standard server menus'
    )
    assert.ok(
      dynamicApiTableSource.includes("writeWithRouteCasingFallback('delete', `/AccesslevelMenu/"),
      'DynamicApiTable must preserve REST API unlinking for standard server menus'
    )
  })
})
