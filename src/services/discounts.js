import apiClient from './api'

export const DiscountService = {
  getDiscounts(params) {
    return apiClient.get('/Discounts', { params })
  },
  getDiscountById(id) {
    return apiClient.get(`/Discounts/${id}`)
  },
  createDiscount(data) {
    return apiClient.post('/Discounts', data)
  },
  updateDiscount(id, data) {
    return apiClient.put(`/Discounts/${id}`, data)
  },
  deleteDiscount(id) {
    return apiClient.delete(`/Discounts/${id}`)
  }
}

export default DiscountService
