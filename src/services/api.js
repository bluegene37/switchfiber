import axios from 'axios'

const apiClient = axios.create({
  // Using relative path '/api' so it hits our Vite proxy defined in vite.config.js
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
  
  if (error.response?.status === 401) {
    console.warn('Unauthorized access - redirecting to login')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  if (error.response?.status >= 500) {
    console.error('Server error occurred')
  }

  // Standardize error message
  let errorMessage = error.response?.data?.message || error.response?.data?.title
  if (!errorMessage && error.response?.data?.errors) {
    const errs = error.response.data.errors
    if (typeof errs === 'object') {
      errorMessage = Object.values(errs).flat().join(', ')
    }
  }
  if (!errorMessage) {
    errorMessage = error.message || 'An unexpected error occurred'
  }

  const customError = new Error(errorMessage)
  customError.status = error.response?.status

  return Promise.reject(customError)
})

export default apiClient
