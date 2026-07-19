import apiClient from './api'

export const VlanService = {
  getVlans() {
    return apiClient.get('/Vlans')
  },
  getVlanById(id) {
    return apiClient.get(`/Vlans/${id}`)
  },
  createVlan(data) {
    return apiClient.post('/Vlans', data)
  },
  updateVlan(id, data) {
    return apiClient.put(`/Vlans/${id}`, data)
  },
  deleteVlan(id) {
    return apiClient.delete(`/Vlans/${id}`)
  }
}
