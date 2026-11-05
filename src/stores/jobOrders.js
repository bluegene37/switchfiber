import { defineStore } from 'pinia'
import { ref } from 'vue'
// import { JobOrderService } from '../services/jobOrders'
// Gene - Nov 5, 2026: Use explicit .js extension for Node ESM test runner compatibility
import { JobOrderService } from '../services/jobOrders.js'

/*
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
*/
// Gene - Nov 5, 2026: Added fetchJobOrderImage action to useJobOrderStore for on-demand image retrieval
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

  const fetchJobOrderImage = async (id) => {
    try {
      return await JobOrderService.getJobOrderImage(id)
    } catch (err) {
      console.error(`[useJobOrderStore] Failed to fetch image for JO #${id}:`, err)
      return null
    }
  }

  return { jobOrders, isLoading, error, fetchJobOrders, fetchJobOrderImage }
})
