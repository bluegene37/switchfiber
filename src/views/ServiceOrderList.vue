<template>
  <div class="d-flex flex-column gap-4 sfa-tracker-service-order-list">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 sfa-tracker-service-order-list-header">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">{{ pageTitle }}</h1>
        <p class="small text-secondary mt-1 mb-0">{{ pageDescription }}</p>
      </div>
    </div>

    <!-- Main Card Container: Filter Tabs & Data Table -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 d-flex flex-column gap-3 sfa-tracker-service-order-list-card">
      <!-- Unified Filter Controls (Status Tabs on Left | Date Range right after divider) -->
      <div class="d-flex align-items-center justify-content-start flex-wrap gap-3 pb-2 border-bottom sfa-tracker-service-order-list-filters">
        <!-- Left Side: Status Filter Tabs (Shown only on All Service Orders page) -->
        <div v-if="!isDedicatedStatusRoute" class="d-flex align-items-center gap-2 overflow-x-auto filter-tabs-scrollable flex-shrink-0 sfa-tracker-service-order-list-status-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab.id"
            type="button"
            class="btn btn-sm d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1.5 fw-medium text-nowrap status-tab-btn"
            :class="[
              isActiveTab(tab.value)
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
              :class="isActiveTab(tab.value)
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

      <!-- Data Table with standard inside-the-card toolbar Create button.
           Service Orders have no `status` column: the lifecycle the tabs and the
           sidebar sub-menu follow is `visitStatus`, hence `status-field`. -->
      <DynamicApiTable
        ref="apiTableRef"
        endpoint="ServiceOrders"
        :filter-params="activeFilterParams"
        client-status-filter
        status-field="visitStatus"
        :status-label="selectedStatus"
        :show-top-bar="false"
        :hide-create-button="false"
        :create-button-in-toolbar="false"
        hide-status-filter
        create-button-label="Create Service Order"
        @reset-filters="clearAllFilters"
        @select-status="onSelectStatus"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import DynamicApiTable from '../components/DynamicApiTable.vue'
import { DATE_PRESETS, CUSTOM_PRESET, resolveDatePreset } from '../utils/dateRangePresets'

const route = useRoute()
const router = useRouter()
const apiTableRef = ref(null)

// The create form lives in DynamicApiTable; the filter-bar button is just
// another way in to the dialog it already exposes.
const openCreateDialog = () => apiTableRef.value?.openCreateDialog()

const selectedStatus = ref('')
const fromDate = ref(null)
const toDate = ref(null)
const selectedDatePreset = ref('')

// The lifecycle Service Orders keep in `visitStatus` — the same three statuses the
// sidebar sub-menu offers. Values are spelled the way the data carries them
// ('In Progress' with a space, unlike Job Orders' 'Inprogress'); 'Scheduled' is
// what the create form writes for a new visit. Matching downstream is
// case- and space-insensitive.
const statusTabs = [
  { id: 'all', label: 'All Service Orders', value: '', routePath: '/service-orders', icon: 'pi-list' },
  { id: 'inprogress', label: 'In Progress', value: 'In Progress', routePath: '/service-orders/inprogress', icon: 'pi-clock' },
  { id: 'scheduled', label: 'Scheduled', value: 'Scheduled', routePath: '/service-orders/scheduled', icon: 'pi-calendar' },
  { id: 'done', label: 'Done', value: 'Done', routePath: '/service-orders/done', icon: 'pi-check-circle' }
]

// Status per /service-orders/<slug>. The first three have sidebar entries; the
// rest are legacy routes kept alive for old links, and the empty state explains
// when the data carries no such status.
const ROUTE_STATUS = {
  inprogress: 'In Progress',
  scheduled: 'Scheduled',
  done: 'Done',
  pending: 'Pending',
  resolved: 'Resolved',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

const normStatus = (s) => String(s || '').trim().toLowerCase().replace(/[\s_-]+/g, '')

const routeStatusSlug = () => {
  const m = String(route.path || '').toLowerCase().match(/^\/service-orders\/([^/?#]+)/)
  return m ? m[1] : ''
}

const isActiveTab = (value) => normStatus(selectedStatus.value) === normStatus(value)

// Counts for the status tabs, computed by the table over the set it already holds
const statusCounts = computed(() => {
  if (isDedicatedStatusRoute.value) return null
  const table = apiTableRef.value
  if (!table || !table.hasFetched) return null
  return table.statusCounts || null
})

const isDedicatedStatusRoute = computed(() => !!ROUTE_STATUS[routeStatusSlug()])

const pageTitle = computed(() => {
  const status = String(selectedStatus.value || '').trim()
  return status ? `${status} Service Orders` : 'All Service Orders'
})

const STATUS_DESCRIPTIONS = {
  inprogress: 'Track active field dispatches, repairs, and technical support visits in progress.',
  scheduled: 'View service visits scheduled for a technician but not yet started.',
  done: 'View completed subscriber repair tickets, maintenance jobs, and field service visits.'
}

const pageDescription = computed(() => {
  const key = normStatus(selectedStatus.value)
  if (!key) return 'Manage subscriber repair requests, technical support tickets, field dispatch visits, and equipment pullouts.'
  return STATUS_DESCRIPTIONS[key] || `View service orders whose visit status is ${selectedStatus.value}.`
})

// A dedicated route names its status; on the All page a `?status=` query (from
// a tab, a bookmark, or the empty-state hint) does, spelled back to the tab's
// value when it matches one so the heading reads like the tab.
const syncStatusFromRoute = () => {
  const slugStatus = ROUTE_STATUS[routeStatusSlug()]
  if (slugStatus) {
    selectedStatus.value = slugStatus
    return
  }
  const q = String(route.query.status || '').trim()
  const tab = statusTabs.find(t => t.value && normStatus(t.value) === normStatus(q))
  selectedStatus.value = tab ? tab.value : q
}

watch([() => route.path, () => route.query.status], () => {
  syncStatusFromRoute()
}, { immediate: true })

// Clicking a tab filters in place. On a dedicated /service-orders/<status> route it
// also leaves that route behind, so the URL never disagrees with the tab strip.
const setStatusFilter = (status) => {
  if (isDedicatedStatusRoute.value) {
    router.push(status ? { path: '/service-orders', query: { status } } : { path: '/service-orders' })
    return
  }
  selectedStatus.value = status
}

// Picked from the empty-state hint — same destination as clicking its tab.
const onSelectStatus = (status) => setStatusFilter(status)

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
