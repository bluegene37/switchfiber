import apiClient from './api'

export const LcpService = {
  getLcps() {
    return apiClient.get('/Lcps')
  },
  getLcpById(id) {
    return apiClient.get(`/Lcps/${id}`)
  },
  /**
   * @param {import('../models/types').CreateLcpRequest} data 
   */
  createLcp(data) {
    return apiClient.post('/Lcps', data)
  },
  /**
   * @param {string|number} id 
   * @param {import('../models/types').UpdateLcpRequest} data 
   */
  updateLcp(id, data) {
    return apiClient.put(`/Lcps/${id}`, data)
  },
  deleteLcp(id) {
    return apiClient.delete(`/Lcps/${id}`)
  }
}
