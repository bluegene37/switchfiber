import { defineStore } from 'pinia'
import { ref } from 'vue'
import { UserService } from '../services/users'

export const useUserStore = defineStore('users', () => {
  const users = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchUsers = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await UserService.getUsers()
      users.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch users'
    } finally {
      isLoading.value = false
    }
  }

  return { users, isLoading, error, fetchUsers }
})
