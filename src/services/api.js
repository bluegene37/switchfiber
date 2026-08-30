import axios from 'axios'

const apiClient = axios.create({
  // Using relative path '/api' so it hits our Vite proxy defined in vite.config.js
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Allow up to 60 seconds for large unpaginated backend datasets, or customize via env
  timeout: Number(typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_TIMEOUT) || 60000,
})

// The app and the API share one origin (Vite proxy in dev, nginx/Vercel
// rewrites in production), and over HTTP/1.1 a browser opens at most ~6
// connections per origin. A burst of slow API GETs can occupy every slot and
// starve the router's lazy view imports — sidebar clicks then appear dead
// until the API answers or times out. Aborting stale in-flight GETs when a
// navigation starts frees those sockets so route changes always go through.
// Requests that must survive navigation opt out with { cancelOnNavigate: false }.
const navCancellable = new Set()

export const abortPendingNavigationRequests = () => {
  navCancellable.forEach((controller) => controller.abort())
  navCancellable.clear()
}

const releaseNavController = (config) => {
  if (config?._navAbortController) {
    navCancellable.delete(config._navAbortController)
    delete config._navAbortController
  }
}

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token && typeof token === 'string' && token.trim()) {
    config.headers.Authorization = `Bearer ${token.trim()}`
  }
  // Only reads are cancellable — a mutation must never be killed mid-flight.
  // A caller-supplied signal is left alone.
  if ((config.method || 'get').toLowerCase() === 'get' && config.cancelOnNavigate !== false && !config.signal) {
    const controller = new AbortController()
    config.signal = controller.signal
    config._navAbortController = controller
    navCancellable.add(controller)
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// ASP.NET keys deserializer failures by JSON path (`$.accountNo`) rather than by
// property name. Strip the path syntax so the user sees the field, not the shape
// of the request body.
const cleanFieldName = (field) => String(field).replace(/^\$\./, '').trim() || String(field)

// A .NET deserializer failure arrives as one long sentence naming the request
// class, the JSON path, the line number and the byte offset. None of that helps
// the person filling in the form; it only buries the one fact that does.
const JSON_CONVERT_FAILURE = /The JSON value could not be converted to [^.]+\./i

const simplifyServerFieldError = (message) => {
  const text = String(message)
  if (!JSON_CONVERT_FAILURE.test(text)) return text
  return 'the value entered is not in the format the server expects.'
}

// Response interceptor
apiClient.interceptors.response.use((response) => {
  releaseNavController(response.config)
  let data = response.data
  if (typeof data === 'string') {
    const trimmed = data.trim()
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        data = JSON.parse(trimmed)
      } catch (e) {
        // If parsing fails, retain original raw string
      }
    }
  }
  return data
}, (error) => {
  releaseNavController(error.config)

  // A request aborted because the user navigated away is not a failure —
  // callers check `isCanceled` to skip error states and health reports.
  if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
    const canceledError = new Error('Request canceled by navigation.')
    canceledError.isCanceled = true
    return Promise.reject(canceledError)
  }

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
  let errorMessage = error.response?.data?.message
  if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
    const fieldErrList = []
    Object.entries(error.response.data.errors).forEach(([field, msgs]) => {
      const msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
      fieldErrList.push(`${cleanFieldName(field)}: ${simplifyServerFieldError(msgStr)}`)
    })
    if (fieldErrList.length > 0) {
      const detailed = fieldErrList.join(' | ')
      errorMessage = errorMessage ? `${errorMessage} - ${detailed}` : detailed
    }
  }
  if (!errorMessage) {
    // Several endpoints answer with a bare text body ("An error occurred while
    // creating the access level menu") rather than a problem-details object.
    // Without this, that sentence is dropped and the user is shown axios's
    // "Request failed with status code 500", which says nothing.
    const raw = error.response?.data
    if (typeof raw === 'string' && raw.trim() && raw.trim().length <= 300) {
      errorMessage = raw.trim()
    }
  }
  if (!errorMessage) {
    errorMessage = error.response?.data?.title || error.message || 'An unexpected server error occurred.'
  }

  const customError = new Error(errorMessage)
  customError.status = error.response?.status

  return Promise.reject(customError)
})

export default apiClient
