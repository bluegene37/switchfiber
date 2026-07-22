import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApplicationService } from '../services/applications'

export const useApplicationStore = defineStore('applications', () => {
  const applications = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchApplications = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await ApplicationService.getApplications()
      applications.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch applications'
    } finally {
      isLoading.value = false
    }
  }

  return { applications, isLoading, error, fetchApplications }
})
