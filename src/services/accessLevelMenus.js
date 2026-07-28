import apiClient from './api'

export const AccessLevelMenuService = {
  getAccessLevelMenus() {
    return apiClient.get('/AccesslevelMenu')
  },
  getAccessLevelMenuById(id) {
    return apiClient.get(`/AccesslevelMenu/${id}`)
  },
  /**
   * @param {import('../models/types').CreateAccesslevelMenuRequest} data
   */
  createAccessLevelMenu(data) {
    return apiClient.post('/AccesslevelMenu', data)
  },
  /**
   * @param {string|number} id
   * @param {import('../models/types').UpdateAccesslevelMenuRequest} data
   */
  updateAccessLevelMenu(id, data) {
    return apiClient.put(`/AccesslevelMenu/${id}`, data)
  },
  deleteAccessLevelMenu(id) {
    return apiClient.delete(`/AccesslevelMenu/${id}`)
  }
}
