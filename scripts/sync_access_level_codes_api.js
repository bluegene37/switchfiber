// Gene - Oct 13, 2026: Synchronize Access Level names with their shortCodes via backend API
import https from 'node:https'
import { getAccessLevelDisplayName } from '../src/constants/accessLevelCatalog.js'

const agent = new https.Agent({ rejectUnauthorized: false })
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

async function syncAccessLevelCodes() {
  console.log(`[SyncAccessLevels] Fetching current access levels from ${API_BASE}/api/AccessLevel...`)
  const res = await request(`${API_BASE}/api/AccessLevel`, { method: 'GET' })
  if (!Array.isArray(res.data)) {
    console.error('[SyncAccessLevels] Failed to fetch access levels list:', res)
    process.exit(1)
  }

  const levels = res.data
  console.log(`[SyncAccessLevels] Found ${levels.length} total access levels in database.`)

  let updatedCount = 0
  let unchangedCount = 0
  let errorCount = 0

  for (const level of levels) {
    const currentName = level.name || ''
    const targetName = getAccessLevelDisplayName(level)

    if (!targetName || currentName === targetName) {
      console.log(`- [ID ${level.id}] Already synced: "${currentName}"`)
      unchangedCount++
      continue
    }

    const payload = {
      id: level.id,
      name: targetName,
      description: level.description || '',
      modifiedBy: 1,
      modifiedDate: null
    }

    try {
      const putRes = await request(`${API_BASE}/api/AccessLevel/${level.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }, payload)

      if (putRes.status >= 200 && putRes.status < 300) {
        console.log(`✔ [ID ${level.id}] "${currentName}" -> "${targetName}"`)
        updatedCount++
      } else {
        console.error(`✖ [ID ${level.id}] Failed to update (${putRes.status}):`, putRes.raw)
        errorCount++
      }
    } catch (err) {
      console.error(`✖ [ID ${level.id}] Network error:`, err.message)
      errorCount++
    }
  }

  console.log('\n--- Sync Summary ---')
  console.log(`Total Access Levels: ${levels.length}`)
  console.log(`Updated:             ${updatedCount}`)
  console.log(`Unchanged:           ${unchangedCount}`)
  console.log(`Errors:              ${errorCount}`)
}

syncAccessLevelCodes().catch(err => {
  console.error('Fatal error during access level sync:', err)
  process.exit(1)
})
