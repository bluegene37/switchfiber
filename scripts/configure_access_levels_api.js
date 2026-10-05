import https from 'node:https'

const agent = new https.Agent({ rejectUnauthorized: false })
// const BASE_URL = 'https://103.249.198.50:8090/api'
// Gene - Oct 5, 2026: Updated API URL to https://admin.switchfiber.ph/api
const BASE_URL = 'https://admin.switchfiber.ph/api'

const apiRequest = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`)
    const options = {
      agent,
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }

    const req = https.request(url, options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : null
          resolve({ status: res.statusCode, data: json, raw: body })
        } catch {
          resolve({ status: res.statusCode, data: body, raw: body })
        }
      })
    })

    req.on('error', reject)
    if (data) req.write(JSON.stringify(data))
    req.end()
  })
}

async function run() {
  console.log('=== Step 1: Fetch Existing Access Levels and Menus ===')
  const { data: levels } = await apiRequest('/AccessLevel')
  const { data: menus } = await apiRequest('/Menus')
  const { data: existingLinks } = await apiRequest('/AccesslevelMenu')

  console.log(`Found ${levels.length} Access Levels, ${menus.length} Menus, ${existingLinks.length} existing Menu Links.`)

  // Step 2: Repurpose ID 95 and ID 99
  console.log('\n=== Step 2: Update Existing Access Levels with Standard Roles ===')
  
  // ID 95 -> Sales & Marketing Representative
  const res95 = await apiRequest('/AccessLevel/95', 'PUT', {
    id: 95,
    name: 'Sales & Marketing Representative',
    description: 'Handles prospective customer applications, broadband internet plans, seasonal promos, and promotional discounts.',
    modifiedByUserId: 1
  })
  console.log('Updated ID 95 to Sales & Marketing Representative:', res95.status)

  // ID 99 -> Cashier / Payment Collector
  const res99 = await apiRequest('/AccessLevel/99', 'PUT', {
    id: 99,
    name: 'Cashier / Payment Collector',
    description: 'Processes over-the-counter payments, customer bill collections, official payment receipts, and billing inquiries.',
    modifiedByUserId: 1
  })
  console.log('Updated ID 99 to Cashier / Payment Collector:', res99.status)

  // Step 3: Create Missing Access Levels
  console.log('\n=== Step 3: Create Missing ISP Access Levels ===')
  const levelsToCreate = [
    {
      name: 'Fiber Plant Engineer (OSP)',
      description: 'Manages physical outside-plant fiber distribution, LCP cabinets, LCNAP splitters, NAP boxes, optical ports, and GIS plant mapping.'
    },
    {
      name: 'Auditor / Compliance Officer',
      description: 'Internal audit and regulatory compliance role with access to audit trails, system transaction history, error logs, and financial records.'
    },
    {
      name: 'Warehouse & Inventory Officer',
      description: 'Oversees equipment inventory, ONT modem routers, optical hardware, technician material requests, and equipment serial numbers.'
    }
  ]

  const createdLevelMap = {}
  for (const item of levelsToCreate) {
    const existing = levels.find(l => l.name?.toLowerCase().trim() === item.name.toLowerCase().trim())
    if (existing) {
      console.log(`Level "${item.name}" already exists with ID ${existing.id}`)
      createdLevelMap[item.name] = existing.id
    } else {
      const res = await apiRequest('/AccessLevel', 'POST', {
        name: item.name,
        description: item.description,
        createdByUserId: 1,
        modifiedByUserId: 1
      })
      const newId = res.data?.id
      console.log(`Created "${item.name}" -> ID ${newId} (Status ${res.status})`)
      createdLevelMap[item.name] = newId
    }
  }

  // Refetch fresh levels
  const { data: updatedLevels } = await apiRequest('/AccessLevel')
  const levelByName = {}
  updatedLevels.forEach(l => {
    levelByName[l.name] = l.id
  })

  // Helper to find menu ID by code or name fragment
  const getMenuIdByName = (nameFrag) => {
    const m = menus.find(row => row.name.toLowerCase().includes(nameFrag.toLowerCase()))
    return m ? m.id : null
  }

  // Pre-configured menu ID mappings for roles
  const roleMenuDefinitions = {
    // 1. Executive / General Manager (ID 104)
    [levelByName['Executive / General Manager'] || 104]: [
      4,  // Main Dashboard (MD1)
      20, // Accounting Dashboard (AD1)
      13, // All Application (AA1)
      16, // All Job Orders (AJO1)
      24, // All Service Orders (ASO1)
      30, // Disconnection (DIS1)
      32, // LCP NAP Map (LNM1)
      33, // LCP NAP Records (LNR1)
      35, // All Audit Trail (AAT1)
      36, // Audit Trail by Transaction Date (ATTD1)
      17, // Invoice (INV1)
      18, // Billing (BIL1)
      22, // Payments (PAY1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 2. Billing Manager (ID 5)
    5: [
      4,  // Main Dashboard (MD1)
      20, // Accounting Dashboard (AD1)
      17, // Invoice (INV1)
      18, // Billing (BIL1)
      22, // Payments (PAY1)
      1,  // Discount Types (DT1)
      3,  // Discounts (DISC1)
      12, // Plan (PL1)
      13, // All Application (AA1)
      30, // Disconnection (DIS1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 3. Technical Support (ID 6)
    6: [
      4,  // Main Dashboard (MD1)
      16, // All Job Orders (AJO1)
      27, // Job Orders In Progress (JOIP1)
      28, // Job Orders Completed (JOC1)
      29, // Job Orders Activated (JOA1)
      24, // All Service Orders (ASO1)
      5,  // LCP (LCP1)
      6,  // LCNAP (LCNAP1)
      7,  // LCNAP Port (LNP1)
      8,  // NAP (NAP1)
      9,  // Port (P1)
      10, // VLAN (V1)
      11, // Router (R1)
      32, // LCP NAP Map (LNM1)
      33, // LCP NAP Records (LNR1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 4. Data Input Team (ID 8)
    8: [
      13, // All Application (AA1)
      25, // In Progress (IP1)
      26, // Approved (AP1)
      49, // Done (D1)
      12, // Plan (PL1)
      1,  // Discount Types (DT1)
      3,  // Discounts (DISC1)
      5,  // LCP (LCP1)
      6,  // LCNAP (LCNAP1)
      8,  // NAP (NAP1)
      9,  // Port (P1)
      10, // VLAN (V1)
      11, // Router (R1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 5. Network Operations Center (NOC) (ID 10)
    10: [
      4,  // Main Dashboard (MD1)
      5,  // LCP (LCP1)
      6,  // LCNAP (LCNAP1)
      7,  // LCNAP Port (LNP1)
      8,  // NAP (NAP1)
      9,  // Port (P1)
      10, // VLAN (V1)
      11, // Router (R1)
      32, // LCP NAP Map (LNM1)
      33, // LCP NAP Records (LNR1)
      24, // All Service Orders (ASO1)
      40, // All Error Logs (AEL1)
      41, // Error Logs by Date Range (ELDR1)
      42, // Error Logs by Entity & Date (ELED1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 6. Sales & Marketing Representative (ID 95)
    95: [
      4,  // Main Dashboard (MD1)
      13, // All Application (AA1)
      25, // In Progress (IP1)
      26, // Approved (AP1)
      49, // Done (D1)
      12, // Plan (PL1)
      1,  // Discount Types (DT1)
      3,  // Discounts (DISC1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 7. Cashier / Payment Collector (ID 99)
    99: [
      20, // Accounting Dashboard (AD1)
      22, // Payments (PAY1)
      18, // Billing (BIL1)
      17, // Invoice (INV1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 8. Dispatcher / Schedule Coordinator (ID 100)
    100: [
      4,  // Main Dashboard (MD1)
      13, // All Application (AA1)
      16, // All Job Orders (AJO1)
      27, // Job Orders In Progress (JOIP1)
      28, // Job Orders Completed (JOC1)
      29, // Job Orders Activated (JOA1)
      24, // All Service Orders (ASO1)
      32, // LCP NAP Map (LNM1)
      33, // LCP NAP Records (LNR1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 9. Customer Support (ID 7)
    7: [
      4,  // Main Dashboard (MD1)
      13, // All Application (AA1)
      25, // In Progress (IP1)
      26, // Approved (AP1)
      49, // Done (D1)
      24, // All Service Orders (ASO1)
      30, // Disconnection (DIS1)
      12, // Plan (PL1)
      1,  // Discount Types (DT1)
      3,  // Discounts (DISC1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 10. Fiber Plant Engineer (OSP)
    [levelByName['Fiber Plant Engineer (OSP)']]: [
      4,  // Main Dashboard (MD1)
      5,  // LCP (LCP1)
      6,  // LCNAP (LCNAP1)
      7,  // LCNAP Port (LNP1)
      8,  // NAP (NAP1)
      9,  // Port (P1)
      10, // VLAN (V1)
      11, // Router (R1)
      32, // LCP NAP Map (LNM1)
      33, // LCP NAP Records (LNR1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 11. Auditor / Compliance Officer
    [levelByName['Auditor / Compliance Officer']]: [
      4,  // Main Dashboard (MD1)
      20, // Accounting Dashboard (AD1)
      35, // All Audit Trail (AAT1)
      36, // Audit Trail by Transaction Date (ATTD1)
      37, // Audit Trail by Entity & Date (ATED1)
      38, // Audit Trail by User & Date (ATUD1)
      40, // All Error Logs (AEL1)
      41, // Error Logs by Date Range (ELDR1)
      42, // Error Logs by Entity & Date (ELED1)
      43, // Error Logs by User & Date (ELUD1)
      17, // Invoice (INV1)
      18, // Billing (BIL1)
      22, // Payments (PAY1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ],
    // 12. Warehouse & Inventory Officer
    [levelByName['Warehouse & Inventory Officer']]: [
      11, // Router (R1)
      16, // All Job Orders (AJO1)
      28, // Job Orders Completed (JOC1)
      29, // Job Orders Activated (JOA1)
      24, // All Service Orders (ASO1)
      33, // LCP NAP Records (LNR1)
      19, // Settings (SET1)
      46, // Theme & Appearance (TA1)
      47  // Modify Password (MP1)
    ]
  }

  // Populate missing links
  console.log('\n=== Step 4: Link Pre-configured Menus to Access Levels ===')
  const existingSet = new Set(existingLinks.map(r => `${r.accessLevelId || r.accesslevel_id}_${r.menuId || r.menu_id}`))

  let addedLinksCount = 0
  for (const [levelIdStr, targetMenuIds] of Object.entries(roleMenuDefinitions)) {
    const levelId = Number(levelIdStr)
    if (!levelId || isNaN(levelId)) continue

    const levelObj = updatedLevels.find(l => l.id === levelId)
    const levelName = levelObj ? levelObj.name : `Level ${levelId}`

    for (const menuId of targetMenuIds) {
      const key = `${levelId}_${menuId}`
      if (!existingSet.has(key)) {
        try {
          const res = await apiRequest('/AccesslevelMenu', 'POST', {
            accesslevel_id: levelId,
            menu_id: menuId,
            createdByUserId: 1,
            modifiedByUserId: 1
          })
          if (res.status === 200 || res.status === 201) {
            existingSet.add(key)
            addedLinksCount++
          }
        } catch (err) {
          console.error(`Failed to link Level ${levelId} (${levelName}) to Menu ${menuId}:`, err.message)
        }
      }
    }
    console.log(`Verified Level ${levelId} (${levelName}) - target ${targetMenuIds.length} menus linked.`)
  }

  console.log(`\nSuccessfully linked ${addedLinksCount} new AccesslevelMenu permissions!`)

  // Step 5: Summary Report
  console.log('\n=== Final Access Level Audit Summary ===')
  const { data: finalLevels } = await apiRequest('/AccessLevel')
  const { data: finalLinks } = await apiRequest('/AccesslevelMenu')

  console.log(`Total Access Levels: ${finalLevels.length}`)
  console.log('----------------------------------------------------')
  finalLevels.sort((a,b) => a.id - b.id).forEach(l => {
    const linkCount = finalLinks.filter(r => (r.accessLevelId || r.accesslevel_id) === l.id).length
    console.log(`ID ${String(l.id).padEnd(4)} | Menus: ${String(linkCount).padEnd(3)} | ${l.name}`)
  })
}

run().catch(console.error)
