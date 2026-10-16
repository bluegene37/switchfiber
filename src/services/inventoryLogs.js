// Gene - Oct, 16, 2026: Created InventoryLogs REST API service for /api/InventoryLogs CRUD operations
import apiClient from './api'

export const InventoryLogsService = {
  getInventoryLogs(params) {
    return apiClient.get('/InventoryLogs', { params })
  },
  getInventoryLogById(id) {
    return apiClient.get(`/InventoryLogs/${id}`)
  },
  createInventoryLog(data) {
    return apiClient.post('/InventoryLogs', data)
  },
  updateInventoryLog(id, data) {
    return apiClient.put(`/InventoryLogs/${id}`, data)
  },
  deleteInventoryLog(id) {
    return apiClient.delete(`/InventoryLogs/${id}`)
  }
}

export default InventoryLogsService
