import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LcpService } from '../services/lcps'

export const useLcpStore = defineStore('lcps', () => {
  const lcps = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchLcps = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await LcpService.getLcps()
      lcps.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch lcps'
    } finally {
      isLoading.value = false
    }
  }

  return { lcps, isLoading, error, fetchLcps }
})
