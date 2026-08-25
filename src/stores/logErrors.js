import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LogErrorService } from '../services/logErrors'
import { DEFAULT_LOG_ENTITIES } from '../models/entities'

export const useLogErrorStore = defineStore('logErrors', () => {
  const logErrors = ref([])
  // Local default list of entity names for the dropdown so it works offline
  // and does not depend on log data presence in a chosen date range.
  const entities = ref([...DEFAULT_LOG_ENTITIES])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchLogErrors = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await LogErrorService.getLogErrors()
      logErrors.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch error logs'
    } finally {
      isLoading.value = false
    }
  }

  const fetchEntities = async (dateFrom, dateTo) => {
    try {
      const response = await LogErrorService.getEntities(dateFrom, dateTo)
      if (Array.isArray(response) && response.length > 0) {
        // Merge any newly discovered entities with default list
        const set = new Set([...DEFAULT_LOG_ENTITIES, ...response.filter(Boolean)])
        entities.value = Array.from(set)
      }
    } catch (err) {
      console.warn('[logErrors] Could not load error log entities:', err.message)
    }
  }

  return { logErrors, entities, isLoading, error, fetchLogErrors, fetchEntities }
})
