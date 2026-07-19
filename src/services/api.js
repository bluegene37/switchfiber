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
  // Can add token here if backend existed
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
    // Handle unauthorized (e.g. redirect to login)
    console.warn('Unauthorized access - please login again')
  }

  if (error.response?.status >= 500) {
    console.error('Server error occurred')
  }

  // Standardize error message
  const customError = new Error(
    error.response?.data?.message || error.message || 'An unexpected error occurred'
  )
  customError.status = error.response?.status

  return Promise.reject(customError)
})

export default apiClient
