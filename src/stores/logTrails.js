import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { LogTrailService } from '../services/logTrails'

export const useLogTrailStore = defineStore('logTrails', () => {
  const logTrails = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Distinct entity names grouped out of the downloaded logs — the Entity
  // dropdown offers exactly what the data contains, so every option is
  // guaranteed to match at least one log row.
  const entities = computed(() => {
    const set = new Set()
    for (const row of logTrails.value) {
      if (row && row.entity) set.add(row.entity)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  })

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

  return { logTrails, entities, isLoading, error, fetchLogTrails }
})
