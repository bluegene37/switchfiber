import apiClient from './api'

/**
 * Service Orders — post-installation support, repair, and pullout visits.
 * Adheres strictly to REST conventions (/api/ServiceOrders).
 */
export const ServiceOrderService = {
  getServiceOrders() {
    return apiClient.get('/ServiceOrders')
  },
  getServiceOrderById(id) {
    return apiClient.get(`/ServiceOrders/${id}`)
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
