import { defineStore } from 'pinia'
import { ref } from 'vue'
// import { ServiceOrderService } from '../services/serviceOrders'
// Gene - Nov 5, 2026: Explicit .js extension for Node ESM test runner compatibility
import { ServiceOrderService } from '../services/serviceOrders.js'

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

  // Gene - Nov 5, 2026: Added fetchServiceOrderImage action to retrieve binary/base64 Service Order photos
  const fetchServiceOrderImage = async (id) => {
    try {
      return await ServiceOrderService.getServiceOrderImage(id)
    } catch (err) {
      console.warn(`[useServiceOrderStore] Failed to fetch image for Service Order #${id}:`, err)
      throw err
    }
  }

  return {
    serviceOrders,
    isLoading,
    error,
    fetchServiceOrders,
    getServiceOrderById,
    fetchServiceOrderImage,
    createServiceOrder,
    updateServiceOrder,
    deleteServiceOrder
  }
})
