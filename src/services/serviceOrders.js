import apiClient from './api.js'

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
  /**
   * @param {import('../models/types').CreateServiceOrderRequest} data
   */
  createServiceOrder(data) {
    return apiClient.post('/ServiceOrders', data)
  },
  /**
   * @param {string|number} id
   * @param {import('../models/types').UpdateServiceOrderRequest} data
   */
  updateServiceOrder(id, data) {
    return apiClient.put(`/ServiceOrders/${id}`, data)
  },
  deleteServiceOrder(id) {
    return apiClient.delete(`/ServiceOrders/${id}`)
  }
}

export default ServiceOrderService
