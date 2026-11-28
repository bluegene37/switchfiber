// Gene - Nov, 28, 2026: Centralized Status-table (/api/Status) helpers, DataTable quick-status mapping, tab builders, and per-endpoint PUT payload builders
import {
  normalizeStatusToken,
  getFallbackStatusOptions
} from '../services/status.js'
import { buildServiceOrderMultipartFormData } from '../services/serviceOrders.js'
import {
  APPLICATION_CANONICAL_STATUS_MAP,
  buildApplicationQuickStatusFormData,
  applyApplicationStatusLocally,
  formatQuickStatusSubtitle
} from './applicationQuickStatus.js'
import { dataUriToBlob } from './imageActions.js'

const READ_ONLY_OR_META_ENDPOINTS = new Set([
  'radiususer',
  'radiususers',
  'logtrail',
  'logerror',
  'status',
  'statuses'
])

const EXCLUDED_STATUS_COLUMNS = new Set([
  'statusremarks',
  'usernamestatus',
  'responsestatus',
  'emailstatus',
  'smsstatus'
])

const COLUMN_TYPE_MAP = Object.freeze({
  onsitestatus: 'JO_ONSITE',
  billingstatus: 'BILLING',
  deliverystatus: 'DELIVERY',
  invoicestatus: 'INVOICE',
  supportstatus: 'SO_SUPPORT',
  visitstatus: 'SO_VISIT',
  discountstatus: 'DISCOUNT'
})

const ENDPOINT_STATUS_TYPE_MAP = Object.freeze({
  applications: 'APPLICATION',
  application: 'APPLICATION',
  joborders: 'JOB_ORDER',
  joborder: 'JOB_ORDER',
  job_order: 'JOB_ORDER',
  billingdetails: 'BILLING',
  billing: 'BILLING',
  invoices: 'INVOICE',
  invoice: 'INVOICE',
  billingstatements: 'INVOICE',
  billingstatement: 'INVOICE',
  billing_statements: 'INVOICE',
  billing_statement: 'INVOICE',
  payments: 'PAYMENT',
  payment: 'PAYMENT',
  discounts: 'DISCOUNT',
  discount: 'DISCOUNT',
  inventorylogs: 'INVENTORY_LOG',
  inventorylog: 'INVENTORY_LOG',
  inventory_logs: 'INVENTORY_LOG',
  inventory_log: 'INVENTORY_LOG'
})

const QUICK_STATUS_TITLES = Object.freeze({
  status: 'Update Status',
  visitstatus: 'Update Visit Status',
  supportstatus: 'Update Support Status',
  onsitestatus: 'Update Onsite Status',
  billingstatus: 'Update Billing Status',
  deliverystatus: 'Update Delivery Status',
  discountstatus: 'Update Discount Status',
  invoicestatus: 'Update Invoice Status'
})

export const JOB_ORDER_PHOTO_FIELDS = [
  ['setupImage', 'SetupImage', 'setupImage.jpg'],
  ['clientSignature', 'ClientSignature', 'clientSignature.jpg'],
  ['signedContractImage', 'SignedContractImage', 'signedContractImage.jpg'],
  ['boxReadingImage', 'BoxReadingImage', 'boxReadingImage.jpg'],
  ['routerReadingImage', 'RouterReadingImage', 'routerReadingImage.jpg'],
  ['portLabelImage', 'PortLabelImage', 'portLabelImage.jpg'],
  ['houseFront', 'HouseFront', 'houseFront.jpg'],
  ['speedtestImage', 'SpeedtestImage', 'speedtestImage.jpg']
]

const JOB_ORDER_NUMERIC_OR_DATE_KEYS = new Set([
  'itemquantity1', 'itemquantity2', 'itemquantity3', 'itemquantity4', 'itemquantity5',
  'itemquantity6', 'itemquantity7', 'itemquantity8', 'itemquantity9', 'itemquantity10',
  'installationfee', 'billingday', 'duration', 'lcpid', 'napid', 'vlanid', 'portid',
  'lcpnapid', 'lcpnapportid', 'accountno',
  'dateinstalled', 'installationdate', 'starttimestamp', 'endtimestamp',
  'createdby', 'createddate', 'modifieddate'
])

const JOB_ORDER_PHOTO_KEYS = new Set([
  'setupimage',
  'clientsignature',
  'signedcontractimage',
  'boxreadingimage',
  'routerreadingimage',
  'portlabelimage',
  'housefront',
  'speedtestimage'
])

const LEGACY_AUDIT_ALIAS_KEYS = new Set([
  'lastmodified',
  'lastmodifiedby'
])

const normalizeColCompact = (col) => String(col ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')

const findRecordKey = (record, col) => {
  if (!record || typeof record !== 'object' || !col) return col
  const target = normalizeColCompact(col)
  return Object.keys(record).find(k => normalizeColCompact(k) === target) || col
}

const canonicalStatusKeyFor = (col) => {
  const norm = normalizeColCompact(col)
  if (norm === 'onsitestatus') return 'onsiteStatus'
  if (norm === 'billingstatus') return 'billingStatus'
  if (norm === 'deliverystatus') return 'deliveryStatus'
  if (norm === 'invoicestatus') return 'invoiceStatus'
  if (norm === 'supportstatus') return 'supportStatus'
  if (norm === 'visitstatus') return 'visitStatus'
  if (norm === 'discountstatus') return 'discountStatus'
  return 'status'
}

/**
 * Normalizes an endpoint name by stripping leading/trailing slashes and lowercasing.
 */
export function normalizeQuickStatusEndpoint(endpoint) {
  return String(endpoint ?? '').trim().replace(/^\/+|\/+$/g, '').toLowerCase()
}

/**
 * Resolves the canonical /api/Status type code (e.g. APPLICATION, SO_VISIT, INVOICE)
 * for a given endpoint and column name, returning '' for non-status columns.
 */
export function resolveStatusTypeCodeForColumn(endpoint, col) {
  const normCol = normalizeColCompact(col)
  if (!normCol || EXCLUDED_STATUS_COLUMNS.has(normCol)) return ''

  if (COLUMN_TYPE_MAP[normCol]) {
    return COLUMN_TYPE_MAP[normCol]
  }

  if (normCol === 'status') {
    const ep = normalizeQuickStatusEndpoint(endpoint)
    return ENDPOINT_STATUS_TYPE_MAP[ep] || ''
  }

  return ''
}

/**
 * Determines whether a table cell should be clickable for inline quick-status updates.
 */
export function isQuickStatusEditableCell({ endpoint, col, readOnly = false } = {}) {
  if (readOnly) return false
  const ep = normalizeQuickStatusEndpoint(endpoint)
  if (!ep || READ_ONLY_OR_META_ENDPOINTS.has(ep)) return false
  return Boolean(resolveStatusTypeCodeForColumn(ep, col))
}

/**
 * Normalizes a raw row status value against available /api/Status options while
 * preserving unknown legacy values verbatim.
 */
export function normalizeQuickStatusValue(rawStatus, availableOptions = [], typeCode = '') {
  if (rawStatus === null || rawStatus === undefined) return ''
  const trimmed = String(rawStatus).trim()
  if (!trimmed) return ''

  const list = Array.isArray(availableOptions) ? availableOptions : []
  const normalizedOptions = list
    .map(opt => {
      if (typeof opt === 'string') {
        const v = opt.trim()
        return v ? { value: v, label: v } : null
      }
      if (opt && typeof opt === 'object') {
        const rawVal = opt.value ?? opt.name ?? opt.label
        if (rawVal === undefined || rawVal === null) return null
        const valueStr = String(rawVal).trim()
        const labelStr = String(opt.label ?? opt.description ?? rawVal).trim()
        return valueStr ? { value: valueStr, label: labelStr } : null
      }
      return null
    })
    .filter(Boolean)

  const lower = trimmed.toLowerCase()
  const exactMatch = normalizedOptions.find(
    opt => opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower
  )
  if (exactMatch) return exactMatch.value

  const token = normalizeStatusToken(trimmed)
  if (token) {
    const tokenMatch = normalizedOptions.find(
      opt => normalizeStatusToken(opt.value) === token || normalizeStatusToken(opt.label) === token
    )
    if (tokenMatch) return tokenMatch.value

    if (String(typeCode || '').toUpperCase() === 'APPLICATION' && APPLICATION_CANONICAL_STATUS_MAP[token]) {
      return APPLICATION_CANONICAL_STATUS_MAP[token]
    }
  }

  return trimmed
}

/**
 * Merges /api/Status options (or JSON fallback options when empty) with distinct raw
 * row values so both centralized statuses and legacy row values stay selectable/filterable.
 */
export function mergeStatusOptionsWithData(apiOptions = [], rawValues = [], fallbackTypeCode = '') {
  const primary = Array.isArray(apiOptions) && apiOptions.length > 0
    ? apiOptions
    : (fallbackTypeCode ? getFallbackStatusOptions(fallbackTypeCode) : [])

  const out = []
  const seenTokens = new Set()
  const seenLower = new Set()

  const pushUnique = (item) => {
    const isObj = item && typeof item === 'object'
    const rawVal = isObj ? (item.value ?? item.name ?? item.label) : item
    const val = rawVal !== null && rawVal !== undefined ? String(rawVal).trim() : ''
    if (!val) return
    const lower = val.toLowerCase()
    const token = normalizeStatusToken(val)
    if (seenLower.has(lower) || (token && seenTokens.has(token))) return
    seenLower.add(lower)
    if (token) seenTokens.add(token)
    const label = isObj ? String(item.label ?? item.description ?? val).trim() : val
    out.push({ label: label || val, value: val })
  }

  for (const opt of primary) {
    pushUnique(opt)
  }

  if (Array.isArray(rawValues)) {
    for (const raw of rawValues) {
      pushUnique(raw)
    }
  }

  return out
}

/**
 * Builds list-view status filter tabs backed by /api/Status options and supplemented
 * with any extra live statuses present in the table vocabulary.
 */
export function buildStatusFilterTabs({
  allLabel = 'All',
  allIcon = 'pi-list',
  apiOptions = [],
  vocabulary = [],
  tabMetaByToken = {}
} = {}) {
  const tabs = [{ id: 'all', label: allLabel, value: '', icon: allIcon }]
  const seenTokens = new Set()
  const seenLower = new Set()

  const appendTab = (rawVal, rawLabel) => {
    const val = rawVal !== null && rawVal !== undefined ? String(rawVal).trim() : ''
    if (!val) return
    const lower = val.toLowerCase()
    const token = normalizeStatusToken(val)
    if (seenLower.has(lower) || (token && seenTokens.has(token))) return
    seenLower.add(lower)
    if (token) seenTokens.add(token)
    const label = rawLabel !== null && rawLabel !== undefined ? String(rawLabel).trim() : val
    const meta = token && tabMetaByToken && typeof tabMetaByToken === 'object' ? tabMetaByToken[token] : null
    tabs.push({
      id: token || lower,
      label: label || val,
      value: val,
      icon: meta?.icon || ''
    })
  }

  for (const opt of Array.isArray(apiOptions) ? apiOptions : []) {
    if (typeof opt === 'string') {
      appendTab(opt, opt)
    } else if (opt && typeof opt === 'object') {
      appendTab(opt.value ?? opt.name ?? opt.label, opt.label ?? opt.description ?? opt.value)
    }
  }

  for (const item of Array.isArray(vocabulary) ? vocabulary : []) {
    if (typeof item === 'string') {
      appendTab(item, item)
    } else if (item && typeof item === 'object') {
      appendTab(item.value ?? item.name ?? item.label, item.label ?? item.description ?? item.value)
    }
  }

  return tabs
}

/**
 * Formats the quick-status popover header title for a specific status column.
 */
export function formatQuickStatusTitle(col, formatLabelFn = null) {
  const norm = normalizeColCompact(col)
  if (QUICK_STATUS_TITLES[norm]) return QUICK_STATUS_TITLES[norm]
  if (typeof formatLabelFn === 'function' && col) {
    return `Update ${formatLabelFn(col)}`
  }
  return 'Update Status'
}

/**
 * Formats a compact header subtitle for any quick-status-editable record.
 */
export function formatGenericQuickStatusSubtitle(endpoint, record, fallbackId = '') {
  const ep = normalizeQuickStatusEndpoint(endpoint)
  if (ep === 'applications' || ep === 'application') {
    return formatQuickStatusSubtitle(record, fallbackId)
  }

  if (!record || typeof record !== 'object') {
    const fallback = String(fallbackId ?? '').trim()
    return fallback ? `#${fallback}` : ''
  }

  let identifier = ''
  if (ep === 'payments' || ep === 'payment') {
    identifier = record.transactionID ?? record.transactionId ?? record.id ?? record.Id ?? fallbackId
  } else if (ep === 'invoices' || ep === 'invoice' || ep === 'billingstatements' || ep === 'billingstatement') {
    identifier = record.invoiceNo ?? record.accountNo ?? record.id ?? record.Id ?? fallbackId
  } else if (ep === 'billingdetails' || ep === 'billing') {
    identifier = record.accountNo ?? record.accountNumber ?? record.id ?? record.Id ?? fallbackId
  } else {
    identifier = record.id ?? record.Id ?? record.ID ?? record.accountNo ?? record.accountNumber ?? fallbackId
  }
  const idStr = String(identifier ?? '').trim()

  let nameStr = ''
  if (ep === 'inventorylogs' || ep === 'inventorylog' || ep === 'inventory_logs' || ep === 'inventory_log') {
    const itemId = String(record.itemId ?? '').trim()
    const requestedBy = String(record.requestedBy ?? '').trim()
    nameStr = [itemId, requestedBy].filter(Boolean).join(' • ')
  } else {
    const first = String(record.firstName ?? record.FirstName ?? '').trim()
    const last = String(record.lastName ?? record.LastName ?? '').trim()
    nameStr =
      String(record.fullName ?? record.FullName ?? record.name ?? '').trim() ||
      [first, last].filter(Boolean).join(' ')
  }

  return [idStr ? `#${idStr}` : '', nameStr].filter(Boolean).join(' • ')
}

/**
 * Immutably updates the target row's status column and modification audit fields locally.
 */
export const applyQuickStatusLocally = (rows, recordId, statusCol, nextStatus, opts = {}) =>
  applyApplicationStatusLocally(rows, recordId, statusCol, nextStatus, opts)

const lookupImageMapValue = (mapObj, colKey, formField) => {
  if (!mapObj || typeof mapObj !== 'object') return undefined
  const normCol = normalizeColCompact(colKey)
  const normForm = normalizeColCompact(formField)
  const camelForm = formField ? formField.charAt(0).toLowerCase() + formField.slice(1) : ''
  const direct =
    mapObj[colKey] ??
    mapObj[normCol] ??
    mapObj[formField] ??
    mapObj[camelForm] ??
    mapObj[normForm]
  if (direct !== undefined) return direct
  const matchedKey = Object.keys(mapObj).find(k => {
    const nk = normalizeColCompact(k)
    return nk === normCol || nk === normForm
  })
  return matchedKey !== undefined ? mapObj[matchedKey] : undefined
}

/**
 * Builds multipart/form-data payload for PUT /api/JobOrders/{id} preserving existing photos.
 */
export function buildJobOrderQuickStatusFormData({ joPayload = {}, existingImages = {} } = {}) {
  const form = new FormData()

  Object.entries(joPayload || {}).forEach(([key, val]) => {
    const lowerKey = normalizeColCompact(key)
    if (JOB_ORDER_PHOTO_KEYS.has(lowerKey)) return
    if (JOB_ORDER_NUMERIC_OR_DATE_KEYS.has(lowerKey)) {
      if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim().toLowerCase() !== 'null') {
        form.append(key, String(val).trim())
      }
      return
    }
    if (val !== undefined && val !== null) {
      const strVal = String(val).trim()
      if (strVal.toLowerCase() !== 'null') {
        form.append(key, String(val))
      }
    }
  })

  JOB_ORDER_PHOTO_FIELDS.forEach(([colKey, formField, fallbackFileName]) => {
    const existingDataUrl = lookupImageMapValue(existingImages, colKey, formField)
    if (typeof existingDataUrl === 'string' && existingDataUrl.startsWith('data:image/')) {
      if (formField === 'SpeedtestImage') {
        form.append('speedtestImage', joPayload.speedtestImage || fallbackFileName)
      } else {
        const blob = dataUriToBlob(existingDataUrl)
        if (blob) {
          form.append(formField, blob, fallbackFileName)
        }
      }
    } else if (formField === 'SpeedtestImage' && joPayload.speedtestImage) {
      form.append('speedtestImage', joPayload.speedtestImage)
    }
  })

  return form
}

/**
 * Builds JSON payload and query config for PUT /api/Payments/{id}.
 */
export function buildPaymentQuickStatusPayload({
  record = {},
  recordId,
  statusKey = 'status',
  nextStatus,
  loggedInUserId = '1',
  processedBy = '',
  currentUserEmail = 'admin@switchfiber.com',
  localTimestamp = ''
} = {}) {
  const rec = record && typeof record === 'object' ? record : {}
  const finalPayload = {}

  Object.entries(rec).forEach(([k, v]) => {
    const norm = normalizeColCompact(k)
    if (norm === 'createdby' || norm === 'createddate' || LEGACY_AUDIT_ALIAS_KEYS.has(norm)) return
    if (v === '' || v === null || v === undefined) return
    finalPayload[k] = v instanceof Date ? v.toISOString() : v
  })

  finalPayload.id = Number(recordId) || recordId
  finalPayload[statusKey] = nextStatus
  finalPayload.status = nextStatus

  const acct = String(finalPayload.accountNo ?? rec.accountNo ?? '').trim()
  if (!acct) {
    throw new Error('Account # is required. Please edit this payment to assign a valid subscriber account.')
  }
  finalPayload.accountNo = acct

  if (finalPayload.paymentDate instanceof Date) {
    finalPayload.paymentDate = finalPayload.paymentDate.toISOString()
  } else if (finalPayload.paymentDate) {
    const d = new Date(finalPayload.paymentDate)
    finalPayload.paymentDate = Number.isNaN(d.getTime()) ? finalPayload.paymentDate : d.toISOString()
  } else {
    finalPayload.paymentDate = new Date().toISOString()
  }

  if (
    finalPayload.receivedPayment instanceof Date ||
    (typeof finalPayload.receivedPayment === 'string' &&
      (finalPayload.receivedPayment.includes('-') || finalPayload.receivedPayment.includes('T')))
  ) {
    finalPayload.receivedPayment = null
  }
  if (finalPayload.receivedPayment === null || finalPayload.receivedPayment === undefined || finalPayload.receivedPayment === '') {
    finalPayload.receivedPayment = null
  } else {
    const cleanPaymentStr = String(finalPayload.receivedPayment).replace(/[^0-9.-]/g, '')
    const numVal = Number(cleanPaymentStr)
    finalPayload.receivedPayment = !Number.isNaN(numVal) && cleanPaymentStr !== '' ? numVal : null
  }

  if (finalPayload.image && !finalPayload.plan) {
    finalPayload.plan = String(finalPayload.image)
    finalPayload.image = String(finalPayload.image)
  } else if (finalPayload.plan && !finalPayload.image) {
    finalPayload.image = String(finalPayload.plan)
    finalPayload.plan = String(finalPayload.plan)
  } else {
    if (finalPayload.image !== undefined && finalPayload.image !== null) {
      finalPayload.image = String(finalPayload.image)
    }
    if (finalPayload.plan !== undefined && finalPayload.plan !== null) {
      finalPayload.plan = String(finalPayload.plan)
    }
  }

  const procBy = String(processedBy || loggedInUserId || '1')
  finalPayload.processedBy = procBy
  if (!finalPayload.remarks && procBy) {
    finalPayload.remarks = procBy
  }
  finalPayload.modifiedBy = String(loggedInUserId || '1')
  finalPayload.modifiedDate = localTimestamp || new Date().toISOString()
  finalPayload.userEmail = currentUserEmail

  const txnId = String(finalPayload.transactionID ?? rec.transactionID ?? '').trim()
  if (txnId) {
    finalPayload.transactionID = txnId
  }

  delete finalPayload.createdBy
  delete finalPayload.createdDate

  if (finalPayload.accountBalance !== undefined && finalPayload.accountBalance !== null && finalPayload.accountBalance !== '') {
    finalPayload.accountBalance = Number(String(finalPayload.accountBalance).replace(/[^0-9.-]/g, '')) || 0
  }

  return {
    payload: finalPayload,
    config: txnId ? { params: { transactionid: txnId } } : {}
  }
}

/**
 * Builds JSON payload for PUT /api/Invoices/{id}.
 */
export function buildInvoiceQuickStatusPayload({
  record = {},
  recordId,
  statusKey = 'status',
  nextStatus,
  loggedInUserId = '1',
  currentUserEmail = 'admin@switchfiber.com',
  localTimestamp = ''
} = {}) {
  const rec = record && typeof record === 'object' ? record : {}
  const finalPayload = {}

  Object.entries(rec).forEach(([k, v]) => {
    const norm = normalizeColCompact(k)
    if (LEGACY_AUDIT_ALIAS_KEYS.has(norm)) return
    if (v === '' || v === null || v === undefined) return
    finalPayload[k] = v instanceof Date ? v.toISOString() : v
  })

  if (recordId !== undefined && recordId !== null && recordId !== '') {
    finalPayload.id = rec.id ?? (Number(recordId) || recordId)
  }
  finalPayload[statusKey] = nextStatus
  finalPayload.modifiedBy = String(loggedInUserId || '1')
  finalPayload.modifiedDate = localTimestamp || new Date().toISOString()
  finalPayload.userEmail = currentUserEmail

  return { payload: finalPayload, config: {} }
}

/**
 * Builds JSON payload for PUT /api/Discounts/{id} while preserving createdBy/createdDate.
 */
export function buildDiscountQuickStatusPayload({
  record = {},
  recordId,
  statusKey = 'discountStatus',
  nextStatus,
  loggedInUserId = '1',
  processedBy = '',
  currentUserEmail = 'admin@switchfiber.com',
  localTimestamp = ''
} = {}) {
  const rec = record && typeof record === 'object' ? record : {}
  const finalPayload = {}

  Object.entries(rec).forEach(([k, v]) => {
    const norm = normalizeColCompact(k)
    if (LEGACY_AUDIT_ALIAS_KEYS.has(norm)) return
    if (v === '' || v === null || v === undefined) return
    finalPayload[k] = v instanceof Date ? v.toISOString() : v
  })

  if (recordId !== undefined && recordId !== null && recordId !== '') {
    finalPayload.id = Number(recordId) || recordId
  }
  finalPayload[statusKey] = nextStatus
  if (normalizeColCompact(statusKey) === 'discountstatus') {
    finalPayload.discountStatus = nextStatus
  }
  if (rec.createdBy !== undefined && rec.createdBy !== null && String(rec.createdBy).trim() !== '') {
    finalPayload.createdBy = String(rec.createdBy)
  }
  if (rec.createdDate !== undefined && rec.createdDate !== null && rec.createdDate !== '') {
    finalPayload.createdDate = rec.createdDate instanceof Date ? rec.createdDate.toISOString() : rec.createdDate
  }
  if (!finalPayload.processedBy || !String(finalPayload.processedBy).trim()) {
    finalPayload.processedBy = String(processedBy || loggedInUserId || '1')
  }
  finalPayload.modifiedBy = String(loggedInUserId || '1')
  finalPayload.modifiedDate = localTimestamp || new Date().toISOString()
  finalPayload.userEmail = currentUserEmail

  return { payload: finalPayload, config: {} }
}

/**
 * Builds JSON payload for PUT /api/InventoryLogs/{id} preserving SQL length caps and createdDate.
 */
export function buildInventoryLogQuickStatusPayload({
  record = {},
  recordId,
  nextStatus,
  userDisplayName = 'Admin'
} = {}) {
  const rec = record && typeof record === 'object' ? record : {}
  const normStr = (val, maxLen) => {
    if (val === null || val === undefined) return null
    const str = String(val).trim()
    if (!str) return null
    return str.length > maxLen ? str.slice(0, maxLen).trim() : str
  }

  let cleanQty = 1
  if (rec.quantity !== undefined && rec.quantity !== null && rec.quantity !== '') {
    const qNum = parseInt(rec.quantity, 10)
    if (!Number.isNaN(qNum) && qNum > 0) cleanQty = qNum
  }

  const createdDate = rec.createdDate instanceof Date
    ? rec.createdDate.toISOString()
    : (rec.createdDate || new Date().toISOString())

  const payload = {
    id: Number(recordId) || recordId,
    itemId: normStr(rec.itemId, 50),
    quantity: cleanQty,
    requestedBy: normStr(rec.requestedBy || userDisplayName, 100),
    requestedWith: normStr(rec.requestedWith, 100),
    status: normStr(nextStatus || 'Pending', 20),
    remarks: normStr(rec.remarks, 255),
    createdDate
  }

  return { payload, config: {} }
}

/**
 * Orchestrates building the PUT payload, request config, and effective stored status
 * for quick-status updates across all supported SwitchFiber endpoints.
 */
export function buildQuickStatusUpdateRequest({
  endpoint,
  record = {},
  recordId,
  col = 'status',
  nextStatus,
  context = {}
} = {}) {
  const ep = normalizeQuickStatusEndpoint(endpoint)
  const rec = record && typeof record === 'object' ? record : {}
  const actualKey = findRecordKey(rec, col)
  const canonicalKey = canonicalStatusKeyFor(col)

  const loggedInUserId = String(context.loggedInUserId || '1')
  const numericUserId = Number(context.numericUserId ?? loggedInUserId) || 1
  const currentUserEmail = context.currentUserEmail || 'admin@switchfiber.com'
  const nowIso = context.nowIso || new Date().toISOString()
  const localTimestamp = context.localTimestamp || nowIso

  if (ep === 'applications' || ep === 'application') {
    const form = buildApplicationQuickStatusFormData(rec, nextStatus, {
      loggedInUserId,
      currentUserEmail,
      nowIso,
      normalizePhone: context.normalizePhone,
      normalizeAgreement: context.normalizeAgreement,
      capStr: context.capStr
    })
    return { payload: form, config: {}, effectiveStatus: nextStatus }
  }

  if (ep === 'joborders' || ep === 'joborder' || ep === 'job_order') {
    const merged = {
      ...rec,
      id: recordId,
      [actualKey]: nextStatus,
      [canonicalKey]: nextStatus
    }
    const joPayload = typeof context.buildJobOrderPayload === 'function'
      ? context.buildJobOrderPayload(merged, 'update', numericUserId, loggedInUserId)
      : merged
    if (typeof context.applyJobOrderCreationAudit === 'function') {
      context.applyJobOrderCreationAudit(joPayload, numericUserId, 'update')
    }
    const form = buildJobOrderQuickStatusFormData({
      joPayload,
      existingImages: context.existingImages || {}
    })
    const effectiveStatus = joPayload?.[canonicalKey] ?? nextStatus
    return { payload: form, config: {}, effectiveStatus }
  }

  if (ep === 'serviceorders' || ep === 'serviceorder' || ep === 'service_order' || ep === 'service_orders') {
    const merged = {
      ...rec,
      [actualKey]: nextStatus,
      [canonicalKey]: nextStatus,
      modifiedBy: loggedInUserId,
      modifiedDate: nowIso,
      userEmail: context.authUserEmail || rec.userEmail || currentUserEmail
    }
    if (rec.createdDate !== undefined && rec.createdDate !== null && rec.createdDate !== '') {
      merged.createdDate = rec.createdDate
    }
    const form = buildServiceOrderMultipartFormData({
      payload: merged,
      files: {},
      removed: {},
      existingImages: context.existingImages || {},
      serializeTime: context.serializeTime,
      getFieldType: context.getFieldType,
      isAuditField: context.isAuditField
    })
    return { payload: form, config: {}, effectiveStatus: nextStatus }
  }

  if (ep === 'billingdetails' || ep === 'billing') {
    const merged = {
      ...rec,
      [actualKey]: nextStatus,
      [canonicalKey]: nextStatus
    }
    const billingPayload = typeof context.buildBillingPayload === 'function'
      ? context.buildBillingPayload(merged, 'update', loggedInUserId)
      : merged
    const effectiveStatus = billingPayload?.[canonicalKey] ?? nextStatus
    return { payload: billingPayload, config: {}, effectiveStatus }
  }

  if (ep === 'payments' || ep === 'payment') {
    const { payload, config } = buildPaymentQuickStatusPayload({
      record: rec,
      recordId,
      statusKey: actualKey,
      nextStatus,
      loggedInUserId,
      processedBy: context.processedBy,
      currentUserEmail,
      localTimestamp
    })
    return { payload, config, effectiveStatus: nextStatus }
  }

  if (ep === 'invoices' || ep === 'invoice' || ep === 'billingstatements' || ep === 'billingstatement' || ep === 'billing_statements' || ep === 'billing_statement') {
    const { payload, config } = buildInvoiceQuickStatusPayload({
      record: rec,
      recordId,
      statusKey: actualKey,
      nextStatus,
      loggedInUserId,
      currentUserEmail,
      localTimestamp
    })
    return { payload, config, effectiveStatus: nextStatus }
  }

  if (ep === 'discounts' || ep === 'discount') {
    const { payload, config } = buildDiscountQuickStatusPayload({
      record: rec,
      recordId,
      statusKey: actualKey,
      nextStatus,
      loggedInUserId,
      processedBy: context.processedBy,
      currentUserEmail,
      localTimestamp
    })
    return { payload, config, effectiveStatus: nextStatus }
  }

  if (ep === 'inventorylogs' || ep === 'inventorylog' || ep === 'inventory_logs' || ep === 'inventory_log') {
    const { payload, config } = buildInventoryLogQuickStatusPayload({
      record: rec,
      recordId,
      nextStatus,
      userDisplayName: context.userDisplayName
    })
    return { payload, config, effectiveStatus: payload.status ?? nextStatus }
  }

  throw new Error(`Quick status editing is not supported for endpoint "${endpoint}".`)
}
