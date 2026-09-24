// The logged-in session follows the server's CURRENT access level.
//
// The stored user is a login-time snapshot: before this, changing a user's
// access level on the User screen changed nothing for their running session —
// through any number of reloads — until they logged out. Proven live on
// 2026-09-01: a session frozen at Guest (11) for a user whose row said Super
// Admin (3) kept the Guest fallback menu across a full reload. Now every
// permission load re-reads /Users/{id} first and adopts a changed level, and
// saving the logged-in user's own row re-runs the pipeline immediately.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')
const authSource = read('src/stores/auth.js')
const permissionsSource = read('src/composables/usePermissions.js')
const tableSource = read('src/components/DynamicApiTable.vue')

describe('Session adopts the server access level', () => {
  test('every permission load re-reads the user row before resolving the level', () => {
    assert.ok(
      permissionsSource.includes('const refreshUserFromServer = async ()'),
      'usePermissions must own the refresh'
    )
    const runFetchAt = permissionsSource.indexOf('await refreshUserFromServer()')
    const resolveAt = permissionsSource.indexOf('await resolveLevelName()')
    assert.ok(runFetchAt > -1, 'runFetch must refresh the user first')
    assert.ok(
      runFetchAt < resolveAt,
      'The level NAME must be resolved from the refreshed id, not the login-time one'
    )
  })

  test('a changed level clears the stale role fields before re-resolving', () => {
    // The old role/accessLevelName belong to the old level; the super-admin
    // check must not answer from them while the new name loads.
    assert.ok(permissionsSource.includes("resolvedLevelName.value = ''"))
    assert.ok(permissionsSource.includes('role: undefined, accessLevelName: undefined'))
  })

  test('a failed read keeps the snapshot instead of demoting the user', () => {
    const fn = permissionsSource.slice(
      permissionsSource.indexOf('const refreshUserFromServer'),
      permissionsSource.indexOf('let pendingFetch')
    )
    assert.ok(/catch\s*\{/.test(fn), 'The refresh must swallow a fetch failure')
    assert.ok(
      fn.includes('fresh > 0 && fresh !== Number('),
      'Only a real, different level may be adopted — a 404 or junk row must change nothing'
    )
  })

  test('the auth store patch re-persists to the storage that holds the session', () => {
    assert.ok(authSource.includes('const updateUser = (fields)'))
    assert.ok(
      authSource.includes("localStorage.getItem('user') ? localStorage : sessionStorage"),
      'A rememberMe session lives in localStorage, a plain one in sessionStorage — patch the right one'
    )
    assert.ok(
      /return \{[^}]*updateUser[^}]*\}/s.test(authSource),
      'updateUser must be exposed on the store'
    )
  })

  test('saving your own User row takes effect without a logout', () => {
    assert.ok(
      tableSource.includes("new CustomEvent('current-user-updated'"),
      'The Users save path must announce a save of the logged-in user'
    )
    assert.ok(
      tableSource.includes('isUserEndpoint.value && Number(updatedId) === Number(authStore.user?.id'),
      'Only the logged-in user’s OWN row triggers it — editing someone else must not'
    )
    assert.ok(
      permissionsSource.includes("window.addEventListener('current-user-updated'"),
      'usePermissions must listen and re-run the pipeline'
    )
  })
})
