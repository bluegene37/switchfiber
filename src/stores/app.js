import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApplicationService } from '../services/applications'

export const useAppStore = defineStore('app', () => {
  // Recent Applications (Mapped for the Dashboard table)
  const recentConnections = ref([])
  const isLoadingConnections = ref(false)
  const connectionsError = ref(null)

  // The dashboard table shows a handful of recent rows, so ask the server for a
  // recent date window instead of the whole table (15,449+ rows; the unbounded
  // GET both caps at 5,000 and is the load the backend struggles under). A
  // quiet month falls back to a year so the table never looks wrongly empty.
  const RECENT_WINDOWS_DAYS = [30, 365]

  const fetchApplications = async () => {
    isLoadingConnections.value = true
    connectionsError.value = null
    try {
      let data = []
      for (const days of RECENT_WINDOWS_DAYS) {
        const to = new Date()
        const from = new Date(to.getTime() - days * 86400000)
        const response = await ApplicationService.filterApplications({
          fromDate: from.toISOString(),
          toDate: to.toISOString()
        })

        // The endpoint may answer with a bare array or a wrapped object.
        data = response || []
        if (data && !Array.isArray(data) && typeof data === 'object') {
          const arrayKey = Object.keys(data).find(k => Array.isArray(data[k]))
          data = arrayKey ? data[arrayKey] : []
        }
        if (Array.isArray(data) && data.length > 0) break
      }
      if (!Array.isArray(data)) data = []

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
