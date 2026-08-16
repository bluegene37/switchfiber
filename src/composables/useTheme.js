import { ref } from 'vue'

/**
 * =========================================================================
 * 🎨 MASTER THEME COLOR CONFIGURATION (SINGLE SOURCE OF TRUTH)
 * =========================================================================
 * Change the hex color code below to explore or update the primary theme color.
 * Changing this single hex value automatically updates ALL buttons, icons, 
 * highlights, tables, badges, hover states, active states, focus rings, and PDF exports!
 */
export const MASTER_THEME_COLOR = '#e74c5a' // SwitchFiber Primary Brand Hex Code
// export const MASTER_THEME_COLOR = '#FFE4E6' // SwitchFiber Primary Brand Hex Code

function hexToRgbValues(hex) {
  let c = (hex || '#e74c5a').replace('#', '')
  if (c.length === 3) c = c.split('').map(x => x + x).join('')
  const num = parseInt(c, 16) || 0
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function adjustColorBrightness(hex, percent) {
  const [r, g, b] = hexToRgbValues(hex)
  const clamp = x => Math.min(255, Math.max(0, Math.round(x)))
  const factor = 1 + percent / 100
  const toHex = x => clamp(x).toString(16).padStart(2, '0')
  return `#${toHex(r * factor)}${toHex(g * factor)}${toHex(b * factor)}`
}

// Blend a colour toward a target by `ratio` (0 = untouched, 1 = fully the target).
// Tints and shades built this way keep the theme's hue, which brightness scaling
// alone cannot do: multiplying a saturated hue never reaches a pale wash.
function mixColor(hex, targetHex, ratio) {
  const [r, g, b] = hexToRgbValues(hex)
  const [tr, tg, tb] = hexToRgbValues(targetHex)
  const toHex = x => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, '0')
  return `#${toHex(r + (tr - r) * ratio)}${toHex(g + (tg - g) * ratio)}${toHex(b + (tb - b) * ratio)}`
}

export function buildPaletteFromHex(hex, name = 'SwitchFiber Theme') {
  const [r, g, b] = hexToRgbValues(hex)
  const hover = adjustColorBrightness(hex, -10)
  const active = adjustColorBrightness(hex, -20)
  return {
    name,
    primary: hex,
    hover,
    active,
    rgb: `${r}, ${g}, ${b}`,
    // Solid tints, matching the values style.css documents for the default rose.
    bgSubtle: mixColor(hex, '#ffffff', 0.93),
    borderSubtle: mixColor(hex, '#ffffff', 0.78),
    // Light wash used behind hovered table rows, per mode.
    rowHoverSolidLight: mixColor(hex, '#ffffff', 0.96),
    rowHoverSolidDark: mixColor(hex, '#15171a', 0.86),
    // Lifted variant that stays legible as text on a dark surface.
    onDark: mixColor(hex, '#ffffff', 0.35),
    subtleBg: `rgba(${r}, ${g}, ${b}, 0.08)`,
    pdfRgb: [r, g, b]
  }
}

/**
 * Categorical series colours for charts, stepped through the active brand hue
 * from a deep shade to a pale tint.
 *
 * Chart categories like plan tiers or node names carry no inherent meaning, so
 * they follow the theme instead of pulling in unrelated hues. Genuinely semantic
 * series — success / warning / danger — keep their own fixed colours and must not
 * use this ramp.
 */
export function buildCategoricalRamp(hex, steps = 5) {
  if (steps <= 1) return [hex]
  const ramp = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const distance = Math.abs(t - 0.5) * 1.1
    ramp.push(mixColor(hex, t < 0.5 ? '#2a0d11' : '#ffffff', distance))
  }
  return ramp
}

export const THEME_PALETTES = {
  red: buildPaletteFromHex(MASTER_THEME_COLOR, 'SwitchFiber Warm Rose'),
  green: buildPaletteFromHex('#10b981', 'Emerald Green'),
  purple: buildPaletteFromHex('#7c3aed', 'Royal Purple'),
  blue: buildPaletteFromHex('#0284c7', 'Ocean Blue'),
  orange: buildPaletteFromHex('#ea580c', 'Sunset Orange'),
  slate: buildPaletteFromHex('#475569', 'Slate Gray')
}

const isDark = ref(false)
const activeColorTheme = ref('red')

function applyColorTheme(themeKeyOrHex) {
  let palette
  if (THEME_PALETTES[themeKeyOrHex]) {
    palette = THEME_PALETTES[themeKeyOrHex]
  } else if (typeof themeKeyOrHex === 'string' && themeKeyOrHex.startsWith('#')) {
    palette = buildPaletteFromHex(themeKeyOrHex, 'Custom Hex Theme')
  } else {
    palette = buildPaletteFromHex(MASTER_THEME_COLOR, 'SwitchFiber Warm Rose')
  }

  activeColorTheme.value = themeKeyOrHex || 'red'

  if (typeof document !== 'undefined') {
    const root = document.documentElement
    root.style.setProperty('--color-primary', palette.primary)
    root.style.setProperty('--color-primary-dark', palette.hover)

    root.style.setProperty('--bs-primary', palette.primary)
    root.style.setProperty('--bs-primary-rgb', palette.rgb)
    root.style.setProperty('--bs-primary-hover', palette.hover)
    root.style.setProperty('--bs-primary-active', palette.active)
    root.style.setProperty('--bs-primary-bg-subtle', palette.bgSubtle)
    // Previously left at the static rose value, so every subtle border kept the
    // old hue after a theme switch.
    root.style.setProperty('--bs-primary-border-subtle', palette.borderSubtle)
    root.style.setProperty('--bs-link-color-rgb', palette.rgb)
    root.style.setProperty('--theme-primary-on-dark', palette.onDark)

    root.style.setProperty('--p-primary-color', palette.primary)
    root.style.setProperty('--p-primary-hover-color', palette.hover)
    root.style.setProperty('--p-primary-active-color', palette.active)

    root.style.setProperty('--theme-primary', palette.primary)
    root.style.setProperty('--theme-primary-hover', palette.hover)
    root.style.setProperty('--theme-row-highlight', palette.primary)
    root.style.setProperty('--theme-row-hover', `rgba(${palette.rgb}, 0.08)`)
    root.style.setProperty('--theme-row-hover-solid', isDark.value ? palette.rowHoverSolidDark : palette.rowHoverSolidLight)
    root.setAttribute('data-color-theme', typeof themeKeyOrHex === 'string' ? themeKeyOrHex : 'red')
  }
}

// Initial application
if (typeof document !== 'undefined') {
  isDark.value = document.documentElement.classList.contains('dark') || (typeof localStorage !== 'undefined' && localStorage.theme === 'dark')
  applyColorTheme(MASTER_THEME_COLOR)
}

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-bs-theme', 'dark')
      localStorage.theme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.removeAttribute('data-bs-theme')
      localStorage.theme = 'light'
    }
    // Some tokens (the solid row-hover wash) resolve differently per mode, and
    // were previously fixed at whatever mode was active on first load.
    applyColorTheme(activeColorTheme.value)
  }

  const setColorTheme = (themeKeyOrHex) => {
    applyColorTheme(themeKeyOrHex)
  }

  return {
    isDark,
    toggleTheme,
    activeColorTheme,
    setColorTheme,
    THEME_PALETTES,
    MASTER_THEME_COLOR,
    buildPaletteFromHex
  }
}
