<template>
  <div class="d-flex vh-100 bg-body-tertiary overflow-hidden position-relative">
    <!-- Sidebar -->
    <Sidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />
    
    <!-- Main Content Wrapper -->
    <div class="flex-grow-1 d-flex flex-column min-w-0 overflow-hidden">
      <!-- Top Navbar -->
      <Navbar @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      
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
</script>
