<template>
  <div class="d-flex vh-100 bg-body-tertiary overflow-hidden position-relative">
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
      />
      
      <!-- Main Content -->
      <main class="flex-grow-1 overflow-y-auto p-3 p-md-4 p-lg-5">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import Navbar from '../components/Navbar.vue'

const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(false)
</script>
