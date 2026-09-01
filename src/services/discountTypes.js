import apiClient from './api'

export const DiscountTypeService = {
  getDiscountTypes(params) {
    return apiClient.get('/DiscountTypes', { params })
  },
  getDiscountTypeById(id) {
    return apiClient.get(`/DiscountTypes/${id}`)
  },
  createDiscountType(data) {
    return apiClient.post('/DiscountTypes', data)
  },
  updateDiscountType(id, data) {
    return apiClient.put(`/DiscountTypes/${id}`, data)
  },
  deleteDiscountType(id) {
    return apiClient.delete(`/DiscountTypes/${id}`)
  }
}

export default DiscountTypeService
