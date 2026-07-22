import { ref } from 'vue'

export const THEME_PALETTES = {
  red: {
    name: 'Crimson Red',
    primary: '#ef4444',
    hover: '#dc2626',
    active: '#b91c1c',
    rgb: '239, 68, 68',
    subtleBg: '#fef2f2',
    pdfRgb: [239, 68, 68]
  },
  green: {
    name: 'Emerald Green',
    primary: '#10b981',
    hover: '#059669',
    active: '#047857',
    rgb: '16, 185, 129',
    subtleBg: '#ecfdf5',
    pdfRgb: [16, 185, 129]
  },
  purple: {
    name: 'Royal Purple',
    primary: '#7c3aed',
    hover: '#6d28d9',
    active: '#5b21b6',
    rgb: '124, 58, 237',
    subtleBg: '#f5f3ff',
    pdfRgb: [124, 58, 237]
  },
  blue: {
    name: 'Ocean Blue',
    primary: '#0284c7',
    hover: '#0369a1',
    active: '#075985',
    rgb: '2, 132, 199',
    subtleBg: '#f0f9ff',
    pdfRgb: [2, 132, 199]
  },
  orange: {
    name: 'Sunset Orange',
    primary: '#ea580c',
    hover: '#c2410c',
    active: '#9a3412',
    rgb: '234, 88, 12',
    subtleBg: '#fff7ed',
    pdfRgb: [234, 88, 12]
  },
  slate: {
    name: 'Slate Gray',
    primary: '#475569',
    hover: '#334155',
    active: '#1e293b',
    rgb: '71, 85, 105',
    subtleBg: '#f8fafc',
    pdfRgb: [71, 85, 105]
  }
}

const isDark = ref(false)
const activeColorTheme = ref('green')

if (typeof localStorage !== 'undefined') {
  activeColorTheme.value = localStorage.getItem('switchfiber_color_theme') || 'green'
}

function applyColorTheme(themeKey) {
  const palette = THEME_PALETTES[themeKey] || THEME_PALETTES.green
  activeColorTheme.value = themeKey
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('switchfiber_color_theme', themeKey)
  }

  if (typeof document !== 'undefined') {
    const root = document.documentElement
    root.style.setProperty('--color-primary', palette.primary)
    root.style.setProperty('--color-primary-dark', palette.hover)

    root.style.setProperty('--bs-primary', palette.primary)
    root.style.setProperty('--bs-primary-rgb', palette.rgb)
    root.style.setProperty('--bs-primary-hover', palette.hover)
    root.style.setProperty('--bs-primary-active', palette.active)
    root.style.setProperty('--bs-primary-bg-subtle', palette.subtleBg)

    root.style.setProperty('--p-primary-color', palette.primary)
    root.style.setProperty('--p-primary-hover-color', palette.hover)
    root.style.setProperty('--p-primary-active-color', palette.active)

    root.style.setProperty('--theme-primary', palette.primary)
    root.style.setProperty('--theme-primary-hover', palette.hover)
    root.style.setProperty('--theme-row-highlight', palette.primary)
    root.style.setProperty('--theme-row-hover', `rgba(${palette.rgb}, 0.08)`)
    root.setAttribute('data-color-theme', themeKey)
  }
}

// Initial application
if (typeof document !== 'undefined') {
  isDark.value = document.documentElement.classList.contains('dark') || (typeof localStorage !== 'undefined' && localStorage.theme === 'dark')
  applyColorTheme(activeColorTheme.value)
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
  }

  const setColorTheme = (themeKey) => {
    applyColorTheme(themeKey)
  }

  return { 
    isDark, 
    toggleTheme, 
    activeColorTheme, 
    setColorTheme, 
    THEME_PALETTES 
  }
}
