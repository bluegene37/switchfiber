<template>
  <div class="d-flex flex-column gap-4">
    <!-- Screen Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">API Viewer</h1>
        <p class="small text-secondary mt-1 mb-0">
          Inspect live raw JSON response payloads across all backend services in real-time.
        </p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-primary text-white shadow-sm px-3 py-2 rounded-pill fw-bold">
          <i class="pi pi-database me-1.5"></i> {{ apiEndpoints.length }} Live GET Endpoints
        </span>
      </div>
    </div>

    <!-- 2 Column Layout: Left = Endpoint List | Right = Response JSON Viewer -->
    <div class="row g-4">
      <!-- Left Column: API List -->
      <div class="col-12 col-lg-4 col-xl-3">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden h-100 bg-body">
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
                    :class="selectedEndpoint === item.endpoint ? 'get-badge-active' : 'bg-success text-white fw-bold shadow-sm'"
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

      <!-- Right Column: API Response JSON Viewer -->
      <div class="col-12 col-lg-8 col-xl-9">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden h-100 bg-body">
          <!-- Card Header & Controls -->
          <div class="card-header bg-body border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-success text-white font-monospace px-2.5 py-1 fw-bold">
                GET
              </span>
              <h5 class="fw-bold text-body mb-0 font-monospace fs-6">
                /api/{{ selectedEndpoint }}
              </h5>
              <!-- <span class="badge bg-body-tertiary text-secondary border px-2 py-1 small ms-1">
                {{ activeEndpointInfo?.name || selectedEndpoint }}
              </span> -->
              <span v-if="recordCount !== null" class="badge bg-body-tertiary text-body border px-2.5 py-1 small fw-semibold">
                <i class="pi pi-box text-primary me-1"></i> {{ recordCount }} {{ recordCount === 1 ? 'item' : 'items' }}
              </span>
            </div>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <!-- View Mode Toggle (Tree View vs Raw JSON) -->
              <div class="btn-group btn-group-sm p-1 bg-body-tertiary rounded-3 border" role="group">
                <button 
                  type="button" 
                  class="btn btn-sm rounded-2 py-1 px-2.5 text-nowrap" 
                  :class="viewMode === 'tree' ? 'btn-primary shadow-sm fw-semibold' : 'btn-link text-body text-decoration-none border-0 opacity-75'"
                  @click="viewMode = 'tree'"
                >
                  <i class="pi pi-sitemap me-1.5"></i> Tree View
                </button>
                <button 
                  type="button" 
                  class="btn btn-sm rounded-2 py-1 px-2.5 text-nowrap" 
                  :class="viewMode === 'raw' ? 'btn-primary shadow-sm fw-semibold' : 'btn-link text-body text-decoration-none border-0 opacity-75'"
                  @click="viewMode = 'raw'"
                >
                  <i class="pi pi-code me-1.5"></i> Raw JSON
                </button>
              </div>



              <!-- Copy JSON Button -->
              <Button 
                :label="copied ? 'Copied!' : 'Copy JSON'" 
                :icon="copied ? 'pi pi-check' : 'pi pi-copy'" 
                class="p-button-outlined p-button-secondary p-button-sm rounded-3 shadow-xs" 
                :class="{ 'p-button-success': copied }"
                @click="copyJsonToClipboard" 
              />

              <!-- Refresh Button -->
              <Button 
                icon="pi pi-refresh" 
                class="p-button-outlined p-button-secondary p-button-sm rounded-3" 
                v-tooltip.bottom="'Refresh JSON Data'"
                :loading="isLoadingJson"
                @click="fetchRawJson" 
              />
            </div>
          </div>

          <!-- Card Body: JSON Viewer -->
          <div class="card-body p-3">
            <div class="position-relative">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 bg-body-tertiary text-secondary px-3 py-2 rounded-top-3 border border-bottom-0 font-monospace small">
                <span class="fw-semibold">
                  <i :class="['pi', viewMode === 'tree' ? 'pi-sitemap' : 'pi-code', 'me-1.5']"></i> 
                  Response Body ({{ viewMode === 'tree' ? 'Interactive Collapsible Tree' : 'Raw Payload' }})
                </span>

                <!-- Right Side: Expand/Collapse Controls + Bytes Badge -->
                <div class="d-flex align-items-center gap-2">
                  <!-- Expand / Collapse All Controls (Tree Mode) -->
                  <div v-if="viewMode === 'tree'" class="btn-group btn-group-sm p-0.5 bg-body rounded-2 border" role="group">
                    <button 
                      type="button" 
                      class="btn btn-sm rounded-2 py-0.5 px-2 text-nowrap d-flex align-items-center gap-1 transition-all"
                      :class="treeExpandState === 'expanded' ? 'btn-primary shadow-xs fw-semibold' : 'btn-link text-body text-decoration-none border-0 opacity-75'"
                      @click="expandAllTree"
                      title="Expand All Nodes"
                    >
                      <i class="pi pi-angle-double-down" style="font-size: 0.75rem;"></i>
                      <span style="font-size: 0.75rem;">Expand All</span>
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm rounded-2 py-0.5 px-2 text-nowrap d-flex align-items-center gap-1 transition-all"
                      :class="treeExpandState === 'collapsed' ? 'btn-primary shadow-xs fw-semibold' : 'btn-link text-body text-decoration-none border-0 opacity-75'"
                      @click="collapseAllTree"
                      title="Collapse All Nodes"
                    >
                      <i class="pi pi-angle-double-up" style="font-size: 0.75rem;"></i>
                      <span style="font-size: 0.75rem;">Collapse All</span>
                    </button>
                  </div>

                  <span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-0.5 small">{{ formattedPayloadSize }}</span>
                </div>
              </div>

              <!-- Loader for JSON -->
              <div v-if="isLoadingJson" class="bg-body-tertiary text-body p-5 text-center font-monospace rounded-bottom-3 border">
                <i class="pi pi-spin pi-spinner fs-3 text-primary mb-2 d-block"></i>
                <span>Fetching GET /api/{{ selectedEndpoint }}...</span>
              </div>

              <!-- Interactive Tree View -->
              <div 
                v-else-if="viewMode === 'tree'"
                class="bg-body-tertiary text-body p-3.5 rounded-bottom-3 border overflow-auto custom-scrollbar"
                style="max-height: calc(100vh - 280px); min-height: 480px;"
              >
                <JsonTreeNode 
                  :data="parsedJsonData" 
                  :depth="0"
                  :force-expand="forceExpandCounter"
                  :force-collapse="forceCollapseCounter"
                  :expand-state="treeExpandState"
                />
              </div>

              <!-- Formatted Raw JSON View -->
              <pre 
                v-else 
                class="bg-body-tertiary text-body p-3 rounded-bottom-3 border overflow-auto font-monospace mb-0 custom-scrollbar" 
                style="max-height: calc(100vh - 280px); min-height: 480px; font-size: 0.85rem; line-height: 1.5;"
              ><code>{{ rawJsonString }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Button from 'primevue/button'
import apiClient from '../services/api'
import JsonTreeNode from '../components/JsonTreeNode.vue'

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
const viewMode = ref('tree') // 'tree' or 'raw'
const isLoadingJson = ref(false)
const rawJsonString = ref('[]')
const parsedJsonData = ref([])
const recordCount = ref(null)
const copied = ref(false)
const forceExpandCounter = ref(0)
const forceCollapseCounter = ref(0)
const treeExpandState = ref('expanded') // 'expanded' or 'collapsed'

const expandAllTree = () => {
  forceExpandCounter.value++
  treeExpandState.value = 'expanded'
}

const collapseAllTree = () => {
  forceCollapseCounter.value++
  treeExpandState.value = 'collapsed'
}

const formattedPayloadSize = computed(() => {
  const bytes = rawJsonString.value ? rawJsonString.value.length : 0
  const mb = (bytes / (1024 * 1024)).toFixed(3)
  return `${bytes.toLocaleString()} bytes (${mb} MB)`
})

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
  fetchRawJson()
}

const fetchRawJson = async () => {
  isLoadingJson.value = true
  recordCount.value = null
  try {
    const res = await apiClient.get(`/${selectedEndpoint.value}`)
    let data = res
    if (res && typeof res === 'object' && !Array.isArray(res)) {
      const arrayKey = Object.keys(res).find(k => Array.isArray(res[k]))
      if (arrayKey) data = res[arrayKey]
    }
    parsedJsonData.value = data
    if (Array.isArray(data)) {
      recordCount.value = data.length
    } else {
      recordCount.value = 1
    }
    rawJsonString.value = JSON.stringify(data, null, 2)
  } catch (err) {
    recordCount.value = 0
    parsedJsonData.value = {
      error: true,
      message: err.message || 'Failed to fetch data from endpoint',
      status: err.response?.status
    }
    rawJsonString.value = JSON.stringify(parsedJsonData.value, null, 2)
  } finally {
    isLoadingJson.value = false
  }
}

const copyJsonToClipboard = () => {
  if (!rawJsonString.value) return
  navigator.clipboard.writeText(rawJsonString.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

onMounted(() => {
  fetchRawJson()
})

watch(selectedEndpoint, () => {
  fetchRawJson()
})
</script>

<style scoped>
.transition-all {
  transition: all 0.15s ease-in-out;
}

.hover-bg:hover {
  background-color: var(--bs-tertiary-bg);
}

.get-badge-active {
  background-color: #ffffff !important;
  color: #e74c5a !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15) !important;
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
