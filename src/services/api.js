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
  return Promise.reject(error)
})

export default apiClient
