import apiClient from './api'

export const NapService = {
  getNaps() {
    return apiClient.get('/Naps')
  },
  getNapById(id) {
    return apiClient.get(`/Naps/${id}`)
  },
  createNap(data) {
    return apiClient.post('/Naps', data)
  },
  updateNap(id, data) {
    return apiClient.put(`/Naps/${id}`, data)
  },
  deleteNap(id) {
    return apiClient.delete(`/Naps/${id}`)
  }
}
