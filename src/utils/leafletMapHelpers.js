// Gene - Nov, 27, 2026: Shared Leaflet tile layer, XSS-safe HTML escaping, and LCP marker color helpers extracted in Phase 1 modular refactor

export const FALLBACK_MAP_CENTER = [14.4655, 121.1922]

export const LEAFLET_TILE_LAYERS = {
  streetLight: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }
  },
  streetDark: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      className: 'osm-dark-tiles',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Imagery &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
    }
  }
}

/**
 * Escape HTML-significant characters before interpolating API text into Leaflet tooltips/popups.
 * @param {*} value
 * @returns {string}
 */
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[ch]))

/**
 * Resolve the tile layer definition for street (light/dark) or satellite mode.
 * @param {{ mode?: string, isDark?: boolean }} [opts]
 */
export const resolveTileLayerSpec = ({ mode = 'street', isDark = false } = {}) => {
  if (mode === 'satellite') return LEAFLET_TILE_LAYERS.satellite
  return isDark ? LEAFLET_TILE_LAYERS.streetDark : LEAFLET_TILE_LAYERS.streetLight
}

/**
 * Replace any active Leaflet base tile layer on `map` with the resolved layer for `mode` / `isDark`.
 * @param {{ L: any, map: any, currentLayer?: any, mode?: string, isDark?: boolean }} [opts]
 * @returns {any} Newly added Leaflet tileLayer instance (or `currentLayer` if `L`/`map` is missing)
 */
export const applyLeafletBaseLayer = ({ L, map, currentLayer = null, mode = 'street', isDark = false } = {}) => {
  if (!L || !map) return currentLayer
  if (currentLayer) {
    map.removeLayer(currentLayer)
  }
  const spec = resolveTileLayerSpec({ mode, isDark })
  return L.tileLayer(spec.url, spec.options).addTo(map)
}

export const LCP_PALETTE = [
  '#e74c5a', '#6f42c1', '#d63384', '#dc3545',
  '#fd7e14', '#ffc107', '#10b981', '#20c997',
  '#0ea5e9', '#8b5cf6', '#ec4899', '#f97316'
]

const hashString = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Map an LCP cabinet name deterministically to a categorical palette color.
 * @param {string} lcpName
 * @returns {string}
 */
export const hashLcpColor = (lcpName) => {
  if (!lcpName) return '#6c757d'
  const idx = hashString(String(lcpName).trim().toLowerCase()) % LCP_PALETTE.length
  return LCP_PALETTE[idx]
}

/**
 * Compute a golden-angle hue (0–359) for an LCP cabinet name.
 * @param {string} lcpName
 * @returns {number}
 */
export const lcpHue = (lcpName) => {
  const digits = String(lcpName || '').replace(/\D/g, '')
  let seed = digits ? Number(digits) : 0
  if (!seed) {
    for (const ch of String(lcpName || '')) seed = (seed * 31 + ch.charCodeAt(0)) % 100000
  }
  return Math.round((seed * 137.508) % 360)
}

/**
 * Return an `hsl(...)` color string for an LCP cabinet name using golden-angle spacing.
 * @param {string} lcpName
 * @returns {string}
 */
export const lcpHslColor = (lcpName) => `hsl(${lcpHue(lcpName)}, 62%, 44%)`
