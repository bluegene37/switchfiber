import apiClient from './api'

export const LcpService = {
  getLcps() {
    return apiClient.get('/Lcps')
  },
  getLcpById(id) {
    return apiClient.get(`/Lcps/${id}`)
  },
  createLcp(data) {
    return apiClient.post('/Lcps', data)
  },
  updateLcp(id, data) {
    return apiClient.put(`/Lcps/${id}`, data)
  },
  deleteLcp(id) {
    return apiClient.delete(`/Lcps/${id}`)
  }
}
