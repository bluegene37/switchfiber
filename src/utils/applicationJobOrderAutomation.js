// Gene - Nov, 18, 2026: Automated Application-to-JobOrder eligibility, status mapping, payload seed builder, and confirmation summary helpers

export const CLOSED_APPLICATION_STATUSES = new Set([
  'cancelled',
  'canceled',
  'duplicate',
  'nofacility',
  'noslot'
])

export const normalizeStatusToken = (status) =>
  String(status ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')

export const isApplicationEligibleForJobOrder = (record) => {
  if (!record || typeof record !== 'object') return false
  return !CLOSED_APPLICATION_STATUSES.has(normalizeStatusToken(record.status))
}

export const resolveJobOrderInitialStatusFromApplication = (record) => {
  const token = normalizeStatusToken(record?.status)
  if (token === 'schedule' || token === 'scheduled') return 'Scheduled'
  return 'Inprogress'
}

const findMatchingPlanOption = (desiredPlan, plansList = []) => {
  if (desiredPlan === null || desiredPlan === undefined) return null
  const raw = String(desiredPlan).trim()
  if (!raw) return null
  const lower = raw.toLowerCase()
  const list = Array.isArray(plansList) ? plansList : []
  return list.find(opt => {
    if (!opt) return false
    const candidates = [opt.id, opt.value, opt.name, opt.label]
    return candidates.some(c => c !== undefined && c !== null && String(c).trim().toLowerCase() === lower)
  }) || null
}

export const resolvePlanIdFromDesiredPlan = (desiredPlan, plansList = []) => {
  if (desiredPlan === null || desiredPlan === undefined) return ''
  const raw = String(desiredPlan).trim()
  if (!raw) return ''
  const found = findMatchingPlanOption(raw, plansList)
  if (found && found.id !== undefined && found.id !== null) {
    return String(found.id)
  }
  return raw
}

export const extractCoordinatesFromApplication = (record) => {
  if (!record || typeof record !== 'object') return ''
  const explicit = record.addressCoordinates ?? record.coordinates ?? record.coordinate ?? ''
  const trimmed = String(explicit).trim()
  if (trimmed) return trimmed

  const remarks = String(record.remarks ?? '')
  const match = remarks.match(/GPS\([^)]*\)\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i)
  if (match) {
    return `${match[1]},${match[2]}`
  }
  return ''
}

export const getCanonicalApplicationId = (record) => {
  if (!record || typeof record !== 'object') return ''
  return String(
    record.applicationid ??
    record.applicationId ??
    record.applicationIdValue ??
    record.id ??
    record.Id ??
    record.ID ??
    ''
  ).trim()
}

export const hasApplicationHouseFrontPhoto = (record) => {
  if (!record || typeof record !== 'object') return false
  const v = String(record.houseFrontPicture ?? record.housefrontpicture ?? '').trim()
  return Boolean(v && v !== '-' && v.toLowerCase() !== 'null')
}

export const mapApplicationToJobOrderSeed = (record, { plansList = [] } = {}) => {
  const rec = record && typeof record === 'object' ? record : {}
  const landmark = String(rec.landmark || rec.firstNearestLandmark || '').trim()
  return {
    applicationId: getCanonicalApplicationId(rec),
    firstName: String(rec.firstName ?? '').trim(),
    middleInitial: String(rec.middleName ?? rec.middleInitial ?? '').trim(),
    lastName: String(rec.lastName ?? '').trim(),
    contactNumber: String(rec.mobileNumber ?? rec.contactNumber ?? '').trim(),
    secondContactNumber: String(rec.secondaryMobileNumber ?? rec.secondContactNumber ?? '').trim(),
    emailAddress: String(rec.emailAddress ?? '').trim(),
    applicantEmailAddress: String(rec.emailAddress ?? rec.applicantEmailAddress ?? '').trim(),
    address: String(rec.installationAddress ?? rec.address ?? '').trim(),
    region: String(rec.region ?? '').trim(),
    city: String(rec.city ?? '').trim(),
    barangay: String(rec.barangay || rec.barangay1 || '').trim(),
    installationLandmark: landmark,
    location: landmark,
    addressCoordinates: extractCoordinatesFromApplication(rec),
    planId: resolvePlanIdFromDesiredPlan(rec.desiredPlan ?? rec.planId, plansList),
    referredBy: String(rec.referredBy ?? '').trim(),
    referrersAccountNumber: String(rec.referrersAccountNumber ?? '').trim(),
    visitBy: String(rec.visitBy ?? '').trim(),
    visitWith: String(rec.visitWith ?? '').trim(),
    visitWithOther: String(rec.visitWithOther ?? '').trim(),
    remarks: String(rec.remarks ?? '').trim(),
    status: resolveJobOrderInitialStatusFromApplication(rec),
    billingDay: null,
    installationFee: null,
    houseFront: String(rec.houseFrontPicture ?? rec.houseFront ?? '').trim()
  }
}

export const buildApplicationJobOrderSummary = (record, { plansList = [] } = {}) => {
  const rec = record && typeof record === 'object' ? record : {}
  const appId = getCanonicalApplicationId(rec)
  const applicantName = [rec.firstName, rec.middleName, rec.lastName]
    .map(v => String(v ?? '').trim())
    .filter(Boolean)
    .join(' ')
  const mobile = String(rec.mobileNumber ?? rec.contactNumber ?? '').trim()
  const email = String(rec.emailAddress ?? '').trim()
  const fullAddress = [rec.installationAddress, rec.barangay || rec.barangay1, rec.city, rec.region]
    .map(v => String(v ?? '').trim())
    .filter(Boolean)
    .join(', ')
  const rawPlan = rec.desiredPlan ?? rec.planId
  const matchedPlan = findMatchingPlanOption(rawPlan, plansList)
  const planDisplay = matchedPlan?.label || matchedPlan?.name || String(rawPlan ?? '').trim()
  const initialStatus = resolveJobOrderInitialStatusFromApplication(rec)

  const items = [
    { key: 'applicationId', label: 'Application #', value: appId ? `#${appId}` : '-' },
    { key: 'applicant', label: 'Applicant', value: applicantName || '-' },
    { key: 'contactNumber', label: 'Mobile Number', value: mobile || '-' }
  ]

  if (email) {
    items.push({ key: 'emailAddress', label: 'Email Address', value: email })
  }

  items.push(
    { key: 'address', label: 'Installation Address', value: fullAddress || '-' },
    { key: 'plan', label: 'Target Plan', value: planDisplay || '-' },
    { key: 'status', label: 'Initial Job Order Status', value: initialStatus }
  )

  if (hasApplicationHouseFrontPhoto(rec)) {
    items.push({
      key: 'houseFront',
      label: 'House Front Photo',
      value: 'Will be copied from Application'
    })
  }

  return items
}
