import { defineStore } from 'pinia'
import { ref } from 'vue'
import { RouterService } from '../services/routers'

export const useRouterStore = defineStore('routers', () => {
  const routers = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchRouters = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await RouterService.getRouters()
      routers.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch routers'
    } finally {
      isLoading.value = false
    }
  }

  return { routers, isLoading, error, fetchRouters }
})
