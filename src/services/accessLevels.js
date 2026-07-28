import apiClient from './api'

export const AccessLevelService = {
  getAccessLevels() {
    return apiClient.get('/AccessLevel')
  },
  getAccessLevelById(id) {
    return apiClient.get(`/AccessLevel/${id}`)
  },
  /**
   * @param {import('../models/types').CreateAccessLevelRequest} data
   */
  createAccessLevel(data) {
    return apiClient.post('/AccessLevel', data)
  },
  /**
   * @param {string|number} id
   * @param {import('../models/types').UpdateAccessLevelRequest} data
   */
  updateAccessLevel(id, data) {
    return apiClient.put(`/AccessLevel/${id}`, data)
  },
  deleteAccessLevel(id) {
    return apiClient.delete(`/AccessLevel/${id}`)
  }
}
