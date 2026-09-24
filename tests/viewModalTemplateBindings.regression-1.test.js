// Regression: R-02 — the View Details modal crashed with
// "_ctx.formatViewFieldValue is not a function" for every record whose fields
// fell through to the plain InputText branch.
// Root cause: 2be810b renamed formatViewFieldValue(col, val) to
// formatDisplayValue(val, col) — argument order flipped too — but the view
// modal's binding was left pointing at the old name. `<script setup>` exposes
// only what it declares, so the template resolved it to undefined and Vue threw
// on render, which the error boundary showed as "Something went wrong".
// Nothing catches this at build time: a Vue template is not type-checked, so the
// second test below is the guard — every function a template calls must exist in
// that component's script.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src')
const tableFile = path.resolve(srcDir, 'components/DynamicApiTable.vue')

const vueFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return vueFiles(full)
    return entry.name.endsWith('.vue') ? [full] : []
  })

// Not functions the component has to declare: JS built-ins, the template's own
// globals, and CSS functions that show up inside :style bindings.
const NOT_COMPONENT_FUNCTIONS = new Set([
  'String', 'Number', 'Boolean', 'Array', 'Object', 'JSON', 'Math', 'Date',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent',
  'decodeURIComponent', 'RegExp', 'Set', 'Map', 'console', 'window', 'document',
  'localStorage', 'sessionStorage',
  '$emit', '$event', '$slots', '$refs', '$attrs',
  'var', 'calc', 'url', 'rgb', 'rgba', 'hsl', 'hsla', 'translate', 'translateX',
  'translateY', 'scale', 'rotate', 'bezier', 'linear', 'blur', 'Maps', 'Info', 'A'
])

const splitSfc = (source) => {
  const scriptAt = source.indexOf('<script')
  return scriptAt < 0
    ? { template: source, script: '' }
    : { template: source.slice(0, scriptAt), script: source.slice(scriptAt) }
}

// Every identifier the template calls as a function: `{{ foo(x) }}` and any
// bound attribute, handler or directive value. `a.method(x)` is the object's
// business, not the component's.
const templateCalls = (template) => {
  const calls = new Set()
  const expressions = /\{\{(.*?)\}\}|(?:v-[\w:.\-[\]]+|:[\w:.\-[\]]+|@[\w:.\-[\]]+)\s*=\s*"([^"]*)"/gs
  for (const match of template.matchAll(expressions)) {
    let expr = match[1] || match[2] || ''
    // Template-literal text is prose, not code: `Applications Trend (${x})`
    // must not read as a call to Trend(). Keep only the ${...} expressions.
    expr = expr.replace(/`([^`]*)`/g, (_, inner) =>
      [...inner.matchAll(/\$\{([^}]*)\}/g)].map(m => m[1]).join(' ; ')
    )
    for (const call of expr.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (/[.?]\s*$/.test(expr.slice(0, call.index))) continue
      calls.add(call[1])
    }
  }
  return calls
}

// Declared, destructured out of a composable, or imported — all three are ways a
// `<script setup>` binding legitimately reaches the template.
const isDeclaredInScript = (script, name) => {
  const n = name.replace(/[$]/g, '\\$&')
  return (
    new RegExp(`\\b(?:const|let|var|function)\\s+${n}\\b`).test(script) ||
    new RegExp(`^[^\\n]*[{,]\\s*${n}\\s*[,}]`, 'm').test(script) ||
    new RegExp(`import[^\\n]*\\b${n}\\b`).test(script) ||
    new RegExp(`\\b${n}\\s*:`).test(script)
  )
}

describe('View modal renders plain fields (regression R-02)', () => {
  const source = fs.readFileSync(tableFile, 'utf8')

  test('the dead formatViewFieldValue name is gone for good', () => {
    assert.ok(
      !source.includes('formatViewFieldValue'),
      'The function was renamed to formatDisplayValue; nothing may reference the old name'
    )
  })

  test('the fallback InputText calls formatDisplayValue with (value, column)', () => {
    assert.ok(
      source.includes('formatDisplayValue(viewFormData[col], col)'),
      'The view modal must format through the same helper the table cells use, value first'
    )
    assert.ok(
      !/formatDisplayValue\(\s*col\s*,/.test(source),
      'formatDisplayValue takes (val, col) — the reversed order silently formats the wrong thing'
    )
  })

  test('formatDisplayValue is declared and covers a missing value', () => {
    const declaration = source.match(/const formatDisplayValue = \(val, col\) => \{([\s\S]{0,200})/)
    assert.ok(declaration, 'formatDisplayValue must exist with the (val, col) signature')
    assert.ok(
      declaration[1].includes("return '-'"),
      'A null/empty field must still render a dash, as the old helper did'
    )
  })
})

describe('No template calls a function its script does not define', () => {
  test('every .vue component resolves its own template calls', () => {
    const missing = []
    for (const file of vueFiles(srcDir)) {
      const { template, script } = splitSfc(fs.readFileSync(file, 'utf8'))
      for (const name of templateCalls(template)) {
        if (NOT_COMPONENT_FUNCTIONS.has(name)) continue
        if (isDeclaredInScript(script, name)) continue
        missing.push(`${path.relative(srcDir, file)}: ${name}()`)
      }
    }
    assert.deepEqual(
      missing,
      [],
      'A template calling an undefined function throws at render time and the ' +
      'error boundary swallows it into "Something went wrong". Rename both sides, ' +
      'or add a genuine non-component global to NOT_COMPONENT_FUNCTIONS.'
    )
  })

  test('the guard would have caught the original bug', () => {
    const broken = `
      <template>
        <InputText :modelValue="formatViewFieldValue(col, viewFormData[col])" />
      </template>
      <script setup>
      const formatDisplayValue = (val, col) => String(val)
      </script>
    `
    const { template, script } = splitSfc(broken)
    assert.ok(templateCalls(template).has('formatViewFieldValue'))
    assert.equal(isDeclaredInScript(script, 'formatViewFieldValue'), false)
    assert.equal(isDeclaredInScript(script, 'formatDisplayValue'), true)
  })
})
