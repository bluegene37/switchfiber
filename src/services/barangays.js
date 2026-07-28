import apiClient from './api'

/**
 * BarangayService
 * Note: Backend /Barangays API is currently commented out as local PSGC downloaded JSON is used instead.
 */
export const BarangayService = {
  getBarangays() {
    // return apiClient.get('/Barangays')
  },
  getBarangayById(id) {
    // return apiClient.get(`/Barangays/${id}`)
  },
  /**
   * @param {import('../models/types').CreateBarangayRequest} data
   */
  createBarangay(data) {
    // return apiClient.post('/Barangays', data)
  },
  /**
   * @param {string|number} id
   * @param {import('../models/types').UpdateBarangayRequest} data
   */
  updateBarangay(id, data) {
    // return apiClient.put(`/Barangays/${id}`, data)
  },
  deleteBarangay(id) {
    // return apiClient.delete(`/Barangays/${id}`)
  }
}

