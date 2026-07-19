import { defineStore } from 'pinia'
import { ref } from 'vue'
import { NapService } from '../services/naps'

export const useNapStore = defineStore('naps', () => {
  const naps = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchNaps = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await NapService.getNaps()
      naps.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch naps'
    } finally {
      isLoading.value = false
    }
  }

  return { naps, isLoading, error, fetchNaps }
})
