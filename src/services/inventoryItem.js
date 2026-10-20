// Gene - Oct, 16, 2026: Created InventoryItem REST API service for /api/InventoryItem CRUD operations
// import apiClient from './api'
// Gene - Oct, 20, 2026: Added explicit .js extension for Node.js native ESM test compatibility
import apiClient from './api.js'

export const InventoryItemService = {
  getInventoryItems(params) {
    return apiClient.get('/InventoryItem', { params })
  },
  getInventoryItemById(id) {
    return apiClient.get(`/InventoryItem/${id}`)
  },
  createInventoryItem(data) {
    return apiClient.post('/InventoryItem', data)
  },
  updateInventoryItem(id, data) {
    return apiClient.put(`/InventoryItem/${id}`, data)
  },
  deleteInventoryItem(id) {
    return apiClient.delete(`/InventoryItem/${id}`)
  }
}

export default InventoryItemService
