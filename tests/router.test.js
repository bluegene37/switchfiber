import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const routerPath = path.resolve(__dirname, '../src/router/index.js')
const indexHtmlPath = path.resolve(__dirname, '../index.html')

describe('Router & Browser Tab Title Suite', () => {
  test('Router file contains SwitchFiber Admin APP_TITLE branding', () => {
    const content = fs.readFileSync(routerPath, 'utf8')
    assert.ok(
      content.includes("const APP_TITLE = 'SwitchFiber Admin'"),
      'Expected APP_TITLE to be set to "SwitchFiber Admin"'
    )
  })

  test('Document title in index.html is branded with SwitchFiber Admin', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf8')
    assert.ok(
      html.includes('<title>SwitchFiber Admin — Network Management</title>'),
      'Expected <title> in index.html to be "SwitchFiber Admin — Network Management"'
    )
    assert.ok(
      html.includes('<meta name="apple-mobile-web-app-title" content="SwitchFiber Admin" />'),
      'Expected apple-mobile-web-app-title to be "SwitchFiber Admin"'
    )
  })

  test('Router defines all expected core production routes', () => {
    const content = fs.readFileSync(routerPath, 'utf8')
    const expectedRoutes = [
      '/login',
      '/dashboard',
      '/application',
      '/job-orders',
      '/lcp',
      '/lcnap',
      '/nap',
      '/port',
      '/vlan',
      '/router',
      '/plan',
      '/user',
      '/access_level',
      '/lcp-nap-locations',
      '/logs/audit-trail',
      '/logs/error-logs',
      '/service-orders',
      '/data-viewer',
      '/models',
      '/settings'
    ]

    for (const route of expectedRoutes) {
      assert.ok(
        content.includes(`path: '${route}'`),
        `Expected router to define route path: ${route}`
      )
    }
  })
})
