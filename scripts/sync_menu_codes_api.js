import https from 'node:https'
import { getMenuDisplayName } from '../src/constants/menuCatalog.js'

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

async function syncMenuCodes() {
  console.log(`[SyncMenus] Fetching current menus from ${API_BASE}/api/Menus...`)
  const res = await request(`${API_BASE}/api/Menus`, { method: 'GET' })
  if (!Array.isArray(res.data)) {
    console.error('[SyncMenus] Failed to fetch menus list:', res)
    process.exit(1)
  }

  const menus = res.data
  console.log(`[SyncMenus] Found ${menus.length} total menus in database.`)

  let updatedCount = 0
  let unchangedCount = 0
  let errorCount = 0

  for (const menu of menus) {
    const currentName = menu.name || ''
    const targetName = getMenuDisplayName(menu)

    if (!targetName || currentName === targetName) {
      unchangedCount++
      continue
    }

    const payload = {
      name: targetName,
      description: menu.description || '',
      modifiedBy: 1,
      modifiedDate: null
    }

    try {
      const putRes = await request(`${API_BASE}/api/Menus/${menu.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }, payload)

      if (putRes.status >= 200 && putRes.status < 300) {
        console.log(`✔ [ID ${menu.id}] "${currentName}" -> "${targetName}"`)
        updatedCount++
      } else {
        console.error(`✖ [ID ${menu.id}] Failed to update (${putRes.status}):`, putRes.raw)
        errorCount++
      }
    } catch (err) {
      console.error(`✖ [ID ${menu.id}] Network error:`, err.message)
      errorCount++
    }
  }

  console.log('\n--- Sync Summary ---')
  console.log(`Total Menus: ${menus.length}`)
  console.log(`Updated:     ${updatedCount}`)
  console.log(`Unchanged:   ${unchangedCount}`)
  console.log(`Errors:      ${errorCount}`)
}

syncMenuCodes().catch(err => {
  console.error('Fatal error during menu sync:', err)
  process.exit(1)
})
