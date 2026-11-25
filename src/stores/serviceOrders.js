import { defineStore } from 'pinia'
import { ref } from 'vue'
// import { ServiceOrderService } from '../services/serviceOrders'
// Gene - Nov 5, 2026: Explicit .js extension for Node ESM test runner compatibility
import { ServiceOrderService } from '../services/serviceOrders.js'

export const useServiceOrderStore = defineStore('serviceOrders', () => {
  const serviceOrders = ref([])
  const isLoading = ref(false)
  // Gene - Nov, 26, 2026: Track loaded cache and one-shot Service Order draft handoff from Subscribers
  const hasLoadedList = ref(false)
  const pendingCreateDraft = ref(null)
  const error = ref(null)

  let pendingEnsurePromise = null

  const fetchServiceOrders = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await ServiceOrderService.getServiceOrders()
      serviceOrders.value = response || []
      hasLoadedList.value = true
    } catch (err) {
      error.value = err.message || 'Failed to fetch service orders'
    } finally {
      isLoading.value = false
    }
  }

  const ensureServiceOrdersLoaded = async ({ force = false } = {}) => {
    if (pendingEnsurePromise && !force) return pendingEnsurePromise
    if (hasLoadedList.value && !force) return serviceOrders.value

    pendingEnsurePromise = fetchServiceOrders()
      .finally(() => {
        pendingEnsurePromise = null
      })
    await pendingEnsurePromise
    return serviceOrders.value
  }

  const setPendingCreateDraft = (draft) => {
    pendingCreateDraft.value = draft && typeof draft === 'object' ? { ...draft } : null
  }

  const consumePendingCreateDraft = () => {
    const draft = pendingCreateDraft.value
    pendingCreateDraft.value = null
    return draft
  }

  const invalidateListCache = () => {
    hasLoadedList.value = false
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
    hasLoadedList,
    pendingCreateDraft,
    error,
    fetchServiceOrders,
    ensureServiceOrdersLoaded,
    setPendingCreateDraft,
    consumePendingCreateDraft,
    invalidateListCache,
    getServiceOrderById,
    fetchServiceOrderImage,
    createServiceOrder,
    updateServiceOrder,
    deleteServiceOrder
  }
})
