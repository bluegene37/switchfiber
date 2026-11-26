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
    <!-- Gene - Nov, 27, 2026: Replaced single-pane Status table with 33% / 67% Type Code group split on /status while keeping all other File Maintenance routes full-width -->
    <!--
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 sfa-tracker-file-maintenance-table-card">
      <DynamicApiTable
        ref="apiTableRef"
        v-if="endpoint"
        :endpoint="endpoint"
        :key="tableKey"
        :read-only="readOnly"
        :hide-create-button="readOnly || hideCreate"
        :access-level-names="accessLevelNames"
        :create-button-label="`Create ${title}`"
      />
      <div v-else class="p-4 text-center text-muted">Invalid Configuration</div>
    </div>
    -->
    <div v-if="isStatusPage" class="row g-4 align-items-start sfa-tracker-status-split">
      <!-- Left Column (33%): Status Type Codes Group List -->
      <div class="col-12 col-xl-4 sfa-tracker-status-groups-col">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body sfa-tracker-status-groups-card">
          <div class="card-header bg-body border-bottom p-3 d-flex align-items-center justify-content-between gap-2">
            <div class="d-flex align-items-center gap-2">
              <i class="pi pi-tags text-primary"></i>
              <h5 class="fw-bold text-body mb-0 fs-6">Status Type Codes</h5>
            </div>
            <span class="badge rounded-pill text-bg-secondary bg-opacity-25 text-body fw-semibold">
              {{ statusTypeGroups.length }}
            </span>
          </div>

          <div class="p-2 border-bottom bg-body-tertiary bg-opacity-50">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-body border-end-0 text-secondary">
                <i class="pi pi-search" style="font-size: 0.78rem;"></i>
              </span>
              <input
                v-model="statusTypeSearch"
                type="text"
                class="form-control border-start-0 shadow-none"
                placeholder="Filter type codes..."
                aria-label="Filter status type codes"
              />
              <button
                v-if="statusTypeSearch"
                type="button"
                class="btn btn-outline-secondary"
                aria-label="Clear type code filter"
                @click="clearStatusTypeSearch"
              >
                <i class="pi pi-times" style="font-size: 0.75rem;"></i>
              </button>
            </div>
          </div>

          <div class="list-group list-group-flush sfa-status-type-list" role="listbox" aria-label="Status type groups">
            <button
              v-if="showAllGroupItem"
              type="button"
              role="option"
              :aria-selected="selectedStatusType === ''"
              class="list-group-item list-group-item-action d-flex align-items-center justify-content-between gap-2 px-3 py-2 border-0 border-bottom sfa-status-type-item"
              :class="{ 'sfa-status-type-item-active': selectedStatusType === '' }"
              @click="selectStatusType('')"
            >
              <span class="font-monospace fw-semibold small text-truncate">ALL</span>
              <span
                class="badge rounded-pill sfa-status-type-count"
                :class="selectedStatusType === '' ? 'bg-white bg-opacity-25 text-white' : 'bg-secondary bg-opacity-10 text-secondary'"
              >
                {{ statusTotalCount }}
              </span>
            </button>

            <button
              v-for="group in filteredStatusTypeGroups"
              :key="group.code"
              type="button"
              role="option"
              :aria-selected="selectedStatusType === group.code"
              class="list-group-item list-group-item-action d-flex align-items-center justify-content-between gap-2 px-3 py-2 border-0 border-bottom sfa-status-type-item"
              :class="{ 'sfa-status-type-item-active': selectedStatusType === group.code }"
              @click="selectStatusType(group.code)"
            >
              <span class="font-monospace fw-semibold small text-truncate">{{ group.code }}</span>
              <span
                class="badge rounded-pill sfa-status-type-count"
                :class="selectedStatusType === group.code ? 'bg-white bg-opacity-25 text-white' : 'bg-secondary bg-opacity-10 text-secondary'"
              >
                {{ group.count }}
              </span>
            </button>

            <div
              v-if="!showAllGroupItem && filteredStatusTypeGroups.length === 0"
              class="p-3 text-center small text-secondary"
            >
              No matching type code
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column (67%): Filtered Status Details Table -->
      <div class="col-12 col-xl-8 sfa-tracker-status-table-col">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 sfa-tracker-file-maintenance-table-card">
          <DynamicApiTable
            ref="apiTableRef"
            v-if="endpoint"
            :endpoint="endpoint"
            :key="tableKey"
            :read-only="readOnly"
            :hide-create-button="readOnly || hideCreate"
            :access-level-names="accessLevelNames"
            :client-filters="statusClientFilters"
            :create-button-label="`Create ${title}`"
            @reset-filters="handleStatusFilterReset"
          />
          <div v-else class="p-4 text-center text-muted">Invalid Configuration</div>
        </div>
      </div>
    </div>

    <div v-else class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 sfa-tracker-file-maintenance-table-card">
      <DynamicApiTable
        ref="apiTableRef"
        v-if="endpoint"
        :endpoint="endpoint"
        :key="tableKey"
        :read-only="readOnly"
        :hide-create-button="readOnly || hideCreate"
        :access-level-names="accessLevelNames"
        :create-button-label="`Create ${title}`"
      />
      <div v-else class="p-4 text-center text-muted">Invalid Configuration</div>
    </div>
  </div>
</template>

<script setup>
/*
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import DynamicApiTable from '../components/DynamicApiTable.vue'
*/
// Gene - Nov, 27, 2026: Import useStatusStore and buildStatusTypeGroups for left Type Code group navigation on /status
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import DynamicApiTable from '../components/DynamicApiTable.vue'
import { useStatusStore } from '../stores/statuses'
import { STATUS_TYPES, buildStatusTypeGroups } from '../services/status'

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
  // Gene - Nov, 23, 2026: Added Tech menu route under Users Management scoped to FIT1 / Field Installation Team access levels
  '/tech': {
    title: 'Tech',
    endpoint: 'Users',
    icon: 'pi-wrench',
    accessLevelNames: ['FIT1', 'Field Installation Team'],
    description: 'Manage field technicians and installers assigned to the FIT1 / Field Installation Team access level.'
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
  /*
  '/job_order': { 
    title: 'Job Order', 
    endpoint: 'JobOrders', 
    icon: 'pi-clipboard', 
    description: 'Track technical dispatch work orders, site installations, subscriber repairs, and field service assignments.' 
  },
  */
  // Gene - Nov, 16, 2026: Hide manual Job Order Create on legacy /job_order route because Job Orders are auto-created from Applications
  '/job_order': { 
    title: 'Job Order', 
    endpoint: 'JobOrders', 
    icon: 'pi-clipboard', 
    hideCreate: true,
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
  '/payments': {
    title: 'Payments',
    endpoint: 'Payments',
    icon: 'pi-wallet',
    description: 'Track customer collections, payment transactions, official receipts, and billing settlements.'
  },
  '/payment': {
    title: 'Payments',
    endpoint: 'Payments',
    icon: 'pi-wallet',
    description: 'Track customer collections, payment transactions, official receipts, and billing settlements.'
  },
  // Gene - Nov 5, 2026: Add Payment Methods and Payment Types under Transaction group
  '/payment-methods': {
    title: 'Payment Methods',
    endpoint: 'PaymentMethods',
    icon: 'pi-credit-card',
    description: 'Configure available payment channels, gateways, bank transfers, and over-the-counter options.'
  },
  '/payment_methods': {
    title: 'Payment Methods',
    endpoint: 'PaymentMethods',
    icon: 'pi-credit-card',
    description: 'Configure available payment channels, gateways, bank transfers, and over-the-counter options.'
  },
  '/paymentmethods': {
    title: 'Payment Methods',
    endpoint: 'PaymentMethods',
    icon: 'pi-credit-card',
    description: 'Configure available payment channels, gateways, bank transfers, and over-the-counter options.'
  },
  '/payment-types': {
    title: 'Payment Types',
    endpoint: 'PaymentTypes',
    icon: 'pi-tag',
    description: 'Categorize customer payment transactions, collections, advance deposits, and settlement types.'
  },
  '/payment_types': {
    title: 'Payment Types',
    endpoint: 'PaymentTypes',
    icon: 'pi-tag',
    description: 'Categorize customer payment transactions, collections, advance deposits, and settlement types.'
  },
  '/paymenttypes': {
    title: 'Payment Types',
    endpoint: 'PaymentTypes',
    icon: 'pi-tag',
    description: 'Categorize customer payment transactions, collections, advance deposits, and settlement types.'
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
  },
  // Gene - Oct, 16, 2026: Added File Maintenance route mappings for Promo (/api/Promotions), Inventory Category (/api/InventoryCategory), Inventory Item (/api/InventoryItem), and Inventory Logs (/api/InventoryLogs)
  '/promo': {
    title: 'Promo',
    endpoint: 'Promotions',
    icon: 'pi-gift',
    description: 'Configure promotional campaigns, promo codes, website banners, discount links, perks, and terms.'
  },
  '/promotions': {
    title: 'Promo',
    endpoint: 'Promotions',
    icon: 'pi-gift',
    description: 'Configure promotional campaigns, promo codes, website banners, discount links, perks, and terms.'
  },
  '/inventory-category': {
    title: 'Inventory Category',
    endpoint: 'InventoryCategory',
    icon: 'pi-tags',
    description: 'Manage warehouse and network equipment categories for classifying fiber hardware, cables, and stock items.'
  },
  '/inventory_category': {
    title: 'Inventory Category',
    endpoint: 'InventoryCategory',
    icon: 'pi-tags',
    description: 'Manage warehouse and network equipment categories for classifying fiber hardware, cables, and stock items.'
  },
  '/inventory-item': {
    title: 'Inventory Item',
    endpoint: 'InventoryItem',
    icon: 'pi-box',
    description: 'Manage hardware stock items, item codes, categories, suppliers, available quantities, and item images.'
  },
  '/inventory_item': {
    title: 'Inventory Item',
    endpoint: 'InventoryItem',
    icon: 'pi-box',
    description: 'Manage hardware stock items, item codes, categories, suppliers, available quantities, and item images.'
  },
  '/inventory-logs': {
    title: 'Inventory Logs',
    endpoint: 'InventoryLogs',
    icon: 'pi-history',
    description: 'Track inventory stock requests, item dispatches, quantities, technicians, statuses, and remarks.'
  },
  '/inventory_logs': {
    title: 'Inventory Logs',
    endpoint: 'InventoryLogs',
    icon: 'pi-history',
    description: 'Track inventory stock requests, item dispatches, quantities, technicians, statuses, and remarks.'
  },
  // Gene - Nov, 25, 2026: Added File Maintenance route mappings for Status (/api/Status)
  '/status': {
    title: 'Status',
    endpoint: 'Status',
    icon: 'pi-flag',
    description: 'Manage system status codes (name), display labels (description), and module type codes (type).'
  },
  '/statuses': {
    title: 'Status',
    endpoint: 'Status',
    icon: 'pi-flag',
    description: 'Manage system status codes (name), display labels (description), and module type codes (type).'
  }
}

const config = computed(() => routeMap[route.path] || { title: 'Unknown', endpoint: null, icon: 'pi-list', description: 'Manage records and system configurations.' })
const title = computed(() => config.value.title)
const endpoint = computed(() => config.value.endpoint)
const icon = computed(() => config.value.icon || 'pi-list')
const readOnly = computed(() => config.value.readOnly === true)
// Gene - Nov, 16, 2026: Read hideCreate flag from route config
const hideCreate = computed(() => config.value.hideCreate === true)
// Gene - Nov, 23, 2026: Read optional accessLevelNames scope and compute route-aware table key so switching /user <-> /tech cleanly resets table state
const accessLevelNames = computed(() =>
  Array.isArray(config.value.accessLevelNames) ? config.value.accessLevelNames : []
)
const tableKey = computed(() => `${endpoint.value || ''}:${route.path}`)
const description = computed(() => config.value.description || `Manage ${title.value} records and system configurations.`)

const openCreateModal = () => {
  if (apiTableRef.value) {
    apiTableRef.value.openCreateDialog()
  }
}

// Gene - Nov, 27, 2026: Status Type Code group state, client filter binding, and live store preload for /status
const statusStore = useStatusStore()
const isStatusPage = computed(() => endpoint.value === 'Status')
const selectedStatusType = ref('')
const statusTypeSearch = ref('')

const statusGroupSummary = computed(() => buildStatusTypeGroups(statusStore.statuses, STATUS_TYPES))
const statusTypeGroups = computed(() => statusGroupSummary.value.groups)
const statusTotalCount = computed(() => statusGroupSummary.value.totalCount)

const filteredStatusTypeGroups = computed(() => {
  const q = statusTypeSearch.value.trim().toLowerCase()
  if (!q) return statusTypeGroups.value
  return statusTypeGroups.value.filter(group => group.code.toLowerCase().includes(q))
})

const showAllGroupItem = computed(() => {
  const q = statusTypeSearch.value.trim().toLowerCase()
  return !q || 'all'.includes(q)
})

const statusClientFilters = computed(() =>
  isStatusPage.value && selectedStatusType.value ? { type: selectedStatusType.value } : {}
)

const selectStatusType = (code) => {
  selectedStatusType.value = String(code || '').trim()
}

const handleStatusFilterReset = () => {
  selectedStatusType.value = ''
}

const clearStatusTypeSearch = () => {
  statusTypeSearch.value = ''
}

watch(() => route.path, () => {
  selectedStatusType.value = ''
  statusTypeSearch.value = ''
})

watch(isStatusPage, (active) => {
  if (active && !statusStore.isLoaded) {
    statusStore.loadStatuses()
  }
}, { immediate: true })

onMounted(() => {
  if (isStatusPage.value && !statusStore.isLoaded) {
    statusStore.loadStatuses()
  }
})
</script>

<style scoped>
.sfa-status-type-list {
  max-height: 65vh;
  overflow-y: auto;
  scrollbar-width: thin;
}

.sfa-status-type-item {
  background-color: transparent;
  color: var(--bs-body-color);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.sfa-status-type-item:hover:not(.sfa-status-type-item-active) {
  background-color: var(--bs-tertiary-bg);
}

.sfa-status-type-item-active {
  background-color: var(--bs-primary) !important;
  color: #ffffff !important;
}

.sfa-status-type-count {
  font-size: 0.7rem;
  min-width: 1.75rem;
}
</style>


