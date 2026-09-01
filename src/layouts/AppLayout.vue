<template>
  <div class="app-shell d-flex bg-body-tertiary overflow-hidden position-relative sfa-tracker-layout-shell">
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
      <main class="flex-grow-1 overflow-y-auto p-3 p-md-4 p-lg-5 safe-area-inset sfa-tracker-layout-main">
        <router-view />
      </main>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Sidebar from '../components/Sidebar.vue'
import Navbar from '../components/Navbar.vue'
import Toast from 'primevue/toast'

const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')

watch(isSidebarCollapsed, (newVal) => {
  localStorage.setItem('sidebar_collapsed', String(newVal))
})

// The route guard runs outside any component, so it cannot call useToast()
// itself. It announces a denied navigation with this event, and the layout —
// which owns the <Toast /> outlet — says it to the user.
const toast = useToast()
const announceDenial = (detail) => {
  const menuName = detail?.menuName
  toast.add({
    severity: 'warn',
    summary: 'Access denied',
    detail: menuName
      ? `You don't have access to ${menuName}.`
      : "You don't have access to that screen.",
    life: 4000
  })
}
const onAccessDenied = (event) => {
  delete window.__pendingMenuDenial
  announceDenial(event?.detail)
}

onMounted(() => {
  window.addEventListener('menu-access-denied', onAccessDenied)
  // A denial on a typed URL happens while the app is still booting, before this
  // listener exists — the guard buffers it for exactly this moment.
  if (window.__pendingMenuDenial) {
    announceDenial(window.__pendingMenuDenial)
    delete window.__pendingMenuDenial
  }
})
onUnmounted(() => window.removeEventListener('menu-access-denied', onAccessDenied))
</script>
