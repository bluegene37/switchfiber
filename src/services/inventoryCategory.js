// Gene - Oct, 16, 2026: Created InventoryCategory REST API service for /api/InventoryCategory CRUD operations
// import apiClient from './api'
// Gene - Oct, 20, 2026: Added explicit .js extension for Node.js native ESM test compatibility
import apiClient from './api.js'

export const InventoryCategoryService = {
  getInventoryCategories(params) {
    return apiClient.get('/InventoryCategory', { params })
  },
  getInventoryCategoryById(id) {
    return apiClient.get(`/InventoryCategory/${id}`)
  },
  createInventoryCategory(data) {
    return apiClient.post('/InventoryCategory', data)
  },
  updateInventoryCategory(id, data) {
    return apiClient.put(`/InventoryCategory/${id}`, data)
  },
  deleteInventoryCategory(id) {
    return apiClient.delete(`/InventoryCategory/${id}`)
  }
}

export default InventoryCategoryService
