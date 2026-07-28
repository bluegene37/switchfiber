import apiClient from './api'

export const MenuService = {
  getMenus() {
    return apiClient.get('/Menus')
  },
  getMenuById(id) {
    return apiClient.get(`/Menus/${id}`)
  },
  /**
   * @param {import('../models/types').CreateMenuRequest} data
   */
  createMenu(data) {
    return apiClient.post('/Menus', data)
  },
  /**
   * @param {string|number} id
   * @param {import('../models/types').UpdateMenuRequest} data
   */
  updateMenu(id, data) {
    return apiClient.put(`/Menus/${id}`, data)
  },
  deleteMenu(id) {
    return apiClient.delete(`/Menus/${id}`)
  }
}
