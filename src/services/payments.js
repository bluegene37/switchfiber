// Gene - Nov 7, 2026: REST API service for /api/Payments and /api/Payments/search matching updated PaymentDto and transactionID query parameters
import apiClient from './api.js'

// Gene - Nov, 11, 2026: Resolve logged-in user details from storage so PaymentService createPayment and updatePayment always stamp modifiedBy, processedBy, and userEmail based on the active user session
const getLoggedInPaymentUser = () => {
  try {
    if (typeof window === 'undefined') return { userId: '1', processedBy: '', userEmail: '' }
    const raw = window.localStorage?.getItem('user') || window.sessionStorage?.getItem('user')
    if (!raw) return { userId: '1', processedBy: '', userEmail: '' }
    const parsed = JSON.parse(raw)
    const userId = String(parsed?.id || '1')
    const fullName = [parsed?.fname || parsed?.firstName || parsed?.first_name, parsed?.lname || parsed?.lastName || parsed?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()
    const processedBy = fullName || parsed?.name || parsed?.username || parsed?.email || userId
    const userEmail = String(parsed?.email || parsed?.username || '')
    return { userId, processedBy: String(processedBy || userId), userEmail }
  } catch {
    return { userId: '1', processedBy: '', userEmail: '' }
  }
}

export const PaymentService = {
  /**
   * Retrieve all payment records.
   * @param {Object} [params]
   */
  getPayments(params) {
    return apiClient.get('/Payments', { params })
  },

  /**
   * Retrieve a single payment record by ID and transactionID query parameter.
   * @param {string|number} id
   * @param {string} [transactionID]
   */
  getPaymentById(id, transactionID) {
    const params = transactionID ? { transactionID } : undefined
    return apiClient.get(`/Payments/${id}`, { params })
  },

  /**
   * Search payment records by transactionID, accountNo, fullName, or contactNumber.
   * @param {{ transactionID?: string, accountNo?: string, fullName?: string, contactNumber?: string }} [params]
   */
  searchPayments(params) {
    return apiClient.get('/Payments/search', { params })
  },

  /**
   * Create a new payment record using PaymentDto schema.
   * @param {import('../models/types').PaymentDto} data
   */
  createPayment(data) {
    // return apiClient.post('/Payments', data)
    // Gene - Nov, 11, 2026: Auto-populate processedBy, modifiedBy, and userEmail on Payment creation based on the logged-in user
    const { userId, processedBy, userEmail } = getLoggedInPaymentUser()
    const payload = data && typeof data === 'object'
      ? {
          ...data,
          processedBy: String(data.processedBy || processedBy || userId),
          modifiedBy: String(data.modifiedBy || userId),
          ...(userEmail && !data.userEmail ? { userEmail } : {})
        }
      : data
    return apiClient.post('/Payments', payload)
  },

  /**
   * Update an existing payment record by ID and transactionid query parameter.
   * @param {string|number} id
   * @param {import('../models/types').PaymentDto} data
   * @param {string} [transactionid]
   */
  updatePayment(id, data, transactionid) {
    const resolvedTxnId = transactionid || data?.transactionID || data?.transactionid
    const params = resolvedTxnId ? { transactionid: resolvedTxnId } : undefined
    // return apiClient.put(`/Payments/${id}`, data, { params })
    // Gene - Nov, 11, 2026: Auto-update processedBy, modifiedBy, and userEmail on Payment update based on the logged-in user
    const { userId, processedBy, userEmail } = getLoggedInPaymentUser()
    const payload = data && typeof data === 'object'
      ? {
          ...data,
          processedBy: String(processedBy || data.processedBy || userId),
          modifiedBy: String(userId || data.modifiedBy || '1'),
          ...(userEmail ? { userEmail } : {})
        }
      : data
    return apiClient.put(`/Payments/${id}`, payload, { params })
  },

  /**
   * Delete a payment record by ID and transactionId query parameter.
   * @param {string|number} id
   * @param {string} [transactionId]
   */
  deletePayment(id, transactionId) {
    const params = transactionId ? { transactionId } : undefined
    return apiClient.delete(`/Payments/${id}`, { params })
  }
}

export default PaymentService
