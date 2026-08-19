import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApplicationService } from '../services/applications'

export const useAppStore = defineStore('app', () => {
  // Recent Applications (Mapped for the Dashboard table)
  const recentConnections = ref([])
  const isLoadingConnections = ref(false)
  const connectionsError = ref(null)

  const fetchApplications = async () => {
    isLoadingConnections.value = true
    connectionsError.value = null
    try {
      const response = await ApplicationService.getApplications()

      // The endpoint may answer with a bare array or a wrapped object.
      let data = response || []
      if (data && !Array.isArray(data) && typeof data === 'object') {
        const arrayKey = Object.keys(data).find(k => Array.isArray(data[k]))
        data = arrayKey ? data[arrayKey] : []
      }

      // Sort applications descending by ID (newest first)
      const sortedData = [...data].sort((a, b) => {
        const idA = Number(a.id || a.applicationId || 0)
        const idB = Number(b.id || b.applicationId || 0)
        return idB - idA
      })

      recentConnections.value = sortedData.map(app => ({
        id: app.id || app.applicationId,
        name: `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Unknown',
        contact: app.mobileNumber || 'N/A',
        type: app.applyingFor || 'N/A',
        limit: app.desiredPlan || 'N/A',
        status: app.status || 'Pending',
        node: app.city || 'N/A'
      }))
    } catch (err) {
      // Surfaced in the UI — a silent catch here left the dashboard looking
      // empty rather than broken when the endpoint fails.
      connectionsError.value = err.message || 'Unable to load applications.'
      recentConnections.value = []
    } finally {
      isLoadingConnections.value = false
    }
  }

  return {
    recentConnections,
    isLoadingConnections,
    connectionsError,
    fetchApplications
  }
})
