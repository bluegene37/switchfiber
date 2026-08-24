import apiClient from './api'

/**
 * Service Orders — post-installation support, repair, and pullout visits.
 *
 * Only the reads are wired up for now: the menu entry lands ahead of the
 * screen, so nothing calls the write methods yet. They are declared here so the
 * service matches the API surface (`/api/ServiceOrders` supports POST, PUT and
 * DELETE) and the screen, when it arrives, has nothing left to add.
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
