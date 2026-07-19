import apiClient from './api'

export const LcpnapService = {
  getLcpnaps() {
    return apiClient.get('/Lcpnaps')
  },
  getLcpnapById(id) {
    return apiClient.get(`/Lcpnaps/${id}`)
  },
  /**
   * @param {import('../models/types').CreateLcpnapRequest} data 
   */
  createLcpnap(data) {
    return apiClient.post('/Lcpnaps', data)
  },
  /**
   * @param {string|number} id 
   * @param {import('../models/types').UpdateLcpnapRequest} data 
   */
  updateLcpnap(id, data) {
    return apiClient.put(`/Lcpnaps/${id}`, data)
  },
  deleteLcpnap(id) {
    return apiClient.delete(`/Lcpnaps/${id}`)
  }
}
