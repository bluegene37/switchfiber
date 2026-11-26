// Gene - Nov, 27, 2026: Unit tests for Phase 1 extracted modules (formatters, leafletMapHelpers, useColumnResizer, useListDateStatusFilters)
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ref, computed } from 'vue'
import {
  pad,
  formatDateParam,
  formatLocalYmd,
  formatFileTimestamp,
  formatShortDate,
  formatDateTime,
  rgbaOf
} from '../src/utils/formatters.js'
import {
  FALLBACK_MAP_CENTER,
  LEAFLET_TILE_LAYERS,
  escapeHtml,
  resolveTileLayerSpec,
  applyLeafletBaseLayer,
  hashLcpColor,
  lcpHue,
  lcpHslColor
} from '../src/utils/leafletMapHelpers.js'
import {
  DEFAULT_MIN_RESIZABLE_COL_WIDTH,
  DEFAULT_MAX_RESIZABLE_COL_WIDTH,
  stopColumnResizerClick,
  useColumnResizer
} from '../src/composables/useColumnResizer.js'
import {
  useListDateFilters,
  useStatusTabNavigation
} from '../src/composables/useListDateStatusFilters.js'
import { CUSTOM_PRESET } from '../src/utils/dateRangePresets.js'

describe('Phase 1 formatters.js', () => {
  test('pad zero-pads numbers and supports custom widths', () => {
    assert.equal(pad(5), '05')
    assert.equal(pad(12), '12')
    assert.equal(pad(7, 3), '007')
  })

  test('formatDateParam builds start-of-day and end-of-day ISO bounds and preserves pre-formatted ISO strings', () => {
    assert.equal(formatDateParam(null), undefined)
    assert.equal(formatDateParam('   '), undefined)
    assert.equal(formatDateParam('2026-11-27T10:00:00.000Z'), '2026-11-27T10:00:00.000Z')

    const d = new Date(2026, 10, 27, 14, 30, 0)
    const startIso = formatDateParam(d, false)
    const endIso = formatDateParam(d, true)
    assert.equal(startIso, new Date(2026, 10, 27, 0, 0, 0, 0).toISOString())
    assert.equal(endIso, new Date(2026, 10, 27, 23, 59, 59, 999).toISOString())
  })

  test('formatLocalYmd and formatFileTimestamp format dates predictably', () => {
    assert.equal(formatLocalYmd(null), '')
    assert.equal(formatLocalYmd('not-a-date'), 'not-a-date')
    assert.equal(formatLocalYmd(new Date(2026, 10, 5, 9, 8, 7)), '2026-11-05')
    assert.equal(formatFileTimestamp(new Date(2026, 10, 5, 9, 8, 7)), '20261105_090807')
  })

  test('formatShortDate and formatDateTime handle empty, invalid, and valid dates', () => {
    assert.equal(formatShortDate(null), '—')
    assert.equal(formatShortDate('invalid-date-string'), 'invalid-da')
    assert.ok(formatShortDate('2026-11-27T08:00:00Z').includes('2026'))

    assert.equal(formatDateTime(''), 'unknown date')
    assert.equal(formatDateTime('raw-unparsed'), 'raw-unparsed')
    assert.ok(formatDateTime('2026-11-27T08:00:00Z').includes('2026'))
  })

  test('rgbaOf converts 3-digit and 6-digit hex strings and falls back safely', () => {
    assert.equal(rgbaOf('#fff', 0.5), 'rgba(255, 255, 255, 0.5)')
    assert.equal(rgbaOf('#0f4c81', 0.25), 'rgba(15, 76, 129, 0.25)')
    assert.equal(rgbaOf('invalid', 0.4), 'rgba(100, 116, 139, 0.4)')
  })
})

describe('Phase 1 leafletMapHelpers.js', () => {
  test('escapeHtml neutralizes HTML markup', () => {
    assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    assert.equal(escapeHtml(null), '')
    assert.deepEqual(FALLBACK_MAP_CENTER, [14.4655, 121.1922])
  })

  test('resolveTileLayerSpec selects light, dark, and satellite layers', () => {
    assert.equal(resolveTileLayerSpec({ mode: 'street', isDark: false }), LEAFLET_TILE_LAYERS.streetLight)
    assert.equal(resolveTileLayerSpec({ mode: 'street', isDark: true }), LEAFLET_TILE_LAYERS.streetDark)
    assert.equal(resolveTileLayerSpec({ mode: 'satellite', isDark: true }), LEAFLET_TILE_LAYERS.satellite)
  })

  test('applyLeafletBaseLayer removes prior layer and attaches resolved layer', () => {
    const removed = []
    const addedTo = []
    const mockLayer = { id: 'next-layer', addTo: (m) => { addedTo.push(m); return mockLayer } }
    const fakeL = {
      calls: [],
      tileLayer(url, options) {
        this.calls.push({ url, options })
        return mockLayer
      }
    }
    const fakeMap = {
      removeLayer: (layer) => removed.push(layer)
    }
    const prevLayer = { id: 'old-layer' }

    const next = applyLeafletBaseLayer({
      L: fakeL,
      map: fakeMap,
      currentLayer: prevLayer,
      mode: 'satellite',
      isDark: false
    })

    assert.equal(next, mockLayer)
    assert.deepEqual(removed, [prevLayer])
    assert.deepEqual(addedTo, [fakeMap])
    assert.equal(fakeL.calls[0].url, LEAFLET_TILE_LAYERS.satellite.url)
  })

  test('hashLcpColor and lcpHslColor are deterministic', () => {
    assert.equal(hashLcpColor(''), '#6c757d')
    assert.equal(hashLcpColor('LCP-01'), hashLcpColor(' lcp-01 '))
    assert.equal(lcpHue('LCP-12'), lcpHue('12'))
    assert.match(lcpHslColor('LCP-12'), /^hsl\(\d+, 62%, 44%\)$/)
  })
})

describe('Phase 1 useColumnResizer.js', () => {
  test('stopColumnResizerClick calls stopPropagation safely', () => {
    let stopped = false
    stopColumnResizerClick({ stopPropagation: () => { stopped = true } })
    assert.equal(stopped, true)
    assert.doesNotThrow(() => stopColumnResizerClick(null))
  })

  test('useColumnResizer exposes expected PT bindings and clamps drag indicator with listener cleanup', () => {
    const listeners = new Map()
    const origWindow = globalThis.window
    globalThis.window = {
      scrollX: 0,
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: (type) => listeners.delete(type)
    }

    try {
      const resizeHelperEl = { style: { display: 'block', left: '100px' } }
      const dtEl = {
        scrollLeft: 0,
        getBoundingClientRect: () => ({ left: 0 }),
        querySelector: () => resizeHelperEl
      }
      const attrs = new Map()
      const headerEl = {
        style: { minWidth: '150px' },
        getBoundingClientRect: () => ({ width: 200 }),
        setAttribute: (k, v) => attrs.set(k, v),
        closest: () => dtEl
      }
      const resizerEl = { closest: () => headerEl }

      const { onColumnResizerMouseDown, dataTableResizePt, getColumnResizePt } = useColumnResizer({
        recordStartWidthAttr: true
      })

      assert.equal(dataTableResizePt.column.columnResizer.onMousedown, onColumnResizerMouseDown)
      assert.equal(getColumnResizePt('name').headerCell['data-sfa-col'], 'name')

      onColumnResizerMouseDown({ currentTarget: resizerEl, pageX: 200 })
      assert.equal(headerEl.style.minWidth, '')
      assert.equal(attrs.get('data-sfa-start-width'), '200')
      assert.ok(listeners.has('mousemove'))
      assert.ok(listeners.has('mouseup'))

      // Shrink below minWidth (72px -> minHelperX = 72)
      resizeHelperEl.style.left = '10px'
      listeners.get('mousemove')({ pageX: 10 })
      assert.equal(resizeHelperEl.style.left, `${DEFAULT_MIN_RESIZABLE_COL_WIDTH}px`)

      // Expand past maxWidth (960px -> maxHelperX = 960)
      resizeHelperEl.style.left = '1500px'
      listeners.get('mouseup')({ pageX: 1500 })
      assert.equal(resizeHelperEl.style.left, `${DEFAULT_MAX_RESIZABLE_COL_WIDTH}px`)
      assert.equal(listeners.size, 0, 'Both window listeners removed on mouseup')
    } finally {
      if (origWindow === undefined) delete globalThis.window
      else globalThis.window = origWindow
    }
  })
})

describe('Phase 1 useListDateStatusFilters.js', () => {
  test('useListDateFilters handles non-mandatory toggle, CUSTOM_PRESET, and resetDateFilters', () => {
    const state = useListDateFilters({ defaultPreset: 'this_week', mandatoryDate: false })
    assert.equal(state.selectedDatePreset.value, 'this_week')
    assert.ok(state.fromDate.value instanceof Date)
    assert.ok(state.toDate.value instanceof Date)

    // Re-clicking active preset clears dates when not mandatory
    state.applyDatePreset('this_week')
    assert.equal(state.selectedDatePreset.value, '')
    assert.equal(state.fromDate.value, null)
    assert.equal(state.toDate.value, null)

    state.onManualDateChange()
    assert.equal(state.selectedDatePreset.value, CUSTOM_PRESET)

    state.resetDateFilters()
    assert.equal(state.selectedDatePreset.value, '')
    assert.equal(state.fromDate.value, null)
  })

  test('useListDateFilters enforces mandatory date range and resets to defaultPreset', () => {
    const selectedStatus = ref('')
    const state = useListDateFilters({
      defaultPreset: 'this_week',
      mandatoryDate: true,
      fallbackSteps: [{ preset: 'this_month', label: 'this month' }],
      selectedStatus
    })

    // Re-clicking active preset keeps range when mandatoryDate is true
    state.applyDatePreset('this_week')
    assert.equal(state.selectedDatePreset.value, 'this_week')
    assert.ok(state.fromDate.value instanceof Date)

    state.searchAllDates()
    assert.equal(state.selectedDatePreset.value, 'last_12_months')
    assert.equal(state.autoWidenEnabled.value, false)

    state.useDefaultWeek()
    assert.equal(state.selectedDatePreset.value, 'this_week')

    state.resetDateFilters()
    assert.equal(state.autoWidenEnabled.value, true)
    assert.equal(state.selectedDatePreset.value, 'this_week')
  })

  test('useStatusTabNavigation handles in-place vs dedicated route transitions', () => {
    const selectedStatus = ref('In Progress')
    const dedicated = ref(false)
    const pushed = []
    const router = { push: (target) => pushed.push(target) }

    const nav = useStatusTabNavigation({
      selectedStatus,
      isDedicatedStatusRoute: computed(() => dedicated.value),
      router,
      basePath: '/service-orders',
      normalize: (v) => String(v || '').trim().toLowerCase().replace(/[\s_-]+/g, '')
    })

    assert.equal(nav.isActiveTab('inprogress'), true)
    assert.equal(nav.isActiveTab('Done'), false)

    nav.setStatusFilter('Done')
    assert.equal(selectedStatus.value, 'Done')
    assert.equal(pushed.length, 0)

    dedicated.value = true
    nav.onSelectStatus('Scheduled')
    assert.deepEqual(pushed, [{ path: '/service-orders', query: { status: 'Scheduled' } }])
  })
})
