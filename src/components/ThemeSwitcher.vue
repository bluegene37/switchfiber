<template>
  <button 
    @click="toggleTheme" 
    class="btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm"
    :class="isDark ? 'btn-dark' : 'btn-light'"
    style="width: 40px; height: 40px; transition: transform 0.3s;"
    onmouseover="this.style.transform='scale(1.1)'"
    onmouseout="this.style.transform='scale(1)'"
    aria-label="Toggle Theme"
  >
    <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="fs-5"></i>
  </button>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>
