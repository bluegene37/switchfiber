// Gene - Nov, 23, 2026: Unit & integration tests for Tech menu under Users Management (FIT1 / Field Installation Team users)
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MENU_CATALOG,
  LEAF_MENU_CATALOG_ENTRIES,
  PARENT_TO_CHILD_CODES,
  menuCodeForPath,
  extractExplicitMenuCode,
  resolveMenuCodesFromName
} from '../src/constants/menuCatalog.js'
import {
  matchesAccessLevelTargetNames,
  resolveMatchingAccessLevelIds,
  filterUsersByAccessLevelNames
} from '../src/utils/accessLevelUserFilter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readRepoFile = (relPath) => fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8')

const stripHtmlComments = (src) => src.replace(/<!--[\s\S]*?-->/g, '')
const stripBlockComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '')

const routerSrc = readRepoFile('src/router/index.js')
const fileMaintenanceSrc = readRepoFile('src/views/FileMaintenance.vue')
const useSearchSrc = readRepoFile('src/composables/useSearch.js')
const dynamicTableSrc = readRepoFile('src/components/DynamicApiTable.vue')

describe('Tech Menu Catalog & Permission Integration', () => {
  test('registers Tech submenu under Users Management with unique shortCode TECH1 and /tech path', () => {
    const usersGroup = MENU_CATALOG.find(item => item.code === 'users-management')
    assert.ok(usersGroup && Array.isArray(usersGroup.children), 'Users Management group must exist')

    const techEntry = usersGroup.children.find(c => c.code === 'users-management.tech')
    assert.ok(techEntry, 'users-management.tech must be in Users Management children')
    assert.equal(techEntry.name, 'Tech')
    assert.equal(techEntry.shortCode, 'TECH1')
    assert.equal(techEntry.path, '/tech')

    const leafEntry = LEAF_MENU_CATALOG_ENTRIES.find(e => e.code === 'users-management.tech')
    assert.ok(leafEntry, 'LEAF_MENU_CATALOG_ENTRIES must expose users-management.tech to Access Level Management')
    assert.ok(PARENT_TO_CHILD_CODES.get('users-management')?.includes('users-management.tech'))
  })

  test('resolves /tech paths, aliases, explicit code, and menu names to users-management.tech', () => {
    assert.equal(menuCodeForPath('/tech'), 'users-management.tech')
    assert.equal(menuCodeForPath('/techs'), 'users-management.tech')
    assert.equal(menuCodeForPath('/technicians'), 'users-management.tech')
    assert.equal(extractExplicitMenuCode('Tech (TECH1)'), 'users-management.tech')
    assert.ok(resolveMenuCodesFromName('Tech').includes('users-management.tech'))
  })
})

describe('Tech Route, FileMaintenance & Global Search Wiring', () => {
  test('router registers /tech with requiresAuth and maps ROUTE_TITLES.tech', () => {
    assert.match(routerSrc, /tech:\s*'Tech'/)
    assert.match(
      routerSrc,
      /path:\s*'\/tech'[\s\S]{0,120}name:\s*'tech'[\s\S]{0,120}FileMaintenance\.vue[\s\S]{0,120}requiresAuth:\s*true/
    )
  })

  test('FileMaintenance maps /tech to Users endpoint scoped to FIT1 / Field Installation Team and passes route-aware key', () => {
    const activeFm = stripHtmlComments(stripBlockComments(fileMaintenanceSrc))
    assert.match(
      activeFm,
      /'\/tech':\s*\{[\s\S]{0,250}title:\s*'Tech'[\s\S]{0,250}endpoint:\s*'Users'[\s\S]{0,250}accessLevelNames:\s*\[\s*'FIT1'\s*,\s*'Field Installation Team'\s*\]/
    )
    assert.match(activeFm, /:key="tableKey"/)
    assert.match(activeFm, /:access-level-names="accessLevelNames"/)
    assert.match(activeFm, /:hide-create-button="readOnly \|\| hideCreate"/)
  })

  test('useSearch indexes /tech navigation entry', () => {
    assert.match(useSearchSrc, /route:\s*'\/tech'/)
  })
})

describe('Access Level Name Matching & User Filtering (FIT1 / Field Installation Team)', () => {
  const TARGETS = ['FIT1', 'Field Installation Team']

  test('matchesAccessLevelTargetNames matches FIT1 / Field Installation Team variants and rejects other or re-seeded IDs', () => {
    for (const valid of [
      'FIT1',
      'Field Installation Team',
      'Field Installation Team (FIT1)',
      '(FIT1) Field Installation Team',
      'FIT1 - Field Installation Team',
      'field installation team'
    ]) {
      assert.equal(matchesAccessLevelTargetNames(valid, TARGETS), true, `Expected "${valid}" to match`)
    }

    for (const invalid of [
      'Technical Support (TS1)',
      'Super Admin (SA1)',
      'Billing Manager (BM1)',
      'Guest (GST1)'
    ]) {
      assert.equal(matchesAccessLevelTargetNames(invalid, TARGETS), false, `Expected "${invalid}" to be rejected`)
    }

    // Re-seeded ID 9 whose rawName is now Accounting must NOT match FIT1 even if label contains FIT1
    assert.equal(
      matchesAccessLevelTargetNames(
        { value: 9, rawName: 'Accounting', label: 'Field Installation Team (FIT1)' },
        TARGETS
      ),
      false
    )

    assert.equal(
      matchesAccessLevelTargetNames({ value: 9, rawName: 'Field Installation Team' }, TARGETS),
      true
    )
    assert.equal(
      matchesAccessLevelTargetNames({ value: 21, rawName: 'FIT1' }, TARGETS),
      true
    )
  })

  test('filterUsersByAccessLevelNames filters Users to FIT1 / Field Installation Team IDs and supports empty target passthrough', () => {
    const levels = [
      { value: 3, rawName: 'Super Admin', label: 'Super Admin (SA1)' },
      { value: 9, rawName: 'Field Installation Team', label: 'Field Installation Team (FIT1)' },
      { value: 18, rawName: 'FIT1', label: 'FIT1 (FIT1)' },
      { value: 25, rawName: 'Technical Support', label: 'Technical Support (TS1)' }
    ]

    const matchedIds = resolveMatchingAccessLevelIds(levels, TARGETS)
    assert.deepEqual([...matchedIds].sort(), ['18', '9'])

    const users = [
      { id: 1, username: 'admin1', accesslevel_id: 3 },
      { id: 2, username: 'tech_snake', accesslevel_id: 9 },
      { id: 3, username: 'tech_camel', accessLevelId: '18' },
      { id: 4, username: 'support1', accesslevel_id: 25 },
      { id: 5, username: 'unassigned', accesslevel_id: null },
      { id: 6, username: 'missing' }
    ]

    const filtered = filterUsersByAccessLevelNames(users, levels, TARGETS)
    assert.deepEqual(filtered.map(u => u.id), [2, 3])

    assert.deepEqual(filterUsersByAccessLevelNames(users, levels, []).map(u => u.id), [1, 2, 3, 4, 5, 6])
  })
})

describe('DynamicApiTable Access Level Scoping Wiring', () => {
  test('defines accessLevelNames prop, preserves rawName, awaits lookup on scoped fetch, and defaults Create dropdown', () => {
    const activeScript = stripBlockComments(dynamicTableSrc)
    assert.match(activeScript, /accessLevelNames:\s*\{\s*type:\s*Array/)
    assert.match(activeScript, /const rawName = String\(item\.name \|\| item\.Name \|\| ''\)\.trim\(\)/)
    assert.match(activeScript, /hasAccessLevelNameScope\.value\s*\?\s*await Promise\.all\(\[CrudService\.list\(url,\s*params\),\s*fetchAccessLevelsLookup\(\)\]\)/)
    assert.match(activeScript, /const scopedData = computed\(/)
    assert.match(activeScript, /const filteredData = computed\(\(\) => applyFilters\(scopedData\.value\)\)/)
    assert.match(activeScript, /return Array\.isArray\(scopedData\.value\) \? scopedData\.value\.length : 0/)
    assert.match(activeScript, /formData\.value\[col\] = matchedScopedAccessLevels\.value\[0\]\.value/)
  })
})
