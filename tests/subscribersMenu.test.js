// Gene - Nov, 23, 2026: Unit & integration tests for Subscribers parent & child menu, WIP view, and Access Level rights
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MENU_CATALOG,
  LEAF_MENU_CATALOG_ENTRIES,
  PARENT_TO_CHILD_CODES,
  isParentMenu,
  getMenuDisplayName,
  menuCodeForPath,
  extractExplicitMenuCode,
  findPrimaryMenuCodeForName,
  resolveMenuCodesFromName
} from '../src/constants/menuCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readRepoFile = (relPath) => fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8')

const routerSrc = readRepoFile('src/router/index.js')
const useSearchSrc = readRepoFile('src/composables/useSearch.js')
const subscribersViewSrc = readRepoFile('src/views/Subscribers.vue')

describe('Subscribers Menu Catalog & Access Level Rights Integration', () => {
  /*
  test('registers Subscribers parent group (SUB1) and Subscribers child leaf (SUBS1, /subscribers)', () => {
    const parentGroup = MENU_CATALOG.find(item => item.code === 'subscribers')
    assert.ok(parentGroup && Array.isArray(parentGroup.children), 'Subscribers parent group must exist')
    assert.equal(parentGroup.name, 'Subscribers')
    assert.equal(parentGroup.shortCode, 'SUB1')

    const childEntry = parentGroup.children.find(c => c.code === 'subscribers.list')
    assert.ok(childEntry, 'subscribers.list child entry must exist under Subscribers')
    assert.equal(childEntry.name, 'Subscribers')
    assert.equal(childEntry.shortCode, 'SUBS1')
    assert.equal(childEntry.path, '/subscribers')

    const leafEntry = LEAF_MENU_CATALOG_ENTRIES.find(e => e.code === 'subscribers.list')
    assert.ok(leafEntry, 'LEAF_MENU_CATALOG_ENTRIES must include subscribers.list for Access Level Management')
    assert.equal(getMenuDisplayName(leafEntry), 'Subscribers (SUBS1)')
    assert.ok(PARENT_TO_CHILD_CODES.get('subscribers')?.includes('subscribers.list'))
  })

  test('isParentMenu identifies parent group as parent while keeping child leaf visible in Access Level Menu List', () => {
    const parentGroup = MENU_CATALOG.find(item => item.code === 'subscribers')
    const childEntry = parentGroup.children.find(c => c.code === 'subscribers.list')

    assert.equal(isParentMenu(parentGroup), true)
    assert.equal(isParentMenu('subscribers'), true)
    assert.equal(isParentMenu('Subscribers (SUB1)'), true)

    assert.equal(isParentMenu(childEntry), false)
    assert.equal(isParentMenu('subscribers.list'), false)
    assert.equal(isParentMenu('Subscribers (SUBS1)'), false)
  })

  test('resolves /subscribers paths, aliases, explicit codes, and names', () => {
    assert.equal(menuCodeForPath('/subscribers'), 'subscribers.list')
    assert.equal(menuCodeForPath('/subscriber'), 'subscribers.list')
    assert.equal(menuCodeForPath('/subscribers/list'), 'subscribers.list')

    assert.equal(extractExplicitMenuCode('Subscribers (SUBS1)'), 'subscribers.list')
    assert.equal(extractExplicitMenuCode('Subscribers (SUB1)'), 'subscribers')
    assert.ok(resolveMenuCodesFromName('Subscribers').includes('subscribers.list'))
  })
  */
  // Gene - Nov, 23, 2026: Verify subscribers-group parent (SUB1) and subscribers.list leaf (SUBS1) resolve cleanly without parent/child name collision
  test('registers Subscribers parent group (subscribers-group / SUB1) and Subscribers child leaf (subscribers.list / SUBS1, /subscribers)', () => {
    const parentGroup = MENU_CATALOG.find(item => item.code === 'subscribers-group')
    assert.ok(parentGroup && Array.isArray(parentGroup.children), 'Subscribers parent group must exist')
    assert.equal(parentGroup.name, 'Subscribers')
    assert.equal(parentGroup.shortCode, 'SUB1')

    const childEntry = parentGroup.children.find(c => c.code === 'subscribers.list')
    assert.ok(childEntry, 'subscribers.list child entry must exist under Subscribers')
    assert.equal(childEntry.name, 'Subscribers')
    assert.equal(childEntry.shortCode, 'SUBS1')
    assert.equal(childEntry.path, '/subscribers')

    const leafEntry = LEAF_MENU_CATALOG_ENTRIES.find(e => e.code === 'subscribers.list')
    assert.ok(leafEntry, 'LEAF_MENU_CATALOG_ENTRIES must include subscribers.list for Access Level Management')
    assert.equal(getMenuDisplayName(leafEntry), 'Subscribers (SUBS1)')
    assert.ok(PARENT_TO_CHILD_CODES.get('subscribers-group')?.includes('subscribers.list'))
  })

  test('isParentMenu identifies parent group as parent while keeping child leaf and bare Subscribers visible in Access Level Menu List', () => {
    const parentGroup = MENU_CATALOG.find(item => item.code === 'subscribers-group')
    const childEntry = parentGroup.children.find(c => c.code === 'subscribers.list')

    assert.equal(isParentMenu(parentGroup), true)
    assert.equal(isParentMenu('subscribers-group'), true)
    assert.equal(isParentMenu('Subscribers (SUB1)'), true)

    assert.equal(isParentMenu(childEntry), false)
    assert.equal(isParentMenu('subscribers.list'), false)
    assert.equal(isParentMenu('Subscribers (SUBS1)'), false)
    assert.equal(isParentMenu('Subscribers'), false)
  })

  test('resolves /subscribers paths, aliases, explicit codes, primary code, and display name', () => {
    assert.equal(menuCodeForPath('/subscribers'), 'subscribers.list')
    assert.equal(menuCodeForPath('/subscriber'), 'subscribers.list')
    assert.equal(menuCodeForPath('/subscribers/list'), 'subscribers.list')

    assert.equal(extractExplicitMenuCode('Subscribers (SUBS1)'), 'subscribers.list')
    assert.equal(extractExplicitMenuCode('Subscribers (SUB1)'), 'subscribers-group')
    assert.equal(findPrimaryMenuCodeForName('Subscribers'), 'subscribers.list')
    assert.equal(getMenuDisplayName('Subscribers'), 'Subscribers (SUBS1)')
    assert.ok(resolveMenuCodesFromName('Subscribers').includes('subscribers.list'))
  })
})

describe('Subscribers Route, Global Search & Empty/In-Progress View Wiring', () => {
  test('router registers /subscribers with requiresAuth and ROUTE_TITLES.subscribers', () => {
    assert.match(routerSrc, /subscribers:\s*'Subscribers'/)
    assert.match(
      routerSrc,
      /path:\s*'\/subscribers'[\s\S]{0,140}name:\s*'subscribers'[\s\S]{0,140}Subscribers\.vue[\s\S]{0,140}requiresAuth:\s*true/
    )
  })

  test('useSearch indexes /subscribers navigation entry', () => {
    assert.match(useSearchSrc, /route:\s*'\/subscribers'/)
  })

  test('Subscribers.vue renders empty In Progress placeholder with Subscribers (SUBS1) badge', () => {
    assert.match(subscribersViewSrc, /Subscribers \(SUBS1\)/)
    assert.match(subscribersViewSrc, /In Progress/)
    assert.match(subscribersViewSrc, /Subscribers Module In Progress/)
  })
})
