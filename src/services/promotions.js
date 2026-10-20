// Gene - Oct, 16, 2026: Created Promotions REST API service for /api/Promotions CRUD operations
// import apiClient from './api'
// Gene - Oct, 20, 2026: Added explicit .js extension for Node.js native ESM test compatibility
import apiClient from './api.js'

export const PromotionService = {
  getPromotions(params) {
    return apiClient.get('/Promotions', { params })
  },
  getPromotionById(id) {
    return apiClient.get(`/Promotions/${id}`)
  },
  createPromotion(data) {
    return apiClient.post('/Promotions', data)
  },
  updatePromotion(id, data) {
    return apiClient.put(`/Promotions/${id}`, data)
  },
  deletePromotion(id) {
    return apiClient.delete(`/Promotions/${id}`)
  }
}

export default PromotionService
