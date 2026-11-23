// Gene - Nov, 23, 2026: Helper utilities for Applications status normalization and fast DataTable quick-status FormData updates

export const APPLICATION_CANONICAL_STATUS_MAP = Object.freeze({
  forconfirmation: 'For Confirmation',
  confirmed: 'Confirmed',
  nofacility: 'No Facility',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  noslot: 'No Slot',
  duplicate: 'Duplicate'
})

const toStatusToken = (val) => {
  const token = String(val ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')
  return token === 'canceled' ? 'cancelled' : token
}

const defaultCapStr = (val, max = 255) => {
  if (val === null || val === undefined) return ''
  return String(val).trim().slice(0, max)
}

const defaultNormalizePhone = (val) => {
  if (val === null || val === undefined) return ''
  const str = String(val).trim()
  if (!str) return ''
  const raw = str.replace(/[\s\-()]/g, '')
  if (/^9\d{9}$/.test(raw)) return `0${raw}`
  if (/^639\d{9}$/.test(raw)) return `0${raw.slice(2)}`
  if (/^\+639\d{9}$/.test(raw)) return `0${raw.slice(3)}`
  if (/^0\d{10}$/.test(raw)) return raw
  return raw
}

const defaultNormalizeAgreement = (val) => {
  if (val === true || val === 'true') return 'Yes, I Agree'
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed && trimmed.toLowerCase() !== 'false' && trimmed.toLowerCase() !== 'no' && trimmed.toLowerCase() !== '0') {
      return 'Yes, I Agree'
    }
  }
  return ''
}

const pickField = (record, ...keys) => {
  if (!record || typeof record !== 'object') return undefined
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key]
    }
  }
  return undefined
}

const defaultGetRecordId = (record) => {
  if (!record || typeof record !== 'object') return null
  if ('id' in record && record.id !== undefined && record.id !== null) return record.id
  if ('Id' in record && record.Id !== undefined && record.Id !== null) return record.Id
  if ('ID' in record && record.ID !== undefined && record.ID !== null) return record.ID
  const key = Object.keys(record).find(k => k.toLowerCase().endsWith('id'))
  if (key && record[key] !== undefined && record[key] !== null) return record[key]
  const firstVal = Object.values(record)[0]
  return firstVal !== undefined && firstVal !== null ? firstVal : null
}

/**
 * Normalizes a raw Application status string against the active options list and
 * canonical status spelling map while preserving unknown legacy statuses verbatim.
 */
export const normalizeApplicationStatusValue = (rawStatus, availableOptions = []) => {
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
        const rawVal = opt.value ?? opt.label
        if (rawVal === undefined || rawVal === null) return null
        const valueStr = String(rawVal).trim()
        const labelStr = String(opt.label ?? rawVal).trim()
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

  const token = toStatusToken(trimmed)
  if (token) {
    const tokenMatch = normalizedOptions.find(
      opt => toStatusToken(opt.value) === token || toStatusToken(opt.label) === token
    )
    if (tokenMatch) return tokenMatch.value

    if (APPLICATION_CANONICAL_STATUS_MAP[token]) {
      return APPLICATION_CANONICAL_STATUS_MAP[token]
    }
  }

  return trimmed
}

/**
 * Builds the multipart/form-data payload expected by PUT /api/Applications/{id}
 * while preserving existing photos (no Remove* or *File keys) and creation audit fields.
 */
export const buildApplicationQuickStatusFormData = (record, nextStatus, options = {}) => {
  const rec = record && typeof record === 'object' ? record : {}
  const {
    loggedInUserId = '1',
    currentUserEmail = 'admin@switchfiber.com',
    nowIso = new Date().toISOString(),
    normalizePhone = defaultNormalizePhone,
    normalizeAgreement = defaultNormalizeAgreement,
    capStr = defaultCapStr
  } = options

  const form = new FormData()
  const barangayVal = pickField(rec, 'barangay', 'Barangay')
  const barangay1Val = pickField(rec, 'barangay1', 'Barangay1') || barangayVal

  form.append('EmailAddress', capStr(pickField(rec, 'emailAddress', 'EmailAddress'), 100))
  form.append('Region', capStr(pickField(rec, 'region', 'Region'), 100))
  form.append('City', capStr(pickField(rec, 'city', 'City'), 100))
  form.append('Barangay', capStr(barangayVal, 100))
  form.append('ReferredBy', capStr(pickField(rec, 'referredBy', 'ReferredBy'), 150))
  form.append('FirstName', capStr(pickField(rec, 'firstName', 'FirstName'), 100))
  form.append('MiddleName', capStr(pickField(rec, 'middleName', 'MiddleName'), 100))
  form.append('LastName', capStr(pickField(rec, 'lastName', 'LastName'), 100))
  form.append('MobileNumber', capStr(normalizePhone(pickField(rec, 'mobileNumber', 'MobileNumber')), 20))
  form.append('SecondaryMobileNumber', capStr(normalizePhone(pickField(rec, 'secondaryMobileNumber', 'SecondaryMobileNumber')), 20))
  form.append('InstallationAddress', capStr(pickField(rec, 'installationAddress', 'InstallationAddress'), 255))
  form.append('Landmark', capStr(pickField(rec, 'landmark', 'Landmark'), 255))
  form.append('DesiredPlan', capStr(pickField(rec, 'desiredPlan', 'DesiredPlan'), 100))
  form.append('TermsAndConditionsAgreement', normalizeAgreement(pickField(rec, 'termsAndConditionsAgreement', 'TermsAndConditionsAgreement')))
  form.append('FirstNearestLandmark', capStr(pickField(rec, 'firstNearestLandmark', 'FirstNearestLandmark'), 255))
  form.append('SecondNearestLandmark', capStr(pickField(rec, 'secondNearestLandmark', 'SecondNearestLandmark'), 255))
  form.append('ApplicablePromo', capStr(pickField(rec, 'applicablePromo', 'ApplicablePromo'), 100))
  form.append('barangay1', capStr(barangay1Val, 100))
  form.append('barangay2', capStr(pickField(rec, 'barangay2', 'Barangay2'), 100))
  form.append('ReferrersAccountNumber', capStr(pickField(rec, 'referrersAccountNumber', 'ReferrersAccountNumber'), 100))
  form.append('ApplyingFor', capStr(pickField(rec, 'applyingFor', 'ApplyingFor') || 'Residential Fiber', 100))
  form.append('Status', capStr(nextStatus, 50))
  form.append('VisitBy', capStr(pickField(rec, 'visitBy', 'VisitBy'), 100))
  form.append('VisitWith', capStr(pickField(rec, 'visitWith', 'VisitWith'), 100))
  form.append('VisitWithOther', capStr(pickField(rec, 'visitWithOther', 'VisitWithOther'), 100))
  form.append('Remarks', capStr(pickField(rec, 'remarks', 'Remarks'), 255))
  form.append('UserEmail', capStr(pickField(rec, 'userEmail', 'UserEmail') || currentUserEmail, 100))
  form.append('ModifiedBy', String(loggedInUserId || '1'))
  form.append('ModifiedDate', String(nowIso || new Date().toISOString()))

  return form
}

/**
 * Immutably updates the target Application row's status and modification audit fields
 * in the local dataset so UI reflects the saved change immediately.
 */
export const applyApplicationStatusLocally = (
  rows,
  recordId,
  statusCol,
  nextStatus,
  { modifiedBy, modifiedDate, getRecordId } = {}
) => {
  if (!Array.isArray(rows)) return []
  if (recordId === null || recordId === undefined || recordId === '') return [...rows]

  const resolveId = typeof getRecordId === 'function' ? getRecordId : defaultGetRecordId
  const targetIdStr = String(recordId)
  const wantedStatusCol = String(statusCol || 'status').toLowerCase()

  return rows.map(row => {
    if (!row || typeof row !== 'object') return row
    const rowId = resolveId(row)
    if (rowId === null || rowId === undefined || String(rowId) !== targetIdStr) return row

    const keys = Object.keys(row)
    const statusKey =
      keys.find(k => k.toLowerCase() === wantedStatusCol) ||
      keys.find(k => k.toLowerCase() === 'status') ||
      statusCol ||
      'status'

    const patch = {
      ...row,
      [statusKey]: nextStatus
    }

    if (modifiedBy !== undefined) {
      const modByKey = keys.find(k => k.toLowerCase() === 'modifiedby') || 'modifiedBy'
      patch[modByKey] = modifiedBy
    }
    if (modifiedDate !== undefined) {
      const modDateKey = keys.find(k => k.toLowerCase() === 'modifieddate') || 'modifiedDate'
      patch[modDateKey] = modifiedDate
    }

    return patch
  })
}

/**
 * Formats a compact header subtitle for the quick-status popover (e.g. "#APP-4512 • Juan Dela Cruz").
 */
export const formatQuickStatusSubtitle = (record, fallbackId = '') => {
  if (!record || typeof record !== 'object') {
    const fallback = String(fallbackId ?? '').trim()
    return fallback ? `#${fallback}` : ''
  }

  const appId = String(
    record.applicationid ??
    record.applicationId ??
    record.applicationIdValue ??
    record.id ??
    record.Id ??
    record.ID ??
    fallbackId ??
    ''
  ).trim()

  const first = String(record.firstName ?? record.FirstName ?? '').trim()
  const last = String(record.lastName ?? record.LastName ?? '').trim()
  const fullName = [first, last].filter(Boolean).join(' ') ||
    String(record.fullName ?? record.FullName ?? record.name ?? '').trim()

  return [appId ? `#${appId}` : '', fullName].filter(Boolean).join(' • ')
}
