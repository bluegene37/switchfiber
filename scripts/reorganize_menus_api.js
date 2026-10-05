import https from 'node:https'

const agent = new https.Agent({ rejectUnauthorized: false })
// const API_BASE = process.env.VITE_API_URL || 'https://103.249.198.50:8090'
// Gene - Oct 5, 2026: Updated fallback API URL to https://admin.switchfiber.ph
const API_BASE = process.env.VITE_API_URL || 'https://admin.switchfiber.ph'

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { agent, ...options }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {}
          resolve({ status: res.statusCode, data: json, raw: data })
        } catch (e) {
          resolve({ status: res.statusCode, raw: data })
        }
      })
    })
    req.on('error', reject)
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body))
    }
    req.end()
  })
}

async function reorganizeMenus() {
  console.log('[ReorganizeMenus] Connecting to', API_BASE)

  // 1. Repurpose ID 4 -> Main Dashboard (MD1)
  console.log('[ReorganizeMenus] Updating ID 4 to "Main Dashboard (MD1)"...')
  const r4 = await request(`${API_BASE}/api/Menus/4`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Main Dashboard (MD1)',
    description: 'Executive operational KPIs, subscriber analytics, and network plant map.',
    modifiedBy: 1,
    modifiedDate: null
  })
  console.log('ID 4 update result:', r4.status, r4.data)

  // 2. Repurpose ID 20 -> Accounting Dashboard (AD1)
  console.log('[ReorganizeMenus] Updating ID 20 to "Accounting Dashboard (AD1)"...')
  const r20 = await request(`${API_BASE}/api/Menus/20`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Accounting Dashboard (AD1)',
    description: 'Financial analytics, billing collections, revenue reconciliation, and receivables.',
    modifiedBy: 1,
    modifiedDate: null
  })
  console.log('ID 20 update result:', r20.status, r20.data)

  // 3. Repurpose ID 22 -> Payments (PAY1)
  console.log('[ReorganizeMenus] Updating ID 22 to "Payments (PAY1)"...')
  const r22 = await request(`${API_BASE}/api/Menus/22`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Payments (PAY1)',
    description: 'Customer payment transactions, receipts, and collections ledger.',
    modifiedBy: 1,
    modifiedDate: null
  })
  console.log('ID 22 update result:', r22.status, r22.data)

  // 4. Update ID 13 -> All Application (AA1)
  console.log('[ReorganizeMenus] Updating ID 13 to "All Application (AA1)"...')
  const r13 = await request(`${API_BASE}/api/Menus/13`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'All Application (AA1)',
    description: 'All customer subscription applications across all processing stages.',
    modifiedBy: 1,
    modifiedDate: null
  })
  console.log('ID 13 update result:', r13.status, r13.data)

  // 5. Update ID 16 -> All Job Orders (AJO1)
  console.log('[ReorganizeMenus] Updating ID 16 to "All Job Orders (AJO1)"...')
  const r16 = await request(`${API_BASE}/api/Menus/16`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'All Job Orders (AJO1)',
    description: 'All field technician installation and job orders list.',
    modifiedBy: 1,
    modifiedDate: null
  })
  console.log('ID 16 update result:', r16.status, r16.data)

  // 6. Update ID 24 -> All Service Orders (ASO1)
  console.log('[ReorganizeMenus] Updating ID 24 to "All Service Orders (ASO1)"...')
  const r24 = await request(`${API_BASE}/api/Menus/24`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'All Service Orders (ASO1)',
    description: 'All customer repair and technical service visits list.',
    modifiedBy: 1,
    modifiedDate: null
  })
  console.log('ID 24 update result:', r24.status, r24.data)

  // 7. Clean up parent rows (21: User Management, 31: LCP NAP Locations, 34: Audit Trail)
  const parentsToDelete = [21, 31, 34]
  for (const pid of parentsToDelete) {
    console.log(`[ReorganizeMenus] Deleting parent menu ID ${pid}...`)
    const delRes = await request(`${API_BASE}/api/Menus/${pid}?deletedby=1`, {
      method: 'DELETE'
    })
    console.log(`ID ${pid} delete result:`, delRes.status, delRes.data)
  }

  // 8. Clean up orphan AccesslevelMenu relations for deleted parent menus
  const deletedIds = new Set([21, 31, 34, 39])
  console.log('[ReorganizeMenus] Fetching AccesslevelMenu relations to clean up orphan parent links...')
  const relRes = await request(`${API_BASE}/api/AccesslevelMenu`, { method: 'GET' })
  if (Array.isArray(relRes.data)) {
    const orphanRels = relRes.data.filter(r => deletedIds.has(r.menuId || r.menu_id || r.MenuId))
    console.log(`Found ${orphanRels.length} orphan AccesslevelMenu relations to remove.`)
    for (const rel of orphanRels) {
      await request(`${API_BASE}/api/AccesslevelMenu/${rel.id}`, { method: 'DELETE' })
      console.log(`Deleted orphan relation ID ${rel.id} (menuId: ${rel.menuId})`)
    }
  }

  // 9. Fetch and display final cleaned menu list
  const finalListRes = await request(`${API_BASE}/api/Menus`, { method: 'GET' })
  console.log('\n--- Final Cleaned Database Menus ---')
  if (Array.isArray(finalListRes.data)) {
    console.log(`Total live menus: ${finalListRes.data.length}`)
    finalListRes.data.forEach(m => console.log(m.id.toString().padStart(2), ':', m.name))
  }
}

reorganizeMenus().catch(console.error)
