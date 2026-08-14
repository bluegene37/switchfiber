import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../services/api'

// Reads a persisted value, treating the literal strings "null"/"undefined"
// (written by older builds) as absent.
const readStored = (key) => {
  const raw = localStorage.getItem(key) || sessionStorage.getItem(key)
  return raw && raw !== 'null' && raw !== 'undefined' ? raw : null
}

const readStoredUser = () => {
  try {
    return JSON.parse(readStored('user') || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readStored('token'))
  const user = ref(readStoredUser())
  
  const isAuthenticated = computed(() => !!token.value || (!!user.value && (user.value.id > 0 || !!user.value.username)))

  const login = async ({ usernameOrEmail, password, rememberMe = false }) => {
    try {
      // Credentials are verified server-side only. The client never fetches the
      // user table to compare passwords, and there are no built-in accounts.
      const res = await apiClient.post('/Users/login', {
        username: usernameOrEmail,
        password: password
      })

      const authUser = res?.user || res
      if (!authUser || typeof authUser !== 'object' || (!authUser.id && !authUser.username)) {
        throw new Error('Login failed: unexpected response from the authentication server.')
      }

      if (authUser.active === false || authUser.active === 'false') {
        throw new Error('Your account is inactive. Please contact your system administrator.')
      }

      const authToken = res?.token || res?.accessToken || null
      if (!authToken) {
        // The API does not issue a bearer token yet; mark the session as
        // server-verified so the guard and the request interceptor agree.
        console.warn('Login succeeded but no token was returned by the API.')
      }

      token.value = authToken
      user.value = {
        id: authUser.id || 1,
        username: authUser.username || authUser.fname || 'User',
        fname: authUser.firstName || authUser.fname || '',
        lname: authUser.lastName || authUser.lname || '',
        email: authUser.userEmail || authUser.email || '',
        accesslevel_id: authUser.accessLevelId || authUser.accesslevel_id || 1,
        menus: authUser.menus || []
      }

      const storage = rememberMe ? localStorage : sessionStorage
      // Clean previous session storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')

      // Never persist a literal "null" — it reads back as a truthy string and
      // would both fake an authenticated session and send `Bearer null`.
      if (token.value) storage.setItem('token', token.value)
      storage.setItem('user', JSON.stringify(user.value))

      return user.value
    } catch (err) {
      console.error('Login Failed:', err.message)
      throw err
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }

  return { token, user, isAuthenticated, login, logout }
})
