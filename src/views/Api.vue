<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">API Data Viewer</h1>
        <p class="small text-secondary mt-1 mb-0">Live data fetched dynamically from all backend endpoints.</p>
      </div>
    </div>

    <!-- Tabbed Data Viewer -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
      <Tabs v-model:value="activeTab">
        <TabList class="bg-body-tertiary border-bottom overflow-x-auto text-nowrap p-0 m-0">
          <Tab v-for="endpoint in endpoints" :key="endpoint" :value="endpoint" class="px-4 py-3 small fw-medium">
            {{ endpoint }}
          </Tab>
        </TabList>
      </Tabs>
      
      <!-- A single table that gets completely destroyed and recreated when activeTab changes -->
      <DynamicApiTable :endpoint="activeTab" :key="activeTab" class="m-3" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DynamicApiTable from '../components/DynamicApiTable.vue'

const endpoints = ref([
  'Applications',
  'BillingDetails',
  'JobOrders',
  'Lcpnapports',
  'Lcpnaps',
  'Lcps',
  'Naps',
  'Plans',
  'Ports',
  'Routers',
  'Vlans'
])

// Set the first endpoint as the default active tab
const activeTab = ref(endpoints.value[0])
</script>
