import axios from 'axios'

const apiClient = axios.create({
  // Using relative path '/api' so it hits our Vite proxy defined in vite.config.js
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
})

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token && typeof token === 'string' && token.trim()) {
    config.headers.Authorization = `Bearer ${token.trim()}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response interceptor
apiClient.interceptors.response.use((response) => {
  return response.data
}, (error) => {
  console.error('API Error:', error.response?.status, error.message)

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    const timeoutError = new Error('Network request timed out. Please check your internet connection or server status.')
    timeoutError.status = 408
    return Promise.reject(timeoutError)
  }
  
  if (error.response?.status === 401) {
    console.warn('Unauthorized access - cleaning session and redirecting')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  if (error.response?.status >= 500) {
    console.error('Telecom Server Error (5xx):', error.response?.status)
  }

  // Standardize error message payload
  let errorMessage = error.response?.data?.message || error.response?.data?.title
  if (!errorMessage && error.response?.data?.errors) {
    const errs = error.response.data.errors
    if (typeof errs === 'object') {
      errorMessage = Object.values(errs).flat().join(', ')
    }
  }
  if (!errorMessage) {
    errorMessage = error.message || 'An unexpected server error occurred.'
  }

  const customError = new Error(errorMessage)
  customError.status = error.response?.status

  return Promise.reject(customError)
})

export default apiClient
