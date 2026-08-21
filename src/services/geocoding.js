// Thin wrapper around OpenStreetMap's Nominatim geocoder with Philippine address heuristics
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

const cleanBrgyName = (str) => {
  if (!str) return null
  return String(str)
    .replace(/^(barangay|brgy\.?|bgy\.?)\s+/i, '')
    .trim()
}

/**
 * Free-text place search with support for direct coordinates and rich PH results.
 * Returns [{ label, title, subtitle, lat, lng }]
 */
export const searchPlaces = async (query, { signal } = {}) => {
  const q = String(query || '').trim()
  if (!q || q.length < 2) return []

  // Check if user pasted coordinates directly (e.g. "14.474414, 121.196214" or "14.474414 121.196214")
  const coordParts = q.replace(/lat:|latitude:|lng:|longitude:|lon:/gi, '').trim().split(/[,;\s]+/).map(Number)
  if (coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
    const [lat, lng] = coordParts
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [{
        label: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        title: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        subtitle: 'Pinned GPS Coordinates',
        lat,
        lng
      }]
    }
  }

  const url = `${NOMINATIM_BASE}/search?format=jsonv2&countrycodes=ph&limit=8&addressdetails=1&q=${encodeURIComponent(q)}`
  try {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    const rows = await res.json()
    return (Array.isArray(rows) ? rows : []).map(r => {
      const parts = String(r.display_name || '').split(',').map(s => s.trim())
      const title = parts[0] || r.name || 'Location'
      const subtitle = parts.slice(1, 4).join(', ')
      return {
        label: r.display_name,
        title,
        subtitle,
        lat: Number(r.lat),
        lng: Number(r.lon)
      }
    }).filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lng))
  } catch {
    return []
  }
}

/**
 * Coordinates → address parts, with comprehensive fallbacks for Philippine addresses.
 */
export const reverseGeocode = async (lat, lng, { signal } = {}) => {
  const fetchAtZoom = async (zoom) => {
    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&zoom=${zoom}&addressdetails=1&lat=${lat}&lon=${lng}`
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return await res.json()
  }

  let data = null
  try {
    data = await fetchAtZoom(18)
  } catch {
    data = null
  }
  if (!data) return null

  let a = data?.address || {}

  // If both road and barangay/village are missing at zoom 18 (e.g. clicked open lot or pole),
  // do a quick secondary lookup at zoom 16 to capture the encompassing barangay / road
  if (!a.road && !a.suburb && !a.village && !a.neighbourhood && !a.quarter && !a.city_district) {
    try {
      const z16 = await fetchAtZoom(16)
      if (z16?.address) {
        a = { ...z16.address, ...a }
        if (!data.display_name) data = z16
      }
    } catch {
      // Ignore fallback error
    }
  }

  // Extract Street with broad Philippine OSM tag heuristics
  let street = a.road || a.street || a.pedestrian || a.footway || a.path || a.residential ||
    a.highway || a.avenue || a.lane || a.drive || a.boulevard || a.alley || a.way || a.track ||
    a.place || a.neighbourhood || a.commercial || a.industrial || a.amenity || a.building || null

  // If street is still null, extract the leading segment of display_name if it looks like a street or landmark
  if (!street && data?.display_name) {
    const segments = String(data.display_name).split(',').map(s => s.trim())
    if (segments.length > 2) {
      const candidate = segments[0]
      if (!/^(philippines|calabarzon|rizal|laguna|cavite|batangas|quezon|ncr|region)/i.test(candidate)) {
        street = candidate
      }
    }
  }

  // Extract Barangay with broad Philippine OSM tag heuristics
  let rawBarangay = a.suburb || a.village || a.neighbourhood || a.quarter || a.hamlet ||
    a.city_district || a.district || a.borough || a.subdivision || a.allotments || a.residential || null

  // If still missing, look for a "Brgy" or "Barangay" token in display_name
  if (!rawBarangay && data?.display_name) {
    const match = String(data.display_name).match(/(?:barangay|brgy\.?)\s+([^,]+)/i)
    if (match && match[1]) {
      rawBarangay = match[1].trim()
    }
  }

  const cleanBarangay = cleanBrgyName(rawBarangay)

  const city = a.city || a.town || a.municipality || a.city_district || a.county || null

  const provinceLike = [a.province, a.state, a.region, a.state_district, a.county].filter(Boolean)

  return {
    street: street ? String(street).trim() : null,
    barangay: cleanBarangay || (rawBarangay ? String(rawBarangay).trim() : null),
    rawBarangay: rawBarangay ? String(rawBarangay).trim() : null,
    city: city ? String(city).replace(/^(city of|municipality of)\s+/i, '').trim() : null,
    rawCity: city ? String(city).trim() : null,
    provinceLike,
    label: data?.display_name || null
  }
}
