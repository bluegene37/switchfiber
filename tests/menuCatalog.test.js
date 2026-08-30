import test, { describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  MENU_CATALOG,
  CONTROL_MENU_CATALOG,
  ALL_MENU_ENTRIES,
  ALL_MENU_CODES,
  PARENT_TO_CHILD_CODES,
  flattenMenuCatalog,
  normalizeMenuName,
  stemMenuToken,
  normalizeAndStem,
  parseCompoundSegments,
  resolveMenuCodesFromName,
  findPrimaryMenuCodeForName,
  getChildCodesForParent,
  isSuperAdminRole
} from '../src/constants/menuCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8')

describe('Menu Catalog & Name-Based Permission Resolution Engine', () => {
  test('every entry has a stable code, and codes are unique', () => {
    for (const entry of ALL_MENU_ENTRIES) {
      assert.ok(entry.code, `${entry.name} is missing a code`)
      assert.match(entry.code, /^[a-z0-9-]+(\.[a-z0-9-]+)?$/, `${entry.code} is not a stable slug`)
    }
    assert.strictEqual(
      new Set(ALL_MENU_CODES).size,
      ALL_MENU_CODES.length,
      'menu codes must be unique — a duplicate silently merges two screens permissions'
    )
  })

  test('every leaf entry has a route, every group has children', () => {
    for (const item of MENU_CATALOG) {
      if (item.children) {
        assert.ok(item.children.length > 0, `${item.code} is a group with no children`)
        for (const child of item.children) {
          assert.ok(child.path, `${child.code} must have a path`)
        }
      } else {
        assert.ok(item.path, `${item.code} must have a path`)
      }
    }
  })

  test('name normalization ignores case, spacing, and punctuation', () => {
    assert.strictEqual(normalizeMenuName('VLan'), normalizeMenuName('VLAN'))
    assert.strictEqual(normalizeMenuName('LCNAP Port'), normalizeMenuName('lcnap  port'))
    assert.strictEqual(normalizeMenuName('Access Level'), normalizeMenuName('access-level'))
    assert.strictEqual(normalizeMenuName('File Maintenance - LCP'), normalizeMenuName('filemaintenance_lcp'))
    assert.notStrictEqual(normalizeMenuName('User'), normalizeMenuName('User Management'))
  })

  test('stemming tokenization handles plurals and domain vocabulary', () => {
    assert.strictEqual(stemMenuToken('applications'), 'application')
    assert.strictEqual(stemMenuToken('joborders'), 'job order')
    assert.strictEqual(stemMenuToken('plans'), 'plan')
    assert.strictEqual(stemMenuToken('routers'), 'router')
    assert.strictEqual(stemMenuToken('logtrails'), 'audit trail')
    assert.strictEqual(stemMenuToken('logerrors'), 'error log')
    assert.strictEqual(normalizeAndStem('Customer Applications In-Progress'), 'customer application in progress')
  })

  test('compound segment parsing splits delimited titles', () => {
    assert.deepStrictEqual(parseCompoundSegments('File Maintenance - LCP'), ['File Maintenance', 'LCP'])
    assert.deepStrictEqual(parseCompoundSegments('Users Management > Access Level'), ['Users Management', 'Access Level'])
    assert.deepStrictEqual(parseCompoundSegments('Audit Trail / By Date'), ['Audit Trail', 'By Date'])
    assert.deepStrictEqual(parseCompoundSegments('Transaction: Billing'), ['Transaction', 'Billing'])
  })

  test('resolveMenuCodesFromName resolves exact names, aliases, and compound segments', () => {
    // Exact & direct matches
    assert.ok(resolveMenuCodesFromName('Dashboard').includes('dashboard'))
    assert.ok(resolveMenuCodesFromName('LCP').includes('file-maintenance.lcp'))
    assert.ok(resolveMenuCodesFromName('Router').includes('file-maintenance.router'))
    assert.ok(resolveMenuCodesFromName('Billing').includes('transaction.billing'))
    assert.ok(resolveMenuCodesFromName('Invoice').includes('transaction.invoice'))
    assert.ok(resolveMenuCodesFromName('Access Level').includes('users-management.access-level'))

    // Compound segment matches
    assert.ok(resolveMenuCodesFromName('File Maintenance - LCP').includes('file-maintenance.lcp'))
    assert.ok(resolveMenuCodesFromName('Users Management > User').includes('users-management.user'))
    assert.ok(resolveMenuCodesFromName('Audit Trail - By Transaction Date').includes('audit-trail.by-date'))

    // Plural / singular stemmed matches
    assert.ok(resolveMenuCodesFromName('Job Orders').includes('job-orders.all') || resolveMenuCodesFromName('Job Orders').includes('job-orders'))
    assert.ok(resolveMenuCodesFromName('Plans').includes('file-maintenance.plan'))

    // Special controls & security actions
    assert.ok(resolveMenuCodesFromName('Modify Password').includes('settings.modify-password'))
    assert.ok(resolveMenuCodesFromName('Unmask Password').includes('settings.unmask-password'))
    assert.ok(resolveMenuCodesFromName('Theme & Appearance').includes('settings.theme'))
  })

  test('findPrimaryMenuCodeForName returns the best single code', () => {
    assert.strictEqual(findPrimaryMenuCodeForName('Dashboard'), 'dashboard')
    assert.strictEqual(findPrimaryMenuCodeForName('Modify Password'), 'settings.modify-password')
    assert.strictEqual(findPrimaryMenuCodeForName('Unmask Password'), 'settings.unmask-password')
    assert.strictEqual(findPrimaryMenuCodeForName('LCP'), 'file-maintenance.lcp')
  })

  test('parent-child inheritance relations are registered', () => {
    assert.ok(PARENT_TO_CHILD_CODES.has('file-maintenance'))
    const fmChildren = getChildCodesForParent('file-maintenance')
    assert.ok(fmChildren.includes('file-maintenance.lcp'))
    assert.ok(fmChildren.includes('file-maintenance.nap'))
    assert.ok(fmChildren.includes('file-maintenance.vlan'))

    assert.ok(PARENT_TO_CHILD_CODES.has('application'))
    const appChildren = getChildCodesForParent('application')
    assert.ok(appChildren.includes('application.all'))
    assert.ok(appChildren.includes('application.in-progress'))
    assert.ok(appChildren.includes('application.done'))
    assert.ok(appChildren.includes('application.approved'))
  })

  test('flatten covers every group and child exactly once', () => {
    const flat = flattenMenuCatalog()
    const expected = MENU_CATALOG.reduce(
      (n, item) => n + 1 + (item.children ? item.children.length : 0),
      0
    )
    assert.strictEqual(flat.length, expected)
    assert.ok(ALL_MENU_ENTRIES.length === flat.length + CONTROL_MENU_CATALOG.length)
  })

  test('permissions are resolved by name, never by a hardcoded id list', () => {
    const perms = read('../src/composables/usePermissions.js')
    assert.ok(
      !/FULL_MENU_IDS|CLIENT_PROVIDED_MENU_IDS/.test(perms),
      'usePermissions must not carry hardcoded menu id arrays'
    )
    assert.ok(
      !/canAccess\(\s*\d+\s*\)/.test(perms),
      'canAccess must be called with a stable code, not a numeric id'
    )
    assert.ok(
      perms.includes('resolveMenuCodesFromName'),
      'codes must be resolved dynamically through name parsing'
    )
  })

  test('the sidebar renders the shared catalog and filters by code', () => {
    const sidebar = read('../src/components/Sidebar.vue')
    assert.ok(sidebar.includes("from '../constants/menuCatalog'"), 'sidebar must use the catalog')
    assert.ok(sidebar.includes('allowedMenuCodes'), 'sidebar must filter on codes')
    assert.ok(
      !/allowed\.has\(\s*(item|child)\.id\s*\)/.test(sidebar),
      'sidebar must not gate on numeric menu ids'
    )
  })

  test('the Menus picker no longer relabels a server row', () => {
    const table = read('../src/components/DynamicApiTable.vue')
    assert.ok(
      !/appItem\.name\s*=\s*'All Application'/.test(table),
      'renaming menu id 14 in the picker hid the id drift and misled admins granting it'
    )
  })

  test('the sidebar accordion expands via item code/key, not undefined id', () => {
    const sidebar = read('../src/components/Sidebar.vue')
    assert.ok(sidebar.includes('getItemKey'), 'sidebar must use getItemKey to expand submenus')
    assert.ok(!sidebar.includes('expandedState.value[item.id]'), 'sidebar must not key expandedState on item.id')
  })

  test('isSuperAdminRole dynamically resolves Super Admin and Developer access levels by name', () => {
    assert.strictEqual(isSuperAdminRole('Super Admin'), true)
    assert.strictEqual(isSuperAdminRole('superadmin'), true)
    assert.strictEqual(isSuperAdminRole('Super-Admin'), true)
    assert.strictEqual(isSuperAdminRole('Developer'), true)
    assert.strictEqual(isSuperAdminRole('Admin'), true)
    assert.strictEqual(isSuperAdminRole('System Administrator'), true)

    assert.strictEqual(isSuperAdminRole('Billing Manager'), false)
    assert.strictEqual(isSuperAdminRole('Technical Support'), false)
    assert.strictEqual(isSuperAdminRole('Customer Support'), false)
    assert.strictEqual(isSuperAdminRole('Data Input Team'), false)
    assert.strictEqual(isSuperAdminRole('Field Installation Team'), false)
    assert.strictEqual(isSuperAdminRole('Network Operations Center'), false)
    assert.strictEqual(isSuperAdminRole('Guest'), false)
    assert.strictEqual(isSuperAdminRole(''), false)
    assert.strictEqual(isSuperAdminRole(null), false)
  })
})
