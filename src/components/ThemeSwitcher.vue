<template>
  <div class="d-flex align-items-center gap-2 sfa-tracker-theme-switcher">
    <!-- Light/Dark Mode Toggle -->
    <button 
      @click="toggleTheme" 
      class="btn btn-sm rounded-3 d-flex align-items-center justify-content-center p-0 shadow-sm border sfa-tracker-theme-switcher-btn"
      :class="isDark ? 'btn-dark' : 'btn-light'"
      style="width: 36px; height: 36px; transition: transform 0.2s;"
      aria-label="Toggle Dark Mode"
      :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    >
      <i :class="isDark ? 'pi pi-sun text-warning' : 'pi pi-moon text-secondary'" class="fs-6"></i>
    </button>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme, activeColorTheme, setColorTheme, THEME_PALETTES } = useTheme()
</script>
