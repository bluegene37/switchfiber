import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LogTrailService } from '../services/logTrails'

export const useLogTrailStore = defineStore('logTrails', () => {
  const logTrails = ref([])
  // The distinct entity names in the current range, used to fill the Entity
  // dropdown on the by-entity screen rather than rendered as a table.
  const entities = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchLogTrails = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await LogTrailService.getLogTrails()
      logTrails.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch audit trail logs'
    } finally {
      isLoading.value = false
    }
  }

  const fetchEntities = async (dateFrom, dateTo) => {
    try {
      const response = await LogTrailService.getEntities(dateFrom, dateTo)
      entities.value = Array.isArray(response) ? response.filter(Boolean) : []
    } catch (err) {
      // A missing entity list only costs the dropdown its options; the log
      // table beside it still loads, so this must not surface as a page error.
      console.warn('[logTrails] Could not load audit trail entities:', err.message)
      entities.value = []
    }
  }

  return { logTrails, entities, isLoading, error, fetchLogTrails, fetchEntities }
})
