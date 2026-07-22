<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">{{ title }}</h1>
        <p class="small text-secondary mt-1 mb-0">Manage {{ title }} records.</p>
      </div>
      <div>
        <Button 
          v-if="endpoint" 
          :label="`Create New ${title}`" 
          icon="pi pi-plus" 
          class="p-button-primary shadow-sm" 
          @click="openCreateModal" 
        />
      </div>
    </div>

    <!-- Data Viewer -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
      <DynamicApiTable ref="apiTableRef" v-if="endpoint" :endpoint="endpoint" :key="endpoint" class="m-3" :hide-create-button="true" />
      <div v-else class="p-4 text-center text-muted">Invalid Configuration</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import DynamicApiTable from '../components/DynamicApiTable.vue'

const route = useRoute()
const apiTableRef = ref(null)

// Map routes to their corresponding display titles and API endpoints
const routeMap = {
  '/lcp': { title: 'LCP', endpoint: 'Lcps' },
  '/lcnap': { title: 'LCNAP', endpoint: 'Lcpnaps' },
  '/lcnap_port': { title: 'LCNAP Port', endpoint: 'Lcpnapports' },
  '/nap': { title: 'NAP', endpoint: 'Naps' },
  '/port': { title: 'Port', endpoint: 'Ports' },
  '/vlan': { title: 'VLAN', endpoint: 'Vlans' },
  '/router': { title: 'Router', endpoint: 'Routers' },
  '/plan': { title: 'Plan', endpoint: 'Plans' },
  '/plans': { title: 'Plan', endpoint: 'Plans' },
  '/application': { title: 'Application', endpoint: 'Applications' },
  '/applications': { title: 'Application', endpoint: 'Applications' },
  '/user': { title: 'User', endpoint: 'Users' },
  '/users': { title: 'User', endpoint: 'Users' },
  '/menu': { title: 'Menu', endpoint: 'Menus' },
  '/access_level': { title: 'Access Level', endpoint: 'AccessLevel' },
  '/access_level_menu': { title: 'Access Level Menu', endpoint: 'AccessLevelMenu' },
  '/job_order': { title: 'Job Order', endpoint: 'JobOrders' },
  '/invoice': { title: 'Invoice', endpoint: 'BillingStatements' },
  '/billing': { title: 'Billing', endpoint: 'BillingDetails' },
}

const config = computed(() => routeMap[route.path] || { title: 'Unknown', endpoint: null })
const title = computed(() => config.value.title)
const endpoint = computed(() => config.value.endpoint)

const openCreateModal = () => {
  if (apiTableRef.value) {
    apiTableRef.value.openCreateDialog()
  }
}
</script>
