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
        <!-- Left Side: Status Filter Tabs (Shown only on All Service Orders page) -->
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

        <!-- Tabs keep the first line; the date controls and the page's primary
             action share the next one. -->
        <div class="w-100"></div>

        <!-- Date Range Pickers & Presets, with the page's primary action pinned
             to the right of the same row. -->
        <div class="d-flex align-items-center gap-3 flex-wrap flex-grow-1">
          <!-- Date Range Pickers -->
          <div class="d-flex align-items-center gap-2">
            <span class="small text-secondary fw-semibold text-nowrap">From:</span>
            <DatePicker
              ref="fromDatePicker"
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
          <div class="d-flex align-items-center gap-1.5 ms-sm-1 flex-wrap">
            <button
              v-for="preset in DATE_PRESETS"
              :key="preset.id"
              type="button"
              class="btn-date-preset"
              :class="{ 'active': selectedDatePreset === preset.id }"
              @click="applyDatePreset(preset.id)"
            >
              {{ preset.label }}
            </button>
          </div>

          <Button
            class="p-button-primary p-button-sm rounded-3 px-3 shadow-xs ms-auto fw-semibold d-inline-flex align-items-center gap-1.5 flex-shrink-0"
            aria-label="Create Service Order"
            @click="openCreateDialog"
          >
            <i class="pi pi-plus"></i>
            <span class="d-none d-sm-inline">Create Service Order</span>
            <span class="d-sm-none">Create</span>
          </Button>
        </div>

      </div>

      <!-- Data Table with standard inside-the-card toolbar Create button -->
      <DynamicApiTable
        ref="apiTableRef"
        endpoint="ServiceOrders"
        :filter-params="activeFilterParams"
        client-status-filter
        :show-top-bar="false"
        :hide-create-button="false"
        :create-button-in-toolbar="false"
        hide-status-filter
        create-button-label="Create Service Order"
        @reset-filters="clearAllFilters"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import DynamicApiTable from '../components/DynamicApiTable.vue'
import { DATE_PRESETS, CUSTOM_PRESET, resolveDatePreset } from '../utils/dateRangePresets'

const route = useRoute()
const apiTableRef = ref(null)

// The create form lives in DynamicApiTable; the filter-bar button is just
// another way in to the dialog it already exposes.
const openCreateDialog = () => apiTableRef.value?.openCreateDialog()

const selectedStatus = ref('')
const fromDate = ref(null)
const toDate = ref(null)
const selectedDatePreset = ref('')

const statusTabs = [
  { id: 'all', label: 'All Service Orders', value: '', routePath: '/service-orders', icon: 'pi-list' },
  { id: 'pending', label: 'Pending', value: 'Pending', routePath: '/service-orders/pending', icon: 'pi-clock' },
  { id: 'inprogress', label: 'In Progress', value: 'In Progress', routePath: '/service-orders/inprogress', icon: 'pi-spin pi-spinner' },
  { id: 'resolved', label: 'Resolved', value: 'Resolved', routePath: '/service-orders/resolved', icon: 'pi-check-circle' },
  { id: 'completed', label: 'Completed', value: 'Completed', routePath: '/service-orders/completed', icon: 'pi-verified' },
  { id: 'cancelled', label: 'Cancelled', value: 'Cancelled', routePath: '/service-orders/cancelled', icon: 'pi-ban' }
]

// Counts for the status tabs, computed by the table over the set it already holds
const statusCounts = computed(() => {
  if (isDedicatedStatusRoute.value) return null
  const table = apiTableRef.value
  if (!table || !table.hasFetched) return null
  return table.statusCounts || null
})

const isDedicatedStatusRoute = computed(() => {
  const p = route.path.toLowerCase()
  return p.includes('/pending') || p.includes('/inprogress') || p.includes('/resolved') || p.includes('/completed') || p.includes('/cancelled')
})

const pageTitle = computed(() => {
  const lower = (selectedStatus.value || '').toLowerCase()
  if (lower === 'pending') return 'Pending Service Orders'
  if (lower === 'in progress' || lower === 'inprogress') return 'In Progress Service Orders'
  if (lower === 'resolved') return 'Resolved Service Orders'
  if (lower === 'completed') return 'Completed Service Orders'
  if (lower === 'cancelled') return 'Cancelled Service Orders'
  return 'All Service Orders'
})

const pageDescription = computed(() => {
  const lower = (selectedStatus.value || '').toLowerCase()
  if (lower === 'pending') return 'View and process pending subscriber service tickets and technical support requests.'
  if (lower === 'in progress' || lower === 'inprogress') return 'Track active field dispatches, repairs, and technical support visits in progress.'
  if (lower === 'resolved') return 'Review resolved service orders pending subscriber confirmation or final sign-off.'
  if (lower === 'completed') return 'View completed subscriber repair tickets, maintenance jobs, and field service visits.'
  if (lower === 'cancelled') return 'View cancelled service tickets and discontinued field service requests.'
  return 'Manage subscriber repair requests, technical support tickets, field dispatch visits, and equipment pullouts.'
})

const syncStatusFromRoute = () => {
  const p = route.path.toLowerCase()
  const qStatus = String(route.query.status || '').toLowerCase()
  if (p.includes('/pending') || qStatus === 'pending') {
    selectedStatus.value = 'Pending'
  } else if (p.includes('/inprogress') || qStatus === 'inprogress' || qStatus === 'in progress' || qStatus === 'in-progress') {
    selectedStatus.value = 'In Progress'
  } else if (p.includes('/resolved') || qStatus === 'resolved') {
    selectedStatus.value = 'Resolved'
  } else if (p.includes('/completed') || qStatus === 'completed') {
    selectedStatus.value = 'Completed'
  } else if (p.includes('/cancelled') || qStatus === 'cancelled') {
    selectedStatus.value = 'Cancelled'
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

const activeFilterParams = computed(() => {
  const params = {}
  if (selectedStatus.value && selectedStatus.value.trim() !== '') {
    params.status = selectedStatus.value.trim()
  }
  const f = formatDateParam(fromDate.value, false)
  if (f) params.fromDate = f
  const t = formatDateParam(toDate.value, true)
  if (t) params.toDate = t
  return params
})

const fromDatePicker = ref(null)

// PrimeVue opens the overlay when the input takes focus, so focusing it is what
// makes "Custom" do something visible instead of only moving a highlight.
const focusFromDate = () => {
  nextTick(() => {
    const input = fromDatePicker.value?.$el?.querySelector('input')
    if (input) input.focus()
  })
}

const applyDatePreset = (preset) => {
  // Custom hands the range to the From/To pickers, so it keeps whatever is in
  // them and re-opens the From picker instead of clearing on a second click.
  if (preset === CUSTOM_PRESET) {
    selectedDatePreset.value = CUSTOM_PRESET
    focusFromDate()
    return
  }

  if (selectedDatePreset.value === preset) {
    selectedDatePreset.value = ''
    fromDate.value = null
    toDate.value = null
    return
  }

  selectedDatePreset.value = preset
  const range = resolveDatePreset(preset)
  if (!range) return
  fromDate.value = range.from
  toDate.value = range.to
}

// A manual pick IS the Custom range, so the highlight moves to that button.
// (Programmatic assignment from applyDatePreset does not emit this event.)
const onManualDateChange = () => {
  selectedDatePreset.value = CUSTOM_PRESET
}

// Default to 'This Week' filter on initial load
applyDatePreset('this_week')

const clearAllFilters = () => {
  if (!isDedicatedStatusRoute.value) {
    selectedStatus.value = ''
  }
  selectedDatePreset.value = ''
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
