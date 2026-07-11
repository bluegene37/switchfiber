import { ref } from 'vue'

// Global state so it's synced across components
const isDark = ref(false)

if (typeof document !== 'undefined') {
  isDark.value = document.documentElement.classList.contains('dark')
}

export function useTheme() {
  const toggleTheme = () => {
    // Toggle the HTML class for PrimeVue v4 styled mode and Bootstrap 5
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

  return { isDark, toggleTheme }
}
