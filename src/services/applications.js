import apiClient from './api'

export const ApplicationService = {
  getApplications() {
    return apiClient.get('/Applications')
  },
  getApplicationById(id) {
    return apiClient.get(`/Applications/${id}`)
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
