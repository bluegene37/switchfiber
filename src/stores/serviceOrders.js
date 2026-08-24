import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ServiceOrderService } from '../services/serviceOrders'

export const useServiceOrderStore = defineStore('serviceOrders', () => {
  const serviceOrders = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchServiceOrders = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await ServiceOrderService.getServiceOrders()
      serviceOrders.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch service orders'
    } finally {
      isLoading.value = false
    }
  }

  return { serviceOrders, isLoading, error, fetchServiceOrders }
})
