import apiClient from './api'

export const ApplicationService = {
  getApplications() {
    return apiClient.get('/Applications')
  },
  getApplicationById(id) {
    return apiClient.get(`/Applications/${id}`)
  },
  /**
   * @param {import('../models/types').CreateApplicationRequest} data 
   */
  createApplication(data) {
    return apiClient.post('/Applications', data)
  },
  /**
   * @param {string|number} id 
   * @param {import('../models/types').UpdateApplicationRequest} data 
   */
  updateApplication(id, data) {
    return apiClient.put(`/Applications/${id}`, data)
  },
  deleteApplication(id) {
    return apiClient.delete(`/Applications/${id}`)
  }
}
