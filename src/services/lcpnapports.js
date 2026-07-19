import apiClient from './api'

export const LcpnapportService = {
  getLcpnapports() {
    return apiClient.get('/Lcpnapports')
  },
  getLcpnapportById(id) {
    return apiClient.get(`/Lcpnapports/${id}`)
  },
  createLcpnapport(data) {
    return apiClient.post('/Lcpnapports', data)
  },
  updateLcpnapport(id, data) {
    return apiClient.put(`/Lcpnapports/${id}`, data)
  },
  deleteLcpnapport(id) {
    return apiClient.delete(`/Lcpnapports/${id}`)
  }
}
