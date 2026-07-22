<template>
  <div class="d-flex align-items-center gap-2">
    <!-- Color Theme Selector Dropdown -->
    <div class="dropdown">
      <button 
        class="btn btn-sm btn-light border rounded-pill d-flex align-items-center gap-2 px-2 py-1 shadow-sm" 
        type="button" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
        title="Select Main Theme Color"
      >
        <span 
          class="rounded-circle d-inline-block border border-white" 
          :style="{ width: '16px', height: '16px', backgroundColor: THEME_PALETTES[activeColorTheme]?.primary || '#10b981' }"
        ></span>
        <span class="small fw-semibold text-body d-none d-lg-inline pe-1">
          {{ THEME_PALETTES[activeColorTheme]?.name || 'Emerald Green' }}
        </span>
        <i class="pi pi-chevron-down text-secondary" style="font-size: 0.7rem;"></i>
      </button>

      <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 p-2 mt-1" style="min-width: 170px; z-index: 1060;">
        <li class="dropdown-header text-uppercase small fw-bold text-secondary px-2 py-1" style="font-size: 0.65rem; letter-spacing: 0.05em;">
          Theme Color
        </li>
        <li v-for="(palette, key) in THEME_PALETTES" :key="key">
          <button 
            class="dropdown-item d-flex align-items-center gap-2 rounded-2 py-1 px-2 small"
            :class="{ 'fw-bold bg-body-tertiary': activeColorTheme === key }"
            @click="setColorTheme(key)"
          >
            <span 
              class="rounded-circle d-inline-block border" 
              :style="{ width: '14px', height: '14px', backgroundColor: palette.primary }"
            ></span>
            <span class="text-body">{{ palette.name }}</span>
            <i v-if="activeColorTheme === key" class="pi pi-check ms-auto text-primary small"></i>
          </button>
        </li>
      </ul>
    </div>

    <!-- Light/Dark Mode Toggle -->
    <button 
      @click="toggleTheme" 
      class="btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm border"
      :class="isDark ? 'btn-dark' : 'btn-light'"
      style="width: 36px; height: 36px; transition: transform 0.2s;"
      aria-label="Toggle Dark Mode"
      title="Toggle Dark Mode"
    >
      <i :class="isDark ? 'pi pi-sun text-warning' : 'pi pi-moon text-secondary'" class="fs-6"></i>
    </button>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme, activeColorTheme, setColorTheme, THEME_PALETTES } = useTheme()
</script>
