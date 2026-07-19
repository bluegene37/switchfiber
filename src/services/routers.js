import apiClient from './api'

export const RouterService = {
  getRouters() {
    return apiClient.get('/Routers')
  },
  getRouterById(id) {
    return apiClient.get(`/Routers/${id}`)
  },
  /**
   * @param {import('../models/types').CreateRouterRequest} data 
   */
  createRouter(data) {
    return apiClient.post('/Routers', data)
  },
  /**
   * @param {string|number} id 
   * @param {import('../models/types').UpdateRouterRequest} data 
   */
  updateRouter(id, data) {
    return apiClient.put(`/Routers/${id}`, data)
  },
  deleteRouter(id) {
    return apiClient.delete(`/Routers/${id}`)
  }
}
