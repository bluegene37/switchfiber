// Gene - Oct 13, 2026: Access Level Catalog with short codes, name normalization, and flexible condition helpers
/**
 * The Access Level Catalog: stable client-owned codes and short codes for system roles.
 *
 * Why this file exists:
 * --------------------
 * Access levels previously relied on mutable database IDs (which shift when rows are deleted,
 * re-created, or migrated) or loose name comparisons. The backend has no immutable `code` column.
 *
 * This file provides:
 * 1. Stable client-owned codes (e.g., 'super_admin', 'billing_manager') and short codes (e.g., 'SA1', 'BM1')
 * 2. Display name formatting: "Super Admin (SA1)", "Billing Manager (BM1)" matching the Menu List convention
 * 3. Flexible condition & if-statement helpers (e.g., `hasAccessLevel(user, 'SA1', 'DEV1')`)
 */

/** Normalize an access level name or code for robust matching */
export const normalizeAccessLevelKey = (val) =>
  String(val ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

/**
 * Strips any short code in parentheses or brackets from an access level name.
 * E.g. "Super Admin (SA1)" -> "Super Admin"
 *      "(SA1) Super Admin" -> "Super Admin"
 */
export const stripAccessLevelCodeFromName = (rawName) => {
  if (!rawName) return ''
  return String(rawName)
    .replace(/^[\(\[\{<]\s*[A-Za-z0-9_.-]+\s*[\)\]\}>]\s*[-:–—|]?\s*/, '')
    .replace(/\s*[\(\[\{<]\s*[A-Za-z0-9_.-]+\s*[\)\]\}>]\s*$/, '')
    .replace(/^[A-Za-z0-9_.-]{2,10}\s*[:\-\|–—]\s+/, '')
    .trim()
}

/**
 * Extracts a short code like "SA1" or "DEV1" from a name or object.
 * E.g. "Super Admin (SA1)" -> "SA1"
 */
/*
export const extractAccessLevelCode = (nameOrObj) => {
  if (!nameOrObj) return ''
  if (typeof nameOrObj === 'object') {
    if (nameOrObj.shortCode || nameOrObj.ShortCode) return nameOrObj.shortCode || nameOrObj.ShortCode
    if (nameOrObj.code || nameOrObj.Code) return nameOrObj.code || nameOrObj.Code
    nameOrObj = nameOrObj.name || nameOrObj.Name || ''
  }
  const match = String(nameOrObj).match(/[\(\[\{<]\s*([A-Za-z0-9_.-]+)\s*[\)\]\}>]/)
  return match ? match[1].trim().toUpperCase() : ''
}
*/
// Gene - Oct 13, 2026: Prioritize trailing parenthesized code to handle names with legitimate acronyms like Fiber Plant Engineer (OSP) (FPE1)
export const extractAccessLevelCode = (nameOrObj) => {
  if (!nameOrObj) return ''
  if (typeof nameOrObj === 'object') {
    if (nameOrObj.shortCode || nameOrObj.ShortCode) return nameOrObj.shortCode || nameOrObj.ShortCode
    if (nameOrObj.code || nameOrObj.Code) return nameOrObj.code || nameOrObj.Code
    nameOrObj = nameOrObj.name || nameOrObj.Name || ''
  }
  const str = String(nameOrObj)
  const trailingMatch = str.match(/[\(\[\{<]\s*([A-Za-z0-9_.-]+)\s*[\)\]\}>]\s*$/)
  if (trailingMatch) return trailingMatch[1].trim().toUpperCase()
  const anyMatch = str.match(/[\(\[\{<]\s*([A-Za-z0-9_.-]+)\s*[\)\]\}>]/)
  return anyMatch ? anyMatch[1].trim().toUpperCase() : ''
}

export const ACCESS_LEVEL_CATALOG = [
  {
    id: 3,
    code: 'super_admin',
    shortCode: 'SA1',
    codeAliases: ['SA', 'SUPER_ADMIN', 'SUPERADMIN'],
    name: 'Super Admin',
    aliases: ['Super Admin', 'SuperAdmin', 'Super-Admin', 'Super Administrator'],
    description: 'Full system control with unrestricted access to all modules, settings, and user management.'
  },
  {
    id: 4,
    code: 'developer',
    shortCode: 'DEV1',
    codeAliases: ['DEV', 'DEVELOPER'],
    name: 'Developer',
    aliases: ['Developer', 'Software Developer', 'Dev'],
    description: 'Full system control with unrestricted access to all modules, settings, and user management.'
  },
  {
    id: 5,
    code: 'billing_manager',
    shortCode: 'BM1',
    codeAliases: ['BM', 'BILLING_MANAGER', 'BILLING'],
    name: 'Billing Manager',
    aliases: ['Billing Manager', 'Billing', 'Billing Lead'],
    description: 'Manages billing details, invoices, job order billing statuses, and financial records.'
  },
  {
    id: 6,
    code: 'technical_support',
    shortCode: 'TS1',
    codeAliases: ['TS', 'TECHNICAL_SUPPORT', 'TECH_SUPPORT'],
    name: 'Technical Support',
    aliases: ['Technical Support', 'Tech Support', 'Support Tech'],
    description: 'Manages LCP, LCNAP, NAPs, Ports, VLANs, Routers, and technical field job orders.'
  },
  {
    id: 7,
    code: 'customer_support',
    shortCode: 'CS1',
    codeAliases: ['CS', 'CUSTOMER_SUPPORT', 'CSR'],
    name: 'Customer Support',
    aliases: ['Customer Support', 'CSR', 'Support Representative', 'Support'],
    description: 'Handles customer applications, ticket status inquiries, and basic user accounts.'
  },
  {
    id: 8,
    code: 'data_input_team',
    shortCode: 'DIT1',
    codeAliases: ['DIT', 'DATA_INPUT', 'DATA_ENTRY'],
    name: 'Data Input Team',
    aliases: ['Data Input Team', 'Data Input', 'Data Entry', 'Encoder'],
    description: 'Responsible for data entry, records verification, bulk customer imports, and file maintenance updates.'
  },
  {
    id: 9,
    code: 'field_installation_team',
    shortCode: 'FIT1',
    codeAliases: ['FIT', 'FIELD_INSTALLATION', 'INSTALLER'],
    name: 'Field Installation Team',
    aliases: ['Field Installation Team', 'Field Tech', 'Installer', 'Field Installation'],
    description: 'Manages onsite installation visits, technician job orders, modem router SN setup, and drop wire readings.'
  },
  {
    id: 10,
    code: 'network_operations_center',
    shortCode: 'NOC1',
    codeAliases: ['NOC', 'NETWORK_OPERATIONS_CENTER'],
    name: 'Network Operations Center',
    aliases: ['Network Operations Center', 'NOC', 'NOC Team'],
    description: 'Monitors network infrastructure, LCP/LCNAP port allocations, VLAN configurations, and router telemetry.'
  },
  {
    id: 11,
    code: 'guest',
    shortCode: 'GST1',
    codeAliases: ['GST', 'GUEST'],
    name: 'Guest',
    aliases: ['Guest', 'Visitor', 'Public User'],
    description: 'Guest account with read-only access to basic dashboards and public module views.'
  },
  {
    id: 95,
    code: 'sales_marketing_representative',
    shortCode: 'SMR1',
    codeAliases: ['SMR', 'SALES_MARKETING', 'SALES'],
    name: 'Sales & Marketing Representative',
    aliases: ['Sales & Marketing Representative', 'Sales & Marketing', 'Sales Representative', 'Marketing'],
    description: 'Handles prospective customer applications, broadband internet plans, seasonal promos, and promotional discounts.'
  },
  {
    id: 99,
    code: 'cashier_payment_collector',
    shortCode: 'CPC1',
    codeAliases: ['CPC', 'CASHIER', 'PAYMENT_COLLECTOR'],
    name: 'Cashier / Payment Collector',
    aliases: ['Cashier / Payment Collector', 'Cashier', 'Payment Collector', 'Collector'],
    description: 'Processes over-the-counter payments, customer bill collections, official payment receipts, and billing inquiries.'
  },
  {
    id: 100,
    code: 'dispatcher_schedule_coordinator',
    shortCode: 'DSC1',
    codeAliases: ['DSC', 'DISPATCHER', 'SCHEDULE_COORDINATOR'],
    name: 'Dispatcher / Schedule Coordinator',
    aliases: ['Dispatcher / Schedule Coordinator', 'Dispatcher', 'Schedule Coordinator', 'Dispatch Coordinator'],
    description: 'Manages job and service order scheduling, field technician dispatching, and visit calendar appointments.'
  },
  {
    id: 101,
    code: 'accounting',
    shortCode: 'ACC1',
    codeAliases: ['ACC', 'ACCOUNTING'],
    name: 'Accounting',
    aliases: ['Accounting', 'Accountant', 'Finance'],
    description: 'For accounting'
  },
  {
    id: 103,
    code: 'qa_tester',
    shortCode: 'QAT1',
    codeAliases: ['QAT', 'QA', 'QA_TESTER'],
    name: 'QA Tester',
    aliases: ['QA Tester', 'QA Testing', 'QA', 'Quality Assurance'],
    description: 'File Maintenance & Logs'
  },
  {
    id: 104,
    code: 'executive_general_manager',
    shortCode: 'EGM1',
    codeAliases: ['EGM', 'EXECUTIVE', 'GENERAL_MANAGER', 'GM'],
    name: 'Executive / General Manager',
    aliases: ['Executive / General Manager', 'General Manager', 'Executive', 'GM'],
    description: 'Executive leadership with high-level reporting, dashboard analytics, audit logs, and strategic overview.'
  },
  {
    id: 105,
    code: 'fiber_plant_engineer',
    shortCode: 'FPE1',
    codeAliases: ['FPE', 'OSP', 'FIBER_PLANT_ENGINEER'],
    name: 'Fiber Plant Engineer (OSP)',
    aliases: ['Fiber Plant Engineer (OSP)', 'Fiber Plant Engineer', 'OSP Engineer', 'Plant Engineer'],
    description: 'Manages physical outside-plant fiber distribution, LCP cabinets, LCNAP splitters, NAP boxes, optical ports, and GIS plant mapping.'
  },
  {
    id: 106,
    code: 'auditor_compliance_officer',
    shortCode: 'ACO1',
    codeAliases: ['ACO', 'AUDITOR', 'COMPLIANCE_OFFICER'],
    name: 'Auditor / Compliance Officer',
    aliases: ['Auditor / Compliance Officer', 'Auditor', 'Compliance Officer', 'Compliance'],
    description: 'Internal audit and regulatory compliance role with access to audit trails, system transaction history, error logs, and financial records.'
  },
  {
    id: 107,
    code: 'warehouse_inventory_officer',
    shortCode: 'WIO1',
    codeAliases: ['WIO', 'WAREHOUSE', 'INVENTORY_OFFICER'],
    name: 'Warehouse & Inventory Officer',
    aliases: ['Warehouse & Inventory Officer', 'Warehouse Officer', 'Inventory Officer', 'Warehouse'],
    description: 'Oversees equipment inventory, ONT modem routers, optical hardware, technician material requests, and equipment serial numbers.'
  }
]

/** Fast lookup map by normalized key */
const ACCESS_LEVEL_LOOKUP = new Map()

// Populate lookup map with id, code, shortCode, aliases, and name
ACCESS_LEVEL_CATALOG.forEach(entry => {
  ACCESS_LEVEL_LOOKUP.set(String(entry.id), entry)
  ACCESS_LEVEL_LOOKUP.set(normalizeAccessLevelKey(entry.code), entry)
  ACCESS_LEVEL_LOOKUP.set(normalizeAccessLevelKey(entry.shortCode), entry)
  ACCESS_LEVEL_LOOKUP.set(normalizeAccessLevelKey(entry.name), entry)
  if (entry.codeAliases) {
    entry.codeAliases.forEach(ca => ACCESS_LEVEL_LOOKUP.set(normalizeAccessLevelKey(ca), entry))
  }
  if (entry.aliases) {
    entry.aliases.forEach(a => ACCESS_LEVEL_LOOKUP.set(normalizeAccessLevelKey(a), entry))
  }
})

/**
 * Generate a deterministic fallback short code from a name.
 * E.g. "Inventory Supervisor" -> "IS1"
 */
export const generateFallbackShortCode = (name) => {
  if (!name) return 'AL1'
  const words = String(name)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return 'AL1'
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase() + '1'
  const initials = words.map(w => w[0].toUpperCase()).join('')
  return initials + '1'
}

/**
 * Resolve an access level catalog entry by ID, code, shortCode, or name.
 */
export const getAccessLevelCatalogEntry = (itemOrNameOrCodeOrId) => {
  if (itemOrNameOrCodeOrId === null || itemOrNameOrCodeOrId === undefined || itemOrNameOrCodeOrId === '') {
    return null
  }

  // If already an object with id, shortCode, or name
  if (typeof itemOrNameOrCodeOrId === 'object') {
    const directCode = itemOrNameOrCodeOrId.shortCode || itemOrNameOrCodeOrId.code
    if (directCode && ACCESS_LEVEL_LOOKUP.has(normalizeAccessLevelKey(directCode))) {
      return ACCESS_LEVEL_LOOKUP.get(normalizeAccessLevelKey(directCode))
    }
    const name = itemOrNameOrCodeOrId.name || itemOrNameOrCodeOrId.Name || itemOrNameOrCodeOrId.role || itemOrNameOrCodeOrId.accessLevelName
    if (name) {
      const stripped = stripAccessLevelCodeFromName(name)
      const found = ACCESS_LEVEL_LOOKUP.get(normalizeAccessLevelKey(stripped)) || ACCESS_LEVEL_LOOKUP.get(normalizeAccessLevelKey(name))
      if (found) return found
    }
    const id = itemOrNameOrCodeOrId.id || itemOrNameOrCodeOrId.accesslevel_id || itemOrNameOrCodeOrId.accessLevelId
    if (id && ACCESS_LEVEL_LOOKUP.has(String(id))) {
      return ACCESS_LEVEL_LOOKUP.get(String(id))
    }
    return null
  }

  const str = String(itemOrNameOrCodeOrId).trim()
  if (!str) return null

  // Check direct lookup
  const norm = normalizeAccessLevelKey(str)
  if (ACCESS_LEVEL_LOOKUP.has(norm)) {
    return ACCESS_LEVEL_LOOKUP.get(norm)
  }

  // Check stripped name
  const stripped = stripAccessLevelCodeFromName(str)
  const normStripped = normalizeAccessLevelKey(stripped)
  if (ACCESS_LEVEL_LOOKUP.has(normStripped)) {
    return ACCESS_LEVEL_LOOKUP.get(normStripped)
  }

  // Check extracted short code
  const extracted = extractAccessLevelCode(str)
  if (extracted && ACCESS_LEVEL_LOOKUP.has(normalizeAccessLevelKey(extracted))) {
    return ACCESS_LEVEL_LOOKUP.get(normalizeAccessLevelKey(extracted))
  }

  return null
}

/**
 * Returns formatted display name with its code in parentheses.
 * E.g. "Super Admin" -> "Super Admin (SA1)"
 *      "Super Admin (SA1)" -> "Super Admin (SA1)"
 *      { id: 3, name: 'Super Admin' } -> "Super Admin (SA1)"
 */
export const getAccessLevelDisplayName = (itemOrNameOrCodeOrId) => {
  if (!itemOrNameOrCodeOrId) return ''

  let rawName = ''
  if (typeof itemOrNameOrCodeOrId === 'object' && itemOrNameOrCodeOrId !== null) {
    rawName = itemOrNameOrCodeOrId.name || itemOrNameOrCodeOrId.Name || itemOrNameOrCodeOrId.role || ''
  } else {
    rawName = String(itemOrNameOrCodeOrId).trim()
  }

  const entry = getAccessLevelCatalogEntry(itemOrNameOrCodeOrId)
  if (entry) {
    const baseName = entry.name
    return `${baseName} (${entry.shortCode})`
  }

  // If existing code already in parentheses, retain clean structure
  const existingCode = extractAccessLevelCode(rawName)
  const baseName = stripAccessLevelCodeFromName(rawName) || rawName
  if (existingCode) {
    return `${baseName} (${existingCode})`
  }

  if (baseName) {
    const fallbackCode = generateFallbackShortCode(baseName)
    return `${baseName} (${fallbackCode})`
  }

  return rawName
}

/**
 * Returns the shortCode (e.g. 'SA1', 'DEV1', 'BM1') for an access level.
 */
export const getAccessLevelShortCode = (itemOrNameOrCodeOrId) => {
  const entry = getAccessLevelCatalogEntry(itemOrNameOrCodeOrId)
  if (entry) return entry.shortCode
  const extracted = extractAccessLevelCode(itemOrNameOrCodeOrId)
  if (extracted) return extracted
  const name = typeof itemOrNameOrCodeOrId === 'object' ? (itemOrNameOrCodeOrId?.name || '') : String(itemOrNameOrCodeOrId || '')
  return generateFallbackShortCode(name)
}

/**
 * Returns the canonical slug code (e.g. 'super_admin', 'billing_manager') for an access level.
 */
export const getAccessLevelCode = (itemOrNameOrCodeOrId) => {
  const entry = getAccessLevelCatalogEntry(itemOrNameOrCodeOrId)
  if (entry) return entry.code
  return getAccessLevelShortCode(itemOrNameOrCodeOrId).toLowerCase()
}

/**
 * Flexible condition / if-statement helper.
 * Tests if the given user or access level matches ANY of the supplied allowed codes, names, or IDs.
 *
 * Examples for flexible conditions and if statements:
 * ```js
 * // Check by user object:
 * if (hasAccessLevel(authStore.user, 'SA1', 'DEV1')) { ... }
 * if (hasAccessLevel(authStore.user, 'billing_manager')) { ... }
 *
 * // Check by role name or string:
 * if (hasAccessLevel('Super Admin', 'SA1')) { ... }
 * if (hasAccessLevel('Billing Manager (BM1)', 'BM1', 'ACC1')) { ... }
 *
 * // Array of codes:
 * if (hasAccessLevel(user, ['SA1', 'DEV1', 'EGM1'])) { ... }
 * ```
 */
export const hasAccessLevel = (targetUserOrLevel, ...allowedCodes) => {
  if (!targetUserOrLevel) return false
  if (!allowedCodes || allowedCodes.length === 0) return false

  // Flatten nested arrays in allowedCodes
  const flattenedCodes = allowedCodes.flat().filter(Boolean)
  if (flattenedCodes.length === 0) return false

  const entry = getAccessLevelCatalogEntry(targetUserOrLevel)
  const currentShortCode = entry?.shortCode || getAccessLevelShortCode(targetUserOrLevel)
  const currentCode = entry?.code || getAccessLevelCode(targetUserOrLevel)
  const currentNormName = normalizeAccessLevelKey(entry?.name || (typeof targetUserOrLevel === 'object' ? (targetUserOrLevel.name || targetUserOrLevel.role || '') : targetUserOrLevel))
  const currentId = entry?.id || (typeof targetUserOrLevel === 'object' ? Number(targetUserOrLevel.accesslevel_id || targetUserOrLevel.accessLevelId || targetUserOrLevel.id || 0) : Number(targetUserOrLevel || 0))

  for (const check of flattenedCodes) {
    if (typeof check === 'number' && currentId && currentId === check) {
      return true
    }

    const normCheck = normalizeAccessLevelKey(check)

    if (currentShortCode && normalizeAccessLevelKey(currentShortCode) === normCheck) {
      return true
    }
    if (currentCode && normalizeAccessLevelKey(currentCode) === normCheck) {
      return true
    }
    if (currentNormName && currentNormName === normCheck) {
      return true
    }

    // Check code aliases in catalog
    if (entry?.codeAliases?.some(ca => normalizeAccessLevelKey(ca) === normCheck)) {
      return true
    }
    if (entry?.aliases?.some(a => normalizeAccessLevelKey(a) === normCheck)) {
      return true
    }

    // Check if the check itself is a catalog entry and matches ID
    const checkEntry = getAccessLevelCatalogEntry(check)
    if (checkEntry && entry && checkEntry.code === entry.code) {
      return true
    }
  }

  return false
}

/**
 * Test whether an access level qualifies as Super Admin.
 */
export const isSuperAdminAccessLevel = (targetUserOrLevel) => {
  return hasAccessLevel(targetUserOrLevel, 'SA1', 'super_admin')
}
