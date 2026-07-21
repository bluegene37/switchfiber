<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">{{ title }}</h1>
        <p class="small text-secondary mt-1 mb-0">Manage {{ title }} records.</p>
      </div>
    </div>

    <!-- Data Viewer -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
      <DynamicApiTable v-if="endpoint" :endpoint="endpoint" :key="endpoint" class="m-3" />
      <div v-else class="p-4 text-center text-muted">Invalid Configuration</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DynamicApiTable from '../components/DynamicApiTable.vue'

const route = useRoute()

// Map routes to their corresponding display titles and API endpoints
const routeMap = {
  '/lcp': { title: 'LCP', endpoint: 'Lcps' },
  '/lcnap': { title: 'LCNAP', endpoint: 'Lcpnaps' },
  '/lcnap_port': { title: 'LCNAP Port', endpoint: 'Lcpnapports' },
  '/nap': { title: 'NAP', endpoint: 'Naps' },
  '/port': { title: 'Port', endpoint: 'Ports' },
  '/vlan': { title: 'VLAN', endpoint: 'Vlans' },
  '/router': { title: 'Router', endpoint: 'Routers' },
}

const config = computed(() => routeMap[route.path] || { title: 'Unknown', endpoint: null })
const title = computed(() => config.value.title)
const endpoint = computed(() => config.value.endpoint)
</script>
