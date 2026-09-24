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
      '/dashboard/main',
      '/dashboard/accounting',
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
      '/api-management/services',
      '/settings'
    ]

    for (const route of expectedRoutes) {
      assert.ok(
        content.includes(`path: '${route}'`),
        `Expected router to define route path: ${route}`
      )
    }
  })

  test('Router redirects root path / dynamically to landing for authenticated users and login for guests', () => {
    const content = fs.readFileSync(routerPath, 'utf8')
    assert.ok(
      content.includes("authStore.isAuthenticated ? '/landing' : '/login'"),
      'Root route / must redirect to /landing when authenticated and /login when guest'
    )
  })

  test('Router defaultParkingRoute parks authenticated guests and fallback on landing (Home)', () => {
    const content = fs.readFileSync(routerPath, 'utf8')
    assert.ok(
      content.includes("const defaultParkingRoute = isApiDown.value") && content.includes(": { name: 'landing' }"),
      'defaultParkingRoute must default to landing (Home) unless API is offline'
    )
  })

  test('Login.vue redirects fresh login with no payload to /landing (Home)', () => {
    const loginPath = path.resolve(__dirname, '../src/views/Login.vue')
    const loginContent = fs.readFileSync(loginPath, 'utf8')
    assert.ok(
      loginContent.includes("const defaultLanding = isApiDown.value ? '/settings' : '/landing'"),
      'Login.vue must use /landing (Home) as default landing destination'
    )
  })

  test('Sidebar.vue defaultLandingRoute points brand logo to /landing (Home)', () => {
    const sidebarPath = path.resolve(__dirname, '../src/components/Sidebar.vue')
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8')
    assert.ok(
      sidebarContent.includes("const defaultLandingRoute = computed(() => isApiDown.value ? '/settings' : '/landing')"),
      'Sidebar.vue brand logo must route to /landing (Home)'
    )
  })
})
