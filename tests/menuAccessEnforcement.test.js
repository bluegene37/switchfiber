// Menu access is enforced by NAME, everywhere the menu is reachable from.
//
// The client deletes and recreates rows, so database ids are not identity: the
// live data on 2026-09-01 held 28 AccesslevelMenu rows pointing at access level
// 1 (deleted — levels now start at 3) and 3 rows pointing at menus 101-103
// (also gone). Everything therefore resolves through the name engine — and the
// three doors into a screen (sidebar, typed URL, omnibox) must all use it, or
// hiding the menu entry just moves the problem.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ALL_MENU_ENTRIES,
  MENU_CODE_BY_PATH,
  menuCodeForPath,
  isSuperAdminName,
  resolveMenuCodesFromName
} from '../src/constants/menuCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')
const routerSource = read('src/router/index.js')
const permissionsSource = read('src/composables/usePermissions.js')
const searchSource = read('src/composables/useSearch.js')
const layoutSource = read('src/layouts/AppLayout.vue')

describe('Super Admin is a whole-name decision', () => {
  test('only a level literally named Super Admin gets everything', () => {
    assert.equal(isSuperAdminName('Super Admin'), true)
    assert.equal(isSuperAdminName('super-admin'), true)
    assert.equal(isSuperAdminName('SUPERADMIN'), true)
  })

  test('the live level names that must NOT be super admins', () => {
    // "Developer" is level 4 in the live data with exactly 2 granted rows —
    // the substring check used to hand it the whole menu anyway.
    for (const name of [
      'Developer', 'Supervisor', 'Superintendent', 'Super User', 'Admin',
      'Billing Manager', 'Technical Support', 'Customer Support',
      'Data Input Team', 'Field Installation Team',
      'Network Operations Center', 'Guest'
    ]) {
      assert.equal(isSuperAdminName(name), false, `"${name}" must be an ordinary level`)
    }
  })

  test('usePermissions decides by strict name, never by the loose role test or an id', () => {
    assert.ok(permissionsSource.includes('isSuperAdminName'), 'Must use the whole-name check')
    assert.ok(
      !/\bisSuperAdminRole\b/.test(permissionsSource),
      'The substring check grants "Supervisor" and "Developer" the full menu'
    )
    assert.ok(
      !/userAccessLevel\.value === [13]/.test(permissionsSource),
      'Ids shift when the client re-seeds — the next level landing on id 3 would inherit everything'
    )
  })
})

describe('Route paths resolve to the code that governs them', () => {
  test('every routed screen the catalog owns maps back to its code', () => {
    assert.equal(menuCodeForPath('/access_level'), 'users-management.access-level')
    assert.equal(menuCodeForPath('/application'), 'application.all')
    assert.equal(menuCodeForPath('/dashboard'), 'dashboard')
    assert.equal(menuCodeForPath('/settings'), 'settings')
  })

  test('legacy aliases and landing redirects are not back doors', () => {
    assert.equal(menuCodeForPath('/application_list'), 'application.all')
    assert.equal(menuCodeForPath('/job_order'), 'job-orders.all')
    assert.equal(menuCodeForPath('/menu'), 'users-management.access-level')
    assert.equal(menuCodeForPath('/access_level_menu'), 'users-management.access-level')
    assert.equal(menuCodeForPath('/lcp-nap-locations'), 'lcp-nap-locations.map')
    assert.equal(menuCodeForPath('/logs'), 'audit-trail.all')
  })

  test('a child path inherits its parent screen without an explicit entry', () => {
    // Status routes appear and disappear; the parent's permission covers them.
    assert.equal(menuCodeForPath('/service-orders/pending'), 'service-orders')
    assert.equal(menuCodeForPath('/service-orders/inprogress'), 'service-orders')
    assert.equal(menuCodeForPath('/logs/audit-trail/by-user'), 'audit-trail.by-user')
  })

  test('query strings, hashes and trailing slashes do not defeat the mapping', () => {
    assert.equal(menuCodeForPath('/access_level?tab=menus'), 'users-management.access-level')
    assert.equal(menuCodeForPath('/access_level/'), 'users-management.access-level')
    assert.equal(menuCodeForPath('/access_level#top'), 'users-management.access-level')
  })

  test('unmanaged routes resolve to nothing rather than something wrong', () => {
    assert.equal(menuCodeForPath('/login'), null)
    assert.equal(menuCodeForPath('/'), null)
    assert.equal(menuCodeForPath('/no-such-screen'), null)
  })

  test('every authenticated router path is governed by a code', () => {
    const activeSource = routerSource
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
    const routerPaths = [...activeSource.matchAll(/path: '([^']+)'/g)]
      .map(m => m[1])
      .filter(p => p !== '/' && p !== '/login' && !p.includes(':'))
    const unguarded = routerPaths.filter(p => !menuCodeForPath(p))
    assert.deepEqual(
      unguarded,
      [],
      'A route no menu code governs is reachable by URL regardless of permissions'
    )
  })
})

describe('All three doors use the same gate', () => {
  test('the router guard enforces canAccess and lands denied users on the dashboard', () => {
    assert.ok(routerSource.includes('menuCodeForPath(to.path)'), 'Guard must resolve the path to a code')
    assert.ok(routerSource.includes('await ensurePermissionsLoaded()'), 'Guard must wait for the permission set')
    assert.ok(routerSource.includes('if (!canAccess(code))'), 'Guard must enforce the code')
    assert.ok(routerSource.includes("'menu-access-denied'"), 'A silent bounce reads as a broken link')
  })

  test('the dashboard is exempt so the redirect cannot loop', () => {
    assert.ok(
      routerSource.includes("code !== 'dashboard'"),
      'Denying the landing screen would redirect to itself forever'
    )
  })

  test('the omnibox offers only permitted navigation', () => {
    assert.ok(searchSource.includes('menuCodeForPath(item.route)'), 'Search must resolve each route')
    assert.ok(searchSource.includes('canAccess(code)'), 'Search must apply the same gate')
    assert.ok(
      searchSource.includes('permittedNavigationItems.value.filter'),
      'The query must filter the permitted list, not the full list'
    )
  })

  test('the layout says why a navigation was refused', () => {
    assert.ok(layoutSource.includes("'menu-access-denied'"), 'The toast outlet must hear the guard')
    assert.ok(layoutSource.includes('Access denied'), 'The user must be told, not just bounced')
  })
})

describe('The name engine still recognizes the live registry', () => {
  test('the live menu rows that matter resolve to codes', () => {
    // Names as they exist in /api/Menus on 2026-09-01.
    const expectations = [
      ['Access Level', 'users-management.access-level'],
      ['Application', 'application.all'],
      ['Job Order', 'job-orders.all'],
      ['File Maintenance', 'file-maintenance.lcp'],
      ['Service Orders', 'service-orders'],
      ['Theme & Appearance', 'settings.theme']
    ]
    for (const [serverName, expectedCode] of expectations) {
      assert.ok(
        resolveMenuCodesFromName(serverName).includes(expectedCode),
        `"${serverName}" must resolve to ${expectedCode}`
      )
    }
  })

  test('every catalog entry with a path is in the path index', () => {
    for (const entry of ALL_MENU_ENTRIES) {
      if (!entry.path) continue
      assert.equal(MENU_CODE_BY_PATH.get(entry.path), entry.code)
    }
  })
})
