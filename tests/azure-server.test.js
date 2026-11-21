// Gene - Nov, 21, 2026: Unit & integration tests for Azure App Service server.js

import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

import { createAppServer, isCloudflareChallenge } from '../server.js'

describe('Azure App Service Server (server.js)', () => {
  let appServer
  let primaryMock
  let fallbackMock
  let baseUrl
  let appPort
  let tempDistDir
  let primaryRequests = []
  let fallbackRequests = []
  let primaryHandler = null
  let fallbackHandler = null

  before(async () => {
    tempDistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'switchfiber-admin-dist-'))
    fs.mkdirSync(path.join(tempDistDir, 'assets'), { recursive: true })
    fs.writeFileSync(
      path.join(tempDistDir, 'index.html'),
      '<!doctype html><html><body><div id="app">SwitchFiber Admin SPA</div></body></html>',
      'utf8'
    )
    fs.writeFileSync(
      path.join(tempDistDir, 'assets', 'app.js'),
      'console.log("switchfiber-admin");',
      'utf8'
    )
    fs.writeFileSync(
      path.join(tempDistDir, 'openapi.json'),
      JSON.stringify({ openapi: '3.1.0', info: { title: 'Bundled Spec' } }),
      'utf8'
    )
    fs.writeFileSync(
      path.join(tempDistDir, 'web.config'),
      '<configuration><rewrite /></configuration>',
      'utf8'
    )

    primaryMock = http.createServer((req, res) => {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => {
        const record = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: Buffer.concat(chunks)
        }
        primaryRequests.push(record)
        if (primaryHandler) {
          primaryHandler(record, req, res)
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ source: 'primary', method: record.method, url: record.url }))
      })
    })

    fallbackMock = http.createServer((req, res) => {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => {
        const record = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: Buffer.concat(chunks)
        }
        fallbackRequests.push(record)
        if (fallbackHandler) {
          fallbackHandler(record, req, res)
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ source: 'fallback', method: record.method, url: record.url }))
      })
    })

    await new Promise((resolve) => primaryMock.listen(0, '127.0.0.1', resolve))
    await new Promise((resolve) => fallbackMock.listen(0, '127.0.0.1', resolve))

    const primaryUrl = `http://127.0.0.1:${primaryMock.address().port}`
    const fallbackUrl = `http://127.0.0.1:${fallbackMock.address().port}`

    appServer = createAppServer({
      distDir: tempDistDir,
      backendBaseUrl: primaryUrl,
      fallbackBackendUrl: fallbackUrl,
      upstreamTimeoutMs: 5000,
      maxBodyBytes: 1024 * 64
    })

    await new Promise((resolve) => appServer.listen(0, '127.0.0.1', resolve))
    appPort = appServer.address().port
    baseUrl = `http://127.0.0.1:${appPort}`
  })

  beforeEach(() => {
    primaryRequests = []
    fallbackRequests = []
    primaryHandler = null
    fallbackHandler = null
  })

  after(async () => {
    if (appServer) await new Promise((resolve) => appServer.close(resolve))
    if (primaryMock) await new Promise((resolve) => primaryMock.close(resolve))
    if (fallbackMock) await new Promise((resolve) => fallbackMock.close(resolve))
    if (tempDistDir) fs.rmSync(tempDistDir, { recursive: true, force: true })
  })

  it('serves GET and HEAD /healthz with 200 and no-store caching', async () => {
    const getRes = await fetch(`${baseUrl}/healthz`)
    const body = await getRes.text()
    assert.equal(getRes.status, 200)
    assert.match(getRes.headers.get('cache-control') || '', /no-store/i)
    assert.equal(body.trim(), 'healthy')

    const headRes = await fetch(`${baseUrl}/healthz`, { method: 'HEAD' })
    const headBody = await headRes.text()
    assert.equal(headRes.status, 200)
    assert.match(headRes.headers.get('cache-control') || '', /no-store/i)
    assert.equal(headBody, '')
  })

  it('serves index.html on / with security headers and no-store caching', async () => {
    const res = await fetch(`${baseUrl}/`)
    const html = await res.text()

    assert.equal(res.status, 200)
    assert.match(res.headers.get('content-type') || '', /text\/html/i)
    assert.match(res.headers.get('cache-control') || '', /no-store/i)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(res.headers.get('x-frame-options'), 'DENY')
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
    assert.equal(res.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()')
    assert.match(html, /SwitchFiber Admin SPA/)
  })

  it('serves SPA fallback on deep routes and never proxies /api-management or /api-services', async () => {
    const routes = ['/dashboard/main', '/api-management', '/api-management/services', '/api-services']
    for (const route of routes) {
      const res = await fetch(`${baseUrl}${route}`)
      const html = await res.text()
      assert.equal(res.status, 200, `Expected 200 for ${route}`)
      assert.match(res.headers.get('content-type') || '', /text\/html/i)
      assert.match(html, /SwitchFiber Admin SPA/)
    }
    assert.equal(primaryRequests.length, 0, 'SPA routes starting with /api- must not be proxied')
  })

  it('serves static /openapi.json locally while proxying /openapi/v1.json upstream', async () => {
    const staticRes = await fetch(`${baseUrl}/openapi.json`)
    const staticJson = await staticRes.json()
    assert.equal(staticRes.status, 200)
    assert.equal(staticJson.info.title, 'Bundled Spec')
    assert.equal(primaryRequests.length, 0)

    const liveRes = await fetch(`${baseUrl}/openapi/v1.json`)
    const liveJson = await liveRes.json()
    assert.equal(liveRes.status, 200)
    assert.equal(liveJson.source, 'primary')
    assert.equal(liveJson.url, '/openapi/v1.json')
    assert.equal(primaryRequests.length, 1)
  })

  it('serves /assets/app.js with immutable cache and returns 404 for missing /assets files', async () => {
    const assetRes = await fetch(`${baseUrl}/assets/app.js`)
    const assetBody = await assetRes.text()
    assert.equal(assetRes.status, 200)
    assert.match(assetRes.headers.get('content-type') || '', /application\/javascript/i)
    assert.match(assetRes.headers.get('cache-control') || '', /immutable/i)
    assert.match(assetBody, /switchfiber-admin/)

    const missingRes = await fetch(`${baseUrl}/assets/missing.js`)
    await missingRes.text()
    assert.equal(missingRes.status, 404)
  })

  it('blocks dotfiles, path traversal, and web.config with 404', async () => {
    const dotfileRes = await fetch(`${baseUrl}/.env`)
    await dotfileRes.text()
    assert.equal(dotfileRes.status, 404)

    const webConfigRes = await fetch(`${baseUrl}/web.config`)
    await webConfigRes.text()
    assert.equal(webConfigRes.status, 404)

    const webConfigUpperRes = await fetch(`${baseUrl}/WEB.CONFIG`)
    await webConfigUpperRes.text()
    assert.equal(webConfigUpperRes.status, 404)

    // Use raw http.get so client does not normalize /%2e%2e/ before sending
    const traversalStatus = await new Promise((resolve, reject) => {
      http
        .get({ host: '127.0.0.1', port: appPort, path: '/%2e%2e/package.json' }, (res) => {
          res.resume()
          resolve(res.statusCode)
        })
        .on('error', reject)
    })
    assert.equal(traversalStatus, 404)
  })

  it('proxies GET, POST, PUT, DELETE with query strings, Authorization header, multipart binary body, and binary response', async () => {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
      const res = await fetch(`${baseUrl}/api/Plans?active=true&page=2`, {
        method,
        headers: {
          Authorization: 'Bearer test-jwt-token',
          'Content-Type': 'application/json'
        },
        body: method === 'GET' ? undefined : JSON.stringify({ name: 'Fiber 1500' })
      })
      const data = await res.json()
      assert.equal(res.status, 200)
      assert.equal(data.method, method)
      assert.equal(data.url, '/api/Plans?active=true&page=2')
    }

    assert.equal(primaryRequests.length, 4)
    assert.equal(primaryRequests[0].headers.authorization, 'Bearer test-jwt-token')
    assert.equal(primaryRequests[1].body.toString('utf8'), JSON.stringify({ name: 'Fiber 1500' }))

    // Binary multipart upload & binary image download pass-through
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff])
    const boundary = '----SwitchFiberBoundary123'
    const multipartPayload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="id.png"\r\nContent-Type: image/png\r\n\r\n`),
      pngSignature,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ])

    primaryHandler = (record, _req, res) => {
      assert.equal(record.headers['content-type'], `multipart/form-data; boundary=${boundary}`)
      assert.ok(Buffer.compare(record.body, multipartPayload) === 0, 'Binary multipart payload must pass intact')
      res.statusCode = 200
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Disposition', 'inline; filename="id.png"')
      res.end(pngSignature)
    }

    const binRes = await fetch(`${baseUrl}/api/JobOrders/42/image`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer upload-token',
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: multipartPayload
    })
    const receivedBytes = Buffer.from(await binRes.arrayBuffer())
    assert.equal(binRes.status, 200)
    assert.equal(binRes.headers.get('content-type'), 'image/png')
    assert.equal(binRes.headers.get('content-disposition'), 'inline; filename="id.png"')
    assert.equal(Buffer.compare(receivedBytes, pngSignature), 0)
  })

  it('handles OPTIONS preflight on /api/Plans with 204 and Allow header', async () => {
    const res = await fetch(`${baseUrl}/api/Plans`, { method: 'OPTIONS' })
    await res.text()

    assert.equal(res.status, 204)
    assert.match(res.headers.get('allow') || '', /GET/)
    assert.match(res.headers.get('allow') || '', /DELETE/)
    assert.equal(primaryRequests.length, 0)
  })

  it('fails over to fallbackBackendUrl when primary returns a Cloudflare 403 challenge', async () => {
    assert.equal(isCloudflareChallenge(403, '<html><title>Just a moment...</title></html>', 'text/html'), true)
    assert.equal(isCloudflareChallenge(401, '{"error":"Unauthorized"}', 'application/json'), false)

    primaryHandler = (_record, _req, res) => {
      res.statusCode = 403
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end('<html><head><title>Just a moment...</title></head><body>challenges.cloudflare.com</body></html>')
    }

    fallbackHandler = (record, _req, res) => {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true, via: 'fallback', auth: record.headers.authorization }))
    }

    const res = await fetch(`${baseUrl}/api/Menus`, {
      headers: { Authorization: 'Bearer cf-bypass-token' }
    })
    const data = await res.json()

    assert.equal(res.status, 200)
    assert.equal(data.via, 'fallback')
    assert.equal(data.auth, 'Bearer cf-bypass-token')
    assert.equal(primaryRequests.length, 1)
    assert.equal(fallbackRequests.length, 1)
  })

  it('rejects oversized proxy bodies exceeding maxBodyBytes with 413 Payload Too Large', async () => {
    const oversized = JSON.stringify({ data: 'x'.repeat(70 * 1024) })
    const res = await fetch(`${baseUrl}/api/JobOrders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: oversized
    })
    const data = await res.json()

    assert.equal(res.status, 413)
    assert.equal(data.error, 'Payload Too Large')
    assert.equal(primaryRequests.length, 0)
  })
})
