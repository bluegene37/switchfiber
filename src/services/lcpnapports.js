import apiClient from './api'

export const LcpnapportService = {
  getLcpnapports() {
    return apiClient.get('/Lcpnapports')
  },
  getLcpnapportById(id) {
    return apiClient.get(`/Lcpnapports/${id}`)
  },
  /**
   * @param {import('../models/types').CreateLcpnapportRequest} data 
   */
  createLcpnapport(data) {
    return apiClient.post('/Lcpnapports', data)
  },
  /**
   * @param {string|number} id 
   * @param {import('../models/types').UpdateLcpnapportRequest} data 
   */
  updateLcpnapport(id, data) {
    return apiClient.put(`/Lcpnapports/${id}`, data)
  },
  deleteLcpnapport(id) {
    return apiClient.delete(`/Lcpnapports/${id}`)
  }
}
