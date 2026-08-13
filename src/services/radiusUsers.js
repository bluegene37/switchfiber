import apiClient from './api'

export const RadiusUserService = {
  getRadiusUsers() {
    return apiClient.get('/RadiusUser')
  },
  getRadiusUserByKey(key) {
    return apiClient.get(`/RadiusUser/${key}`)
  },
  updateRadiusUser(key, data) {
    return apiClient.patch(`/RadiusUser/${key}`, data)
  },
  deleteRadiusUser(key) {
    return apiClient.delete(`/RadiusUser/${key}`)
  },
  connectRadiusUser(key) {
    return apiClient.post(`/RadiusUser/${key}/connect`)
  },
  disconnectRadiusUser(key) {
    return apiClient.post(`/RadiusUser/${key}/disconnect`)
  }
}
