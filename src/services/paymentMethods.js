// Gene - Nov 5, 2026: REST API service for /api/PaymentMethods
import apiClient from './api.js'

export const PaymentMethodService = {
  getPaymentMethods(params) {
    return apiClient.get('/PaymentMethods', { params })
  },
  getPaymentMethodById(id) {
    return apiClient.get(`/PaymentMethods/${id}`)
  },
  createPaymentMethod(data) {
    return apiClient.post('/PaymentMethods', data)
  },
  updatePaymentMethod(id, data) {
    return apiClient.put(`/PaymentMethods/${id}`, data)
  },
  deletePaymentMethod(id, params) {
    return apiClient.delete(`/PaymentMethods/${id}`, { params })
  }
}

export default PaymentMethodService
