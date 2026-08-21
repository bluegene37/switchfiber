<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">{{ pageTitle }}</h1>
        <p class="small text-secondary mt-1 mb-0">{{ pageDescription }}</p>
      </div>
    </div>

    <!-- Main Card Container: Filter Tabs & Data Table -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 d-flex flex-column gap-3">
      <!-- Unified Filter Controls (Status Tabs on Left | Date Range right after divider) -->
      <div class="d-flex align-items-center justify-content-start flex-wrap gap-3 pb-2 border-bottom">
        <!-- Left Side: Status Filter Tabs (Shown only on All Application page) -->
        <div v-if="!isDedicatedStatusRoute" class="d-flex align-items-center gap-2 overflow-x-auto filter-tabs-scrollable flex-shrink-0">
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
            <span
              v-if="statusCounts"
              class="badge rounded-pill status-tab-count"
              :class="selectedStatus === tab.value
                ? 'bg-white bg-opacity-25 text-white'
                : 'bg-secondary bg-opacity-10 text-secondary'"
            >
              {{ statusCounts.countFor(tab.value) }}
            </span>
          </button>
        </div>

        <!-- Vertical Divider (Shown when Status Tabs are visible) -->
        <div v-if="!isDedicatedStatusRoute" class="d-none d-lg-block filter-divider text-muted mx-1">|</div>

        <!-- Date Range Pickers & Presets (Placed directly after divider) -->
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <!-- Date Range Pickers -->
          <div class="d-flex align-items-center gap-2">
            <span class="small text-secondary fw-semibold text-nowrap">From:</span>
            <DatePicker
              v-model="fromDate"
              showIcon
              iconDisplay="input"
              size="small"
              dateFormat="yy-mm-dd"
              placeholder="From Date"
              class="date-filter-picker"
              @update:model-value="onManualDateChange"
            />
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="small text-secondary fw-semibold text-nowrap">To:</span>
            <DatePicker
              v-model="toDate"
              showIcon
              iconDisplay="input"
              size="small"
              dateFormat="yy-mm-dd"
              placeholder="To Date"
              class="date-filter-picker"
              @update:model-value="onManualDateChange"
            />
          </div>

          <!-- Quick Date Presets (Theme-Driven Centralized Highlight) -->
          <div class="d-flex align-items-center gap-1.5 ms-sm-1">
            <button 
              type="button" 
              class="btn-date-preset"
              :class="{ 'active': selectedDatePreset === 'today' }"
              @click="applyDatePreset('today')"
            >
              Today
            </button>
            <button 
              type="button" 
              class="btn-date-preset"
              :class="{ 'active': selectedDatePreset === 'this_week' }"
              @click="applyDatePreset('this_week')"
            >
              This Week
            </button>
            <button 
              type="button" 
              class="btn-date-preset"
              :class="{ 'active': selectedDatePreset === 'this_month' }"
              @click="applyDatePreset('this_month')"
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      <!-- Data Table with standard inside-the-card toolbar Create button -->
      <DynamicApiTable
        ref="apiTableRef"
        endpoint="Applications"
        filter-endpoint="/Applications/filter"
        :filter-params="activeFilterParams"
        server-date-filter
        :hide-create-button="false"
        hide-status-filter
        create-button-label="Create Application"
        :default-sort-order="-1"
        default-sort-field="id"
        @reset-filters="clearAllFilters"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import DynamicApiTable from '../components/DynamicApiTable.vue'

const route = useRoute()
const router = useRouter()
const apiTableRef = ref(null)

// Default to 'This Week' on initial load to avoid fetching/rendering massive datasets at once
const selectedStatus = ref('')
const fromDate = ref(null)
const toDate = ref(null)
const selectedDatePreset = ref('')

const statusTabs = [
  { id: 'all', label: 'All Application', value: '', routePath: '/application', icon: 'pi-list' },
  { id: 'in_progress', label: 'In Progress', value: 'In Progress', routePath: '/application/in-progress', icon: 'pi-clock' },
  { id: 'done', label: 'Done', value: 'Done', routePath: '/application/done', icon: 'pi-check-circle' },
  { id: 'approved', label: 'Approved', value: 'Approved', routePath: '/application/approved', icon: 'pi-verified' }
]

// Counts for the status tabs. A status-filtered fetch only knows about its own
// status, so the counts are captured whenever a fetch WITHOUT a status param
// settles (the "All" tab) and replayed while a status tab is active. Keyed by the
// date range that produced them: badges hide rather than show numbers belonging
// to a different range.
const cachedStatusCounts = ref(null)

const dateRangeKeyOf = (params) => `${params?.fromDate || ''}|${params?.toDate || ''}`

watchEffect(() => {
  const table = apiTableRef.value
  if (!table || !table.hasFetched) return
  const fetched = table.lastFetchedParams
  if (!fetched || fetched.status) return
  const sc = table.statusCounts
  if (!sc) return
  cachedStatusCounts.value = {
    rangeKey: dateRangeKeyOf(fetched),
    total: sc.total,
    byStatus: { ...sc.byStatus }
  }
})

const statusCounts = computed(() => {
  if (isDedicatedStatusRoute.value) return null
  const cache = cachedStatusCounts.value
  if (!cache || cache.rangeKey !== dateRangeKeyOf(activeFilterParams.value)) return null
  return {
    countFor: (status) => {
      const key = String(status || '').trim().toLowerCase()
      return key ? (cache.byStatus[key] || 0) : cache.total
    }
  }
})

const isDedicatedStatusRoute = computed(() => {
  const p = route.path.toLowerCase()
  return p.includes('/in-progress') || p.includes('/done') || p.includes('/approved')
})

const pageTitle = computed(() => {
  if (selectedStatus.value === 'In Progress') return 'In Progress Applications'
  if (selectedStatus.value === 'Done') return 'Done Applications'
  if (selectedStatus.value === 'Approved') return 'Approved Applications'
  return 'All Application'
})

const pageDescription = computed(() => {
  if (selectedStatus.value === 'In Progress') return 'View and process customer subscription applications currently in progress.'
  if (selectedStatus.value === 'Done') return 'View completed customer subscription applications.'
  if (selectedStatus.value === 'Approved') return 'View verified and approved customer subscription applications.'
  return 'Process customer subscription applications, track status updates, and filter records.'
})

const syncStatusFromRoute = () => {
  const p = route.path.toLowerCase()
  const qStatus = String(route.query.status || '').toLowerCase()
  if (p.includes('/in-progress') || qStatus === 'in-progress' || qStatus === 'in progress') {
    selectedStatus.value = 'In Progress'
  } else if (p.includes('/done') || qStatus === 'done') {
    selectedStatus.value = 'Done'
  } else if (p.includes('/approved') || qStatus === 'approved') {
    selectedStatus.value = 'Approved'
  } else {
    selectedStatus.value = ''
  }
}

watch(() => route.path, () => {
  syncStatusFromRoute()
}, { immediate: true })

const setStatusFilter = (status) => {
  selectedStatus.value = status
}

const formatDateParam = (dateVal, isEnd = false) => {
  if (!dateVal) return undefined
  let d = dateVal
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim()
    if (!trimmed) return undefined
    if (trimmed.includes('T')) return trimmed
    d = new Date(trimmed)
  }
  if (d instanceof Date && !isNaN(d.getTime())) {
    if (isEnd) {
      const endDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
      return endDay.toISOString()
    } else {
      const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
      return startDay.toISOString()
    }
  }
  return undefined
}

const formatDisplayDate = (dateVal) => {
  if (!dateVal) return ''
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal)
  if (d instanceof Date && !isNaN(d.getTime())) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return String(dateVal)
}

const activeFilterParams = computed(() => {
  const params = {}
  // "All" means no status param at all — the request narrows by date only
  if (selectedStatus.value && selectedStatus.value.trim() !== '') {
    params.status = selectedStatus.value.trim()
  }
  // The date range is mandatory: an unbounded /Applications fetch is too heavy
  // for the backend, so a missing bound falls back to the current week even if
  // the UI state was somehow cleared.
  let f = formatDateParam(fromDate.value, false)
  let t = formatDateParam(toDate.value, true)
  if (!f || !t) {
    const week = currentWeekBounds()
    if (!f) f = week.from.toISOString()
    if (!t) t = week.to.toISOString()
  }
  params.fromDate = f
  params.toDate = t
  return params
})

const hasActiveFilter = computed(() => {
  if (isDedicatedStatusRoute.value) {
    return !!fromDate.value || !!toDate.value
  }
  return !!selectedStatus.value || !!fromDate.value || !!toDate.value
})

const activeFilterSummary = computed(() => {
  const parts = []
  if (!isDedicatedStatusRoute.value && selectedStatus.value) {
    parts.push(`Status: ${selectedStatus.value}`)
  }
  if (fromDate.value) parts.push(`From: ${formatDisplayDate(fromDate.value)}`)
  if (toDate.value) parts.push(`To: ${formatDisplayDate(toDate.value)}`)
  return parts.join(' | ')
})

const currentWeekBounds = () => {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1)
  return {
    from: new Date(today.getFullYear(), today.getMonth(), diffToMonday, 0, 0, 0, 0),
    to: new Date(today.getFullYear(), today.getMonth(), diffToMonday + 6, 23, 59, 59, 999)
  }
}

const applyDatePreset = (preset) => {
  // The date filter is mandatory, so re-clicking the active preset keeps it
  // instead of clearing the range
  if (selectedDatePreset.value === preset) return

  selectedDatePreset.value = preset
  const today = new Date()
  if (preset === 'today') {
    fromDate.value = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    toDate.value = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  } else if (preset === 'this_week') {
    const week = currentWeekBounds()
    fromDate.value = week.from
    toDate.value = week.to
  } else if (preset === 'this_month') {
    fromDate.value = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0)
    toDate.value = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
  }
}

// A manual pick is a custom range, so the preset highlight no longer applies.
// (Programmatic assignment from applyDatePreset does not emit this event.)
const onManualDateChange = () => {
  selectedDatePreset.value = ''
}

// The date filter can never be absent: clearing a picker falls back to the week
watch([fromDate, toDate], ([f, t]) => {
  if (!f || !t) {
    const week = currentWeekBounds()
    selectedDatePreset.value = 'this_week'
    fromDate.value = week.from
    toDate.value = week.to
  }
})

// Default to 'This Week' filter on initial load
applyDatePreset('this_week')

const clearAllFilters = () => {
  if (!isDedicatedStatusRoute.value) {
    selectedStatus.value = ''
  }
  // "Cleared" dates mean the default week, never an unbounded range
  selectedDatePreset.value = ''
  applyDatePreset('this_week')
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

.status-tab-count {
  font-size: 0.6875rem;
  line-height: 1;
  padding: 0.2rem 0.35rem;
  min-width: 1.4rem;
}

.hover-tab:hover {
  background-color: var(--bs-primary-bg-subtle, #fef2f3) !important;
  border-color: var(--bs-primary-border-subtle, #fdcfd3) !important;
  color: var(--bs-primary, #e74c5a) !important;
}

.filter-divider {
  font-size: 1.15rem;
  font-weight: 300;
  color: #cbd5e1 !important;
  user-select: none;
  line-height: 1;
}

.date-filter-picker {
  width: 145px;
}

:deep(.date-filter-picker .p-inputtext),
:deep(.date-filter-picker .p-datepicker-input) {
  padding-left: 0.75rem !important;
  padding-right: 2rem !important;
  padding-top: 0.3rem !important;
  padding-bottom: 0.3rem !important;
  font-size: 0.8125rem;
  height: 33px !important;
  border-radius: 8px !important;
}
</style>
