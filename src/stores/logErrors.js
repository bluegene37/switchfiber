import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LogErrorService } from '../services/logErrors'

export const useLogErrorStore = defineStore('logErrors', () => {
  const logErrors = ref([])
  // The distinct entity names in the current range, used to fill the Entity
  // dropdown on the by-entity screen rather than rendered as a table.
  const entities = ref([])
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
      entities.value = Array.isArray(response) ? response.filter(Boolean) : []
    } catch (err) {
      // A missing entity list only costs the dropdown its options; the log
      // table beside it still loads, so this must not surface as a page error.
      console.warn('[logErrors] Could not load error log entities:', err.message)
      entities.value = []
    }
  }

  return { logErrors, entities, isLoading, error, fetchLogErrors, fetchEntities }
})
