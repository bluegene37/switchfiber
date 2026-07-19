import { defineStore } from 'pinia'
import { ref } from 'vue'
import { JobOrderService } from '../services/jobOrders'

export const useJobOrderStore = defineStore('jobOrders', () => {
  const jobOrders = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchJobOrders = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await JobOrderService.getJobOrders()
      jobOrders.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch job orders'
    } finally {
      isLoading.value = false
    }
  }

  return { jobOrders, isLoading, error, fetchJobOrders }
})
