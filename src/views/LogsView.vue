<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">{{ config.title }}</h1>
        <p class="small text-secondary mt-1 mb-0">{{ config.description }}</p>
      </div>
    </div>

    <!-- Main Card Container: Filter Controls & Data Table -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 d-flex flex-column gap-3">
      <!-- Filter Controls — only rendered for the sub-endpoints that take
           parameters; the unfiltered "All" screens go straight to the table. -->
      <div
        v-if="config.filter !== 'none'"
        class="d-flex align-items-center justify-content-start flex-wrap gap-3 pb-2 border-bottom"
      >
        <!-- Entity selector (Entity & Date endpoints) -->
        <div v-if="config.filter === 'entity'" class="d-flex align-items-center gap-2">
          <span class="small text-secondary fw-semibold text-nowrap">Entity:</span>
          <Select
            v-model="selectedEntity"
            :options="entityOptions"
            :loading="entityOptionsLoading"
            :placeholder="entityOptionsLoading ? 'Loading entities…' : 'Select entity'"
            emptyMessage="No entities found in the logs"
            size="small"
            showClear
            filter
            class="log-filter-select"
          />
        </div>

        <!-- User selector (User & Date endpoints) -->
        <div v-if="config.filter === 'user'" class="d-flex align-items-center gap-2">
          <span class="small text-secondary fw-semibold text-nowrap">User:</span>
          <Select
            v-model="selectedUsername"
            :options="usernameOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select user"
            size="small"
            showClear
            filter
            class="log-filter-select"
          />
        </div>

        <!-- Vertical Divider (shown once a selector precedes the dates) -->
        <div v-if="config.filter !== 'date'" class="d-none d-lg-block filter-divider text-muted mx-1">|</div>

        <!-- Date Range Pickers & Presets -->
        <div class="d-flex align-items-center gap-3 flex-wrap">
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
            />
          </div>

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

      <!-- The entity / user endpoints return nothing at all without their
           selector, so prompt for it rather than showing a table that is empty
           for a reason the screen never states. -->
      <div v-if="!isFilterSatisfied" class="p-5 text-center text-secondary">
        <i class="pi pi-filter text-secondary d-block mb-3" style="font-size: 2rem; opacity: 0.4;"></i>
        <p class="mb-0 small">{{ filterPrompt }}</p>
      </div>

      <!-- Logs are written by the API and carry no usable key (every row's `id`
           comes back as 0), so this is a browse-only surface. -->
      <DynamicApiTable
        v-else
        :endpoint="config.endpoint"
        :filter-endpoint="config.filterEndpoint"
        :filter-params="activeFilterParams"
        :key="route.path"
        read-only
        default-sort-field="timestamp"
        :default-sort-order="-1"
        @reset-filters="clearAllFilters"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import DynamicApiTable from '../components/DynamicApiTable.vue'
import { useLogTrailStore } from '../stores/logTrails'
import { useLogErrorStore } from '../stores/logErrors'
import { useUserStore } from '../stores/users'

const route = useRoute()
const logTrailStore = useLogTrailStore()
const logErrorStore = useLogErrorStore()
const userStore = useUserStore()

/**
 * One entry per Audit Trail / Error Logs sub-endpoint.
 *
 * `filter` decides which controls the screen renders and which query parameters
 * it sends; `filterEndpoint` is the API path DynamicApiTable calls once any
 * parameter is set. The two families are identical apart from the plain date
 * range, which the API names GetLogsByTransactionDate on LogTrail and
 * GetLogsByDateRange on LogError.
 */
const routeMap = {
  '/logs/audit-trail': {
    title: 'All Audit Trail',
    source: 'trail',
    endpoint: 'LogTrail',
    filterEndpoint: null,
    filter: 'none',
    description: 'Every recorded transaction across the system, newest first.'
  },
  '/logs/audit-trail/by-date': {
    title: 'Audit Trail by Transaction Date',
    source: 'trail',
    endpoint: 'LogTrail',
    filterEndpoint: 'LogTrail/GetLogsByTransactionDate',
    filter: 'date',
    description: 'Recorded transactions within a chosen date range.'
  },
  '/logs/audit-trail/by-entity': {
    title: 'Audit Trail by Entity',
    source: 'trail',
    endpoint: 'LogTrail',
    filterEndpoint: 'LogTrail/GetLogsByEntityAndDate',
    filter: 'entity',
    description: 'Recorded transactions for a single entity within a date range.'
  },
  '/logs/audit-trail/by-user': {
    title: 'Audit Trail by User',
    source: 'trail',
    endpoint: 'LogTrail',
    filterEndpoint: 'LogTrail/GetLogsByUserAndDate',
    filter: 'user',
    description: 'Recorded transactions performed by a single user within a date range.'
  },
  '/logs/error-logs': {
    title: 'All Error Logs',
    source: 'error',
    endpoint: 'LogError',
    filterEndpoint: null,
    filter: 'none',
    description: 'Every error the API has recorded, newest first.'
  },
  '/logs/error-logs/by-date': {
    title: 'Error Logs by Date Range',
    source: 'error',
    endpoint: 'LogError',
    filterEndpoint: 'LogError/GetLogsByDateRange',
    filter: 'date',
    description: 'Recorded errors within a chosen date range.'
  },
  '/logs/error-logs/by-entity': {
    title: 'Error Logs by Entity',
    source: 'error',
    endpoint: 'LogError',
    filterEndpoint: 'LogError/GetLogsByEntityAndDate',
    filter: 'entity',
    description: 'Recorded errors for a single entity within a date range.'
  },
  '/logs/error-logs/by-user': {
    title: 'Error Logs by User',
    source: 'error',
    endpoint: 'LogError',
    filterEndpoint: 'LogError/GetLogsByUserAndDate',
    filter: 'user',
    description: 'Recorded errors raised by a single user within a date range.'
  }
}

const config = computed(() => routeMap[route.path] || routeMap['/logs/audit-trail'])

// The Entity dropdown is grouped out of the downloaded log data itself: the
// by-entity screens download the full log list once, and the distinct entity
// values found in it become the options. While that download is in flight the
// dropdown shows a loading state.
const logStore = computed(() => (config.value.source === 'error' ? logErrorStore : logTrailStore))

const entityOptions = computed(() => logStore.value.entities)
const entityOptionsLoading = computed(() => logStore.value.isLoading)

const ensureEntityData = () => {
  if (config.value.filter !== 'entity') return
  if (config.value.source === 'error') {
    if (logErrorStore.logErrors.length === 0 && !logErrorStore.isLoading) {
      logErrorStore.fetchLogErrors()
    }
  } else if (logTrailStore.logTrails.length === 0 && !logTrailStore.isLoading) {
    logTrailStore.fetchLogTrails()
  }
}

const selectedEntity = ref(null)
const selectedUsername = ref(null)
const fromDate = ref(null)
const toDate = ref(null)
const selectedDatePreset = ref('')

const usernameOptions = computed(() =>
  (userStore.users || [])
    .map(u => {
      const username = u.username || u.userName || ''
      if (!username) return null
      const fullName = [u.fname, u.lname].filter(Boolean).join(' ')
      return { value: username, label: fullName ? `${username} — ${fullName}` : username }
    })
    .filter(Boolean)
)

/** Start of day / end of day as an ISO string, matching the API's DateFrom / DateTo. */
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
    const bound = isEnd
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
      : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    return bound.toISOString()
  }
  return undefined
}

const activeFilterParams = computed(() => {
  if (config.value.filter === 'none') return {}

  const params = {}
  if (config.value.filter === 'entity' && selectedEntity.value) {
    params.Entity = selectedEntity.value
  }
  if (config.value.filter === 'user' && selectedUsername.value) {
    params.Username = selectedUsername.value
  }
  const from = formatDateParam(fromDate.value, false)
  if (from) params.DateFrom = from
  const to = formatDateParam(toDate.value, true)
  if (to) params.DateTo = to
  return params
})

// An entity or user endpoint called without its selector returns an empty array,
// which would read as "no logs" instead of "nothing chosen yet".
const isFilterSatisfied = computed(() => {
  if (config.value.filter === 'entity') return !!selectedEntity.value
  if (config.value.filter === 'user') return !!selectedUsername.value
  return true
})

const filterPrompt = computed(() =>
  config.value.filter === 'entity'
    ? 'Select an entity to load its log records.'
    : 'Select a user to load their log records.'
)

const applyDatePreset = (preset) => {
  if (selectedDatePreset.value === preset) {
    selectedDatePreset.value = ''
    fromDate.value = null
    toDate.value = null
    return
  }

  selectedDatePreset.value = preset
  const today = new Date()
  if (preset === 'today') {
    fromDate.value = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    toDate.value = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  } else if (preset === 'this_week') {
    const day = today.getDay()
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1)
    fromDate.value = new Date(today.getFullYear(), today.getMonth(), diffToMonday, 0, 0, 0, 0)
    toDate.value = new Date(today.getFullYear(), today.getMonth(), diffToMonday + 6, 23, 59, 59, 999)
  } else if (preset === 'this_month') {
    fromDate.value = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0)
    toDate.value = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
  }
}

// Default to 'This Month' — logs accumulate per request, so a wider default
// window than the Job Orders screens still lands on a readable set.
applyDatePreset('this_month')

const clearAllFilters = () => {
  selectedEntity.value = null
  selectedUsername.value = null
  selectedDatePreset.value = ''
  fromDate.value = null
  toDate.value = null
}

watch(() => route.path, () => {
  selectedEntity.value = null
  selectedUsername.value = null
  ensureEntityData()
})

onMounted(() => {
  ensureEntityData()
  if (!userStore.users || userStore.users.length === 0) {
    userStore.fetchUsers().catch(() => {})
  }
})
</script>

<style scoped>
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

.log-filter-select {
  width: 220px;
}

:deep(.date-filter-picker .p-inputtext),
:deep(.date-filter-picker .p-datepicker-input),
:deep(.log-filter-select .p-select-label) {
  padding-left: 0.75rem !important;
  padding-right: 2rem !important;
  padding-top: 0.3rem !important;
  padding-bottom: 0.3rem !important;
  font-size: 0.8125rem;
  height: 33px !important;
  border-radius: 8px !important;
}

:deep(.log-filter-select) {
  height: 33px !important;
  border-radius: 8px !important;
}
</style>
