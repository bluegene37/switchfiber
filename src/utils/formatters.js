// Gene - Nov, 27, 2026: Shared date, padding, and color formatting utilities extracted in Phase 1 modular refactor

/**
 * Pad a number or string with leading zeros to `width` characters.
 * @param {number|string} n
 * @param {number} [width=2]
 * @returns {string}
 */
export const pad = (n, width = 2) => String(n).padStart(width, '0')

/**
 * Format a Date or date string as an ISO-8601 start-of-day or end-of-day query param.
 * Preserves pre-formatted ISO strings containing `'T'`.
 * @param {Date|string|null|undefined} dateVal
 * @param {boolean} [isEnd=false]
 * @returns {string|undefined}
 */
export const formatDateParam = (dateVal, isEnd = false) => {
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

/**
 * Format a Date or date string as local `YYYY-MM-DD`.
 * @param {Date|string|null|undefined} dateVal
 * @returns {string}
 */
export const formatLocalYmd = (dateVal) => {
  if (!dateVal) return ''
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal)
  if (d instanceof Date && !isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return String(dateVal)
}

/**
 * Format a timestamp as `YYYYMMDD_HHmmss` for unique exported filenames.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export const formatFileTimestamp = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/**
 * Format a date string as short US display date (e.g. `Nov 27, 2026`).
 * @param {Date|string|null|undefined} dateStr
 * @param {string} [emptyFallback='—']
 * @returns {string}
 */
export const formatShortDate = (dateStr, emptyFallback = '—') => {
  if (!dateStr) return emptyFallback
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format a date-time value using locale short date + time.
 * @param {Date|string|null|undefined} value
 * @param {string} [emptyFallback='unknown date']
 * @returns {string}
 */
export const formatDateTime = (value, emptyFallback = 'unknown date') => {
  if (!value) return emptyFallback
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * Convert a 3- or 6-digit hex color string to an `rgba(r, g, b, alpha)` CSS string.
 * @param {string} hex
 * @param {number} [alpha=1]
 * @returns {string}
 */
export const rgbaOf = (hex, alpha = 1) => {
  const raw = String(hex ?? '').trim().replace(/^#/, '')
  let full = raw
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    full = raw.split('').map(c => c + c).join('')
  }
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    return `rgba(100, 116, 139, ${alpha})`
  }
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
