import apiClient from './api'

export const RouterService = {
  getRouters() {
    return apiClient.get('/Routers')
  },
  getRouterById(id) {
    return apiClient.get(`/Routers/${id}`)
  },
  createRouter(data) {
    return apiClient.post('/Routers', data)
  },
  updateRouter(id, data) {
    return apiClient.put(`/Routers/${id}`, data)
  },
  deleteRouter(id) {
    return apiClient.delete(`/Routers/${id}`)
  }
}
