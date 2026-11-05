// Gene - Nov 5, 2026: REST API service for /api/PaymentTypes
import apiClient from './api.js'

export const PaymentTypeService = {
  getPaymentTypes(params) {
    return apiClient.get('/PaymentTypes', { params })
  },
  getPaymentTypeById(id) {
    return apiClient.get(`/PaymentTypes/${id}`)
  },
  createPaymentType(data) {
    return apiClient.post('/PaymentTypes', data)
  },
  updatePaymentType(id, data) {
    return apiClient.put(`/PaymentTypes/${id}`, data)
  },
  deletePaymentType(id, params) {
    return apiClient.delete(`/PaymentTypes/${id}`, { params })
  }
}

export default PaymentTypeService
