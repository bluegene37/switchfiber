// Gene - Nov, 27, 2026: Shared list-view date preset, auto-widen fallback, and status tab filter composable extracted in Phase 1 modular refactor
import { ref, watch, watchEffect, nextTick } from 'vue'
import { CUSTOM_PRESET, resolveDatePreset } from '../utils/dateRangePresets.js'
import { formatDateParam } from '../utils/formatters.js'

/**
 * Shared date preset, picker focus, manual range, and auto-widening state for list views.
 * @param {{
 *   defaultPreset?: string,
 *   mandatoryDate?: boolean,
 *   fallbackSteps?: Array<{ preset: string, label: string }>,
 *   apiTableRef?: any,
 *   selectedStatus?: any,
 *   resetWatchSources?: Array<any>
 * }} [options]
 */
export function useListDateFilters({
  defaultPreset = 'this_week',
  mandatoryDate = false,
  fallbackSteps = [],
  apiTableRef = null,
  selectedStatus = null,
  resetWatchSources = []
} = {}) {
  const fromDate = ref(null)
  const toDate = ref(null)
  const selectedDatePreset = ref('')
  const fromDatePicker = ref(null)

  const autoWidenStep = ref(-1)
  const autoWidenEnabled = ref(Boolean(mandatoryDate && fallbackSteps.length))
  const autoWidenLabel = ref('')

  // PrimeVue opens the overlay when the input takes focus, so focusing it makes
  // "Custom" open the picker rather than only toggling the active button state.
  const focusFromDate = () => {
    nextTick(() => {
      const input = fromDatePicker.value?.$el?.querySelector?.('input')
      if (input) input.focus()
    })
  }

  const setDateRange = (preset) => {
    selectedDatePreset.value = preset
    const range = resolveDatePreset(preset)
    if (!range) return
    fromDate.value = range.from
    toDate.value = range.to
  }

  const applyDatePreset = (preset) => {
    if (preset === CUSTOM_PRESET) {
      autoWidenEnabled.value = false
      autoWidenLabel.value = ''
      selectedDatePreset.value = CUSTOM_PRESET
      focusFromDate()
      return
    }

    if (selectedDatePreset.value === preset) {
      if (mandatoryDate) return
      selectedDatePreset.value = ''
      fromDate.value = null
      toDate.value = null
      return
    }

    autoWidenEnabled.value = false
    autoWidenLabel.value = ''
    setDateRange(preset)
  }

  const onManualDateChange = () => {
    selectedDatePreset.value = CUSTOM_PRESET
    autoWidenEnabled.value = false
    autoWidenLabel.value = ''
  }

  const searchAllDates = () => {
    autoWidenEnabled.value = false
    autoWidenLabel.value = ''
    setDateRange('last_12_months')
  }

  const useDefaultWeek = () => {
    autoWidenEnabled.value = false
    autoWidenLabel.value = ''
    setDateRange('this_week')
  }

  const resetDateFilters = () => {
    if (mandatoryDate) {
      autoWidenEnabled.value = Boolean(fallbackSteps.length)
      autoWidenStep.value = -1
      autoWidenLabel.value = ''
      setDateRange(defaultPreset)
      return
    }
    selectedDatePreset.value = ''
    fromDate.value = null
    toDate.value = null
  }

  if (mandatoryDate) {
    watch([fromDate, toDate], ([f, t]) => {
      if (!f || !t) {
        autoWidenEnabled.value = Boolean(fallbackSteps.length)
        autoWidenStep.value = -1
        autoWidenLabel.value = ''
        setDateRange(defaultPreset)
      }
    })

    if (fallbackSteps.length && apiTableRef) {
      watchEffect(() => {
        const table = apiTableRef.value
        if (!table || !table.hasFetched || !autoWidenEnabled.value) return
        const counts = table.statusCounts
        if (!counts) return
        if ((counts.countFor(selectedStatus?.value ?? '') ?? 0) > 0) return
        if (autoWidenStep.value >= fallbackSteps.length - 1) return

        const next = fallbackSteps[autoWidenStep.value + 1]
        autoWidenStep.value += 1
        autoWidenLabel.value = next.label
        setDateRange(next.preset)
      })
    }

    if (resetWatchSources.length) {
      watch(resetWatchSources, () => {
        if (!autoWidenEnabled.value) return
        autoWidenStep.value = -1
        autoWidenLabel.value = ''
        setDateRange(defaultPreset)
      })
    }

    if (defaultPreset) {
      setDateRange(defaultPreset)
    }
  } else if (defaultPreset) {
    applyDatePreset(defaultPreset)
  }

  return {
    fromDate,
    toDate,
    selectedDatePreset,
    fromDatePicker,
    autoWidenStep,
    autoWidenEnabled,
    autoWidenLabel,
    focusFromDate,
    setDateRange,
    applyDatePreset,
    onManualDateChange,
    searchAllDates,
    useDefaultWeek,
    resetDateFilters,
    formatDateParam
  }
}

/**
 * Shared status tab active-check and route-aware tab selection helpers.
 * @param {{
 *   selectedStatus: any,
 *   isDedicatedStatusRoute: any,
 *   router: any,
 *   basePath: string,
 *   normalize?: (v: any) => string
 * }} options
 */
export function useStatusTabNavigation({
  selectedStatus,
  isDedicatedStatusRoute,
  router,
  basePath,
  normalize = (v) => String(v || '').trim().toLowerCase()
}) {
  const isActiveTab = (value) => normalize(selectedStatus.value) === normalize(value)

  const setStatusFilter = (status) => {
    if (isDedicatedStatusRoute.value) {
      router.push(status ? { path: basePath, query: { status } } : { path: basePath })
      return
    }
    selectedStatus.value = status
  }

  const onSelectStatus = (status) => setStatusFilter(status)

  return {
    isActiveTab,
    setStatusFilter,
    onSelectStatus
  }
}
