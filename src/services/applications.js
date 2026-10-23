// import apiClient from './api'
// Gene - Oct 23, 2026: Use explicit .js extension for Node ESM test runner compatibility
import apiClient from './api.js'

/*
export const ApplicationService = {
  getApplications() {
    return apiClient.get('/Applications')
  },
  getApplicationById(id) {
    return apiClient.get(`/Applications/${id}`)
  },
  filterApplications(params) {
    return apiClient.get('/Applications/filter', { params })
  },
  createApplication(data) {
    return apiClient.post('/Applications', data)
  },
  updateApplication(id, data) {
    return apiClient.put(`/Applications/${id}`, data)
  },
  deleteApplication(id) {
    return apiClient.delete(`/Applications/${id}`)
  }
}
*/
// Gene - Oct 23, 2026: Added getApplicationImages(id) to fetch image files via GET /api/Applications/{id}/GetApplicationImages
export const ApplicationService = {
  getApplications() {
    return apiClient.get('/Applications')
  },
  getApplicationById(id) {
    return apiClient.get(`/Applications/${id}`)
  },
  getApplicationImages(id) {
    return apiClient.get(`/Applications/${id}/GetApplicationImages`)
  },
  filterApplications(params) {
    return apiClient.get('/Applications/filter', { params })
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
