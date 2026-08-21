// Thin wrapper around OpenStreetMap's Nominatim geocoder — keyless, which is
// why it powers both the map search box and the pin → address autofill.
// Usage policy asks for light traffic: callers debounce, and results are
// scoped to the Philippines.

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

/**
 * Free-text place search. Returns [{ label, lat, lng }] (max 5).
 */
export const searchPlaces = async (query, { signal } = {}) => {
  const q = String(query || '').trim()
  if (q.length < 3) return []
  const url = `${NOMINATIM_BASE}/search?format=jsonv2&countrycodes=ph&limit=5&addressdetails=0&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const rows = await res.json()
  return (Array.isArray(rows) ? rows : []).map(r => ({
    label: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon)
  })).filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lng))
}

/**
 * Coordinates → address parts, mapped onto the fields the location records
 * store. Every field can come back null — the caller fills only what resolved.
 */
export const reverseGeocode = async (lat, lng, { signal } = {}) => {
  const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data = await res.json()
  const a = data?.address || {}
  return {
    street: a.road || a.street || a.pedestrian || null,
    // OSM tags Philippine barangays inconsistently — take the most specific
    barangay: a.suburb || a.village || a.neighbourhood || a.quarter || a.hamlet || null,
    city: a.city || a.town || a.municipality || null,
    // "Rizal" etc. arrives as state or province depending on the mapper
    provinceLike: [a.province, a.state, a.county, a.region].filter(Boolean),
    label: data?.display_name || null
  }
}
