import apiClient from './api'

export const PortService = {
  getPorts() {
    return apiClient.get('/Ports')
  },
  getPortById(id) {
    return apiClient.get(`/Ports/${id}`)
  },
  createPort(data) {
    return apiClient.post('/Ports', data)
  },
  updatePort(id, data) {
    return apiClient.put(`/Ports/${id}`, data)
  },
  deletePort(id) {
    return apiClient.delete(`/Ports/${id}`)
  }
}
