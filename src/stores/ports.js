import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PortService } from '../services/ports'

export const usePortStore = defineStore('ports', () => {
  const ports = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchPorts = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await PortService.getPorts()
      ports.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch ports'
    } finally {
      isLoading.value = false
    }
  }

  return { ports, isLoading, error, fetchPorts }
})
