<template>
  <div class="position-relative min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center p-4">
    <div class="position-absolute top-0 end-0 p-3 p-sm-4">
      <ThemeSwitcher />
    </div>
    
    <router-view />
  </div>
</template>

<script setup>
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
</script>
