<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">Application List</h1>
        <p class="small text-secondary mt-1 mb-0">Process customer subscription applications, track status updates, and filter records.</p>
      </div>
    </div>

    <!-- Main Card Container: Filter Tabs & Data Table -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 d-flex flex-column gap-3">
      <!-- Status Filter Tabs -->
      <div class="d-flex align-items-center gap-2 overflow-x-auto pb-2 border-bottom filter-tabs-scrollable">
        <button
          v-for="tab in statusTabs"
          :key="tab.id"
          type="button"
          class="btn btn-sm d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1.5 fw-medium text-nowrap status-tab-btn"
          :class="[
            selectedStatus === tab.value 
              ? 'btn-primary shadow-sm text-white' 
              : 'btn-light border text-secondary bg-body-tertiary hover-tab'
          ]"
          @click="setStatusFilter(tab.value)"
        >
          <i :class="['pi', tab.icon]" style="font-size: 0.85rem;"></i>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Advanced Filter Controls (Date Range & Presets) -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 pb-2 border-bottom">
        <!-- Date Range Pickers -->
        <div class="d-flex align-items-center gap-2 flex-wrap flex-grow-1 flex-md-grow-0">
          <div class="d-flex align-items-center gap-1.5">
            <span class="small text-secondary fw-semibold text-nowrap">From:</span>
            <DatePicker 
              v-model="fromDate" 
              showIcon 
              iconDisplay="input"
              size="small"
              dateFormat="yy-mm-dd" 
              placeholder="From Date" 
              class="date-filter-picker"
            />
          </div>
          <div class="d-flex align-items-center gap-1.5">
            <span class="small text-secondary fw-semibold text-nowrap">To:</span>
            <DatePicker 
              v-model="toDate" 
              showIcon 
              iconDisplay="input"
              size="small"
              dateFormat="yy-mm-dd" 
              placeholder="To Date" 
              class="date-filter-picker"
            />
          </div>

          <!-- Quick Date Presets -->
          <div class="d-flex align-items-center gap-1 ms-sm-1">
            <button 
              type="button" 
              class="btn btn-sm btn-outline-secondary border-0 rounded-pill px-2.5 py-1 small fw-medium"
              @click="applyDatePreset('today')"
            >
              Today
            </button>
            <button 
              type="button" 
              class="btn btn-sm btn-outline-secondary border-0 rounded-pill px-2.5 py-1 small fw-medium"
              @click="applyDatePreset('this_week')"
            >
              This Week
            </button>
            <button 
              type="button" 
              class="btn btn-sm btn-outline-secondary border-0 rounded-pill px-2.5 py-1 small fw-medium"
              @click="applyDatePreset('this_month')"
            >
              This Month
            </button>
          </div>
        </div>

        <!-- Active Filter Badge & Clear Button -->
        <div v-if="hasActiveFilter" class="d-flex align-items-center gap-2 ms-auto">
          <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2.5 py-1 small fw-semibold">
            Filter Active: {{ activeFilterSummary }}
          </span>
          <button 
            type="button" 
            class="btn btn-sm btn-outline-danger border-dashed rounded-pill d-inline-flex align-items-center gap-1 px-2.5 py-1 small shadow-xs"
            @click="clearAllFilters"
            title="Reset status and date filters"
          >
            <i class="pi pi-filter-slash" style="font-size: 0.75rem;"></i>
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      <!-- Data Table with standard inside-the-card toolbar Create button -->
      <DynamicApiTable 
        ref="apiTableRef" 
        endpoint="Applications" 
        filter-endpoint="/Applications/filter"
        :filter-params="activeFilterParams"
        :hide-create-button="false"
        create-button-label="Create Application"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DatePicker from 'primevue/datepicker'
import DynamicApiTable from '../components/DynamicApiTable.vue'

const apiTableRef = ref(null)

const selectedStatus = ref('')
const fromDate = ref(null)
const toDate = ref(null)

const statusTabs = [
  { id: 'all', label: 'All Applications', value: '', icon: 'pi-list' },
  { id: 'pending', label: 'Pending', value: 'Pending', icon: 'pi-clock' },
  { id: 'approved', label: 'Approved', value: 'Approved', icon: 'pi-check-circle' },
  { id: 'installed', label: 'Installed', value: 'Installed', icon: 'pi-verified' },
  { id: 'drop', label: 'Drop / Rejected', value: 'Drop', icon: 'pi-times-circle' },
  { id: 'failed', label: 'Failed', value: 'Failed', icon: 'pi-exclamation-triangle' },
  { id: 'reschedule', label: 'Reschedule', value: 'Reschedule', icon: 'pi-calendar-times' },
  { id: 'cancelled', label: 'Cancelled', value: 'Cancelled', icon: 'pi-ban' }
]

const setStatusFilter = (status) => {
  selectedStatus.value = status
}

const formatDateParam = (dateVal) => {
  if (!dateVal) return undefined
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim()
    return trimmed ? trimmed : undefined
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const y = dateVal.getFullYear()
    const m = String(dateVal.getMonth() + 1).padStart(2, '0')
    const d = String(dateVal.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return undefined
}

const activeFilterParams = computed(() => {
  const params = {}
  if (selectedStatus.value && selectedStatus.value.trim() !== '') {
    params.status = selectedStatus.value.trim()
  }
  const f = formatDateParam(fromDate.value)
  if (f) params.fromDate = f
  const t = formatDateParam(toDate.value)
  if (t) params.toDate = t
  return params
})

const hasActiveFilter = computed(() => {
  return !!selectedStatus.value || !!fromDate.value || !!toDate.value
})

const activeFilterSummary = computed(() => {
  const parts = []
  if (selectedStatus.value) parts.push(`Status: ${selectedStatus.value}`)
  if (fromDate.value) parts.push(`From: ${formatDateParam(fromDate.value)}`)
  if (toDate.value) parts.push(`To: ${formatDateParam(toDate.value)}`)
  return parts.join(' | ')
})

const applyDatePreset = (preset) => {
  const today = new Date()
  if (preset === 'today') {
    fromDate.value = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    toDate.value = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  } else if (preset === 'this_week') {
    const day = today.getDay()
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1)
    fromDate.value = new Date(today.setDate(diffToMonday))
    toDate.value = new Date()
  } else if (preset === 'this_month') {
    fromDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
    toDate.value = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  }
}

const clearAllFilters = () => {
  selectedStatus.value = ''
  fromDate.value = null
  toDate.value = null
}
</script>

<style scoped>
.filter-tabs-scrollable {
  scrollbar-width: thin;
}

.status-tab-btn {
  transition: all 0.2s ease-in-out;
  font-size: 0.8125rem;
}

.hover-tab:hover {
  background-color: var(--bs-secondary-bg) !important;
  color: var(--bs-primary) !important;
}

.date-filter-picker {
  width: 140px;
}

:deep(.date-filter-picker .p-inputtext) {
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
}
</style>
