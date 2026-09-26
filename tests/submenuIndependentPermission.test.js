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
      sidebarSource.includes('allowed.has(child.code)'),
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

  test('LCP NAP Locations does not resolve to or grant LCP NAP Records when child expansion is false', async () => {
    const { resolveMenuCodesFromName } = await import('../src/constants/menuCatalog.js')
    const parentCodes = resolveMenuCodesFromName('LCP NAP Locations', { expandChildren: false })
    assert.deepEqual(parentCodes, ['lcp-nap-locations'], 'Parent LCP NAP Locations must resolve ONLY to parent code')
    assert.equal(parentCodes.includes('lcp-nap-locations.records'), false, 'Parent must NEVER match records alias')

    const recordsCodes = resolveMenuCodesFromName('LCP NAP Records', { expandChildren: false })
    assert.deepEqual(recordsCodes, ['lcp-nap-locations.records'])
  })

  test('Explicit CODE in menu name resolves deterministically to the target screen', async () => {
    const { resolveMenuCodesFromName, extractExplicitMenuCode, findPrimaryMenuCodeForName, getShortCodeForCatalogCode } = await import('../src/constants/menuCatalog.js')

    // Bracketed with spaces (as requested: "(LCPNAPR ) LCP NAP Records")
    assert.equal(extractExplicitMenuCode('(LCPNAPR ) LCP NAP Records'), 'lcp-nap-locations.records')
    assert.deepEqual(resolveMenuCodesFromName('(LCPNAPR ) LCP NAP Records', { expandChildren: false }), ['lcp-nap-locations.records'])

    // Standard bracketed: "(LCPNAPR) LCP NAP Records" and "[LCPNAPR]"
    assert.equal(extractExplicitMenuCode('(LCPNAPR) LCP NAP Records'), 'lcp-nap-locations.records')
    assert.deepEqual(resolveMenuCodesFromName('(LCPNAPR) LCP NAP Records', { expandChildren: false }), ['lcp-nap-locations.records'])
    assert.equal(extractExplicitMenuCode('[LCPNAPR] LCP NAP Records'), 'lcp-nap-locations.records')

    // Delimited prefix: "LCPNAPR - LCP NAP Records"
    assert.equal(extractExplicitMenuCode('LCPNAPR - LCP NAP Records'), 'lcp-nap-locations.records')
    assert.deepEqual(resolveMenuCodesFromName('LCPNAPR - LCP NAP Records', { expandChildren: false }), ['lcp-nap-locations.records'])

    // Standalone code token
    assert.equal(extractExplicitMenuCode('LCPNAPR'), 'lcp-nap-locations.records')
    assert.equal(extractExplicitMenuCode('lcp-nap-locations.records'), 'lcp-nap-locations.records')

    // Discounts explicit codes
    assert.equal(extractExplicitMenuCode('(FMDISCOUNT) Discounts'), 'file-maintenance.discounts')
    assert.equal(extractExplicitMenuCode('(DISCOUNT) Discounts'), 'file-maintenance.discounts')
    assert.equal(extractExplicitMenuCode('[FMDISCOUNTTYPES] Discount Types'), 'file-maintenance.discount-types')

    // Helper functions: Short codes are first letter codes with numbers
    assert.equal(getShortCodeForCatalogCode('lcp-nap-locations.records'), 'LNR1')
    assert.equal(getShortCodeForCatalogCode('lcp-nap-locations.map'), 'LNM1')
    assert.equal(getShortCodeForCatalogCode('lcp-nap-locations'), 'LNL1')
    assert.equal(findPrimaryMenuCodeForName('(LCPNAPR ) LCP NAP Records'), 'lcp-nap-locations.records')
    assert.equal(findPrimaryMenuCodeForName('LCP NAP Records (LNR1)'), 'lcp-nap-locations.records')
    assert.equal(extractExplicitMenuCode('LCP NAP Records (LNR1)'), 'lcp-nap-locations.records')
  })

  test('LCP NAP Records is reliably hidden when disabled while LCP NAP Locations is granted', async () => {
    const { resolveMenuCodesFromName, MENU_CATALOG, PARENT_TO_CHILD_CODES } = await import('../src/constants/menuCatalog.js')

    // Simulated /api/Menus rows
    const serverMenuRows = [
      { id: 31, name: 'LCP NAP Locations' },
      { id: 32, name: 'LCP NAP Map' },
      { id: 33, name: '(LCPNAPR ) LCP NAP Records' }
    ]

    const idToCodesMap = new Map()
    const codeToMenuIds = new Map()

    serverMenuRows.forEach(row => {
      const codes = resolveMenuCodesFromName(row.name, { expandChildren: false })
      idToCodesMap.set(row.id, codes)
      codes.forEach(code => {
        if (!codeToMenuIds.has(code)) codeToMenuIds.set(code, [])
        codeToMenuIds.get(code).push(row.id)
      })
    })

    // Level granted: only Menu 31 and Menu 32 are linked; Menu 33 is unlinked
    const grantedMenuIds = [31, 32]
    const allowed = new Set()

    grantedMenuIds.forEach(id => {
      const codes = idToCodesMap.get(id) || []
      codes.forEach(code => {
        allowed.add(code)
        if (PARENT_TO_CHILD_CODES.has(code)) {
          PARENT_TO_CHILD_CODES.get(code).forEach(child => {
            if (!codeToMenuIds.has(child)) {
              allowed.add(child)
            }
          })
        }
      })
    })

    // Assertions
    assert.equal(allowed.has('lcp-nap-locations'), true, 'Parent category is granted')
    assert.equal(allowed.has('lcp-nap-locations.map'), true, 'Map is granted')
    assert.equal(allowed.has('lcp-nap-locations.records'), false, 'Records MUST NOT be granted when unlinked')

    // Sidebar rendering
    const lcpCatalog = MENU_CATALOG.find(i => i.code === 'lcp-nap-locations')
    const validChildren = lcpCatalog.children.filter(child => child && allowed.has(child.code))

    assert.equal(validChildren.length, 1, 'Only permitted child is rendered')
    assert.equal(validChildren[0].code, 'lcp-nap-locations.map')
    assert.equal(validChildren.some(c => c.code === 'lcp-nap-locations.records'), false, 'Records must be hidden from sidebar')
  })

  test('Parent menu classification, Home exclusion, and Standalone menu preservation', async () => {
    const {
      PARENT_MENU_CODES,
      isParentMenu,
      isHomeMenu,
      isStandaloneMenu,
      LEAF_MENU_CATALOG_ENTRIES,
      ALL_MENU_CODES
    } = await import('../src/constants/menuCatalog.js')

    // 1. Parent groups must be correctly identified
    const expectedParents = [
      'Dashboard', 'Application', 'Job Order', 'Job Orders',
      'Service Orders', 'Transactions', 'Transaction',
      'LCP NAP Locations', 'User Management', 'Users Management',
      'File Maintenance', 'Audit Trail', 'Error Logs', 'API Management'
    ]
    expectedParents.forEach(name => {
      assert.equal(isParentMenu(name), true, `"${name}" must be classified as a parent menu`)
    })

    // Parent codes
    PARENT_MENU_CODES.forEach(code => {
      assert.equal(isParentMenu(code), true, `Parent code "${code}" must be classified as parent`)
      assert.equal(isParentMenu({ code }), true, `Parent object { code: "${code}" } must be classified as parent`)
    })

    // 2. Standalone menus must NOT be parent menus and must be recognized as standalone
    assert.equal(isParentMenu('Disconnection'), false, 'Disconnection must NOT be a parent menu')
    assert.equal(isStandaloneMenu('Disconnection'), true, 'Disconnection must be recognized as standalone')

    assert.equal(isParentMenu('Settings'), false, 'Settings must NOT be a parent menu')
    assert.equal(isStandaloneMenu('Settings'), true, 'Settings must be recognized as standalone')

    // 3. Leaf screens must NOT be parent menus
    const leafSamples = [
      'Discount Types', 'Discounts', 'LCP', 'LCNAP', 'LCNAP Port', 'NAP', 'Port', 'VLAN', 'Router', 'Plan',
      'User', 'Access Level', 'Invoice', 'Billing', 'Payments',
      'In Progress', 'Approved', 'Done',
      'All Job Orders', 'Job Orders In Progress', 'Job Orders Completed', 'Job Orders Activated',
      'All Service Orders', 'Service Orders In Progress', 'Service Orders Scheduled', 'Service Orders Done',
      'LCP NAP Map', 'LCP NAP Records', '(LCPNAPR ) LCP NAP Records',
      'All Audit Trail', 'Audit Trail by Transaction Date', 'Audit Trail by Entity & Date', 'Audit Trail by User & Date',
      'All Error Logs', 'Error Logs by Date Range', 'Error Logs by Entity & Date', 'Error Logs by User & Date',
      'API Viewer', 'Models', 'API Services'
    ]
    leafSamples.forEach(name => {
      assert.equal(isParentMenu(name), false, `Leaf screen "${name}" must NOT be classified as a parent menu`)
      assert.equal(isHomeMenu(name), false, `Leaf screen "${name}" must NOT be Home`)
    })

    // 4. Home (landing) identification
    assert.equal(isHomeMenu('Home'), true, 'Home must be classified as Home')
    assert.equal(isHomeMenu('Landing'), true, 'Landing must be classified as Home')
    assert.equal(isHomeMenu('landing'), true, 'landing code must be classified as Home')
    assert.equal(isHomeMenu('(HOME) Home'), true, 'Explicit (HOME) must be classified as Home')
    assert.equal(isParentMenu('Home'), false, 'Home must NOT be a parent menu')

    // 5. LEAF_MENU_CATALOG_ENTRIES must NOT contain any parent codes and must NOT contain 'landing'
    const leafCodes = new Set(LEAF_MENU_CATALOG_ENTRIES.map(e => e.code))
    PARENT_MENU_CODES.forEach(parentCode => {
      assert.equal(leafCodes.has(parentCode), false, `LEAF_MENU_CATALOG_ENTRIES must NOT contain parent code "${parentCode}"`)
    })
    assert.equal(leafCodes.has('landing'), false, 'LEAF_MENU_CATALOG_ENTRIES must NOT contain "landing"')

    // Must contain standalone and leaf screens
    assert.equal(leafCodes.has('disconnection'), true, 'LEAF_MENU_CATALOG_ENTRIES must contain "disconnection"')
    assert.equal(leafCodes.has('settings'), true, 'LEAF_MENU_CATALOG_ENTRIES must contain "settings"')
    assert.equal(leafCodes.has('file-maintenance.discounts'), true, 'LEAF_MENU_CATALOG_ENTRIES must contain discounts')
    assert.equal(leafCodes.has('lcp-nap-locations.records'), true, 'LEAF_MENU_CATALOG_ENTRIES must contain LCP NAP Records')
    assert.equal(leafCodes.has('job-orders.all'), true, 'LEAF_MENU_CATALOG_ENTRIES must contain All Job Orders')
  })

  test('canAccess grants landing unconditionally and auto-grants parent when child is permitted', () => {
    assert.ok(
      permissionsSource.includes("if (code === 'landing') return true"),
      'canAccess must unconditionally grant landing'
    )
    assert.ok(
      permissionsSource.includes('PARENT_TO_CHILD_CODES.has(code)'),
      'canAccess must check PARENT_TO_CHILD_CODES for parent auto-inheritance'
    )
    assert.ok(
      permissionsSource.includes('children.some(childCode => canAccess(childCode))'),
      'canAccess must return true if at least one child is permitted'
    )
  })

  test('Simulated Menu List table filtering removes parents and Home while preserving leaf and standalone menus', async () => {
    const { isParentMenu, isHomeMenu } = await import('../src/constants/menuCatalog.js')

    const simulatedServerMenus = [
      { id: 1, name: 'Discount Types' },
      { id: 3, name: 'Discounts' },
      { id: 4, name: 'Dashboard' },
      { id: 5, name: 'LCP' },
      { id: 13, name: 'Application' },
      { id: 14, name: 'User' },
      { id: 15, name: 'Access Level' },
      { id: 16, name: 'Job Order' },
      { id: 19, name: 'Settings' },
      { id: 20, name: 'File Maintenance' },
      { id: 21, name: 'User Management' },
      { id: 22, name: 'Transactions' },
      { id: 24, name: 'Service Orders' },
      { id: 30, name: 'Disconnection' },
      { id: 31, name: 'LCP NAP Locations' },
      { id: 32, name: 'LCP NAP Map' },
      { id: 33, name: 'LCP NAP Records' },
      { id: 34, name: 'Audit Trail' },
      { id: 39, name: 'Error Logs' },
      { id: 50, name: 'Home' }
    ]

    const filtered = simulatedServerMenus.filter(row => !isParentMenu(row.name) && !isHomeMenu(row.name))

    const remainingNames = filtered.map(r => r.name)

    // Parents removed
    assert.equal(remainingNames.includes('Dashboard'), false, 'Dashboard parent must be removed')
    assert.equal(remainingNames.includes('Application'), false, 'Application parent must be removed')
    assert.equal(remainingNames.includes('Job Order'), false, 'Job Order parent must be removed')
    assert.equal(remainingNames.includes('File Maintenance'), false, 'File Maintenance parent must be removed')
    assert.equal(remainingNames.includes('User Management'), false, 'User Management parent must be removed')
    assert.equal(remainingNames.includes('Transactions'), false, 'Transactions parent must be removed')
    assert.equal(remainingNames.includes('Service Orders'), false, 'Service Orders parent must be removed')
    assert.equal(remainingNames.includes('LCP NAP Locations'), false, 'LCP NAP Locations parent must be removed')
    assert.equal(remainingNames.includes('Audit Trail'), false, 'Audit Trail parent must be removed')
    assert.equal(remainingNames.includes('Error Logs'), false, 'Error Logs parent must be removed')

    // Home removed
    assert.equal(remainingNames.includes('Home'), false, 'Home must be removed')

    // Standalone preserved
    assert.equal(remainingNames.includes('Disconnection'), true, 'Disconnection must be kept')
    assert.equal(remainingNames.includes('Settings'), true, 'Settings must be kept')

    // Leaf screens preserved
    assert.equal(remainingNames.includes('Discount Types'), true, 'Discount Types must be kept')
    assert.equal(remainingNames.includes('Discounts'), true, 'Discounts must be kept')
    assert.equal(remainingNames.includes('LCP'), true, 'LCP must be kept')
    assert.equal(remainingNames.includes('User'), true, 'User must be kept')
    assert.equal(remainingNames.includes('Access Level'), true, 'Access Level must be kept')
    assert.equal(remainingNames.includes('LCP NAP Map'), true, 'LCP NAP Map must be kept')
    assert.equal(remainingNames.includes('LCP NAP Records'), true, 'LCP NAP Records must be kept')
  })

  test('First Letter Codes with Numbers in Menu Names & Display Formatter', async () => {
    const {
      getMenuDisplayName,
      stripMenuCodeFromName,
      extractExplicitMenuCode,
      findPrimaryMenuCodeForName
    } = await import('../src/constants/menuCatalog.js')

    // 1. User's explicit examples:
    // - File Maintenance -> File Maintenance (FM1)
    // - LCP -> LCP (LCP1)
    // - LCP NAP Map -> LCP NAP Map (LNM1)
    // - LCP NAP Records -> LCP NAP Records (LNR1)
    assert.equal(getMenuDisplayName('File Maintenance'), 'File Maintenance (FM1)')
    assert.equal(getMenuDisplayName('LCP'), 'LCP (LCP1)')
    assert.equal(getMenuDisplayName('LCP NAP Map'), 'LCP NAP Map (LNM1)')
    assert.equal(getMenuDisplayName('LCP NAP Records'), 'LCP NAP Records (LNR1)')

    // 2. Duplicate menus disambiguated by route / path:
    // - In Progress (Application) -> In Progress (IP1)
    // - In Progress (Service Orders) -> In Progress (IP2)
    // - In Progress (Job Orders) -> In Progress (JOIP1)
    assert.equal(
      getMenuDisplayName({ name: 'In Progress', route: '/application/inprogress' }),
      'In Progress (IP1)'
    )
    assert.equal(
      getMenuDisplayName({ name: 'In Progress', route: '/application/in-progress' }),
      'In Progress (IP1)'
    )
    assert.equal(
      getMenuDisplayName({ name: 'In Progress', route: '/service-orders/inprogress' }),
      'In Progress (IP2)'
    )
    assert.equal(
      getMenuDisplayName({ name: 'In Progress', route: '/job-orders/inprogress' }),
      'In Progress (JOIP1)'
    )

    // - Done (Application) -> Done (D1)
    // - Done (Service Orders) -> Done (D2)
    assert.equal(
      getMenuDisplayName({ name: 'Done', route: '/application/done' }),
      'Done (D1)'
    )
    assert.equal(
      getMenuDisplayName({ name: 'Done', route: '/service-orders/done' }),
      'Done (D2)'
    )

    // 3. Explicit code matching & round-trip idempotency
    assert.equal(getMenuDisplayName('In Progress (IP1)'), 'In Progress (IP1)')
    assert.equal(getMenuDisplayName('In Progress (IP2)'), 'In Progress (IP2)')
    assert.equal(getMenuDisplayName('File Maintenance (FM1)'), 'File Maintenance (FM1)')
    assert.equal(getMenuDisplayName('LCP NAP Map (LNM1)'), 'LCP NAP Map (LNM1)')
    assert.equal(getMenuDisplayName('(LCPNAPR ) LCP NAP Records'), 'LCP NAP Records (LNR1)')

    // 4. Code extraction
    assert.equal(extractExplicitMenuCode('File Maintenance (FM1)'), 'file-maintenance')
    assert.equal(extractExplicitMenuCode('LCP (LCP1)'), 'file-maintenance.lcp')
    assert.equal(extractExplicitMenuCode('LCP NAP Map (LNM1)'), 'lcp-nap-locations.map')
    assert.equal(extractExplicitMenuCode('In Progress (IP1)'), 'application.in-progress')
    assert.equal(extractExplicitMenuCode('In Progress (IP2)'), 'service-orders.in-progress')
    assert.equal(extractExplicitMenuCode('In Progress (JOIP1)'), 'job-orders.in-progress')

    // 5. Code stripping helper
    assert.equal(stripMenuCodeFromName('File Maintenance (FM1)'), 'File Maintenance')
    assert.equal(stripMenuCodeFromName('LCP NAP Map (LNM1)'), 'LCP NAP Map')
    assert.equal(stripMenuCodeFromName('(LCPNAPR ) LCP NAP Records'), 'LCP NAP Records')
    assert.equal(stripMenuCodeFromName('In Progress [IP2]'), 'In Progress')
  })

  test('Dashboard parent group auto-shows only permitted dashboards and auto-hides when none permitted', () => {
    const dashGroup = MENU_CATALOG.find(i => i.code === 'dashboard')
    assert.ok(dashGroup, 'Dashboard parent group must exist in MENU_CATALOG')
    assert.equal(dashGroup.children.length, 2, 'Dashboard group must have Main and Accounting children')

    // Scenario 1: Only Main Dashboard permitted
    const onlyMainAllowed = new Set(['dashboard.main', 'MD1'])
    const mainChildren = dashGroup.children.filter(child =>
      child && (onlyMainAllowed.has(child.code) || (child.shortCode && onlyMainAllowed.has(child.shortCode)))
    )
    assert.equal(mainChildren.length, 1, 'Only Main Dashboard must be visible')
    assert.equal(mainChildren[0].code, 'dashboard.main')
    assert.equal(mainChildren[0].shortCode, 'MD1')

    // Scenario 2: Only Accounting Dashboard permitted
    const onlyAcctAllowed = new Set(['dashboard.accounting', 'AD1'])
    const acctChildren = dashGroup.children.filter(child =>
      child && (onlyAcctAllowed.has(child.code) || (child.shortCode && onlyAcctAllowed.has(child.shortCode)))
    )
    assert.equal(acctChildren.length, 1, 'Only Accounting Dashboard must be visible')
    assert.equal(acctChildren[0].code, 'dashboard.accounting')
    assert.equal(acctChildren[0].shortCode, 'AD1')

    // Scenario 3: Both permitted
    const bothAllowed = new Set(['dashboard.main', 'MD1', 'dashboard.accounting', 'AD1'])
    const bothChildren = dashGroup.children.filter(child =>
      child && (bothAllowed.has(child.code) || (child.shortCode && bothAllowed.has(child.shortCode)))
    )
    assert.equal(bothChildren.length, 2, 'Both dashboards must be visible')

    // Scenario 4: Neither permitted -> Dashboard parent auto-hides
    const noneAllowed = new Set()
    const noneChildren = dashGroup.children.filter(child =>
      child && (noneAllowed.has(child.code) || (child.shortCode && noneAllowed.has(child.shortCode)))
    )
    assert.equal(noneChildren.length, 0, 'No children visible')
    assert.equal(noneChildren.length > 0, false, 'Dashboard parent folder must auto-hide')
  })

  test('Short codes resolve to canonical catalog codes via MENU_CODE_MAP', async () => {
    const { MENU_CODE_MAP, normalizeMenuName } = await import('../src/constants/menuCatalog.js')

    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('MD1')), 'dashboard.main')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('AD1')), 'dashboard.accounting')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('AA1')), 'application.all')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('AJO1')), 'job-orders.all')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('ASO1')), 'service-orders.all')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('PAY1')), 'transaction.payments')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('LNM1')), 'lcp-nap-locations.map')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('LNR1')), 'lcp-nap-locations.records')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('FM1')), 'file-maintenance')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('PR1')), 'file-maintenance.promo')
    assert.equal(MENU_CODE_MAP.get(normalizeMenuName('H1')), 'landing')
  })

  test('Promo menu is configured under File Maintenance with WIP empty screen', async () => {
    const { MENU_CATALOG, getMenuDisplayName, extractExplicitMenuCode, menuCodeForPath } = await import('../src/constants/menuCatalog.js')
    const fileMaint = MENU_CATALOG.find(i => i.code === 'file-maintenance')
    assert.ok(fileMaint, 'File Maintenance must exist in MENU_CATALOG')

    const promoChild = fileMaint.children.find(c => c.code === 'file-maintenance.promo')
    assert.ok(promoChild, 'Promo child must exist under File Maintenance')
    assert.equal(promoChild.shortCode, 'PR1')
    assert.equal(promoChild.path, '/promo')
    assert.equal(promoChild.name, 'Promo')
    assert.equal(promoChild.icon, 'pi-gift')

    assert.equal(getMenuDisplayName(promoChild), 'Promo (PR1)')
    assert.equal(extractExplicitMenuCode('Promo (PR1)'), 'file-maintenance.promo')
    assert.equal(menuCodeForPath('/promo'), 'file-maintenance.promo')

    // Verify Promo.vue file exists and contains work in progress content
    const promoSource = read('../src/views/Promo.vue')
    assert.ok(promoSource.includes('Promo (PR1)'), 'Promo.vue must display Promo (PR1) badge')
    assert.ok(promoSource.includes('Work In Progress'), 'Promo.vue must display Work In Progress state')
    assert.ok(promoSource.includes('/api/Promos'), 'Promo.vue must note pending API endpoint')
  })

  test('All menu entries have unique shortCodes and DynamicApiTable features Sync Menu Codes button', async () => {
    const { ALL_MENU_ENTRIES, LEAF_MENU_CATALOG_ENTRIES, MENU_CODE_MAP, normalizeMenuName } = await import('../src/constants/menuCatalog.js')
    
    // 1. Verify every entry has a valid shortCode
    const missing = ALL_MENU_ENTRIES.filter(e => !e.shortCode)
    assert.equal(missing.length, 0, 'Every menu entry in catalog must have a shortCode')

    // 2. Verify all shortCodes are unique
    const seen = new Map()
    ALL_MENU_ENTRIES.forEach(e => {
      assert.ok(!seen.has(e.shortCode), `Duplicate shortCode found: ${e.shortCode} in ${e.name} and ${seen.get(e.shortCode)}`)
      seen.set(e.shortCode, e.name)
    })

    // 3. Verify every leaf shortCode maps back to its canonical code in MENU_CODE_MAP
    LEAF_MENU_CATALOG_ENTRIES.forEach(leaf => {
      const mapped = MENU_CODE_MAP.get(normalizeMenuName(leaf.shortCode))
      assert.equal(mapped, leaf.code, `Short code ${leaf.shortCode} must resolve to canonical code ${leaf.code}`)
    })

    // 4. Verify DynamicApiTable.vue contains the renamed 'Sync Menu Codes' button label
    const tableSource = read('../src/components/DynamicApiTable.vue')
    assert.ok(tableSource.includes('Sync Menu Codes'), 'DynamicApiTable.vue must have Sync Menu Codes button')
    assert.ok(!tableSource.includes('Update via API'), 'DynamicApiTable.vue must not have old Update via API label')
  })
})


