// Gene - Nov, 25, 2026: Centralized REST API service, canonical type codes, and default catalog for /api/Status
import apiClient from './api.js'

export const STATUS_TYPES = [
  { code: 'APPLICATION', label: 'Applications (status)' },
  { code: 'JOB_ORDER', label: 'Job Orders (status)' },
  { code: 'JO_ONSITE', label: 'Job Orders Onsite (onsiteStatus)' },
  { code: 'SO_SUPPORT', label: 'Service Orders Support (supportStatus)' },
  { code: 'SO_VISIT', label: 'Service Orders Visit (visitStatus)' },
  { code: 'BILLING', label: 'Billing Status (billingStatus)' },
  { code: 'DELIVERY', label: 'Delivery Status (deliveryStatus)' },
  { code: 'INVOICE', label: 'Invoice Status (status)' },
  { code: 'PAYMENT', label: 'Payment Status (status)' },
  { code: 'DISCOUNT', label: 'Discount Status (discountStatus)' },
  { code: 'INVENTORY_LOG', label: 'Inventory Logs (status)' }
]

/**
 * Default status catalog covering all modules across SwitchFiber:
 * - `type`: type code indicating where the status is used
 * - `name`: stored status code / value persisted on records
 * - `description`: human-readable label displayed in dropdown lists
 */
export const DEFAULT_STATUSES = [
  // APPLICATION (12)
  { type: 'APPLICATION', name: 'Inprogress', description: 'In Progress' },
  { type: 'APPLICATION', name: 'Done', description: 'Done' },
  { type: 'APPLICATION', name: 'Approved', description: 'Approved' },
  { type: 'APPLICATION', name: 'Schedule', description: 'Scheduled' },
  { type: 'APPLICATION', name: 'Submitted', description: 'Submitted' },
  { type: 'APPLICATION', name: 'For Confirmation', description: 'For Confirmation' },
  { type: 'APPLICATION', name: 'Confirmed', description: 'Confirmed' },
  { type: 'APPLICATION', name: 'No Facility', description: 'No Facility' },
  { type: 'APPLICATION', name: 'No Slot', description: 'No Slot' },
  { type: 'APPLICATION', name: 'Duplicate', description: 'Duplicate' },
  { type: 'APPLICATION', name: 'Rescheduled', description: 'Rescheduled' },
  { type: 'APPLICATION', name: 'Cancelled', description: 'Cancelled' },

  // JOB_ORDER (9)
  { type: 'JOB_ORDER', name: 'Inprogress', description: 'In Progress' },
  { type: 'JOB_ORDER', name: 'Scheduled', description: 'Scheduled' },
  { type: 'JOB_ORDER', name: 'Completed', description: 'Completed' },
  { type: 'JOB_ORDER', name: 'Activated', description: 'Activated' },
  { type: 'JOB_ORDER', name: 'Failed', description: 'Failed' },
  { type: 'JOB_ORDER', name: 'For Confirmation', description: 'For Confirmation' },
  { type: 'JOB_ORDER', name: 'Confirmed', description: 'Confirmed' },
  { type: 'JOB_ORDER', name: 'Rescheduled', description: 'Rescheduled' },
  { type: 'JOB_ORDER', name: 'Cancelled', description: 'Cancelled' },

  // JO_ONSITE (4)
  { type: 'JO_ONSITE', name: 'Done', description: 'Done' },
  { type: 'JO_ONSITE', name: 'Failed', description: 'Failed' },
  { type: 'JO_ONSITE', name: 'Rescheduled', description: 'Rescheduled' },
  { type: 'JO_ONSITE', name: 'InProgress', description: 'In Progress' },

  // SO_SUPPORT (7)
  { type: 'SO_SUPPORT', name: 'Pending', description: 'Pending' },
  { type: 'SO_SUPPORT', name: 'In Progress', description: 'In Progress' },
  { type: 'SO_SUPPORT', name: 'For Visit', description: 'For Visit' },
  { type: 'SO_SUPPORT', name: 'Resolved', description: 'Resolved' },
  { type: 'SO_SUPPORT', name: 'Closed', description: 'Closed' },
  { type: 'SO_SUPPORT', name: 'Cancelled', description: 'Cancelled' },
  { type: 'SO_SUPPORT', name: 'Failed', description: 'Failed' },

  // SO_VISIT (8)
  { type: 'SO_VISIT', name: 'Scheduled', description: 'Scheduled' },
  { type: 'SO_VISIT', name: 'Dispatched', description: 'Dispatched' },
  { type: 'SO_VISIT', name: 'In Progress', description: 'In Progress' },
  { type: 'SO_VISIT', name: 'Done', description: 'Done' },
  { type: 'SO_VISIT', name: 'Completed', description: 'Completed' },
  { type: 'SO_VISIT', name: 'Reschedule', description: 'Reschedule' },
  { type: 'SO_VISIT', name: 'Cancelled', description: 'Cancelled' },
  { type: 'SO_VISIT', name: 'Failed', description: 'Failed' },

  // BILLING (6)
  { type: 'BILLING', name: 'Done', description: 'Done' },
  { type: 'BILLING', name: 'Pending', description: 'Pending' },
  { type: 'BILLING', name: 'Approved', description: 'Approved' },
  { type: 'BILLING', name: 'Active', description: 'Active' },
  { type: 'BILLING', name: 'Suspended', description: 'Suspended' },
  { type: 'BILLING', name: 'Disconnected', description: 'Disconnected' },

  // DELIVERY (6)
  { type: 'DELIVERY', name: 'Delivered', description: 'Delivered' },
  { type: 'DELIVERY', name: 'Pending', description: 'Pending' },
  { type: 'DELIVERY', name: 'Sent via Email', description: 'Sent via Email' },
  { type: 'DELIVERY', name: 'Sent via SMS', description: 'Sent via SMS' },
  { type: 'DELIVERY', name: 'Printed', description: 'Printed' },
  { type: 'DELIVERY', name: 'Failed', description: 'Failed' },

  // INVOICE (5)
  { type: 'INVOICE', name: 'Unpaid', description: 'Unpaid' },
  { type: 'INVOICE', name: 'Paid', description: 'Paid' },
  { type: 'INVOICE', name: 'Overdue', description: 'Overdue' },
  { type: 'INVOICE', name: 'Partially Paid', description: 'Partially Paid' },
  { type: 'INVOICE', name: 'Cancelled', description: 'Cancelled' },

  // PAYMENT (6)
  { type: 'PAYMENT', name: 'Paid', description: 'Paid' },
  { type: 'PAYMENT', name: 'Pending', description: 'Pending' },
  { type: 'PAYMENT', name: 'Verified', description: 'Verified' },
  { type: 'PAYMENT', name: 'Failed', description: 'Failed' },
  { type: 'PAYMENT', name: 'Refunded', description: 'Refunded' },
  { type: 'PAYMENT', name: 'Cancelled', description: 'Cancelled' },

  // DISCOUNT (6)
  { type: 'DISCOUNT', name: 'Active', description: 'Active' },
  { type: 'DISCOUNT', name: 'Used', description: 'Used' },
  { type: 'DISCOUNT', name: 'Pending', description: 'Pending' },
  { type: 'DISCOUNT', name: 'Approved', description: 'Approved' },
  { type: 'DISCOUNT', name: 'Expired', description: 'Expired' },
  { type: 'DISCOUNT', name: 'Cancelled', description: 'Cancelled' },

  // INVENTORY_LOG (5)
  { type: 'INVENTORY_LOG', name: 'Pending', description: 'Pending' },
  { type: 'INVENTORY_LOG', name: 'Approved', description: 'Approved' },
  { type: 'INVENTORY_LOG', name: 'Issued', description: 'Issued' },
  { type: 'INVENTORY_LOG', name: 'Returned', description: 'Returned' },
  { type: 'INVENTORY_LOG', name: 'Rejected', description: 'Rejected' }
]

export function normalizeStatusType(type) {
  return String(type ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')
}

/**
 * Normalize request payload to match ASP.NET `StatusRequest` schema:
 * { type, name, description, createdBy } (all non-nullable strings).
 */
export function normalizeStatusPayload(input = {}, fallbackUser = '1') {
  const type = normalizeStatusType(input.type) || 'GENERAL'
  const name = String(input.name ?? '').trim()
  const description = String(input.description ?? '').trim() || name
  const createdBy = String(input.createdBy ?? fallbackUser ?? '1').trim() || '1'
  return {
    type,
    name,
    description,
    createdBy
  }
}

/**
 * Filter Status records by `typeCode` and map `{ label: description, value: name }`,
 * deduplicating case-insensitively by `name`.
 */
export function mapStatusesToDropdownOptions(records = [], typeCode = '') {
  if (!Array.isArray(records) || records.length === 0) return []
  const targetType = normalizeStatusType(typeCode)
  const seen = new Set()
  const out = []

  for (const row of records) {
    if (!row || typeof row !== 'object') continue
    if (targetType && normalizeStatusType(row.type) !== targetType) continue
    const value = String(row.name ?? '').trim()
    if (!value) continue
    const dedupKey = value.toLowerCase()
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)
    const label = String(row.description ?? '').trim() || value
    out.push({ label, value })
  }

  return out
}

/**
 * Group Status records by normalized `type` code into `{ [TYPE]: [{ label, value }, ...] }`.
 */
export function groupStatusesByType(records = []) {
  const grouped = {}
  if (!Array.isArray(records)) return grouped

  const seenByType = {}
  for (const row of records) {
    if (!row || typeof row !== 'object') continue
    const typeKey = normalizeStatusType(row.type)
    const value = String(row.name ?? '').trim()
    if (!typeKey || !value) continue
    if (!grouped[typeKey]) {
      grouped[typeKey] = []
      seenByType[typeKey] = new Set()
    }
    const dedupKey = value.toLowerCase()
    if (seenByType[typeKey].has(dedupKey)) continue
    seenByType[typeKey].add(dedupKey)
    grouped[typeKey].push({
      label: String(row.description ?? '').trim() || value,
      value
    })
  }

  return grouped
}

export const StatusService = {
  getAll(config = {}) {
    return apiClient.get('/Status', { cancelOnNavigate: false, ...config })
  },
  getByCode(code, config = {}) {
    return apiClient.get(`/Status/${encodeURIComponent(String(code))}`, config)
  },
  create(data, config = {}) {
    return apiClient.post('/Status', normalizeStatusPayload(data), config)
  },
  update(code, data, config = {}) {
    return apiClient.put(`/Status/${encodeURIComponent(String(code))}`, normalizeStatusPayload(data), config)
  },
  remove(code, config = {}) {
    return apiClient.delete(`/Status/${encodeURIComponent(String(code))}`, config)
  },
  async seedDefaultStatuses(createdBy = '1') {
    const res = await this.getAll()
    const existing = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])
    const created = []

    for (const item of DEFAULT_STATUSES) {
      const match = existing.find(e =>
        normalizeStatusType(e?.type) === normalizeStatusType(item.type) &&
        String(e?.name || '').trim().toLowerCase() === item.name.trim().toLowerCase()
      )
      if (!match) {
        const postRes = await this.create({ ...item, createdBy: String(createdBy || '1') })
        created.push(postRes || item)
      }
    }

    return {
      existing,
      created,
      total: existing.length + created.length
    }
  }
}

export default StatusService
