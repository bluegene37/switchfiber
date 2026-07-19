import apiClient from './api'

export const JobOrderService = {
  getJobOrders() {
    return apiClient.get('/JobOrders')
  },
  getJobOrderById(id) {
    return apiClient.get(`/JobOrders/${id}`)
  },
  /**
   * @param {import('../models/types').CreateJobOrderRequest} data 
   */
  createJobOrder(data) {
    return apiClient.post('/JobOrders', data)
  },
  /**
   * @param {string|number} id 
   * @param {import('../models/types').UpdateJobOrderRequest} data 
   */
  updateJobOrder(id, data) {
    return apiClient.put(`/JobOrders/${id}`, data)
  },
  deleteJobOrder(id) {
    return apiClient.delete(`/JobOrders/${id}`)
  }
}
