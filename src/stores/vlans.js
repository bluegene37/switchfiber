import { defineStore } from 'pinia'
import { ref } from 'vue'
import { VlanService } from '../services/vlans'

export const useVlanStore = defineStore('vlans', () => {
  const vlans = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchVlans = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await VlanService.getVlans()
      vlans.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch vlans'
    } finally {
      isLoading.value = false
    }
  }

  return { vlans, isLoading, error, fetchVlans }
})
