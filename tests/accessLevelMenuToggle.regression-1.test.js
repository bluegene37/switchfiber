// Regression: the Menu List permission toggle flipped back on its own.
//
// isMenuLinked had grown a name-inference branch: a row counted as linked when
// ANY granted relation pointed at a *different* menu row whose name resolved to
// an overlapping catalog code. Because resolveMenuCodesFromName expands a parent
// into its children, granting "All Job Orders" alone rendered "Job Orders In
// Progress" and "Job Orders Completed" as ON. Clicking one off took the unlink
// branch, found no relation row carrying that menu id, ran a DELETE whose
// rejection was swallowed by .catch(() => null), refetched, re-inferred ON — and
// the switch snapped back under a green "Permission Unlinked" toast.
//
// Display state and the write path now key off the same thing: the row's own id.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveMenuCodesFromName, isSuperAdminName } from '../src/constants/menuCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const source = fs.readFileSync(
  path.resolve(__dirname, '../src/components/DynamicApiTable.vue'),
  'utf8'
)

/** The body of a top-level `const <name> = (...) => { ... }` in the SFC. */
const bodyOf = (name) => {
  let start = source.indexOf(`const ${name} = (`)
  if (start === -1) start = source.indexOf(`const ${name} = async (`)
  assert.notEqual(start, -1, `${name} is missing from DynamicApiTable.vue`)
  const end = source.indexOf('\n}', start)
  assert.notEqual(end, -1, `could not find the end of ${name}`)
  return source.slice(start, end)
}

// isMenuLinked as the component now defines it: id-based only.
const makeIsMenuLinked = (grantedMenuIds) => (menuRow) => {
  const linked = new Set(grantedMenuIds.map(String))
  const targetMenuId = String(menuRow.id ?? menuRow.ID ?? menuRow.menuId ?? '').trim()
  if (!targetMenuId) return false
  return linked.has(targetMenuId)
}

describe('Access Level menu toggle (regression: switch snaps back)', () => {
  test('the shared catalog code that made inference unsafe still exists', () => {
    // This is the trap, not a bug: these two DISTINCT menu rows legitimately
    // share a code, so any name-based inference conflates them. The guard below
    // matters precisely because this overlap is real.
    const parent = resolveMenuCodesFromName('All Job Orders')
    const child = resolveMenuCodesFromName('Job Orders In Progress')
    const shared = child.filter((c) => parent.includes(c))
    assert.ok(
      shared.length > 0,
      'expected "All Job Orders" and "Job Orders In Progress" to share a code'
    )
  })

  test('a row with no relation of its own reads as unlinked', () => {
    const isMenuLinked = makeIsMenuLinked([32]) // only "All Job Orders" granted
    assert.equal(isMenuLinked({ id: 32, name: 'All Job Orders' }), true)
    assert.equal(
      isMenuLinked({ id: 33, name: 'Job Orders In Progress' }), false,
      'a sibling row must not read as linked off the parent grant — this is the snap-back'
    )
    assert.equal(isMenuLinked({ id: 34, name: 'Job Orders Completed' }), false)
    assert.equal(
      isMenuLinked({ id: 26, name: 'In Progress' }), false,
      '"In Progress" resolves under both Application and Job Orders — it must not inherit either'
    )
  })

  test('a catalog placeholder row (id null) is never linked', () => {
    // No /api/Menus row exists yet, so no grant can exist. Toggling it on
    // creates the menu row first; after that it matches by id like any other.
    const isMenuLinked = makeIsMenuLinked([32])
    assert.equal(isMenuLinked({ id: null, name: 'Job Orders In Progress' }), false)
  })

  test('isMenuLinked does not infer link state from menu names', () => {
    const body = bodyOf('isMenuLinked')
    assert.ok(
      !body.includes('resolveMenuCodesFromName'),
      'isMenuLinked must not resolve names — display state has to key off the same id the writes use'
    )
    assert.ok(
      body.includes('activeLinkedMenuIds'),
      'isMenuLinked must read the real AccesslevelMenu relations'
    )
  })

  test('the unlink fallback surfaces failures instead of swallowing them', () => {
    assert.ok(
      !/AccesslevelMenu\/\$\{targetAccId\}\/\$\{targetMenuId\}`\)\.catch\(\(\) => null\)/.test(source),
      'a swallowed DELETE is what let a failed unlink report success'
    )
  })

  test('Super Admin is the only level whose menus are locked', () => {
    assert.equal(isSuperAdminName('Super Admin'), true)
    assert.equal(isSuperAdminName('super-admin'), true, 'casing and punctuation must not matter')
    assert.equal(isSuperAdminName('SUPERADMIN'), true)

    // Every other level is granted menu by menu, so its switches stay live.
    for (const name of ['Developer', 'Supervisor', 'Billing Supervisor', 'Superintendent', 'Guest']) {
      assert.equal(
        isSuperAdminName(name), false,
        `"${name}" must not be treated as Super Admin — a substring match locked it out of its own permissions`
      )
    }
  })

  test('the grid locks by strict name, never by a hardcoded access level id', () => {
    const body = bodyOf('isSuperAdminAccessLevelProtected')
    assert.ok(body.includes('isSuperAdminName'), 'the lock must use the strict Super Admin name test')
    assert.ok(
      !/targetAccId === \d/.test(body),
      'Super Admin sat at id 1 before a re-seed and at id 3 after — ids must not gate the lock'
    )
  })

  test('a locked row explains itself when clicked', () => {
    // The switch is disabled, so it dispatches no click of its own: without the
    // wrapper handler the row is dead with no message.
    assert.ok(
      source.includes('@click="explainLockedMenuToggle"'),
      'the toggle wrapper must handle the click that the disabled switch cannot'
    )
    assert.ok(
      source.includes('.menu-toggle-locked :deep(.p-toggleswitch)'),
      'the locked switch must drop pointer events so the wrapper receives the click'
    )
    const body = bodyOf('explainLockedMenuToggle')
    assert.match(body, /Super Admin/, 'the message must name Super Admin as the reason')
  })

  test('a failed link rolls back the menu row it just created', () => {
    // POST /api/AccesslevelMenu currently 500s for every payload, so without a
    // rollback each attempt stranded a menu nothing referenced. Ids 45-49 in the
    // live database were created exactly this way.
    const body = bodyOf('toggleMenuLink')
    assert.ok(body.includes('createdMenuId = newId'), 'a self-created menu row must be tracked')
    assert.ok(
      /if \(createdMenuId\)[\s\S]*apiClient\.delete\(`\/Menus\/\$\{createdMenuId\}`\)/.test(source),
      'the catch must delete a menu row this call created, so a failed toggle changes nothing'
    )
  })

  test('unlink never invents a composite delete route', () => {
    // The API deletes a relation only by its own row id. There is no
    // /AccesslevelMenu/{accessLevelId}/{menuId} route to fall back on.
    assert.ok(
      !/AccesslevelMenu\/\$\{targetAccId\}\/\$\{targetMenuId\}/.test(source),
      'the composite delete route does not exist in the API contract'
    )
  })

  test('a server-side failure is reported as a server fault', () => {
    const body = bodyOf('toggleMenuLink')
    assert.ok(body.includes('status >= 500'), 'a 5xx must be distinguished from a client-side error')
    assert.match(body, /nothing was changed/, 'the message must tell the user no data changed')
  })

  test('the in-flight guard and the write path derive the same key', () => {
    assert.ok(
      source.includes('togglingMenuId.value = menuToggleKey(menuRow)'),
      'the write path must set the guard key via menuToggleKey'
    )
    assert.ok(
      bodyOf('isToggleSwitchDisabled').includes('menuToggleKey(menuRow)'),
      'the disabled check must read the guard key via menuToggleKey'
    )
  })
})
