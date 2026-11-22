// Gene - Nov, 22, 2026: Regression suite ensuring pre-mount and post-mount initial page loaders appear while booting or resolving routes
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8')
const authLayout = fs.readFileSync(path.join(rootDir, 'src/layouts/AuthLayout.vue'), 'utf8')

describe('Initial Page Loader (Pre-mount & Post-mount)', () => {
  test('index.html renders a pre-mount theme-aware loader inside #app', () => {
    assert.match(indexHtml, /<div id="app">[\s\S]*class="sfa-initial-loader"/, '#app must contain .sfa-initial-loader')
    assert.ok(indexHtml.includes('role="status"'), 'Pre-mount loader must include role="status"')
    assert.ok(indexHtml.includes('aria-live="polite"'), 'Pre-mount loader must include aria-live="polite"')
    assert.ok(indexHtml.includes('aria-busy="true"'), 'Pre-mount loader must include aria-busy="true"')
    assert.ok(indexHtml.includes('html.dark .sfa-initial-loader'), 'Pre-mount loader must support html.dark selector')
    assert.ok(
      indexHtml.includes('html[data-bs-theme="dark"] .sfa-initial-loader'),
      'Pre-mount loader must support html[data-bs-theme="dark"] selector'
    )
    assert.ok(indexHtml.includes('@keyframes sfa-initial-spin'), 'Pre-mount loader must define spinner keyframe')
    assert.ok(
      indexHtml.includes('@media (prefers-reduced-motion: reduce)'),
      'Pre-mount loader must respect prefers-reduced-motion'
    )
  })

  test('AuthLayout.vue keeps ThemeSwitcher and renders a centered loader while router-view Component is unresolved', () => {
    assert.ok(authLayout.includes('<ThemeSwitcher />'), 'AuthLayout must retain ThemeSwitcher')
    assert.match(
      authLayout,
      /<router-view\s+v-slot="\{\s*Component\s*\}"\s*>/,
      'AuthLayout must wrap router-view with v-slot="{ Component }"'
    )
    assert.match(
      authLayout,
      /<component\s+v-if="Component"\s+:is="Component"\s*\/>/,
      'AuthLayout must render resolved route component when Component is present'
    )
    assert.ok(
      authLayout.includes('sfa-tracker-auth-layout-loader'),
      'AuthLayout must render .sfa-tracker-auth-layout-loader fallback when Component is null'
    )
    assert.ok(authLayout.includes('spinner-border'), 'AuthLayout fallback loader must render .spinner-border')
    assert.ok(authLayout.includes('role="status"'), 'AuthLayout fallback loader must include role="status"')
    assert.ok(authLayout.includes('aria-live="polite"'), 'AuthLayout fallback loader must include aria-live="polite"')
    assert.ok(authLayout.includes('aria-busy="true"'), 'AuthLayout fallback loader must include aria-busy="true"')
    assert.ok(
      authLayout.includes('import.meta.env.BASE_URL'),
      'AuthLayout must resolve logoUrl using import.meta.env.BASE_URL'
    )
  })
})
