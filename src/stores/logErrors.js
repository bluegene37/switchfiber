import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { LogErrorService } from '../services/logErrors'

export const useLogErrorStore = defineStore('logErrors', () => {
  const logErrors = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Distinct entity names grouped out of the downloaded logs — the Entity
  // dropdown offers exactly what the data contains, so every option is
  // guaranteed to match at least one log row.
  const entities = computed(() => {
    const set = new Set()
    for (const row of logErrors.value) {
      if (row && row.entity) set.add(row.entity)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  })

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

  return { logErrors, entities, isLoading, error, fetchLogErrors }
})
