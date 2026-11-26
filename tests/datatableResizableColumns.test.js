import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
// Gene - Nov, 27, 2026: Import shared useColumnResizer composable for DynamicApiTable resize harness
import { useColumnResizer } from '../src/composables/useColumnResizer.js'

const TABLE_PATH = path.resolve('src/components/DynamicApiTable.vue')
const DASHBOARD_PATH = path.resolve('src/views/Dashboard.vue')
const ACCOUNTING_PATH = path.resolve('src/views/AccountingDashboard.vue')
const STYLE_PATH = path.resolve('src/style.css')

const tableSrc = fs.readFileSync(TABLE_PATH, 'utf8')
const dashboardSrc = fs.readFileSync(DASHBOARD_PATH, 'utf8')
const accountingSrc = fs.readFileSync(ACCOUNTING_PATH, 'utf8')
const styleSrc = fs.readFileSync(STYLE_PATH, 'utf8')

function extractTemplate(src) {
  const start = src.indexOf('<template>')
  const end = src.lastIndexOf('</template>')
  assert.notEqual(start, -1, 'Missing <template> tag')
  assert.notEqual(end, -1, 'Missing </template> tag')
  return src.slice(start, end)
}

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function sliceBetween(src, startMarker, endMarker, includeEnd = false) {
  const start = src.indexOf(startMarker)
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`)
  const end = src.indexOf(endMarker, start)
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`)
  return src.slice(start, includeEnd ? end + endMarker.length : end)
}

function createResizeHarness({
  endpoint = '/api/JobOrders',
  userId = 42,
  displayed = ['id', 'status', 'description', 'customerName'],
  initialStorage = {}
} = {}) {
  const resizeSrc = sliceBetween(
    tableSrc,
    "const COLUMN_WIDTHS_STORAGE_KEY = 'switchfiber_column_widths_v1'",
    '\nconst hasActiveColumn = computed(() => {'
  )

  const storageMap = new Map(Object.entries(initialStorage))
  const localStorageStub = {
    getItem(k) {
      return storageMap.has(k) ? storageMap.get(k) : null
    },
    setItem(k, v) {
      storageMap.set(k, String(v))
    },
    removeItem(k) {
      storageMap.delete(k)
    }
  }

  let destroyedStyleCount = 0
  const tableEl = { style: { width: '1200px', minWidth: '1200px' } }
  const dt = {
    value: {
      destroyStyleElement() {
        destroyedStyleCount += 1
      },
      $el: {
        querySelector() {
          return tableEl
        }
      }
    }
  }

  const props = { endpoint }
  const authStore = { user: userId == null ? null : { id: userId } }
  const displayedColumns = { value: [...displayed] }
  const watchers = []

  const ref = (init) => ({ value: init })
  const computed = (getter) => ({
    get value() {
      return getter()
    }
  })
  const watch = (source, cb, opts) => {
    watchers.push({ source, cb })
    if (opts?.immediate) {
      cb(source.value)
    }
  }

  const factory = new Function(
    'ref',
    'computed',
    'watch',
    'props',
    'authStore',
    'dt',
    'displayedColumns',
    'localStorage',
    'useColumnResizer',
    `${resizeSrc}
    return {
      COLUMN_WIDTHS_STORAGE_KEY,
      MIN_RESIZABLE_COL_WIDTH,
      MAX_RESIZABLE_COL_WIDTH,
      columnWidths,
      columnWidthStoreKey,
      hasCustomColumnWidths,
      loadColumnWidths,
      saveColumnWidths,
      clearImperativeResizeStyles,
      resetColumnWidths,
    // Gene - Nov, 17, 2026: Expose onColumnResizerMouseDown from resize harness.
    /*
      stopColumnResizerClick,
      dataTableResizePt,
      getDynamicColumnPt,
      getDynamicColumnStyle,
      getMultilineCellStyle,
      getTruncateCellStyle,
      onColumnResizeEnd
    */
      stopColumnResizerClick,
      onColumnResizerMouseDown,
      dataTableResizePt,
      getDynamicColumnPt,
      getDynamicColumnStyle,
      getMultilineCellStyle,
      getTruncateCellStyle,
      onColumnResizeEnd
    }`
  )

  const api = factory(
    ref,
    computed,
    watch,
    props,
    authStore,
    dt,
    displayedColumns,
    localStorageStub,
    useColumnResizer
  )

  return {
    api,
    props,
    authStore,
    displayedColumns,
    storageMap,
    tableEl,
    getDestroyedStyleCount: () => destroyedStyleCount,
    triggerStoreKeyWatch: () => {
      for (const w of watchers) {
        w.cb(w.source.value)
      }
    }
  }
}

test('All active DataTable components enable expandable column resizing and sort-safe resizer PT', () => {
  const files = [
    { name: 'DynamicApiTable.vue', src: tableSrc, expectedCount: 1 },
    { name: 'Dashboard.vue', src: dashboardSrc, expectedCount: 1 },
    { name: 'AccountingDashboard.vue', src: accountingSrc, expectedCount: 2 }
  ]

  for (const { name, src, expectedCount } of files) {
    const activeTemplate = stripHtmlComments(extractTemplate(src))
    const dataTableTags = activeTemplate.match(/<DataTable\b[\s\S]*?>/g) || []
    assert.equal(
      dataTableTags.length,
      expectedCount,
      `${name} should contain exactly ${expectedCount} active <DataTable> tag(s)`
    )

    for (const tag of dataTableTags) {
      assert.match(tag, /\bresizableColumns\b/, `${name} <DataTable> missing resizableColumns`)
      assert.match(
        tag,
        /\bcolumnResizeMode="expand"/,
        `${name} <DataTable> must set columnResizeMode="expand"`
      )
      assert.match(
        tag,
        /:pt="dataTableResizePt"/,
        `${name} <DataTable> missing :pt="dataTableResizePt"`
      )
    }
  }

  // Gene - Nov, 17, 2026: Verify active resizable <Column> tags in Dashboard.vue, AccountingDashboard.vue, and non-frozen columns in DynamicApiTable.vue do not set inline min-width/minWidth.
  /*
  for (const { name, src } of files) {
    const activeTemplate = stripHtmlComments(extractTemplate(src))
    const columnTags = activeTemplate.match(/<Column\b[\s\S]*?>/g) || []
    for (const colTag of columnTags) {
      assert.doesNotMatch(
        colTag,
        /\bmin-width\s*:/i,
        `${name} <Column> must not use inline min-width CSS: ${colTag}`
      )
      assert.doesNotMatch(
        colTag,
        /\bminWidth\s*:/,
        `${name} <Column> must not use inline minWidth style prop: ${colTag}`
      )
    }
  }
  */
  for (const { name, src } of files) {
    const activeTemplate = stripHtmlComments(extractTemplate(src))
    const columnTags = activeTemplate.match(/<Column\b[\s\S]*?>/g) || []
    for (const colTag of columnTags) {
      if (name === 'DynamicApiTable.vue' && /:frozen="true"/.test(colTag)) continue
      assert.doesNotMatch(
        colTag,
        /\bmin-width\s*:/i,
        `${name} <Column> must not use inline min-width CSS: ${colTag}`
      )
      assert.doesNotMatch(
        colTag,
        /\bminWidth\s*:/,
        `${name} <Column> must not use inline minWidth style prop: ${colTag}`
      )
    }
  }

  const activeDynamicTemplate = stripHtmlComments(extractTemplate(tableSrc))
  const [dynamicTableTag] = activeDynamicTemplate.match(/<DataTable\b[\s\S]*?>/g) || []
  assert.match(dynamicTableTag, /class="sfa-tracker-table-datatable"/)
  assert.match(dynamicTableTag, /@column-resize-end="onColumnResizeEnd"/)

  assert.match(activeDynamicTemplate, /:style="getDynamicColumnStyle\(col\)"/)
  assert.match(activeDynamicTemplate, /:pt="getDynamicColumnPt\(col\)"/)
  assert.match(activeDynamicTemplate, /:style="getMultilineCellStyle\(col\)"/)
  assert.match(activeDynamicTemplate, /:style="getTruncateCellStyle\(col\)"/)
  assert.match(activeDynamicTemplate, /v-if="hasCustomColumnWidths"/)
  assert.match(activeDynamicTemplate, /@click="resetColumnWidths"/)
  assert.match(activeDynamicTemplate, /Reset Widths/)

  const resetFnSrc = sliceBetween(
    tableSrc,
    '// Gene - Nov, 14, 2026: Reset saved column widths',
    '  clearImperativeResizeStyles()\n}',
    true
  )
  assert.match(resetFnSrc, /resetColumnWidths\(\)/)
  assert.match(resetFnSrc, /clearImperativeResizeStyles\(\)/)
})

test('Global stylesheet defines active styles for resizable DataTable cells, resizer handle, and resize indicator', () => {
  const activeCss = stripCssComments(styleSrc)
  assert.match(activeCss, /\.p-datatable-resizable-table\s*>\s*\.p-datatable-thead\s*>\s*tr\s*>\s*th/)
  assert.match(activeCss, /\.p-datatable-column-resizer\s*\{[\s\S]*?width:\s*8px;[\s\S]*?cursor:\s*col-resize;/)
  assert.match(activeCss, /\.p-datatable-column-resizer:hover::after/)
  assert.match(activeCss, /\.p-datatable-column-resize-indicator\s*\{/)
  // Gene - Nov, 17, 2026: Verify persisted column width uses --sfa-col-width CSS variable on header cells.
  assert.match(activeCss, /\.p-datatable-resizable-table\s*>\s*\.p-datatable-thead\s*>\s*tr\s*>\s*th\.sfa-tracker-table-col-data\s*\{[\s\S]*?min-width:\s*var\(--sfa-col-width,\s*0px\)/)
})

test('DynamicApiTable resize logic persists per user/endpoint, isolates resizer clicks from sort, clamps bounds, and resets cleanly', () => {
  const harness = createResizeHarness()
  const { api, props, authStore, storageMap, tableEl, getDestroyedStyleCount, triggerStoreKeyWatch } = harness

  assert.equal(api.hasCustomColumnWidths.value, false)
  assert.equal(api.getDynamicColumnStyle('customerName'), undefined)
  assert.equal(api.getMultilineCellStyle('description').minWidth, '250px')
  assert.equal(api.getTruncateCellStyle('customerName').maxWidth, '240px')

  let stopped = false
  api.dataTableResizePt.column.columnResizer.onClick({
    stopPropagation() {
      stopped = true
    }
  })
  assert.equal(stopped, true)
  // Gene - Nov, 17, 2026: Verify onMousedown drag-clamp handler is bound on DataTable and dynamic Column PT.
  assert.equal(api.dataTableResizePt.column.columnResizer.onMousedown, api.onColumnResizerMouseDown)

  const colPt = api.getDynamicColumnPt('customerName')
  assert.equal(colPt.headerCell['data-sfa-col'], 'customerName')
  assert.equal(colPt.columnResizer.onClick, api.stopColumnResizerClick)
  assert.equal(colPt.columnResizer.onMousedown, api.onColumnResizerMouseDown)

  // Initial resize via data-sfa-col attribute
  api.onColumnResizeEnd({
    element: {
      getAttribute(attr) {
        return attr === 'data-sfa-col' ? 'customerName' : null
      },
      getBoundingClientRect() {
        return { width: 280.4 }
      }
    },
    delta: 40
  })

  assert.equal(api.hasCustomColumnWidths.value, true)
  // Gene - Nov, 17, 2026: Assert getDynamicColumnStyle sets --sfa-col-width, width, and maxWidth without inline minWidth.
  /*
  assert.deepEqual(api.getDynamicColumnStyle('customerName'), {
    width: '280px',
    minWidth: '280px',
    maxWidth: '280px'
  })
  */
  assert.deepEqual(api.getDynamicColumnStyle('customerName'), {
    '--sfa-col-width': '280px',
    width: '280px',
    maxWidth: '280px'
  })
  assert.equal(api.getDynamicColumnStyle('customerName').minWidth, undefined)
  assert.equal(api.getTruncateCellStyle('customerName').maxWidth, '100%')

  // Incremental shrink via delta + classList fallback and min clamp (72px)
  api.onColumnResizeEnd({
    element: {
      getAttribute() {
        return null
      },
      classList: {
        contains(cls) {
          return cls === 'sfa-header-customername'
        }
      }
    },
    delta: -250
  })
  assert.equal(api.columnWidths.value.customerName, '72px')

  // Expand and max clamp (960px)
  api.onColumnResizeEnd({
    element: {
      getAttribute(attr) {
        return attr === 'data-sfa-col' ? 'description' : null
      },
      getBoundingClientRect() {
        return { width: 1200 }
      }
    },
    delta: 700
  })
  assert.equal(api.columnWidths.value.description, '960px')
  assert.equal(api.getMultilineCellStyle('description').minWidth, '0px')
  assert.equal(api.getMultilineCellStyle('description').width, '100%')

  const persisted = JSON.parse(storageMap.get(api.COLUMN_WIDTHS_STORAGE_KEY))
  assert.deepEqual(persisted['42:joborders'], {
    customerName: '72px',
    description: '960px'
  })

  // Switching endpoint clears imperative styles and isolates stored widths
  props.endpoint = '/api/Payments'
  triggerStoreKeyWatch()
  assert.equal(getDestroyedStyleCount() >= 1, true)
  assert.equal(tableEl.style.width, '')
  assert.equal(tableEl.style.minWidth, '')
  assert.equal(api.hasCustomColumnWidths.value, false)

  // Resizing in Payments keeps JobOrders persisted widths intact
  api.onColumnResizeEnd({
    element: {
      getAttribute(attr) {
        return attr === 'data-sfa-col' ? 'status' : null
      },
      getBoundingClientRect() {
        return { width: 165 }
      }
    },
    delta: 15
  })
  assert.equal(api.columnWidths.value.status, '165px')

  // Switching user id isolates preferences per user
  authStore.user = { id: 99 }
  triggerStoreKeyWatch()
  assert.equal(api.hasCustomColumnWidths.value, false)

  // Switching back restores saved widths
  authStore.user = { id: 42 }
  props.endpoint = '/api/JobOrders'
  triggerStoreKeyWatch()
  assert.equal(api.columnWidths.value.customerName, '72px')
  assert.equal(api.columnWidths.value.description, '960px')

  // Reset removes only current user+endpoint key and clears imperative styles
  const beforeResetCount = getDestroyedStyleCount()
  api.resetColumnWidths()
  assert.equal(api.hasCustomColumnWidths.value, false)
  assert.equal(getDestroyedStyleCount(), beforeResetCount + 1)

  const afterReset = JSON.parse(storageMap.get(api.COLUMN_WIDTHS_STORAGE_KEY))
  assert.equal(afterReset['42:joborders'], undefined)
  assert.deepEqual(afterReset['42:payments'], { status: '165px' })
})

test('Corrupt localStorage entries are handled gracefully without throwing', () => {
  const { api } = createResizeHarness({
    initialStorage: {
      switchfiber_column_widths_v1: '{broken-json'
    }
  })
  assert.deepEqual(api.columnWidths.value, {})

  const { api: partialApi } = createResizeHarness({
    initialStorage: {
      switchfiber_column_widths_v1: JSON.stringify({
        '42:joborders': {
          customerName: '30px',
          status: 'bad',
          description: '320px'
        }
      })
    }
  })
  assert.deepEqual(partialApi.columnWidths.value, {
    customerName: '72px',
    description: '320px'
  })
})

// Gene - Nov, 17, 2026: Verify a column expanded to a large width can be shrunk back down without inline minWidth blocking PrimeVue.
test('Expanded column can shrink back down cleanly without inline minWidth blocking PrimeVue', () => {
  const { api } = createResizeHarness()

  let currentWidth = 200
  const attrs = new Map([['data-sfa-col', 'customerName']])
  const styleProps = new Map()
  const headerEl = {
    style: {
      minWidth: '200px',
      width: '',
      maxWidth: '',
      setProperty(k, v) {
        styleProps.set(k, v)
      },
      removeProperty(k) {
        styleProps.delete(k)
      }
    },
    getAttribute(k) {
      return attrs.get(k) ?? null
    },
    setAttribute(k, v) {
      attrs.set(k, String(v))
    },
    removeAttribute(k) {
      attrs.delete(k)
    },
    getBoundingClientRect() {
      return { width: currentWidth }
    },
    get offsetWidth() {
      return currentWidth
    }
  }
  const resizerEl = { parentElement: headerEl }

  // Start drag -> mousedown clears inline minWidth and captures start width
  api.onColumnResizerMouseDown({ currentTarget: resizerEl, pageX: 200 })
  assert.equal(headerEl.style.minWidth, '')
  assert.equal(attrs.get('data-sfa-start-width'), '200')

  // Expand to 600px
  currentWidth = 600
  api.onColumnResizeEnd({ element: headerEl, delta: 400 })
  assert.equal(api.columnWidths.value.customerName, '600px')
  assert.equal(styleProps.get('--sfa-col-width'), '600px')
  assert.equal(headerEl.style.minWidth, '')

  // Simulate Vue applying getDynamicColumnStyle to headerEl.style before the next drag
  const nextStyle = api.getDynamicColumnStyle('customerName')
  assert.equal(nextStyle.minWidth, undefined)
  Object.assign(headerEl.style, { width: nextStyle.width, maxWidth: nextStyle.maxWidth })

  // PrimeVue's shrink guard: columnWidth + delta > parseInt(headerEl.style.minWidth || 15, 10)
  const shrinkDelta = -380
  const primeVueMinWidth = headerEl.style.minWidth || 15
  assert.equal(currentWidth + shrinkDelta > parseInt(primeVueMinWidth, 10), true)

  // Shrink back from 600px to 220px, then down to 72px
  api.onColumnResizerMouseDown({ currentTarget: resizerEl, pageX: 600 })
  assert.equal(attrs.get('data-sfa-start-width'), '600')
  currentWidth = 220
  api.onColumnResizeEnd({ element: headerEl, delta: shrinkDelta })
  assert.equal(api.columnWidths.value.customerName, '220px')

  api.onColumnResizerMouseDown({ currentTarget: resizerEl, pageX: 220 })
  assert.equal(attrs.get('data-sfa-start-width'), '220')
  currentWidth = 72
  api.onColumnResizeEnd({ element: headerEl, delta: -148 })
  assert.equal(api.columnWidths.value.customerName, '72px')
})
