import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LcpnapportService } from '../services/lcpnapports'

export const useLcpnapportStore = defineStore('lcpnapports', () => {
  const lcpnapports = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchLcpnapports = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await LcpnapportService.getLcpnapports()
      lcpnapports.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch lcpnapports'
    } finally {
      isLoading.value = false
    }
  }

  return { lcpnapports, isLoading, error, fetchLcpnapports }
})
