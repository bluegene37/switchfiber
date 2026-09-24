import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

const apiSource = read('src/services/api.js')
const permissionsSource = read('src/composables/usePermissions.js')
const routerSource = read('src/router/index.js')
const sidebarSource = read('src/components/Sidebar.vue')
const navbarSource = read('src/components/Navbar.vue')
const settingsSource = read('src/views/Settings.vue')
const dashboardSource = read('src/views/Dashboard.vue')
const accountingDashboardSource = read('src/views/AccountingDashboard.vue')

describe('API Offline & Settings Parking Suite', () => {
  describe('api.js error interceptor', () => {
    test('extracts title from HTML error responses (e.g. ASP.NET / IIS 500 runtime errors)', () => {
      assert.ok(
        apiSource.includes('/<title>\\s*([\\s\\S]*?)\\s*<\\/title>/i') ||
        apiSource.includes('/<title>\\s*([^<]+)\\s*<\\/title>/i') ||
        apiSource.includes('<title>'),
        'api.js must parse HTML error titles from the response'
      )
      assert.ok(apiSource.includes('isNetworkError'), 'api.js should flag network errors')
      assert.ok(apiSource.includes('customError.url =') || apiSource.includes('url:'), 'api.js should preserve request url in error details')
    })

    test('verifies HTML regex extracts clean title string', () => {
      const sampleHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"/>
        <title>HTTP Error 500.31 - Failed to load ASP.NET Core runtime</title>
        <style type="text/css">
        <!-- body{margin:0;font-size:.7em;} -->
        </style>
        </head>
        <body><fieldset><h2>HTTP Error 500.31 - ANCM Failed to Find Native Dependencies</h2></fieldset></body>
        </html>
      `
      const match = sampleHtml.match(/<title>\s*([\s\S]*?)\s*<\/title>/i)
      assert.ok(match, 'Regex should match title tag')
      assert.equal(match[1].trim(), 'HTTP Error 500.31 - Failed to load ASP.NET Core runtime')
    })
  })

  describe('usePermissions composable offline behavior', () => {
    test('exports isApiDown, apiErrorDetails, and retryConnection', () => {
      assert.ok(permissionsSource.includes('isApiDown'), 'usePermissions must track isApiDown')
      assert.ok(permissionsSource.includes('apiErrorDetails'), 'usePermissions must track apiErrorDetails')
      assert.ok(permissionsSource.includes('retryConnection: fetchPermissions') || permissionsSource.includes('retryConnection'), 'usePermissions must export retryConnection')
    })

    test('buildFallbackMenuSet strictly returns only settings when API is down or in error', () => {
      assert.ok(
        permissionsSource.includes("reason === 'error' || isApiDown.value") ||
        permissionsSource.includes("isApiDown.value || reason === 'error'"),
        'Fallback menu set must check isApiDown or error reason'
      )
      assert.ok(
        permissionsSource.includes("new Set(['settings', 'settings.theme', 'settings.modify-password', 'settings.unmask-password'])"),
        'Only settings codes are returned in fallback set when API is down'
      )
    })

    test('canAccess(code) restricts non-settings access when isApiDown is true', () => {
      assert.ok(
        permissionsSource.includes('if (isApiDown.value)'),
        'canAccess must check isApiDown'
      )
      assert.ok(
        permissionsSource.includes("code === 'settings' || (typeof code === 'string' && code.startsWith('settings.'))"),
        'When isApiDown is true, canAccess only permits settings'
      )
    })

    test('Super Admin evaluation does not bypass offline state', () => {
      // In runFetch, loadMenuRegistry() must run before checking isSuperAdmin.value
      const registryPos = permissionsSource.indexOf('const registryLoaded = await loadMenuRegistry()')
      const superAdminCheckPos = permissionsSource.indexOf('if (isSuperAdmin.value) {', registryPos)
      assert.ok(
        registryPos !== -1 && superAdminCheckPos !== -1 && registryPos < superAdminCheckPos,
        'loadMenuRegistry() must run before granting super admin full menu so offline state is detected'
      )
    })
  })

  describe('router parking and dashboard exclusion', () => {
    test('router redirects /dashboard and child routes to settings when isApiDown is true', () => {
      assert.ok(
        routerSource.includes("if (isApiDown.value && (to.path === '/dashboard' || to.path.startsWith('/dashboard/')))") ||
        (routerSource.includes('isApiDown.value') && routerSource.includes("name: 'settings'")),
        'router must intercept dashboard navigations when API is down'
      )
    })

    test('defaultParkingRoute dynamically falls back to landing if dashboard cannot be accessed', () => {
      assert.ok(
        routerSource.includes("defaultParkingRoute = isApiDown.value") && routerSource.includes("{ name: 'landing' }"),
        'defaultParkingRoute should route to landing when dashboard permission is missing'
      )
    })
  })

  describe('Dashboard views offline guards', () => {
    test('Dashboard.vue redirects to settings if isApiDown on mount', () => {
      assert.ok(
        dashboardSource.includes('isApiDown.value') && dashboardSource.includes("router.replace('/settings')"),
        'Dashboard.vue should redirect to /settings when isApiDown is true'
      )
    })

    test('AccountingDashboard.vue redirects to settings if isApiDown on mount', () => {
      assert.ok(
        accountingDashboardSource.includes('isApiDown.value') && accountingDashboardSource.includes("router.replace('/settings')"),
        'AccountingDashboard.vue should redirect to /settings when isApiDown is true'
      )
    })
  })

  describe('Sidebar and Navbar UI offline indicators', () => {
    test('Sidebar.vue handles offline state gracefully', () => {
      assert.ok(sidebarSource.includes('isApiDown'), 'Sidebar must inspect isApiDown')
      assert.ok(sidebarSource.includes('!isApiDown'), 'Sidebar search box must be conditioned on !isApiDown')
      assert.ok(sidebarSource.includes('API Server Offline'), 'Sidebar must notify user of API offline status')
    })

    test('Navbar.vue displays API Offline status badge', () => {
      assert.ok(navbarSource.includes('isApiDown'), 'Navbar must import and use isApiDown')
      assert.ok(navbarSource.includes("'API Offline'"), 'Navbar must show API Offline label')
    })

    test('Settings.vue includes dedicated API Offline Diagnostics Panel with Retry button', () => {
      assert.ok(settingsSource.includes('isApiDown'), 'Settings.vue must react to isApiDown')
      assert.ok(settingsSource.includes('apiErrorDetails'), 'Settings.vue must display apiErrorDetails')
      assert.ok(settingsSource.includes('handleRetryConnection') || settingsSource.includes('retryConnection'), 'Settings.vue must provide retry action')
      assert.ok(settingsSource.includes('Retry Connection'), 'Settings.vue must render a Retry Connection button')
    })
  })

  describe('HarmonyITC Team Credits & Trademark', () => {
    test('Settings.vue showcases HarmonyITC team members and roles', () => {
      assert.ok(settingsSource.includes('HarmonyITC'), 'Settings.vue must display HarmonyITC')
      assert.ok(settingsSource.includes('Paulo'), 'Settings.vue must credit Paulo')
      assert.ok(settingsSource.includes('Gene'), 'Settings.vue must credit Gene')
      assert.ok(settingsSource.includes('Bry'), 'Settings.vue must credit Bry')
      assert.ok(settingsSource.includes('Official Architecture'), 'Settings.vue must display official architecture badge')
      assert.ok(!settingsSource.includes('sendHarmonyPing'), 'Settings.vue must not have casual ping button')
    })

    test('Sidebar.vue includes subtle HarmonyITC trademark in footer', () => {
      assert.ok(sidebarSource.includes('HarmonyITC'), 'Sidebar.vue must include HarmonyITC')
      assert.ok(sidebarSource.includes('Crafted by'), 'Sidebar.vue must include Crafted by')
    })
  })
})

