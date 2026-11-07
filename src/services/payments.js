// Gene - Nov 7, 2026: REST API service for /api/Payments and /api/Payments/search matching updated PaymentDto and transactionID query parameters
import apiClient from './api.js'

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
    return apiClient.post('/Payments', data)
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
    return apiClient.put(`/Payments/${id}`, data, { params })
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
