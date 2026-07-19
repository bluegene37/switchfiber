import apiClient from './api'

export const BillingDetailService = {
  getBillingDetails() {
    return apiClient.get('/BillingDetails')
  },
  getBillingDetailById(id) {
    return apiClient.get(`/BillingDetails/${id}`)
  },
  createBillingDetail(data) {
    return apiClient.post('/BillingDetails', data)
  },
  updateBillingDetail(id, data) {
    return apiClient.put(`/BillingDetails/${id}`, data)
  },
  deleteBillingDetail(id) {
    return apiClient.delete(`/BillingDetails/${id}`)
  }
}
