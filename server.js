// Gene - Nov, 21, 2026: Production Node HTTP server for Azure App Service serving dist/ SPA and proxying /api/ and /openapi/ to the backend

import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DEFAULT_BACKEND_BASE_URL = process.env.BACKEND_API_URL || 'https://admin.switchfiber.ph'
export const DEFAULT_FALLBACK_BACKEND_URL = process.env.FALLBACK_BACKEND_API_URL || 'https://103.249.198.50:8090'
export const DEFAULT_UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS) || 60000
export const MAX_BODY_BYTES = 50 * 1024 * 1024

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 SwitchFiber-Admin/1.0'

const PROXY_ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
const PROXY_ALLOW_HEADER = 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS'

const FORWARDED_HEADER_MAP = [
  ['authorization', 'Authorization'],
  ['content-type', 'Content-Type'],
  ['accept-language', 'Accept-Language'],
  ['x-requested-with', 'X-Requested-With'],
  ['if-none-match', 'If-None-Match'],
  ['if-modified-since', 'If-Modified-Since']
]

export const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true
})

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
}

const LONG_MEDIA_EXTS = new Set([
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.gif',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.webmanifest',
  '.mp4',
  '.webm'
])

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
}

function sendJson(res, statusCode, payload) {
  if (res.headersSent) return
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Length', body.length)
  res.end(body)
}

function sendText(res, statusCode, text, { isHead = false } = {}) {
  if (res.headersSent) return
  const body = Buffer.from(text, 'utf8')
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Content-Length', body.length)
  if (isHead) {
    res.end()
    return
  }
  res.end(body)
}

export function isCloudflareChallenge(status, body = '', contentType = '') {
  if (status !== 403 && status !== 503) return false
  const isHtml = Boolean(contentType && String(contentType).toLowerCase().includes('text/html'))
  const strBody = typeof body === 'string' ? body : ''
  const hasChallengeMarkers =
    strBody.includes('challenges.cloudflare.com') ||
    strBody.includes('Just a moment...') ||
    strBody.includes('challenge-platform') ||
    strBody.includes('cf-mitigated') ||
    strBody.includes('Attention Required! | Cloudflare') ||
    (isHtml && strBody.toLowerCase().includes('cloudflare'))
  return isHtml || hasChallengeMarkers
}

function isCompressible(mimeType) {
  return (
    mimeType.startsWith('text/') ||
    mimeType.startsWith('application/javascript') ||
    mimeType.startsWith('application/json') ||
    mimeType.startsWith('application/manifest+json') ||
    mimeType.startsWith('application/xml') ||
    mimeType === 'image/svg+xml'
  )
}

function statFile(filePath) {
  try {
    const stat = fs.statSync(filePath)
    return stat.isFile() ? stat : null
  } catch {
    return null
  }
}

function getCacheControl(urlPath, filePath) {
  if (urlPath === '/index.html') {
    return 'no-store, no-cache, must-revalidate'
  }
  if (urlPath.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable'
  }
  const ext = path.extname(filePath).toLowerCase()
  if (LONG_MEDIA_EXTS.has(ext) || path.basename(filePath) === 'manifest.json') {
    return 'public, max-age=2592000'
  }
  return 'public, max-age=3600'
}

function sendFile(req, res, filePath, cacheControl, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase()
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
  let payload = fs.readFileSync(filePath)

  const acceptEncoding = String(req.headers['accept-encoding'] || '')
  const canGzip =
    isCompressible(mimeType) && payload.length > 1024 && /\bgzip\b/i.test(acceptEncoding)

  res.statusCode = statusCode
  res.setHeader('Content-Type', mimeType)
  res.setHeader('Cache-Control', cacheControl)

  if (canGzip) {
    payload = zlib.gzipSync(payload)
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Vary', 'Accept-Encoding')
  }

  res.setHeader('Content-Length', payload.length)
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  res.end(payload)
}

function readBodyBuffer(req, maxBytes) {
  return new Promise((resolve, reject) => {
    if (!req || typeof req.on !== 'function' || req.readableEnded) {
      resolve(Buffer.alloc(0))
      return
    }

    const chunks = []
    let total = 0
    let settled = false

    req.on('data', (chunk) => {
      if (settled) return
      total += chunk.length
      if (total > maxBytes) {
        settled = true
        const err = new Error(`Request body exceeds ${maxBytes} bytes`)
        err.statusCode = 413
        req.resume()
        reject(err)
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      if (!settled) {
        settled = true
        resolve(Buffer.concat(chunks))
      }
    })

    req.on('error', (err) => {
      if (!settled) {
        settled = true
        reject(err)
      }
    })
  })
}

function buildProxyHeaders(req, payload) {
  const headers = {
    Accept: String(req.headers?.accept || 'application/json, */*'),
    'User-Agent': String(req.headers?.['user-agent'] || DEFAULT_USER_AGENT)
  }

  for (const [incomingKey, outgoingKey] of FORWARDED_HEADER_MAP) {
    const val = req.headers?.[incomingKey]
    if (typeof val === 'string' && val.length > 0) {
      headers[outgoingKey] = val
    }
  }

  if (payload !== null) {
    headers['Content-Length'] = payload.length
  }

  return headers
}

function dispatchUpstream(url, method, headers, payload, timeoutMs) {
  const isHttpsUrl = url.protocol === 'https:'
  const client = isHttpsUrl ? https : http

  return new Promise((resolve) => {
    let settled = false
    const finish = (result) => {
      if (!settled) {
        settled = true
        resolve(result)
      }
    }

    const proxyReq = client.request(
      url,
      { method, agent: isHttpsUrl ? httpsAgent : undefined, headers },
      (proxyRes) => {
        const chunks = []
        proxyRes.on('data', (chunk) => chunks.push(chunk))
        proxyRes.on('end', () => {
          finish({
            networkError: false,
            status: proxyRes.statusCode || 502,
            headers: proxyRes.headers || {},
            bodyBuffer: Buffer.concat(chunks)
          })
        })
        proxyRes.on('error', (err) => {
          finish({
            networkError: true,
            status: 502,
            headers: {},
            bodyBuffer: Buffer.alloc(0),
            errorMessage: String(err?.message || err)
          })
        })
      }
    )

    proxyReq.setTimeout(timeoutMs, () => {
      proxyReq.destroy(new Error(`Upstream did not respond within ${timeoutMs}ms`))
    })

    proxyReq.on('error', (err) => {
      finish({
        networkError: true,
        status: 502,
        headers: {},
        bodyBuffer: Buffer.alloc(0),
        errorMessage: String(err?.message || err)
      })
    })

    if (payload !== null && payload.length > 0) {
      proxyReq.write(payload)
    }
    proxyReq.end()
  })
}

async function handleProxyRequest(
  req,
  res,
  upstreamPath,
  { backendBaseUrl, fallbackBackendUrl, upstreamTimeoutMs, maxBodyBytes }
) {
  res.setHeader('Vary', 'Origin')
  res.setHeader('Cache-Control', 'no-store')

  const method = String(req.method || 'GET').toUpperCase()
  if (!PROXY_ALLOWED_METHODS.has(method)) {
    res.setHeader('Allow', PROXY_ALLOW_HEADER)
    sendJson(res, 405, { error: 'Method Not Allowed' })
    return
  }

  if (method === 'OPTIONS') {
    res.setHeader('Allow', PROXY_ALLOW_HEADER)
    res.statusCode = 204
    res.end()
    return
  }

  let payload = null
  if (method !== 'GET' && method !== 'HEAD') {
    payload = await readBodyBuffer(req, maxBodyBytes)
  }

  const primaryUrl = new URL(upstreamPath, backendBaseUrl)
  const headers = buildProxyHeaders(req, payload)

  let upstream = await dispatchUpstream(primaryUrl, method, headers, payload, upstreamTimeoutMs)

  const primaryPreview = upstream.bodyBuffer.subarray(0, 4096).toString('utf8')
  const primaryContentType = String(upstream.headers['content-type'] || '')
  const primaryWasCfChallenge = isCloudflareChallenge(
    upstream.status,
    primaryPreview,
    primaryContentType
  )

  let fallbackOrigin = ''
  if (fallbackBackendUrl) {
    try {
      fallbackOrigin = new URL(fallbackBackendUrl).origin
    } catch {
      fallbackOrigin = ''
    }
  }

  const shouldFailover =
    Boolean(fallbackOrigin) &&
    primaryUrl.origin !== fallbackOrigin &&
    (upstream.networkError ||
      upstream.status === 502 ||
      upstream.status === 504 ||
      primaryWasCfChallenge)

  if (shouldFailover) {
    console.warn(
      `[Proxy] Upstream ${primaryUrl.origin} returned ${
        upstream.networkError ? 'network error' : `HTTP ${upstream.status}`
      }. Failing over to ${fallbackOrigin}...`
    )
    const fallbackUrl = new URL(upstreamPath, fallbackBackendUrl)
    const fallback = await dispatchUpstream(fallbackUrl, method, headers, payload, upstreamTimeoutMs)
    const fallbackPreview = fallback.bodyBuffer.subarray(0, 4096).toString('utf8')
    const fallbackContentType = String(fallback.headers['content-type'] || '')
    const fallbackWasCfChallenge = isCloudflareChallenge(
      fallback.status,
      fallbackPreview,
      fallbackContentType
    )

    if (
      !fallback.networkError &&
      !fallbackWasCfChallenge &&
      (fallback.status < 500 || upstream.networkError || primaryWasCfChallenge)
    ) {
      upstream = fallback
    }
  }

  if (upstream.networkError) {
    console.error(`[Proxy] Upstream connection failure on ${method} ${upstreamPath}: ${upstream.errorMessage}`)
    sendJson(res, 502, {
      error: 'Bad Gateway',
      message: 'Unable to reach the SwitchFiber API server.'
    })
    return
  }

  res.statusCode = upstream.status
  if (upstream.headers['content-type']) {
    res.setHeader('Content-Type', upstream.headers['content-type'])
  }
  if (upstream.headers['content-disposition']) {
    res.setHeader('Content-Disposition', upstream.headers['content-disposition'])
  }

  if (method === 'HEAD') {
    if (upstream.headers['content-length']) {
      res.setHeader('Content-Length', upstream.headers['content-length'])
    }
    res.end()
    return
  }

  res.setHeader('Content-Length', upstream.bodyBuffer.length)
  res.end(upstream.bodyBuffer)
}

function serveStaticOrSpa(req, res, rawPathname, resolvedDist) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    sendText(res, 405, 'Method Not Allowed')
    return
  }

  const isHead = req.method === 'HEAD'
  let decodedPath
  try {
    decodedPath = decodeURIComponent(rawPathname)
  } catch {
    sendText(res, 400, 'Bad Request', { isHead })
    return
  }

  if (decodedPath.includes('\0')) {
    sendText(res, 404, 'Not Found', { isHead })
    return
  }

  const segments = decodedPath.split(/[\\/]/).filter(Boolean)
  if (segments.some((segment) => segment.startsWith('.') || segment.toLowerCase() === 'web.config')) {
    sendText(res, 404, 'Not Found', { isHead })
    return
  }

  const normalizedUrlPath = '/' + segments.join('/')
  const candidate = path.resolve(resolvedDist, '.' + normalizedUrlPath)
  if (candidate !== resolvedDist && !candidate.startsWith(resolvedDist + path.sep)) {
    sendText(res, 404, 'Not Found', { isHead })
    return
  }

  if (normalizedUrlPath !== '/' && statFile(candidate)) {
    sendFile(req, res, candidate, getCacheControl(normalizedUrlPath, candidate))
    return
  }

  if (normalizedUrlPath === '/assets' || normalizedUrlPath.startsWith('/assets/')) {
    sendText(res, 404, 'Not Found', { isHead })
    return
  }

  const indexPath = path.join(resolvedDist, 'index.html')
  if (!statFile(indexPath)) {
    sendText(res, 503, 'Application bundle not built. Run npm run build first.', { isHead })
    return
  }

  sendFile(req, res, indexPath, 'no-store, no-cache, must-revalidate')
}

export function createAppServer({
  distDir = path.resolve(__dirname, 'dist'),
  backendBaseUrl = DEFAULT_BACKEND_BASE_URL,
  fallbackBackendUrl = DEFAULT_FALLBACK_BACKEND_URL,
  upstreamTimeoutMs = DEFAULT_UPSTREAM_TIMEOUT_MS,
  maxBodyBytes = MAX_BODY_BYTES
} = {}) {
  const resolvedDist = path.resolve(distDir)

  return http.createServer(async (req, res) => {
    applySecurityHeaders(res)

    let parsedUrl
    let rawPathPart = '/'
    try {
      const rawUrl = req.url || '/'
      const safeRawUrl = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
      rawPathPart = safeRawUrl.split(/[?#]/, 1)[0] || '/'
      parsedUrl = new URL(`http://localhost${safeRawUrl}`)
    } catch {
      sendJson(res, 400, { error: 'Bad Request' })
      return
    }

    if (rawPathPart === '/healthz') {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD')
        res.setHeader('Cache-Control', 'no-store')
        sendText(res, 405, 'Method Not Allowed')
        return
      }
      res.setHeader('Cache-Control', 'no-store')
      sendText(res, 200, 'healthy\n', { isHead: req.method === 'HEAD' })
      return
    }

    if (rawPathPart === '/api' || rawPathPart.startsWith('/api/') || rawPathPart.startsWith('/openapi/')) {
      try {
        const upstreamPath = `${rawPathPart}${parsedUrl.search || ''}`
        await handleProxyRequest(req, res, upstreamPath, {
          backendBaseUrl,
          fallbackBackendUrl,
          upstreamTimeoutMs,
          maxBodyBytes
        })
      } catch (err) {
        if (err?.statusCode === 413) {
          sendJson(res, 413, {
            error: 'Payload Too Large',
            message: `Request body exceeds ${maxBodyBytes} bytes.`
          })
          return
        }
        console.error(`[server proxy error] ${req.method} ${rawPathPart}:`, err)
        if (!res.headersSent) {
          sendJson(res, 502, {
            error: 'Bad Gateway',
            message: 'Unable to reach the SwitchFiber API server.'
          })
        }
      }
      return
    }

    try {
      serveStaticOrSpa(req, res, rawPathPart, resolvedDist)
    } catch (err) {
      console.error(`[server static error] ${req.method} ${rawPathPart}:`, err)
      if (!res.headersSent) {
        sendText(res, 500, 'Internal Server Error', { isHead: req.method === 'HEAD' })
      }
    }
  })
}

const isMain =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  const port = Number(process.env.PORT) || 8080
  const server = createAppServer()

  server.listen(port, '0.0.0.0', () => {
    console.log(`SwitchFiber Admin Azure server listening on http://0.0.0.0:${port}`)
  })

  const shutdown = () => {
    server.close(() => {
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
