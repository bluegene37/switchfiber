import apiClient from './api.js'

export const JobOrderService = {
  getJobOrders() {
    return apiClient.get('/JobOrders')
  },
  /**
   * Query job orders filtered by status and/or date window
   * @param {{ status?: string, dateFrom?: string, dateTo?: string, fromDate?: string, toDate?: string }} [params]
   */
  getJobOrdersByStatusDate(params) {
    return apiClient.get('/JobOrders/status-date', { params })
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
