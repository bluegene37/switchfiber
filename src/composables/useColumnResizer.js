// Gene - Nov, 27, 2026: Shared PrimeVue DataTable column resizer composable extracted in Phase 1 modular refactor

export const DEFAULT_MIN_RESIZABLE_COL_WIDTH = 72
export const DEFAULT_MAX_RESIZABLE_COL_WIDTH = 960

/**
 * Prevent PrimeVue column-resizer clicks from bubbling into header sort clicks.
 * @param {Event} event
 */
export const stopColumnResizerClick = (event) => {
  event?.stopPropagation?.()
}

/**
 * Shared PrimeVue DataTable column resize indicator clamping and minWidth clearing.
 * @param {{ dt?: any, minWidth?: number, maxWidth?: number, recordStartWidthAttr?: boolean }} [options]
 */
export function useColumnResizer({
  dt = null,
  minWidth = DEFAULT_MIN_RESIZABLE_COL_WIDTH,
  maxWidth = DEFAULT_MAX_RESIZABLE_COL_WIDTH,
  recordStartWidthAttr = false
} = {}) {
  const onColumnResizerMouseDown = (event) => {
    const resizerEl = event?.currentTarget || event?.target
    const headerEl = resizerEl?.closest?.('th') || resizerEl?.parentElement
    if (!headerEl) return

    if (headerEl.style) {
      headerEl.style.minWidth = ''
    }

    const rectWidth = headerEl.getBoundingClientRect?.().width
    const startWidth = Number.isFinite(rectWidth) && rectWidth > 0
      ? rectWidth
      : (headerEl.offsetWidth || minWidth)

    if (recordStartWidthAttr) {
      headerEl.setAttribute?.('data-sfa-start-width', String(Math.round(startWidth)))
    }

    if (typeof window === 'undefined') return
    const dtEl = dt?.value?.$el || headerEl.closest?.('[data-pc-name="datatable"], .p-datatable')
    const resizeHelperEl = dtEl?.querySelector?.('.p-datatable-column-resize-indicator, [data-pc-section="columnresizeindicator"]')
    if (!dtEl || !resizeHelperEl) return

    const dtRect = dtEl.getBoundingClientRect?.()
    if (!dtRect) return
    const containerLeft = dtRect.left + (window.scrollX || window.pageXOffset || 0)
    const startHelperX = (event?.pageX ?? 0) - containerLeft + (dtEl.scrollLeft || 0)
    const minDelta = Math.min(0, minWidth - startWidth)
    const maxDelta = Math.max(0, maxWidth - startWidth)
    const minHelperX = startHelperX + minDelta
    const maxHelperX = startHelperX + maxDelta

    const clampHelperPosition = (moveEvent) => {
      if (resizeHelperEl.style.display !== 'block') return
      const currentLeft = Number.parseFloat(resizeHelperEl.style.left)
      const fallbackX = typeof moveEvent?.pageX === 'number'
        ? moveEvent.pageX - containerLeft + (dtEl.scrollLeft || 0)
        : startHelperX
      const rawX = Number.isFinite(currentLeft) ? currentLeft : fallbackX
      const clampedX = Math.min(maxHelperX, Math.max(minHelperX, rawX))
      resizeHelperEl.style.left = `${clampedX}px`
    }

    const onMouseUpCapture = (upEvent) => {
      clampHelperPosition(upEvent)
      if (headerEl.style) {
        headerEl.style.minWidth = ''
      }
      window.removeEventListener('mousemove', clampHelperPosition)
      window.removeEventListener('mouseup', onMouseUpCapture, true)
    }

    window.addEventListener('mousemove', clampHelperPosition)
    window.addEventListener('mouseup', onMouseUpCapture, true)
  }

  const dataTableResizePt = {
    column: {
      columnResizer: {
        onClick: stopColumnResizerClick,
        onMousedown: onColumnResizerMouseDown
      }
    }
  }

  const getColumnResizePt = (col) => ({
    headerCell: {
      'data-sfa-col': col
    },
    columnResizer: {
      onClick: stopColumnResizerClick,
      onMousedown: onColumnResizerMouseDown
    }
  })

  return {
    stopColumnResizerClick,
    onColumnResizerMouseDown,
    dataTableResizePt,
    getColumnResizePt
  }
}
