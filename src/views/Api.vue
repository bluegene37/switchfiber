<template>
  <div class="d-flex flex-column gap-4">
    <!-- Screen Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">API Viewer</h1>
        <p class="small text-secondary mt-1 mb-0">
          Inspect live GET endpoints across all backend services in real-time.
        </p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-primary text-white shadow-sm px-3 py-2 rounded-pill fw-bold">
          <i class="pi pi-database me-1.5"></i> {{ apiEndpoints.length }} Live GET Endpoints
        </span>
      </div>
    </div>

    <!-- 2 Column Layout: Left = Endpoint List | Right = Response Viewer -->
    <div class="row g-4">
      <!-- Left Column: API List -->
      <div class="col-12 col-lg-4 col-xl-3">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
          <!-- Card Header & Search -->
          <div class="card-header bg-body border-bottom p-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-body mb-0">API Endpoints</h6>
              <span class="badge bg-secondary text-white rounded-pill small px-2.5 py-1 fw-bold">GET Only</span>
            </div>
            <div class="position-relative">
              <i class="pi pi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" style="font-size: 0.85rem;"></i>
              <input 
                v-model="searchQuery"
                type="text" 
                class="form-control form-control-sm ps-5 bg-body-tertiary border-0 shadow-none rounded-3" 
                placeholder="Search endpoints..." 
              />
            </div>
          </div>

          <!-- List of Endpoints -->
          <div class="card-body p-2 overflow-y-auto" style="max-height: calc(100vh - 280px); min-height: 400px;">
            <div 
              v-if="filteredEndpoints.length === 0" 
              class="text-center text-muted py-5 small"
            >
              <i class="pi pi-search-minus fs-4 mb-2 d-block opacity-50"></i>
              No endpoints found matching "{{ searchQuery }}"
            </div>

            <div class="list-group list-group-flush gap-1">
              <button
                v-for="item in filteredEndpoints"
                :key="item.endpoint"
                type="button"
                class="list-group-item list-group-item-action border-0 rounded-3 p-2.5 transition-all d-flex flex-column gap-1"
                :class="selectedEndpoint === item.endpoint ? 'bg-primary text-white shadow-sm fw-medium' : 'hover-bg'"
                @click="selectEndpoint(item.endpoint)"
              >
                <div class="d-flex align-items-center justify-content-between">
                  <span class="fw-semibold text-truncate small" :class="selectedEndpoint === item.endpoint ? 'text-white' : 'text-body'">
                    {{ item.name }}
                  </span>
                  <span 
                    class="badge rounded-1 font-monospace px-2 py-0.5" 
                    :class="selectedEndpoint === item.endpoint ? 'bg-white text-primary fw-bold' : 'bg-success text-white fw-bold shadow-sm'"
                    style="font-size: 0.7rem;"
                  >
                    GET
                  </span>
                </div>
                <div 
                  class="font-monospace text-truncate opacity-75"
                  :class="selectedEndpoint === item.endpoint ? 'text-white-50' : 'text-secondary'"
                  style="font-size: 0.75rem;"
                >
                  /api/{{ item.endpoint }}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: API Response & Data Table -->
      <div class="col-12 col-lg-8 col-xl-9">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
          <!-- Card Header & Controls -->
          <div class="card-header bg-body border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-success text-white font-monospace px-2.5 py-1 fw-bold">
                GET
              </span>
              <h5 class="fw-bold text-body mb-0 font-monospace fs-6">
                /api/{{ selectedEndpoint }}
              </h5>
              <span class="badge bg-body-tertiary text-secondary border px-2 py-1 small ms-1">
                {{ activeEndpointInfo?.name || selectedEndpoint }}
              </span>
            </div>

            <div class="d-flex align-items-center gap-2">
              <!-- View Mode Toggle -->
              <div class="btn-group btn-group-sm p-1 bg-body-tertiary rounded-3 border" role="group">
                <button 
                  type="button" 
                  class="btn btn-sm rounded-2 py-1 px-2.5 text-nowrap" 
                  :class="viewMode === 'table' ? 'btn-primary shadow-sm fw-semibold' : 'btn-link text-body text-decoration-none border-0 opacity-75'"
                  @click="viewMode = 'table'"
                >
                  <i class="pi pi-table me-1.5"></i> Table View
                </button>
                <button 
                  type="button" 
                  class="btn btn-sm rounded-2 py-1 px-2.5 text-nowrap" 
                  :class="viewMode === 'json' ? 'btn-primary shadow-sm fw-semibold' : 'btn-link text-body text-decoration-none border-0 opacity-75'"
                  @click="switchToRawJson"
                >
                  <i class="pi pi-code me-1.5"></i> Raw JSON
                </button>
              </div>

              <!-- Refresh Button -->
              <Button 
                icon="pi pi-refresh" 
                class="p-button-outlined p-button-secondary p-button-sm rounded-3" 
                v-tooltip.bottom="'Refresh Data'"
                :loading="isRefreshing"
                @click="refreshData" 
              />
            </div>
          </div>

          <!-- Card Body: View Modes -->
          <div class="card-body p-3">
            <!-- Table View Mode -->
            <div v-if="viewMode === 'table'">
              <DynamicApiTable 
                ref="tableRef"
                :endpoint="selectedEndpoint" 
                :key="`table-${selectedEndpoint}-${refreshCounter}`" 
                :hide-create-button="true"
              />
            </div>

            <!-- Raw JSON View Mode -->
            <div v-else-if="viewMode === 'json'" class="position-relative">
              <div class="d-flex align-items-center justify-content-between bg-dark text-white-50 px-3 py-2 rounded-top-3 border-bottom border-secondary border-opacity-25 font-monospace small">
                <span>Response Body (JSON)</span>
                <button 
                  type="button" 
                  class="btn btn-sm text-white-50 hover-text-white p-0 border-0 shadow-none d-flex align-items-center gap-1"
                  @click="copyJsonToClipboard"
                >
                  <i :class="['pi', copied ? 'pi-check text-success' : 'pi-copy']"></i>
                  <span>{{ copied ? 'Copied!' : 'Copy JSON' }}</span>
                </button>
              </div>

              <!-- Loader for JSON -->
              <div v-if="isLoadingJson" class="bg-dark text-white p-5 text-center font-monospace rounded-bottom-3">
                <i class="pi pi-spin pi-spinner fs-3 text-primary mb-2 d-block"></i>
                <span>Fetching GET /api/{{ selectedEndpoint }}...</span>
              </div>

              <!-- Formatted JSON viewer -->
              <pre 
                v-else 
                class="bg-dark text-light p-3 rounded-bottom-3 overflow-auto font-monospace mb-0 custom-scrollbar" 
                style="max-height: 600px; font-size: 0.85rem; line-height: 1.5;"
              ><code>{{ rawJsonString }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Button from 'primevue/button'
import DynamicApiTable from '../components/DynamicApiTable.vue'
import apiClient from '../services/api'

const apiEndpoints = ref([
  { name: 'Applications', endpoint: 'Applications', description: 'Customer application records and form data' },
  { name: 'Billing Details', endpoint: 'BillingDetails', description: 'Subscriber billing, modem SN, & account details' },
  { name: 'Job Orders', endpoint: 'JobOrders', description: 'Installation and technical service job orders' },
  { name: 'LCP', endpoint: 'Lcps', description: 'Local Convergence Point network nodes' },
  { name: 'LCNAP', endpoint: 'Lcpnaps', description: 'LCP Network Access Points mapping' },
  { name: 'LCNAP Port', endpoint: 'Lcpnapports', description: 'LCP NAP port allocations' },
  { name: 'NAP', endpoint: 'Naps', description: 'Network Access Point hardware units' },
  { name: 'Plans', endpoint: 'Plans', description: 'Subscription plans and pricing tiers' },
  { name: 'Ports', endpoint: 'Ports', description: 'Fiber port connections' },
  { name: 'Routers', endpoint: 'Routers', description: 'Router and ONT modem inventory' },
  { name: 'VLANs', endpoint: 'Vlans', description: 'Virtual Local Area Network configurations' },
  { name: 'Users', endpoint: 'Users', description: 'System user accounts and access levels' },
  { name: 'Menus', endpoint: 'Menus', description: 'Navigation menu items' },
  { name: 'Access Level', endpoint: 'AccessLevel', description: 'System user roles and security permissions' },
  { name: 'Access Level Menu', endpoint: 'AccessLevelMenu', description: 'Access level menu permission mappings' },
  { name: 'Invoices', endpoint: 'Invoices', description: 'Customer billing invoices and statement records' },
  { name: 'Barangays', endpoint: 'Barangays', description: 'Location barangay geographic lookup data' }
])

const selectedEndpoint = ref(apiEndpoints.value[0].endpoint)
const searchQuery = ref('')
const viewMode = ref('table')
const refreshCounter = ref(0)
const isRefreshing = ref(false)
const tableRef = ref(null)

const isLoadingJson = ref(false)
const rawJsonString = ref('[]')
const copied = ref(false)

const activeEndpointInfo = computed(() => {
  return apiEndpoints.value.find(e => e.endpoint === selectedEndpoint.value)
})

const filteredEndpoints = computed(() => {
  if (!searchQuery.value.trim()) return apiEndpoints.value
  const query = searchQuery.value.toLowerCase()
  return apiEndpoints.value.filter(e => 
    e.name.toLowerCase().includes(query) || 
    e.endpoint.toLowerCase().includes(query)
  )
})

const selectEndpoint = (ep) => {
  selectedEndpoint.value = ep
  if (viewMode.value === 'json') {
    fetchRawJson()
  }
}

const refreshData = async () => {
  isRefreshing.value = true
  refreshCounter.value++
  if (viewMode.value === 'json') {
    await fetchRawJson()
  }
  setTimeout(() => {
    isRefreshing.value = false
  }, 400)
}

const fetchRawJson = async () => {
  isLoadingJson.value = true
  try {
    const res = await apiClient.get(`/${selectedEndpoint.value}`)
    let data = res
    if (res && typeof res === 'object' && !Array.isArray(res)) {
      const arrayKey = Object.keys(res).find(k => Array.isArray(res[k]))
      if (arrayKey) data = res[arrayKey]
    }
    rawJsonString.value = JSON.stringify(data, null, 2)
  } catch (err) {
    rawJsonString.value = JSON.stringify({
      error: true,
      message: err.message || 'Failed to fetch data from endpoint',
      status: err.response?.status
    }, null, 2)
  } finally {
    isLoadingJson.value = false
  }
}

const switchToRawJson = () => {
  viewMode.value = 'json'
  fetchRawJson()
}

const copyJsonToClipboard = () => {
  if (!rawJsonString.value) return
  navigator.clipboard.writeText(rawJsonString.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

watch(selectedEndpoint, () => {
  if (viewMode.value === 'json') {
    fetchRawJson()
  }
})
</script>

<style scoped>
.transition-all {
  transition: all 0.15s ease-in-out;
}

.hover-bg:hover {
  background-color: var(--bs-tertiary-bg);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>
