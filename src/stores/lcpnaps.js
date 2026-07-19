import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LcpnapService } from '../services/lcpnaps'

export const useLcpnapStore = defineStore('lcpnaps', () => {
  const lcpnaps = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchLcpnaps = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await LcpnapService.getLcpnaps()
      lcpnaps.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch lcpnaps'
    } finally {
      isLoading.value = false
    }
  }

  return { lcpnaps, isLoading, error, fetchLcpnaps }
})
