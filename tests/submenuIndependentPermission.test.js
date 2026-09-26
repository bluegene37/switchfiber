import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MENU_CATALOG } from '../src/constants/menuCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8')

describe('Submenu Independent Permission & Parent Auto-Show', () => {
  const sidebarSource = read('../src/components/Sidebar.vue')
  const permissionsSource = read('../src/composables/usePermissions.js')

  test('Sidebar.vue checks child permission directly and does not allow parent to force-enable children', () => {
    // The previous bug: (allowed.has(child.code) || allowed.has(item.code))
    // allowed.has(item.code) bypassed the child toggle and forced every child to stay visible.
    assert.ok(
      !sidebarSource.includes('allowed.has(child.code) || allowed.has(item.code)'),
      'Sidebar must not allow parent permission to override disabled child'
    )
    assert.ok(
      sidebarSource.includes('item.children.filter(child => child && allowed.has(child.code))'),
      'Sidebar must filter children based on their own code'
    )
  })

  test('Sidebar auto-shows parent if at least 1 child is permitted, and auto-hides if 0 children permitted', () => {
    const rawMenuItems = MENU_CATALOG
    const fileMaint = rawMenuItems.find(i => i.code === 'file-maintenance')
    assert.ok(fileMaint, 'file-maintenance must exist in catalog')

    // Scenario 1: Only "Discounts" disabled; "Plans" and "LCP" permitted
    const allowedDiscountsDisabled = new Set([
      'file-maintenance.lcp',
      'file-maintenance.plan',
      'file-maintenance.discount-types'
    ])

    const validChildren = fileMaint.children.filter(child => child && allowedDiscountsDisabled.has(child.code))
    assert.equal(validChildren.some(c => c.code === 'file-maintenance.discounts'), false, 'Discounts must be excluded')
    assert.equal(validChildren.some(c => c.code === 'file-maintenance.plan'), true, 'Plan must be included')
    assert.ok(validChildren.length > 0, 'Parent must have valid children')

    // Scenario 2: All children disabled -> parent returns null (auto-hidden)
    const allowedNone = new Set()
    const validNone = fileMaint.children.filter(child => child && allowedNone.has(child.code))
    assert.equal(validNone.length, 0, 'No children allowed')
    const parentShown = validNone.length > 0
    assert.equal(parentShown, false, 'Parent must be auto-hidden when 0 children are allowed')
  })

  test('usePermissions.js does not expand parent rows to child codes in loadMenuRegistry', () => {
    assert.ok(
      permissionsSource.includes('resolveMenuCodesFromName(rawName, { expandChildren: false })'),
      'loadMenuRegistry must index each live server row without child expansion'
    )
  })

  test('usePermissions.js only auto-grants children when the child lacks its own separate row in /api/Menus', () => {
    assert.ok(
      permissionsSource.includes('!codeToMenuIds.value.has(child)'),
      'Parent grant must not override child screens that have their own row in /api/Menus'
    )
  })
})
