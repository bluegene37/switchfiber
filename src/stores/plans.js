import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PlanService } from '../services/plans'

export const usePlanStore = defineStore('plans', () => {
  const plans = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchPlans = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await PlanService.getPlans()
      plans.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch plans'
    } finally {
      isLoading.value = false
    }
  }

  return { plans, isLoading, error, fetchPlans }
})
