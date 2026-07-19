import apiClient from './api'

export const LcpnapService = {
  getLcpnaps() {
    return apiClient.get('/Lcpnaps')
  },
  getLcpnapById(id) {
    return apiClient.get(`/Lcpnaps/${id}`)
  },
  createLcpnap(data) {
    return apiClient.post('/Lcpnaps', data)
  },
  updateLcpnap(id, data) {
    return apiClient.put(`/Lcpnaps/${id}`, data)
  },
  deleteLcpnap(id) {
    return apiClient.delete(`/Lcpnaps/${id}`)
  }
}
