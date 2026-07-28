import apiClient from './api'

export const BillingStatusService = {
  getBillingStatuses() {
    return apiClient.get('/BillingStatuses')
  },
  getBillingStatusById(id) {
    return apiClient.get(`/BillingStatuses/${id}`)
  },
  createBillingStatus(data) {
    return apiClient.post('/BillingStatuses', data)
  },
  updateBillingStatus(id, data) {
    return apiClient.put(`/BillingStatuses/${id}`, data)
  },
  deleteBillingStatus(id) {
    return apiClient.delete(`/BillingStatuses/${id}`)
  }
}
