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

  const getServiceOrderById = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      return await ServiceOrderService.getServiceOrderById(id)
    } catch (err) {
      error.value = err.message || `Failed to fetch service order #${id}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createServiceOrder = async (data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await ServiceOrderService.createServiceOrder(data)
      await fetchServiceOrders()
      return response
    } catch (err) {
      error.value = err.message || 'Failed to create service order'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateServiceOrder = async (id, data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await ServiceOrderService.updateServiceOrder(id, data)
      await fetchServiceOrders()
      return response
    } catch (err) {
      error.value = err.message || `Failed to update service order #${id}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteServiceOrder = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await ServiceOrderService.deleteServiceOrder(id)
      await fetchServiceOrders()
      return response
    } catch (err) {
      error.value = err.message || `Failed to delete service order #${id}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    serviceOrders,
    isLoading,
    error,
    fetchServiceOrders,
    getServiceOrderById,
    createServiceOrder,
    updateServiceOrder,
    deleteServiceOrder
  }
})
