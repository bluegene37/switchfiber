import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApplicationService } from '../services/applications'

export const useAppStore = defineStore('app', () => {
  // KPI Data
  const kpiStats = ref([
    { title: 'Total Applications', value: '0', trend: 0, icon: 'pi-users', iconBgClass: 'bg-blue-50 dark:bg-blue-900/20', iconColorClass: 'text-blue-500' },
    { title: 'Active Connections', value: '11,892', trend: 2.1, icon: 'pi-wifi', iconBgClass: 'bg-green-50 dark:bg-green-900/20', iconColorClass: 'text-green-500' },
    { title: 'Offline Customers', value: '142', trend: -12.5, icon: 'pi-exclamation-triangle', iconBgClass: 'bg-amber-50 dark:bg-amber-900/20', iconColorClass: 'text-amber-500' },
    { title: 'Monthly Revenue', value: '$428,500', trend: 8.4, icon: 'pi-dollar', iconBgClass: 'bg-purple-50 dark:bg-purple-900/20', iconColorClass: 'text-purple-500' }
  ])

  // Recent Applications (Mapped for the Dashboard Connections table)
  const recentConnections = ref([])
  const isLoadingConnections = ref(false)

  const fetchApplications = async () => {
    isLoadingConnections.value = true
    try {
      const response = await ApplicationService.getApplications()
      const data = response || []
      
      recentConnections.value = data.map(app => ({
        id: app.id || app.applicationId,
        name: `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Unknown',
        ip: app.mobileNumber || 'N/A', // Using mobile as a dummy field for IP column
        type: app.applyingFor || 'N/A',
        limit: app.desiredPlan || 'N/A',
        status: app.status || 'Pending',
        node: app.city || 'N/A'
      }))
      
      // Update KPI
      kpiStats.value[0].value = recentConnections.value.length.toString()
      
    } catch (err) {
      console.error(err)
    } finally {
      isLoadingConnections.value = false
    }
  }

  // Mock Roles and Permissions
  const rolesList = ref([
    { id: 1, name: 'Super Admin', description: 'Full access to all modules and system settings', users: 3 },
    { id: 2, name: 'Network Engineer', description: 'Access to connection manager and monitoring', users: 8 },
    { id: 3, name: 'Billing Operations', description: 'Access to billing and customer plans', users: 12 }
  ])

  const permissionsList = ref([
    { id: 'read_conn', name: 'Read Connections' },
    { id: 'write_conn', name: 'Write Connections' },
    { id: 'trigger_reconnect', name: 'Trigger Reconnect' },
    { id: 'modify_billing', name: 'Modify Billing' },
    { id: 'manage_users', name: 'Manage Users' }
  ])

  // Matrix: Role ID -> array of Permission IDs
  const permissionsMatrix = ref({
    1: ['read_conn', 'write_conn', 'trigger_reconnect', 'modify_billing', 'manage_users'],
    2: ['read_conn', 'write_conn', 'trigger_reconnect'],
    3: ['read_conn', 'modify_billing']
  })

  // Mock Actions
  const toggleConnection = async (id) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    const conn = recentConnections.value.find(c => c.id === id)
    if (conn) {
      conn.status = conn.status === 'Active' ? 'Suspended' : 'Active'
    }
  }

  const updatePermission = async (roleId, permId, hasPermission) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    if (hasPermission) {
      if (!permissionsMatrix.value[roleId].includes(permId)) {
        permissionsMatrix.value[roleId].push(permId)
      }
    } else {
      permissionsMatrix.value[roleId] = permissionsMatrix.value[roleId].filter(id => id !== permId)
    }
  }

  return {
    kpiStats,
    recentConnections,
    isLoadingConnections,
    fetchApplications,
    rolesList,
    permissionsList,
    permissionsMatrix,
    toggleConnection,
    updatePermission
  }
})
