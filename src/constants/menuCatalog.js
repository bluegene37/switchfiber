/**
 * The menu catalog: one entry per screen and permission control the front end ships.
 *
 * Why this file exists
 * --------------------
 * Menu permissions used to rely on numeric database IDs. Because database IDs
 * shift whenever tables are modified, deleted, re-seeded, or re-created, ID-based
 * checks are brittle. Furthermore, the backend has no immutable `code` column.
 *
 * This file provides:
 *   1. Stable client-owned `code` slugs used across the entire front end (Sidebar,
 *      route guards, `canAccess()`).
 *   2. Comprehensive server name mappings, aliases, and parent-child hierarchies.
 *   3. Intelligent Name Parsing & Near-Matching Engine that dynamically maps any
 *      live `/api/Menus` name (regardless of ID, casing, pluralization, compound
 *      separators, or minor title differences) to the corresponding catalog codes.
 */

/** Case-, spacing-, and punctuation-insensitive comparison key for a menu name. */
export const normalizeMenuName = (name) =>
  String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

/**
 * Tokenize and stem words to handle common plural/singular forms, spacing, and punctuation.
 * E.g. "Job Orders" -> "job order", "Applications" -> "application", "Plans" -> "plan".
 */
export const stemMenuToken = (token) => {
  const t = String(token ?? '').toLowerCase().trim()
  if (!t) return ''
  
  // Custom irregular or domain-specific word stemming
  if (t === 'joborders' || t === 'joborder') return 'job order'
  if (t === 'maindashboard' || t === 'maindashboards') return 'main dashboard'
  if (t === 'accountingdashboard' || t === 'accountingdashboards') return 'accounting dashboard'
  if (t === 'logerror' || t === 'logerrors') return 'error log'
  if (t === 'logtrail' || t === 'logtrails') return 'audit trail'
  if (t === 'accesslevels' || t === 'accesslevel') return 'access level'
  if (t === 'filemaintenance') return 'file maintenance'
  if (t === 'usermanagement' || t === 'usersmanagement') return 'user management'
  if (t === 'dataviewer' || t === 'apiviewer') return 'api viewer'
  if (t === 'apimanagement' || t === 'apismanagement') return 'api management'
  if (t === 'apiservices' || t === 'apiservice') return 'api service'
  if (t === 'lcnapport' || t === 'lcnapports') return 'lcnap port'
  if (t === 'discounttypes' || t === 'discounttype') return 'discount type'
  if (t === 'discounts' || t === 'discount') return 'discount'
  
  // Standard plural stripping
  if (t.endsWith('ies') && t.length > 4) return t.slice(0, -3) + 'y'
  if (t.endsWith('es') && (t.endsWith('shes') || t.endsWith('ches') || t.endsWith('xes') || t.endsWith('sses'))) {
    return t.slice(0, -2)
  }
  if (t.endsWith('s') && !t.endsWith('ss') && !t.endsWith('us') && !t.endsWith('is') && t.length > 3) {
    return t.slice(0, -1)
  }
  return t
}

/**
 * Parse a string into normalized, stemmed search tokens.
 */
export const normalizeAndStem = (name) => {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(stemMenuToken)
    .join(' ')
}

/**
 * Extract sub-strings from compound names such as:
 * - "File Maintenance - LCP"
 * - "Users Management > Access Level"
 * - "Transaction: Invoice"
 * - "Audit Trail / By Date"
 */
export const parseCompoundSegments = (name) => {
  if (!name) return []
  const raw = String(name)
  const segments = raw
    .split(/[-–—>:/|•\\]+/)
    .map(s => s.trim())
    .filter(Boolean)
  return segments
}

export const MENU_CATALOG = [
  {
    code: 'dashboard',
    name: 'Dashboard',
    serverMenu: 'Dashboard',
    aliases: ['Dashboard', 'Dash', 'Overview', 'Home', 'Metrics'],
    icon: 'pi-objects-column',
    children: [
      {
        code: 'dashboard.main',
        name: 'Main Dashboard',
        serverMenu: 'Main Dashboard',
        aliases: ['Main Dashboard', 'Executive Dashboard', 'Main', 'Dashboard Main', 'Overview'],
        path: '/dashboard/main',
        icon: 'pi-objects-column'
      },
      {
        code: 'dashboard.accounting',
        name: 'Accounting Dashboard',
        serverMenu: 'Accounting Dashboard',
        aliases: ['Accounting Dashboard', 'Accounting', 'Finance Dashboard', 'Billing Dashboard', 'Revenue Dashboard'],
        path: '/dashboard/accounting',
        icon: 'pi-wallet'
      }
    ]
  },
  {
    code: 'application',
    name: 'Application',
    serverMenu: 'Application',
    aliases: ['Application', 'Applications', 'All Applications', 'All Application', 'Application List', 'Customer Applications'],
    icon: 'pi-file-edit',
    children: [
      {
        code: 'application.all',
        name: 'All Application',
        serverMenu: 'Application',
        aliases: ['All Application', 'All Applications', 'Application', 'Applications', 'Application List'],
        path: '/application',
        icon: 'pi-list'
      },
      {
        code: 'application.in-progress',
        name: 'In Progress',
        serverMenu: 'In Progress',
        aliases: ['In Progress', 'Application In Progress', 'Applications In Progress', 'Application - In Progress', 'In-Progress Applications', 'Application Inprogress'],
        path: '/application/in-progress',
        icon: 'pi-clock'
      },
      {
        code: 'application.done',
        name: 'Done',
        serverMenu: 'Done',
        aliases: ['Done', 'Application Done', 'Applications Done', 'Application - Done', 'Completed Applications'],
        path: '/application/done',
        icon: 'pi-check-circle'
      },
      {
        code: 'application.approved',
        name: 'Approved',
        serverMenu: 'Approved',
        aliases: ['Approved', 'Application Approved', 'Applications Approved', 'Application - Approved', 'Verified Applications'],
        path: '/application/approved',
        icon: 'pi-verified'
      }
    ]
  },
  {
    code: 'job-orders',
    name: 'Job Orders',
    serverMenu: 'Job Order',
    aliases: ['Job Order', 'Job Orders', 'All Job Orders', 'JobOrders', 'JobOrder', 'Dispatches', 'Technical Orders'],
    icon: 'pi-clipboard',
    children: [
      {
        code: 'job-orders.all',
        name: 'All Job Orders',
        serverMenu: 'Job Order',
        aliases: ['All Job Orders', 'Job Order', 'Job Orders', 'All Job Order', 'Job Order List', 'Job Orders List'],
        path: '/job-orders',
        icon: 'pi-list'
      },
      {
        code: 'job-orders.in-progress',
        name: 'In Progress',
        serverMenu: 'Job Orders In Progress',
        aliases: ['Job Orders In Progress', 'Job Order In Progress', 'In Progress Job Orders', 'Job Orders - In Progress', 'In Progress', 'Job Orders Inprogress'],
        path: '/job-orders/inprogress',
        icon: 'pi-clock'
      },
      {
        code: 'job-orders.completed',
        name: 'Completed',
        serverMenu: 'Job Orders Completed',
        aliases: ['Job Orders Completed', 'Job Order Completed', 'Completed Job Orders', 'Job Orders - Completed', 'Completed'],
        path: '/job-orders/completed',
        icon: 'pi-check-circle'
      },
      {
        code: 'job-orders.activated',
        name: 'Activated',
        serverMenu: 'Job Orders Activated',
        aliases: ['Job Orders Activated', 'Job Order Activated', 'Activated Job Orders', 'Job Orders - Activated', 'Activated'],
        path: '/job-orders/activated',
        icon: 'pi-verified'
      }
    ]
  },
  {
    code: 'service-orders',
    name: 'Service Orders',
    serverMenu: 'Service Orders',
    aliases: ['Service Orders', 'Service Order', 'ServiceOrders', 'ServiceOrder', 'Repairs', 'Support Visits', 'Maintenance Orders', 'Service Tickets'],
    path: '/service-orders',
    icon: 'pi-wrench'
  },
  {
    code: 'transaction',
    name: 'Transaction',
    serverMenu: 'Transactions',
    aliases: ['Transaction', 'Transactions', 'Transaction Management', 'Billing & Invoicing'],
    icon: 'pi-wallet',
    children: [
      {
        code: 'transaction.invoice',
        name: 'Invoice',
        serverMenu: 'Invoice',
        aliases: ['Invoice', 'Invoices', 'Invoice List', 'Transaction Invoice', 'Transaction - Invoice', 'Invoicing'],
        path: '/invoice',
        icon: 'pi-receipt'
      },
      {
        code: 'transaction.billing',
        name: 'Billing',
        serverMenu: 'Billing',
        aliases: ['Billing', 'Billings', 'Billing List', 'Customer Billing', 'Billing Details', 'Transaction Billing', 'Transaction - Billing'],
        path: '/billing',
        icon: 'pi-credit-card'
      },
      {
        code: 'transaction.payments',
        name: 'Payments',
        serverMenu: 'Payments',
        aliases: ['Payments', 'Payment', 'Payment List', 'Customer Payments', 'Transaction Payments', 'Collections', 'Payment Transactions', 'Receipts'],
        path: '/payments',
        icon: 'pi-wallet'
      }
    ]
  },
  {
    code: 'disconnection',
    name: 'Disconnection',
    serverMenu: 'Disconnection',
    aliases: ['Disconnection', 'Disconnections', 'Disconnect', 'Disconnection List', 'Subscriber Disconnections', 'RADIUS Disconnection', 'Cutoff'],
    path: '/disconnection',
    icon: 'pi-ban'
  },
  {
    code: 'lcp-nap-locations',
    name: 'LCP NAP Locations',
    serverMenu: 'LCP NAP Locations',
    aliases: ['LCP NAP Locations', 'LCP NAP Location', 'LCP-NAP Locations', 'LCP NAP', 'LCP/NAP Locations', 'LCP & NAP Locations', 'Locations'],
    icon: 'pi-map',
    children: [
      {
        code: 'lcp-nap-locations.map',
        name: 'LCP NAP Map',
        serverMenu: 'LCP NAP Map',
        aliases: ['LCP NAP Map', 'LCP Map', 'NAP Map', 'Map View', 'LCP NAP Locations - Map', 'LCP-NAP Map', 'Map'],
        path: '/lcp-nap-locations/map',
        icon: 'pi-map-marker'
      },
      {
        code: 'lcp-nap-locations.records',
        name: 'LCP NAP Records',
        serverMenu: 'LCP NAP Records',
        aliases: ['LCP NAP Records', 'LCP Records', 'NAP Records', 'LCP NAP Locations - Records', 'LCP-NAP Records', 'Records', 'LCP NAP Locations'],
        path: '/lcp-nap-locations/records',
        icon: 'pi-table'
      }
    ]
  },
  {
    code: 'users-management',
    name: 'Users Management',
    serverMenu: 'User Management',
    aliases: ['Users Management', 'User Management', 'Users', 'User Admin', 'Accounts Management'],
    icon: 'pi-users',
    children: [
      {
        code: 'users-management.user',
        name: 'User',
        serverMenu: 'User',
        aliases: ['User', 'Users', 'User Accounts', 'Users List', 'Users Management - User'],
        path: '/user',
        icon: 'pi-user'
      },
      {
        code: 'users-management.access-level',
        name: 'Access Level',
        serverMenu: 'Access Level',
        aliases: ['Access Level', 'Access Levels', 'AccessLevel', 'Role Management', 'Roles & Permissions', 'Permissions', 'AccesslevelMenu', 'Access Level Menu', 'Users Management - Access Level'],
        path: '/access_level',
        icon: 'pi-shield'
      }
    ]
  },
  {
    code: 'file-maintenance',
    name: 'File Maintenance',
    serverMenu: 'File Maintenance',
    aliases: ['File Maintenance', 'FileMaintenance', 'Maintenance', 'System Tables', 'Master Data', 'Configuration Tables'],
    icon: 'pi-folder',
    children: [
      {
        code: 'file-maintenance.lcp',
        name: 'LCP',
        serverMenu: 'LCP',
        aliases: ['LCP', 'Local Control Point', 'LCP Cabinets', 'File Maintenance - LCP'],
        path: '/lcp',
        icon: 'pi-server'
      },
      {
        code: 'file-maintenance.lcnap',
        name: 'LCNAP',
        serverMenu: 'LCNAP',
        aliases: ['LCNAP', 'LC NAP', 'LCNAP Splitters', 'File Maintenance - LCNAP'],
        path: '/lcnap',
        icon: 'pi-sitemap'
      },
      {
        code: 'file-maintenance.lcnap-port',
        name: 'LCNAP Port',
        serverMenu: 'LCNAP Port',
        aliases: ['LCNAP Port', 'LCNAP Ports', 'LC NAP Port', 'LCNAP Port Allocations', 'File Maintenance - LCNAP Port'],
        path: '/lcnap_port',
        icon: 'pi-share-alt'
      },
      {
        code: 'file-maintenance.nap',
        name: 'NAP',
        serverMenu: 'NAP',
        aliases: ['NAP', 'Network Access Point', 'NAP Boxes', 'File Maintenance - NAP'],
        path: '/nap',
        icon: 'pi-box'
      },
      {
        code: 'file-maintenance.port',
        name: 'Port',
        serverMenu: 'Port',
        aliases: ['Port', 'Ports', 'Fiber Ports', 'File Maintenance - Port'],
        path: '/port',
        icon: 'pi-link'
      },
      {
        code: 'file-maintenance.vlan',
        name: 'VLan',
        serverMenu: 'VLAN',
        aliases: ['VLan', 'VLAN', 'V-LAN', 'Virtual LAN', 'File Maintenance - VLAN'],
        path: '/vlan',
        icon: 'pi-globe'
      },
      {
        code: 'file-maintenance.router',
        name: 'Router',
        serverMenu: 'Router',
        aliases: ['Router', 'Routers', 'Core Routers', 'Edge Routers', 'File Maintenance - Router'],
        path: '/router',
        icon: 'pi-wifi'
      },
      {
        code: 'file-maintenance.plan',
        name: 'Plan',
        serverMenu: 'Plan',
        aliases: ['Plan', 'Plans', 'Fiber Plans', 'Subscription Plans', 'Packages', 'File Maintenance - Plan'],
        path: '/plan',
        icon: 'pi-tag'
      },
      {
        code: 'file-maintenance.discount-types',
        name: 'Discount Types',
        serverMenu: 'Discount Types',
        aliases: ['Discount Types', 'Discount Type', 'DiscountTypes', 'DiscountType', 'Promo Types', 'Promotions', 'File Maintenance - Discount Types'],
        path: '/discount-types',
        icon: 'pi-percentage'
      },
      {
        code: 'file-maintenance.discounts',
        name: 'Discounts',
        serverMenu: 'Discounts',
        aliases: ['Discounts', 'Discount', 'Customer Discounts', 'Subsidies', 'Vouchers', 'Promos', 'File Maintenance - Discounts'],
        path: '/discounts',
        icon: 'pi-ticket'
      }
    ]
  },
  {
    code: 'audit-trail',
    name: 'Audit Trail',
    serverMenu: 'Audit Trail',
    aliases: ['Audit Trail', 'Audit Logs', 'Audit Log', 'Log Trail', 'LogTrail', 'Audit', 'Activity Logs', 'Transaction History'],
    icon: 'pi-verified',
    children: [
      {
        code: 'audit-trail.all',
        name: 'All Audit Trail',
        serverMenu: 'All Audit Trail',
        aliases: ['All Audit Trail', 'Audit Trail', 'Audit Trail List', 'Full Audit Trail', 'Audit Trail - All', 'Log Trail'],
        path: '/logs/audit-trail',
        icon: 'pi-list'
      },
      {
        code: 'audit-trail.by-date',
        name: 'By Transaction Date',
        serverMenu: 'Audit Trail by Transaction Date',
        aliases: ['By Transaction Date', 'Audit Trail by Date', 'Audit Trail by Transaction Date', 'Audit Trail - By Date', 'Audit by Date'],
        path: '/logs/audit-trail/by-date',
        icon: 'pi-calendar'
      },
      {
        code: 'audit-trail.by-entity',
        name: 'By Entity & Date',
        serverMenu: 'Audit Trail by Entity & Date',
        aliases: ['By Entity & Date', 'By Entity and Date', 'Audit Trail by Entity & Date', 'Audit Trail by Entity and Date', 'Audit Trail - By Entity', 'Audit by Entity'],
        path: '/logs/audit-trail/by-entity',
        icon: 'pi-sitemap'
      },
      {
        code: 'audit-trail.by-user',
        name: 'By User & Date',
        serverMenu: 'Audit Trail by User & Date',
        aliases: ['By User & Date', 'By User and Date', 'Audit Trail by User & Date', 'Audit Trail by User and Date', 'Audit Trail - By User', 'Audit by User'],
        path: '/logs/audit-trail/by-user',
        icon: 'pi-user'
      }
    ]
  },
  {
    code: 'error-logs',
    name: 'Error Logs',
    serverMenu: 'Error Logs',
    aliases: ['Error Logs', 'Error Log', 'Log Error', 'LogError', 'System Errors', 'Exception Logs', 'Errors'],
    icon: 'pi-exclamation-triangle',
    children: [
      {
        code: 'error-logs.all',
        name: 'All Error Logs',
        serverMenu: 'All Error Logs',
        aliases: ['All Error Logs', 'Error Logs', 'Error Log List', 'Full Error Logs', 'Error Logs - All', 'Log Error'],
        path: '/logs/error-logs',
        icon: 'pi-list'
      },
      {
        code: 'error-logs.by-date',
        name: 'By Date Range',
        serverMenu: 'Error Logs by Date Range',
        aliases: ['By Date Range', 'Error Logs by Date', 'Error Logs by Date Range', 'Error Logs - By Date', 'Errors by Date'],
        path: '/logs/error-logs/by-date',
        icon: 'pi-calendar'
      },
      {
        code: 'error-logs.by-entity',
        name: 'By Entity & Date',
        serverMenu: 'Error Logs by Entity & Date',
        aliases: ['By Entity & Date', 'By Entity and Date', 'Error Logs by Entity & Date', 'Error Logs by Entity and Date', 'Error Logs - By Entity', 'Errors by Entity'],
        path: '/logs/error-logs/by-entity',
        icon: 'pi-sitemap'
      },
      {
        code: 'error-logs.by-user',
        name: 'By User & Date',
        serverMenu: 'Error Logs by User & Date',
        aliases: ['By User & Date', 'By User and Date', 'Error Logs by User & Date', 'Error Logs by User and Date', 'Error Logs - By User', 'Errors by User'],
        path: '/logs/error-logs/by-user',
        icon: 'pi-user'
      }
    ]
  },
  {
    code: 'api-management',
    name: 'API Management',
    serverMenu: 'API Management',
    aliases: ['API Management', 'Api Management', 'APIs', 'API', 'API Manager', 'APIManagement'],
    icon: 'pi-sliders-h',
    children: [
      {
        code: 'api-management.viewer',
        name: 'API Viewer',
        serverMenu: 'API Viewer',
        aliases: ['API Viewer', 'API Data Viewer', 'Data Viewer', 'Api Viewer', 'API', 'Endpoints Viewer', 'DataViewer', 'api-viewer'],
        path: '/data-viewer',
        icon: 'pi-database'
      },
      {
        code: 'api-management.models',
        name: 'Models',
        serverMenu: 'Models',
        aliases: ['Models', 'Data Models', 'Model', 'Schema Models', 'Schema Meta', 'Entity Models', 'models'],
        path: '/models',
        icon: 'pi-table'
      },
      {
        code: 'api-management.services',
        name: 'API Services',
        serverMenu: 'API Services',
        aliases: ['API Services', 'Api Services', 'Microservices', 'Micro Services', 'Services', 'API Microservices', 'api-services'],
        path: '/api-management/services',
        icon: 'pi-server'
      }
    ]
  }
]

/**
 * Permissions that gate controls and specialized actions rather than standard sidebar routes.
 */
export const CONTROL_MENU_CATALOG = [
  {
    code: 'settings',
    name: 'Settings',
    serverMenu: 'Settings',
    aliases: ['Settings', 'System Settings', 'Account Settings', 'Configuration', 'System & Account Settings'],
    path: '/settings'
  },
  {
    code: 'settings.modify-password',
    name: 'Modify Password',
    serverMenu: 'Modify Password',
    aliases: ['Modify Password', 'Change Password', 'Update Password', 'Password Modification', 'Edit Password', 'Settings - Modify Password']
  },
  {
    code: 'settings.unmask-password',
    name: 'Unmask Password',
    serverMenu: 'Unmask Password',
    aliases: ['Unmask Password', 'Show Password', 'View Password', 'Reveal Password', 'Password Visibility', 'Settings - Unmask Password']
  },
  {
    code: 'settings.theme',
    name: 'Theme',
    serverMenu: 'Theme & Appearance',
    aliases: ['Theme', 'Theme & Appearance', 'Theme and Appearance', 'Appearance', 'Design System', 'Theme Settings', 'Dark Mode', 'Light Mode', 'Settings - Theme']
  }
]

/** Every catalog entry, tree flattened, groups included. */
export const flattenMenuCatalog = (tree = MENU_CATALOG) =>
  tree.flatMap(item => (item.children ? [item, ...item.children] : [item]))

export const ALL_MENU_ENTRIES = [...flattenMenuCatalog(), ...CONTROL_MENU_CATALOG]

/** Codes for every screen/control the front end ships — the ceiling on what can be granted. */
export const ALL_MENU_CODES = ALL_MENU_ENTRIES.map(e => e.code)

/** Check if an entry is a parent category with child items. */
export const isMenuGroup = (entry) => Array.isArray(entry?.children) && entry.children.length > 0

/**
 * Returns all child codes for a given parent code.
 * E.g., 'file-maintenance' -> ['file-maintenance.lcp', 'file-maintenance.lcnap', ...]
 */
export const getChildCodesForParent = (parentCode) => {
  const found = MENU_CATALOG.find(item => item.code === parentCode)
  if (found && Array.isArray(found.children)) {
    return found.children.map(c => c.code)
  }
  return []
}

/** Parent code mapping to its direct children. */
export const PARENT_TO_CHILD_CODES = new Map(
  MENU_CATALOG.filter(isMenuGroup).map(item => [item.code, item.children.map(c => c.code)])
)

/** Route path -> the code that governs it, for every entry that owns a screen. */
export const MENU_CODE_BY_PATH = new Map(
  ALL_MENU_ENTRIES.filter(e => e.path).map(e => [e.path, e.code])
)

/**
 * Routes the router serves that no catalog entry owns directly: legacy aliases
 * kept alive for old links, and the group landing pages. Without these the route
 * guard would wave them through, and `/application_list` would be an open back
 * door to the screen `/application` protects.
 */
const PATH_CODE_ALIASES = new Map([
  ['/dashboard', 'dashboard'],
  ['/application_list', 'application.all'],
  ['/job_order', 'job-orders.all'],
  ['/api-management', 'api-management'],
  ['/api-services', 'api-management.services'],
  // The Menus registry and the level-to-menu links are the same screen as, and
  // the same authority over, Access Level management.
  ['/menu', 'users-management.access-level'],
  ['/access_level_menu', 'users-management.access-level'],
  ['/lcp-nap-locations', 'lcp-nap-locations.map'],
  ['/logs', 'audit-trail.all']
])

/**
 * The menu code that governs a route path, or null when no menu owns it (a
 * public route, or a screen that ships outside the permission model).
 *
 * Resolution order: the catalog's own path, then a legacy/landing alias, then the
 * nearest parent path — so a status route added later (`/service-orders/pending`)
 * inherits its parent's permission the day it appears, with no edit here.
 */
export const menuCodeForPath = (path) => {
  const clean = String(path || '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'
  if (MENU_CODE_BY_PATH.has(clean)) return MENU_CODE_BY_PATH.get(clean)
  if (PATH_CODE_ALIASES.has(clean)) return PATH_CODE_ALIASES.get(clean)

  let bestPath = ''
  let bestCode = null
  MENU_CODE_BY_PATH.forEach((code, entryPath) => {
    if (clean.startsWith(`${entryPath}/`) && entryPath.length > bestPath.length) {
      bestPath = entryPath
      bestCode = code
    }
  })
  return bestCode
}

/**
 * Pre-compiled index for fast name -> code lookups:
 * Maps normalized keys and stemmed phrases to candidate catalog codes.
 */
const BUILD_LOOKUP_INDEX = () => {
  const directIndex = new Map()
  const stemmedIndex = new Map()

  ALL_MENU_ENTRIES.forEach(entry => {
    const candidates = [
      entry.name,
      entry.serverMenu,
      entry.code,
      ...(entry.aliases || [])
    ].filter(Boolean)

    candidates.forEach(cand => {
      const normKey = normalizeMenuName(cand)
      if (normKey) {
        if (!directIndex.has(normKey)) directIndex.set(normKey, new Set())
        directIndex.get(normKey).add(entry.code)
      }

      const stemKey = normalizeAndStem(cand)
      if (stemKey) {
        if (!stemmedIndex.has(stemKey)) stemmedIndex.set(stemKey, new Set())
        stemmedIndex.get(stemKey).add(entry.code)
      }
    })
  })

  return { directIndex, stemmedIndex }
}

const { directIndex: MENU_DIRECT_INDEX, stemmedIndex: MENU_STEMMED_INDEX } = BUILD_LOOKUP_INDEX()

/**
 * Intelligently resolve a menu name string from `/api/Menus` or user input to
 * matching catalog code(s).
 *
 * Handles:
 *   - Exact and case/punctuation-insensitive matches
 *   - Singular and plural stemming ("Job Orders" <-> "Job Order")
 *   - Compound names with delimiters ("File Maintenance - LCP", "Transaction > Billing")
 *   - Submenu aliases and semantic synonyms ("Theme & Appearance", "Modify Password")
 *   - Parent group inheritance (resolves parent to both parent code and child list)
 *
 * @param {string} rawName - The name from the server / database row.
 * @returns {string[]} Array of matching catalog code strings.
 */
export const resolveMenuCodesFromName = (rawName, options = { expandChildren: true }) => {
  if (!rawName) return []
  const nameStr = String(rawName).trim()
  if (!nameStr) return []

  const matchedCodes = new Set()

  // 1. Direct exact normalized key lookup
  const normKey = normalizeMenuName(nameStr)
  if (normKey && MENU_DIRECT_INDEX.has(normKey)) {
    MENU_DIRECT_INDEX.get(normKey).forEach(c => matchedCodes.add(c))
  }

  // 2. Stemmed phrase lookup
  const stemKey = normalizeAndStem(nameStr)
  if (stemKey && MENU_STEMMED_INDEX.has(stemKey)) {
    MENU_STEMMED_INDEX.get(stemKey).forEach(c => matchedCodes.add(c))
  }

  // 3. Compound name segment parsing (e.g. "File Maintenance - LCP")
  const segments = parseCompoundSegments(nameStr)
  if (segments.length > 1) {
    // Try matching specific child segment (usually the last segment, e.g. "LCP")
    for (let i = segments.length - 1; i >= 0; i--) {
      const segNorm = normalizeMenuName(segments[i])
      if (segNorm && MENU_DIRECT_INDEX.has(segNorm)) {
        MENU_DIRECT_INDEX.get(segNorm).forEach(c => matchedCodes.add(c))
      }
      const segStem = normalizeAndStem(segments[i])
      if (segStem && MENU_STEMMED_INDEX.has(segStem)) {
        MENU_STEMMED_INDEX.get(segStem).forEach(c => matchedCodes.add(c))
      }
    }
  }

  // 4. Fuzzy / Substring near-match fallback across catalog entries
  if (matchedCodes.size === 0) {
    ALL_MENU_ENTRIES.forEach(entry => {
      const candidates = [entry.name, entry.serverMenu, ...(entry.aliases || [])].filter(Boolean)
      for (const cand of candidates) {
        const candNorm = normalizeMenuName(cand)
        const candStem = normalizeAndStem(cand)
        if (normKey && candNorm && (normKey.includes(candNorm) || candNorm.includes(normKey))) {
          matchedCodes.add(entry.code)
          break
        }
        if (stemKey && candStem && (stemKey.includes(candStem) || candStem.includes(stemKey))) {
          matchedCodes.add(entry.code)
          break
        }
      }
    })
  }

  // 5. If a parent code matched, include all of its direct children
  if (options?.expandChildren !== false) {
    const result = new Set(matchedCodes)
    matchedCodes.forEach(code => {
      if (PARENT_TO_CHILD_CODES.has(code)) {
        PARENT_TO_CHILD_CODES.get(code).forEach(childCode => result.add(childCode))
      }
    })
    return Array.from(result)
  }

  return Array.from(matchedCodes)
}

/**
 * Helper: Find the single best / primary catalog code for a menu name.
 */
export const findPrimaryMenuCodeForName = (rawName) => {
  const codes = resolveMenuCodesFromName(rawName)
  if (!codes.length) return null
  // Direct exact normalized code match takes priority (e.g. 'Dashboard' -> 'dashboard', 'API Management' -> 'api-management')
  const direct = codes.find(c => normalizeMenuName(c) === normalizeMenuName(rawName) || c === normalizeMenuName(rawName))
  if (direct) return direct
  // Prefer leaf child codes over parent groups if both are returned
  const leaf = codes.find(c => !PARENT_TO_CHILD_CODES.has(c))
  return leaf || codes[0]
}

/**
 * Map: code -> primary normalized server key for backwards compatibility.
 */
export const MENU_CODE_TO_SERVER_KEY = new Map(
  ALL_MENU_ENTRIES
    .filter(e => e.serverMenu)
    .map(e => [e.code, normalizeMenuName(e.serverMenu)])
)

/**
 * Codes that map onto server menus.
 */
export const SERVER_BACKED_MENU_CODES = ALL_MENU_ENTRIES
  .filter(e => e.serverMenu)
  .map(e => e.code)

/**
 * Test whether a given role or access level name qualifies as Super Admin / Developer level.
 * Matches: "Super Admin", "SuperAdmin", "Super-Admin", "Developer", "Admin", "System Administrator", etc.
 */
/**
 * Strict test for the ONE access level that owns every menu by definition.
 *
 * Deliberately narrower than `isSuperAdminRole`: Super Admin is the only level
 * that gets the whole menu for free, so this matches Super Admin and nothing
 * else. A substring test would hand full access to "Supervisor" and
 * "Superintendent", and a level named "Developer" is a normal level whose menus
 * are granted row by row like everyone else's.
 *
 * Whole-name match, so casing, spacing and punctuation vary freely
 * ("Super Admin", "super-admin", "SUPERADMIN") but a longer name never matches.
 */
const SUPER_ADMIN_LEVEL_NAMES = new Set([
  'superadmin',
  'superadministrator',
  'supersadmin'
])

export const isSuperAdminName = (levelName) => {
  if (!levelName) return false
  const norm = String(levelName).toLowerCase().replace(/[^a-z0-9]/g, '')
  return SUPER_ADMIN_LEVEL_NAMES.has(norm)
}

export const isSuperAdminRole = (roleOrLevelName) => {
  if (!roleOrLevelName) return false
  const norm = String(roleOrLevelName).toLowerCase().replace(/[^a-z0-9]/g, '')
  return (
    norm.includes('super') ||
    norm.includes('developer') ||
    norm === 'admin' ||
    norm === 'superadmin' ||
    norm === 'sysadmin' ||
    norm === 'systemadministrator'
  )
}


