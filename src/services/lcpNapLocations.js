import apiClient from './api'

export const LcpNapLocationService = {
  getLocations() {
    return apiClient.get('/LCPNapLocations')
  },
  getLocationById(id) {
    return apiClient.get(`/LCPNapLocations/${id}`)
  },
  createLocation(data) {
    return apiClient.post('/LCPNapLocations', data)
  },
  updateLocation(id, data) {
    return apiClient.put(`/LCPNapLocations/${id}`, data)
  },
  deleteLocation(id) {
    return apiClient.delete(`/LCPNapLocations/${id}`)
  },
  // A location row stores its LCP and NAP as display names ("LCP 031",
  // "NAP 001"). These fetch the master records so the map can link each
  // location to its Lcps / Naps row id — the key that create, update, and
  // edit flows will write back against.
  getLcps() {
    return apiClient.get('/Lcps')
  },
  getNaps() {
    return apiClient.get('/Naps')
  }
}

// "14.474414, 121.196214" → { lat, lng }, or null when the string is not a
// usable WGS84 pair. Kept here so every consumer rejects bad rows the same way.
export const parseCoordinates = (value) => {
  if (typeof value !== 'string') return null
  const parts = value.split(',').map(p => Number(p.trim()))
  if (parts.length !== 2 || parts.some(n => !Number.isFinite(n))) return null
  const [lat, lng] = parts
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  // (0, 0) is the classic "no GPS fix" placeholder, never a real site
  if (lat === 0 && lng === 0) return null
  return { lat, lng }
}
