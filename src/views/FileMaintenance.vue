<template>
  <div class="d-flex flex-column gap-4 sfa-tracker-file-maintenance">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 sfa-tracker-file-maintenance-header">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">{{ title }}</h1>
        <p class="small text-secondary mt-1 mb-0">{{ description }}</p>
      </div>
    </div>

    <!-- Data Viewer -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 sfa-tracker-file-maintenance-table-card">
      <DynamicApiTable
        ref="apiTableRef"
        v-if="endpoint"
        :endpoint="endpoint"
        :key="endpoint"
        :read-only="readOnly"
        :hide-create-button="readOnly"
        :create-button-label="`Create ${title}`"
      />
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

// Map routes to their corresponding display titles, API endpoints, icons, and detailed header descriptions
const routeMap = {
  '/lcp': { 
    title: 'LCP', 
    endpoint: 'Lcps', 
    icon: 'pi-server', 
    description: 'Manage Local Convergence Point (LCP) cabinets, primary fiber distribution hubs, and outdoor node enclosures.' 
  },
  '/lcnap': { 
    title: 'LCNAP', 
    endpoint: 'Lcpnaps', 
    icon: 'pi-sitemap', 
    description: 'Manage Local Convergence Network Access Point (LCNAP) distribution splitters and feeder line connections.' 
  },
  '/lcnap_port': { 
    title: 'LCNAP Port', 
    endpoint: 'Lcpnapports', 
    icon: 'pi-share-alt', 
    description: 'Track LCNAP port assignments, optical split ratios, port capacity availability, and feeder line bindings.' 
  },
  '/nap': { 
    title: 'NAP', 
    endpoint: 'Naps', 
    icon: 'pi-box', 
    description: 'Manage Network Access Point (NAP) distribution boxes, subscriber drop-cable termination points, and splitters.' 
  },
  '/port': { 
    title: 'Port', 
    endpoint: 'Ports', 
    icon: 'pi-link', 
    description: 'Monitor physical and logical fiber optic port allocations, connection statuses, and capacity tracking.' 
  },
  '/vlan': { 
    title: 'VLAN', 
    endpoint: 'Vlans', 
    icon: 'pi-globe', 
    description: 'Configure Virtual Local Area Network (VLAN) segment IDs, subnet IP bindings, and traffic isolation settings.' 
  },
  '/router': { 
    title: 'Router', 
    endpoint: 'Routers', 
    icon: 'pi-wifi', 
    description: 'Manage core and edge router hardware inventory, IP address allocations, gateway settings, and ONT modems.' 
  },
  '/plan': { 
    title: 'Plan', 
    endpoint: 'Plans', 
    icon: 'pi-tag', 
    description: 'Define subscriber broadband Internet packages, download/upload bandwidth speeds, and monthly pricing tiers.' 
  },
  '/plans': { 
    title: 'Plan', 
    endpoint: 'Plans', 
    icon: 'pi-tag', 
    description: 'Define subscriber broadband Internet packages, download/upload bandwidth speeds, and monthly pricing tiers.' 
  },
  '/application': { 
    title: 'All Application', 
    endpoint: 'Applications', 
    icon: 'pi-file', 
    description: 'Process customer subscription applications, service installation requests, and subscriber onboarding documents.' 
  },
  '/applications': { 
    title: 'All Application', 
    endpoint: 'Applications', 
    icon: 'pi-file', 
    description: 'Process customer subscription applications, service installation requests, and subscriber onboarding documents.' 
  },
  '/application_list': { 
    title: 'All Application', 
    endpoint: 'Applications', 
    icon: 'pi-file', 
    description: 'Process customer subscription applications, service installation requests, and subscriber onboarding documents.' 
  },
  '/user': { 
    title: 'User', 
    endpoint: 'Users', 
    icon: 'pi-user', 
    description: 'Manage system user accounts, login credentials, assigned access roles, profiles, and administrative permissions.' 
  },
  '/users': { 
    title: 'User', 
    endpoint: 'Users', 
    icon: 'pi-user', 
    description: 'Manage system user accounts, login credentials, assigned access roles, profiles, and administrative permissions.' 
  },
  '/menu': { 
    title: 'Menu', 
    endpoint: 'Menus', 
    icon: 'pi-list', 
    description: 'Configure navigation menu items, sidebar system routes, display icons, and module navigation hierarchy.' 
  },
  '/access_level': { 
    title: 'Access Level', 
    endpoint: 'AccessLevel', 
    icon: 'pi-shield', 
    description: 'Manage system security roles, access control levels, administrative privilege groups, and security profiles.' 
  },
  '/access_level_menu': { 
    title: 'Access Level Menu', 
    endpoint: 'AccessLevelMenu', 
    icon: 'pi-sliders-h', 
    description: 'Configure role-based menu access permissions, feature visibility matrices, and module display authorizations.' 
  },
  '/job_order': { 
    title: 'Job Order', 
    endpoint: 'JobOrders', 
    icon: 'pi-clipboard', 
    description: 'Track technical dispatch work orders, site installations, subscriber repairs, and field service assignments.' 
  },
  '/invoice': { 
    title: 'Invoice', 
    endpoint: 'Invoices',
    icon: 'pi-receipt', 
    description: 'Generate customer billing statements, track invoice payment statuses, charges, and financial transaction records.' 
  },
  '/billing': {
    title: 'Billing',
    endpoint: 'BillingDetails',
    icon: 'pi-credit-card',
    description: 'Manage subscriber billing accounts, modem serial numbers, payment schedules, and account statuses.'
  },
  // RadiusUser records come back without a usable key (every `id` is an empty
  // string), so there is nothing to address a write to — this screen browses only.
  '/disconnection': {
    title: 'Disconnection',
    endpoint: 'RadiusUser',
    icon: 'pi-ban',
    readOnly: true,
    description: 'Review RADIUS subscriber accounts and whether each one is currently enabled or disabled.'
  },
  '/lcp-nap-locations/records': {
    title: 'LCP NAP Records',
    endpoint: 'LCPNapLocations',
    icon: 'pi-table',
    description: 'Maintain Local Convergence Point and Network Access Point location records.'
  },
  '/service-orders': {
    title: 'Service Orders',
    endpoint: 'ServiceOrders',
    icon: 'pi-wrench',
    description: 'Manage subscriber repair requests, technical support tickets, field dispatch visits, and equipment pullouts.'
  },
  '/service_orders': {
    title: 'Service Orders',
    endpoint: 'ServiceOrders',
    icon: 'pi-wrench',
    description: 'Manage subscriber repair requests, technical support tickets, field dispatch visits, and equipment pullouts.'
  },
  '/serviceorders': {
    title: 'Service Orders',
    endpoint: 'ServiceOrders',
    icon: 'pi-wrench',
    description: 'Manage subscriber repair requests, technical support tickets, field dispatch visits, and equipment pullouts.'
  },
  '/discount-types': {
    title: 'Discount Types',
    endpoint: 'DiscountTypes',
    icon: 'pi-percentage',
    description: 'Configure broadband subscription discount packages, promotion promo codes, validity dates, and discount amounts.'
  },
  '/discount_types': {
    title: 'Discount Types',
    endpoint: 'DiscountTypes',
    icon: 'pi-percentage',
    description: 'Configure broadband subscription discount packages, promotion promo codes, validity dates, and discount amounts.'
  },
  '/discount_type': {
    title: 'Discount Types',
    endpoint: 'DiscountTypes',
    icon: 'pi-percentage',
    description: 'Configure broadband subscription discount packages, promotion promo codes, validity dates, and discount amounts.'
  },
  '/discounts': {
    title: 'Discounts',
    endpoint: 'Discounts',
    icon: 'pi-ticket',
    description: 'Track customer discount redemptions, promo applications, approved subsidies, and account deductions.'
  },
  '/discount': {
    title: 'Discounts',
    endpoint: 'Discounts',
    icon: 'pi-ticket',
    description: 'Track customer discount redemptions, promo applications, approved subsidies, and account deductions.'
  }
}

const config = computed(() => routeMap[route.path] || { title: 'Unknown', endpoint: null, icon: 'pi-list', description: 'Manage records and system configurations.' })
const title = computed(() => config.value.title)
const endpoint = computed(() => config.value.endpoint)
const icon = computed(() => config.value.icon || 'pi-list')
const readOnly = computed(() => config.value.readOnly === true)
const description = computed(() => config.value.description || `Manage ${title.value} records and system configurations.`)

const openCreateModal = () => {
  if (apiTableRef.value) {
    apiTableRef.value.openCreateDialog()
  }
}
</script>


