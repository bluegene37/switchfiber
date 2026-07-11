import apiClient from './api'

export const PlanService = {
  getPlans() {
    return apiClient.get('/Plans')
  },
  getPlanById(id) {
    return apiClient.get(`/Plans/${id}`)
  },
  createPlan(data) {
    return apiClient.post('/Plans', data)
  },
  updatePlan(id, data) {
    return apiClient.put(`/Plans/${id}`, data)
  },
  deletePlan(id) {
    return apiClient.delete(`/Plans/${id}`)
  }
}
