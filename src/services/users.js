import apiClient from './api'

export const UserService = {
  getUsers() {
    return apiClient.get('/Users')
  },
  getUserById(id) {
    return apiClient.get(`/Users/${id}`)
  },
  createUser(data) {
    return apiClient.post('/Users', data)
  },
  /**
   * @param {import('../models/types').LoginRequest} credentials
   */
  loginUser(credentials) {
    return apiClient.post('/Users/login', credentials)
  },
  updateUser(id, data) {
    return apiClient.put(`/Users/${id}`, data)
  },
  deleteUser(id) {
    return apiClient.delete(`/Users/${id}`)
  }
}
