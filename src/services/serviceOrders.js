import apiClient from './api.js'
// Gene - Nov, 24, 2026: Import dataUriToBlob for shared Service Order FormData image preservation and Create/Edit helpers
import { dataUriToBlob } from '../utils/imageActions.js'

/**
 * Normalizes legacy ServiceOrder records from the API where CSV columns were imported
 * in shifted database fields (e.g. date in accountNumber, phone in fullName, email in contactNumber,
 * address in emailAddress, or plan in provider).
 *
 * @param {Object} r - Raw ServiceOrder record
 * @returns {Object} Normalized ServiceOrder record with accurate semantic fields
 */
export function normalizeServiceOrder(r) {
  if (!r || typeof r !== 'object') return r
  const copy = { ...r }

  const isEmail = (s) => typeof s === 'string' && s.includes('@') && s.includes('.')
  const isDateStr = (s) => typeof s === 'string' && (s.includes('/') || (s.length >= 10 && s[4] === '-' && s[7] === '-'))
  const isPhoneDigits = (s) => typeof s === 'string' && /^[0-9+() -]{7,15}$/.test(s.trim()) && !s.includes('/')

  // Detection 1: Shifted CSV records (867 rows)
  // where date is in accountNumber, phone in fullName, email in contactNumber, street address in emailAddress
  if (isDateStr(copy.accountNumber) && (isPhoneDigits(copy.fullName) || isEmail(copy.contactNumber))) {
    const rawDate = copy.accountNumber
    const rawContact = isPhoneDigits(copy.fullName) ? copy.fullName : ''
    const rawEmail = isEmail(copy.contactNumber) ? copy.contactNumber : ''
    const rawAddress = copy.emailAddress

    copy.dateInstalled = rawDate || copy.dateInstalled
    copy.accountNumber = ''
    copy.fullName = ''
    copy.contactNumber = rawContact || copy.contactNumber
    copy.emailAddress = rawEmail || copy.emailAddress
    copy.address = rawAddress || copy.address
  }

  // Detection 2: Shifted Plan/Network records (Records 0-2)
  // where provider has plan name, routerModemSN has connection type, etc.
  if (typeof copy.provider === 'string' && copy.provider.includes('Switch') && copy.routerModemSN === 'Fiber') {
    const rawPlan = copy.provider
    const rawProvider = copy.username || 'SWITCH'
    const rawUsername = copy.connectionType || copy.username
    const rawConnectionType = copy.routerModemSN || 'Fiber'
    const rawModemSN = copy.lcp || ''
    const rawLcp = copy.nap || ''
    const rawNap = copy.port || ''
    const rawPort = copy.vlan || ''
    const rawVlan = copy.supportStatus || ''
    const rawSupportStatus = copy.concern || ''
    const rawConcern = copy.connectionRemarks || ''
    const rawConnectionRemarks = copy.priorityLevel || ''
    const rawVisitStatus = (copy.visitBy === 'In Progress' || copy.visitBy === 'Pending' || copy.visitBy === 'Completed')
      ? copy.visitBy
      : copy.visitStatus

    copy.plan = rawPlan
    copy.provider = rawProvider
    copy.username = rawUsername
    copy.connectionType = rawConnectionType
    copy.routerModemSN = rawModemSN
    copy.lcp = rawLcp
    copy.nap = rawNap
    copy.port = rawPort
    copy.vlan = rawVlan
    copy.supportStatus = rawSupportStatus
    copy.concern = rawConcern
    copy.connectionRemarks = rawConnectionRemarks
    copy.priorityLevel = 'Normal'
    copy.visitStatus = rawVisitStatus
    if (copy.visitBy === rawVisitStatus) copy.visitBy = ''
  }

  // Clean non-image values ("0", "1", "2") from photo fields so they don't break previews
  ['image1', 'image2', 'image3', 'houseFrontPicture', 'clientSignature'].forEach(imgKey => {
    if (copy[imgKey] === '0' || copy[imgKey] === '1' || copy[imgKey] === '2' || copy[imgKey] === null) {
      copy[imgKey] = ''
    }
  })

  return copy
}

// Gene - Nov, 24, 2026: Shared Service Order image upload constants, Create payload sanitizer, and Edit/Create FormData builder matching OpenAPI multipart PUT schema
export const SERVICE_ORDER_PHOTO_FIELDS = [
  ['clientSignature', 'ClientSignature', 'clientSignature.jpg'],
  ['image1', 'Image1', 'image1.jpg'],
  ['image2', 'Image2', 'image2.jpg'],
  ['image3', 'Image3', 'image3.jpg'],
  ['houseFrontPicture', 'HouseFrontPicture', 'houseFrontPicture.jpg']
]

export const SERVICE_ORDER_PHOTO_KEYS = new Set([
  'clientsignature',
  'image1',
  'image2',
  'image3',
  'housefrontpicture',
  'housefront'
])

export const SERVICE_ORDER_NUMERIC_OR_DATE_KEYS = new Set([
  'id',
  'itemquantity',
  'itemquantity1',
  'itemquantity2',
  'itemquantity3',
  'itemquantity4',
  'itemquantity5',
  'itemquantity6',
  'itemquantity7',
  'itemquantity8',
  'itemquantity9',
  'itemquantity10',
  'servicecharge',
  'createddate',
  'dateinstalled',
  'modifieddate',
  'starttimestamp',
  'stoptimestamp',
  'duration',
  'techmodifieddate',
  'assigneddate'
])

const normalizeSoKey = (key) => String(key || '').toLowerCase().replace(/_/g, '')

const isFileOrBlob = (val) => Boolean(
  val && (
    (typeof Blob !== 'undefined' && val instanceof Blob) ||
    (typeof File !== 'undefined' && val instanceof File)
  )
)

const lookupSoMapValue = (mapObj, colKey, formField) => {
  if (!mapObj || typeof mapObj !== 'object') return undefined
  const normCol = normalizeSoKey(colKey)
  const normForm = normalizeSoKey(formField)
  const camelForm = formField ? formField.charAt(0).toLowerCase() + formField.slice(1) : ''
  const direct =
    mapObj[colKey] ??
    mapObj[normCol] ??
    mapObj[formField] ??
    mapObj[camelForm] ??
    mapObj[normForm]
  if (direct !== undefined) return direct
  const matchedKey = Object.keys(mapObj).find(k => {
    const nk = normalizeSoKey(k)
    return nk === normCol || nk === normForm
  })
  return matchedKey !== undefined ? mapObj[matchedKey] : undefined
}

/**
 * Determine whether any Service Order photo slot has a newly selected File/Blob
 * or an uploaded data:image/ URL that requires a follow-up multipart PUT.
 */
export function hasServiceOrderUploadableImages(files = {}, formValues = {}, removed = {}) {
  return SERVICE_ORDER_PHOTO_FIELDS.some(([colKey, formField]) => {
    if (Boolean(lookupSoMapValue(removed, colKey, formField))) return false
    const selected = lookupSoMapValue(files, colKey, formField)
    if (isFileOrBlob(selected)) return true
    const previewVal = lookupSoMapValue(formValues, colKey, formField)
    return typeof previewVal === 'string' && previewVal.startsWith('data:image/')
  })
}

/**
 * Sanitize JSON POST /api/ServiceOrders create payload so raw base64/blob image
 * strings are never sent in JSON (preventing SQL VARCHAR truncation) and empty
 * numeric/date strings are omitted cleanly.
 */
export function sanitizeServiceOrderCreatePayload(payload = {}) {
  if (!payload || typeof payload !== 'object') return payload
  const sanitized = { ...payload }
  Object.keys(sanitized).forEach((key) => {
    const lowerKey = normalizeSoKey(key)
    const val = sanitized[key]

    if (SERVICE_ORDER_PHOTO_KEYS.has(lowerKey)) {
      if (
        isFileOrBlob(val) ||
        (typeof val === 'string' && (val.startsWith('data:image/') || val.startsWith('blob:')))
      ) {
        delete sanitized[key]
      }
      return
    }

    if (SERVICE_ORDER_NUMERIC_OR_DATE_KEYS.has(lowerKey)) {
      if (
        val === undefined ||
        val === null ||
        (typeof val === 'string' && (val.trim() === '' || val.trim().toLowerCase() === 'null'))
      ) {
        delete sanitized[key]
      }
    }
  })
  return sanitized
}

/**
 * Build a multipart/form-data payload for PUT /api/ServiceOrders/{id} matching
 * the OpenAPI query/scalar fields and 5 IFormFile image fields.
 */
export function buildServiceOrderMultipartFormData({
  payload = {},
  files = {},
  removed = {},
  existingImages = {},
  serializeTime = null,
  getFieldType = null,
  isAuditField = null
} = {}) {
  const form = new FormData()

  Object.entries(payload || {}).forEach(([key, val]) => {
    const lowerKey = normalizeSoKey(key)
    if (SERVICE_ORDER_PHOTO_KEYS.has(lowerKey)) return
    if (
      typeof isAuditField === 'function' &&
      isAuditField(key) &&
      lowerKey !== 'id' &&
      lowerKey !== 'createddate' &&
      lowerKey !== 'modifiedby' &&
      lowerKey !== 'modifieddate'
    ) {
      return
    }

    const fieldType = typeof getFieldType === 'function' ? getFieldType(key) : ''
    if (fieldType === 'time' || lowerKey === 'starttimestamp' || lowerKey === 'stoptimestamp') {
      if (typeof serializeTime === 'function') {
        const serializedTime = serializeTime(val, payload.assignedDate || payload.dateInstalled || null)
        if (serializedTime) {
          form.append(key, serializedTime)
        }
      } else if (val !== undefined && val !== null) {
        const strVal = val instanceof Date ? val.toISOString() : String(val).trim()
        if (strVal !== '' && strVal.toLowerCase() !== 'null') {
          form.append(key, strVal)
        }
      }
      return
    }

    if (fieldType === 'date' || SERVICE_ORDER_NUMERIC_OR_DATE_KEYS.has(lowerKey)) {
      if (val !== undefined && val !== null) {
        const strVal = val instanceof Date ? val.toISOString() : String(val).trim()
        if (strVal !== '' && strVal.toLowerCase() !== 'null') {
          form.append(key, strVal)
        }
      }
      return
    }

    if (val !== undefined && val !== null) {
      const strVal = val instanceof Date ? val.toISOString() : String(val)
      if (strVal.trim().toLowerCase() !== 'null') {
        form.append(key, strVal)
      }
    }
  })

  SERVICE_ORDER_PHOTO_FIELDS.forEach(([colKey, formField, fallbackFileName]) => {
    const newlySelected = lookupSoMapValue(files, colKey, formField)
    if (isFileOrBlob(newlySelected)) {
      form.append(formField, newlySelected, newlySelected.name || fallbackFileName)
      return
    }

    if (Boolean(lookupSoMapValue(removed, colKey, formField))) {
      return
    }

    const existingDataUrl = lookupSoMapValue(existingImages, colKey, formField)
    if (typeof existingDataUrl === 'string' && existingDataUrl.startsWith('data:image/')) {
      const blob = dataUriToBlob(existingDataUrl)
      if (blob) {
        form.append(formField, blob, fallbackFileName)
      }
    }
  })

  return form
}

/**
 * Service Orders — post-installation support, repair, and pullout visits.
 * Adheres strictly to REST conventions (/api/ServiceOrders).
 */
export const ServiceOrderService = {
  async getServiceOrders() {
    const res = await apiClient.get('/ServiceOrders')
    const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    return list.map(normalizeServiceOrder)
  },
  async getServiceOrderById(id) {
    const res = await apiClient.get(`/ServiceOrders/${id}`)
    const record = res?.data || res
    return normalizeServiceOrder(record)
  },
  // Gene - Nov 5, 2026: Added getServiceOrderImage(id) to fetch Service Order photos from GET /api/ServiceOrders/{id}/GetServiceOrderImage
  /**
   * Fetch binary / base64 image files for a Service Order
   * @param {string|number} id
   */
  getServiceOrderImage(id) {
    return apiClient.get(`/ServiceOrders/${id}/GetServiceOrderImage`)
  },
  // /**
  //  * @param {import('../models/types').CreateServiceOrderRequest} data
  //  */
  // createServiceOrder(data) {
  //   return apiClient.post('/ServiceOrders', data)
  // },
  // Gene - Nov, 27, 2026: Strip manual Content-Type header on FormData createServiceOrder payload so browser XHR/Axios sets multipart/form-data with dynamic boundary
  /**
   * @param {import('../models/types').CreateServiceOrderRequest|FormData} data
   * @param {Object} [config]
   */
  createServiceOrder(data, config = {}) {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      const cleanHeaders = { ...(config && config.headers) }
      delete cleanHeaders['Content-Type']
      delete cleanHeaders['content-type']
      return apiClient.post('/ServiceOrders', data, {
        ...config,
        headers: cleanHeaders
      })
    }
    return apiClient.post('/ServiceOrders', data, config)
  },
  /**
   * @param {string|number} id
   * @param {import('../models/types').UpdateServiceOrderRequest|FormData} data
   * @param {Object} [config]
   */
  /*
  updateServiceOrder(id, data) {
    return apiClient.put(`/ServiceOrders/${id}`, data)
  },
  */
  /*
  // Gene - Nov 5, 2026: Pass multipart/form-data header when updating Service Order with FormData payload to prevent 415 error
  updateServiceOrder(id, data, config = {}) {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return apiClient.put(`/ServiceOrders/${id}`, data, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(config && config.headers)
        }
      })
    }
    return apiClient.put(`/ServiceOrders/${id}`, data, config)
  },
  */
  // Gene - Nov, 24, 2026: Strip manual Content-Type header on FormData updateServiceOrder payload so browser XHR/Axios sets the dynamic boundary delimiter
  updateServiceOrder(id, data, config = {}) {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      const cleanHeaders = { ...(config && config.headers) }
      delete cleanHeaders['Content-Type']
      delete cleanHeaders['content-type']
      return apiClient.put(`/ServiceOrders/${id}`, data, {
        ...config,
        headers: cleanHeaders
      })
    }
    return apiClient.put(`/ServiceOrders/${id}`, data, config)
  },
  deleteServiceOrder(id) {
    return apiClient.delete(`/ServiceOrders/${id}`)
  }
}

export default ServiceOrderService
