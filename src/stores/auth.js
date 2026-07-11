import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(localStorage.getItem('auth') === 'true')
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)

  const login = async (credentials) => {
    // Dummy authentication delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Accept any credentials as per requirements
    isAuthenticated.value = true
    user.value = {
      name: 'Admin User',
      email: credentials.email || credentials.username || 'admin@switchfiber.com',
      role: 'Super Admin'
    }
    
    localStorage.setItem('auth', 'true')
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const logout = () => {
    isAuthenticated.value = false
    user.value = null
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
  }

  return { isAuthenticated, user, login, logout }
})
