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
        </div>
      </div>

      <!-- Widened-window notice: the date range on screen is not the default one,
           so say which range the rows belong to and offer the week back -->
      <div v-if="autoWidenLabel" class="alert alert-info d-flex align-items-start gap-2 py-2 px-3 mb-0 small rounded-3">
        <i class="pi pi-calendar-clock mt-1"></i>
        <div class="flex-grow-1">
          {{ autoWidenSubject }} dated this week, so the range was widened to
          <strong>{{ autoWidenLabel }}</strong>.
        </div>
        <button
          type="button"
          class="btn btn-sm btn-link p-0 text-decoration-underline fw-semibold flex-shrink-0"
          @click="useDefaultWeek"
        >
          Back to this week
        </button>
      </div>

      <!-- Data Table with standard inside-the-card toolbar Create button -->
      <!-- Status is resolved client-side on every route: /Applications/filter
           answers 13,633 rows for status=Schedule against a 5,000-row list, and a
           status-filtered response cannot tell an empty tab from a status the data
           has never carried. Keeping the whole set loaded feeds the per-tab counts
           and the absent-status hint. -->
      <DynamicApiTable
        ref="apiTableRef"
        endpoint="Applications"
        :filter-params="activeFilterParams"
        client-status-filter
        :hide-create-button="false"
        hide-status-filter
        create-button-label="Create Application"
        :default-sort-order="-1"
        default-sort-field="id"
        @reset-filters="clearAllFilters"
        @select-status="onSelectStatus"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, watchEffect, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import DynamicApiTable from '../components/DynamicApiTable.vue'
import { DATE_PRESETS, CUSTOM_PRESET, resolveDatePreset, currentWeekBounds } from '../utils/dateRangePresets'

const route = useRoute()
const router = useRouter()
const apiTableRef = ref(null)
const fromDatePicker = ref(null)

// PrimeVue opens the overlay when the input takes focus, so focusing it is what
// makes "Custom" do something visible instead of only moving a highlight.
const focusFromDate = () => {
  nextTick(() => {
    const input = fromDatePicker.value?.$el?.querySelector('input')
    if (input) input.focus()
  })
}

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

// The date window is mandatory so the page never renders the whole table at
// once, but a window with nothing in it reads as "the system lost my data": at
// the time of writing the newest application is 11 days old, so the default
// week shows 0 of 5000 records. When the default window comes back empty, step
// it out until the most recent applications are in view and say so.
const DATE_FALLBACK_STEPS = [
  { preset: 'this_month', label: 'this month' },
  { preset: 'last_12_months', label: 'the last 12 months' }
]

const autoWidenStep = ref(-1)        // -1 = still on the default window
const autoWidenEnabled = ref(true)   // a hand-picked range is never overridden
const autoWidenLabel = ref('')

// Named for the tab in view, so a status route does not claim there were no
// applications at all when what it means is none with that status.
const autoWidenSubject = computed(() => {
  const tab = statusTabs.find(t => t.value === selectedStatus.value)
  if (tab && tab.value) return `No ${tab.label.toLowerCase()} applications`
  if (selectedStatus.value) return `No ${selectedStatus.value.toLowerCase()} applications`
  return 'No applications'
})

// Widen only on a settled fetch: `hasFetched` goes false for the duration of a
// request, so an in-flight window is never mistaken for an empty one.
watchEffect(() => {
  const table = apiTableRef.value
  if (!table || !table.hasFetched || !autoWidenEnabled.value) return
  const counts = table.statusCounts
  if (!counts) return
  // The count the active tab would render, not the row count for the window: the
  // loaded set spans every status, so a window can hold rows while the tab shows none.
  if ((counts.countFor(selectedStatus.value) ?? 0) > 0) return
  if (autoWidenStep.value >= DATE_FALLBACK_STEPS.length - 1) return

  const next = DATE_FALLBACK_STEPS[autoWidenStep.value + 1]
  autoWidenStep.value += 1
  autoWidenLabel.value = next.label
  setDateRange(next.preset)
})

const statusCounts = computed(() => {
  if (isDedicatedStatusRoute.value) return null
  const table = apiTableRef.value
  if (!table || !table.hasFetched) return null
  return table.statusCounts || null
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
    // Any other status is one the data actually carries (e.g. 'Schedule', reached
    // from the empty-state hint); matching is case-insensitive downstream.
    selectedStatus.value = String(route.query.status || '').trim()
  }
}

watch([() => route.path, () => route.query.status], () => {
  syncStatusFromRoute()
}, { immediate: true })

const setStatusFilter = (status) => {
  selectedStatus.value = status
}

// Picked from the empty-state hint, so it is a status the loaded set really has:
// leave the dedicated route behind and show it under All Application.
const onSelectStatus = (status) => {
  if (isDedicatedStatusRoute.value) {
    router.push({ path: '/application', query: { status } })
    return
  }
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
  let f = formatDateParam(fromDate.value, false)
  let t = formatDateParam(toDate.value, true)
  if (!f || !t) {
    const week = currentWeekBounds()
    if (!f) f = week.from.toISOString()
    if (!t) t = week.to.toISOString()
  }
  params.fromDate = f
  params.toDate = t

  // Resolved client-side by DynamicApiTable (client-status-filter), never sent
  // upstream: the whole set stays loaded so the tab counts and the absent-status
  // hint can see every status at once.
  if (selectedStatus.value && selectedStatus.value.trim() !== '') {
    params.status = selectedStatus.value.trim()
  }
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

const setDateRange = (preset) => {
  selectedDatePreset.value = preset
  // 'custom' has no range of its own: the pickers already hold what the user chose.
  const range = resolveDatePreset(preset)
  if (!range) return
  fromDate.value = range.from
  toDate.value = range.to
}

const applyDatePreset = (preset) => {
  // Custom hands the range to the From/To pickers. Re-clicking it re-opens the
  // From picker rather than doing nothing, so the button always has an effect.
  if (preset === CUSTOM_PRESET) {
    autoWidenEnabled.value = false
    autoWidenLabel.value = ''
    selectedDatePreset.value = CUSTOM_PRESET
    focusFromDate()
    return
  }

  // The date filter is mandatory, so re-clicking the active preset keeps it
  // instead of clearing the range
  if (selectedDatePreset.value === preset) return

  // Picking a window by hand pins it: an empty result is then the answer, not a
  // problem to fix, so the fallback stands down until the filters are reset.
  autoWidenEnabled.value = false
  autoWidenLabel.value = ''
  setDateRange(preset)
}

/** Drop the widened window and stay on the default week, empty or not. */
const useDefaultWeek = () => {
  autoWidenEnabled.value = false
  autoWidenLabel.value = ''
  setDateRange('this_week')
}

// A manual pick IS the Custom range, so the highlight moves to that button.
// (Programmatic assignment from setDateRange does not emit this event.)
const onManualDateChange = () => {
  selectedDatePreset.value = CUSTOM_PRESET
  autoWidenEnabled.value = false
  autoWidenLabel.value = ''
}

// The date filter can never be absent: clearing a picker falls back to the week
watch([fromDate, toDate], ([f, t]) => {
  if (!f || !t) {
    // No explicit range is the default state, fallback included
    autoWidenEnabled.value = true
    autoWidenStep.value = -1
    autoWidenLabel.value = ''
    setDateRange('this_week')
  }
})

// Switching tabs re-opens the question of which window holds that tab's rows.
watch(selectedStatus, () => {
  if (!autoWidenEnabled.value) return
  autoWidenStep.value = -1
  autoWidenLabel.value = ''
  setDateRange('this_week')
})

// Default to 'This Week' filter on initial load
setDateRange('this_week')

const clearAllFilters = () => {
  if (!isDedicatedStatusRoute.value) {
    selectedStatus.value = ''
  }
  // "Cleared" dates mean the default week, never an unbounded range
  autoWidenEnabled.value = true
  autoWidenStep.value = -1
  autoWidenLabel.value = ''
  setDateRange('this_week')
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
