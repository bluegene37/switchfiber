import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LogTrailService } from '../services/logTrails'
import { DEFAULT_LOG_ENTITIES } from '../models/entities'

export const useLogTrailStore = defineStore('logTrails', () => {
  const logTrails = ref([])
  // Local default list of entity names for the dropdown so it works offline
  // and does not depend on log data presence in a chosen date range.
  const entities = ref([...DEFAULT_LOG_ENTITIES])
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
      if (Array.isArray(response) && response.length > 0) {
        // Merge any newly discovered entities with default list
        const set = new Set([...DEFAULT_LOG_ENTITIES, ...response.filter(Boolean)])
        entities.value = Array.from(set)
      }
    } catch (err) {
      console.warn('[logTrails] Could not load audit trail entities:', err.message)
    }
  }

  return { logTrails, entities, isLoading, error, fetchLogTrails, fetchEntities }
})
