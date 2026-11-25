// Gene - Nov, 25, 2026: Idempotent seeder script for all application statuses in /api/Status
import https from 'node:https'
/*
import { DEFAULT_STATUSES, normalizeStatusType, normalizeStatusPayload } from '../src/services/status.js'
*/
// Gene - Nov, 26, 2026: Use token-aware matching so 'inprogress' matches legacy variants and fail fast on repeated 500 responses
import { DEFAULT_STATUSES, normalizeStatusType, normalizeStatusToken, normalizeStatusPayload } from '../src/services/status.js'

const API_BASE = 'https://admin.switchfiber.ph/api'

function makeRequest(url, method = 'GET', payload = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const bodyStr = payload ? JSON.stringify(payload) : null
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        Accept: 'application/json',
        ...(bodyStr ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr)
        } : {})
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null
          resolve({ status: res.statusCode, data: parsed, raw: data })
        } catch {
          resolve({ status: res.statusCode, data: null, raw: data })
        }
      })
    })

    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

/*
export async function seedStatuses(createdBy = '1') {
*/
// Gene - Nov, 25, 2026: Default createdBy to SEED_CREATED_BY env var or 'system'
export async function seedStatuses(createdBy = process.env.SEED_CREATED_BY || 'system') {
  console.log('--- Seeding Application Statuses (/api/Status) ---')
  const getRes = await makeRequest(`${API_BASE}/Status`)
  const existing = Array.isArray(getRes.data) ? getRes.data : []
  console.log(`Existing Status records: ${existing.length}`)

  let createdCount = 0
  let skippedCount = 0
  let failedCount = 0
  let consecutiveServerErrors = 0

  for (const item of DEFAULT_STATUSES) {
    const match = existing.find(e =>
      normalizeStatusType(e?.type) === normalizeStatusType(item.type) &&
      normalizeStatusToken(e?.name) === normalizeStatusToken(item.name)
    )
    if (match) {
      skippedCount++
      continue
    }

    const payload = normalizeStatusPayload(item, createdBy)
    const postRes = await makeRequest(`${API_BASE}/Status`, 'POST', payload)
    if (postRes.status === 200 || postRes.status === 201) {
      createdCount++
      consecutiveServerErrors = 0
      existing.push(postRes.data || payload)
      console.log(`  [CREATED] [${payload.type}] "${payload.name}" -> "${payload.description}"`)
    } else {
      failedCount++
      console.error(`  [FAILED] [${payload.type}] "${payload.name}" - HTTP ${postRes.status}:`, postRes.raw)
      if (postRes.status >= 500) {
        consecutiveServerErrors++
        if (consecutiveServerErrors >= 3) {
          console.error('  [ABORTED] Stopped early after 3 consecutive HTTP 5xx server errors on POST /api/Status.')
          break
        }
      } else {
        consecutiveServerErrors = 0
      }
    }
  }

  console.log(`Status seeding finished: ${createdCount} created, ${skippedCount} skipped, ${failedCount} failed (target: ${DEFAULT_STATUSES.length}).`)
  return { existingCount: existing.length, createdCount, skippedCount, failedCount }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedStatuses()
    .then(async (summary) => {
      if (summary.failedCount > 0) process.exitCode = 1
    })
    .catch((err) => {
      console.error('Error seeding statuses:', err)
      process.exit(1)
    })
}
