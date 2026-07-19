import apiClient from './api'

export const PlanService = {
  getPlans() {
    return apiClient.get('/Plans')
  },
  getPlanById(id) {
    return apiClient.get(`/Plans/${id}`)
  },
  /**
   * @param {import('../models/types').CreatePlanRequest} data 
   */
  createPlan(data) {
    return apiClient.post('/Plans', data)
  },
  /**
   * @param {string|number} id 
   * @param {import('../models/types').UpdatePlanRequest} data 
   */
  updatePlan(id, data) {
    return apiClient.put(`/Plans/${id}`, data)
  },
  deletePlan(id) {
    return apiClient.delete(`/Plans/${id}`)
  }
}
