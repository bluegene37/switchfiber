<template>
  <div class="app-shell d-flex bg-body-tertiary overflow-hidden position-relative">
    <!-- Sidebar -->
    <Sidebar 
      :is-open="isSidebarOpen" 
      :is-collapsed="isSidebarCollapsed"
      @close="isSidebarOpen = false" 
      @toggle-collapse="isSidebarCollapsed = !isSidebarCollapsed"
    />
    
    <!-- Main Content Wrapper -->
    <div class="flex-grow-1 d-flex flex-column min-w-0 overflow-hidden">
      <!-- Top Navbar -->
      <Navbar 
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen" 
        @toggle-collapse="isSidebarCollapsed = !isSidebarCollapsed"
        :is-collapsed="isSidebarCollapsed"
        :is-open="isSidebarOpen"
      />
      
      <!-- Main Content -->
      <main class="flex-grow-1 overflow-y-auto p-3 p-md-4 p-lg-5 safe-area-inset">
        <router-view />
      </main>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import Navbar from '../components/Navbar.vue'
import Toast from 'primevue/toast'

const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')

watch(isSidebarCollapsed, (newVal) => {
  localStorage.setItem('sidebar_collapsed', String(newVal))
})
</script>
