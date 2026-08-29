<template>
  <div class="card shadow-sm border-0 rounded-4 p-4 h-100 bg-body">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
      <div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h3 class="fs-5 fw-bold text-body mb-0">Network Plant & LCP NAP Coverage</h3>
          <span v-if="!isLoading && sites.length" class="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 small fw-semibold">
            {{ sites.length }} Nodes Plotted
          </span>
          <span v-if="!isLoading && totalPorts" class="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2.5 py-1 small">
            {{ totalPorts }} Ports
          </span>
        </div>
        <p class="small text-secondary mb-0 mt-0.5">Live geospatial mapping of LCP & NAP plant distribution</p>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <!-- Layer Switcher -->
        <div class="btn-group btn-group-sm bg-body-tertiary border rounded-3 p-0.5 shadow-none" role="group">
          <button
            type="button"
            class="btn btn-sm border-0 rounded-2 fw-medium px-2.5 py-1 d-inline-flex align-items-center gap-1.5 transition-all"
            :class="baseLayerMode === 'street' ? 'btn-primary text-white shadow-xs' : 'btn-link text-secondary text-decoration-none'"
            @click="setBaseLayer('street')"
          >
            <i class="pi pi-map" style="font-size: 0.7rem;"></i>
            <span>Street</span>
          </button>
          <button
            type="button"
            class="btn btn-sm border-0 rounded-2 fw-medium px-2.5 py-1 d-inline-flex align-items-center gap-1.5 transition-all"
            :class="baseLayerMode === 'satellite' ? 'btn-primary text-white shadow-xs' : 'btn-link text-secondary text-decoration-none'"
            @click="setBaseLayer('satellite')"
          >
            <i class="pi pi-globe" style="font-size: 0.7rem;"></i>
            <span>Satellite</span>
          </button>
        </div>

        <Button
          class="p-button-secondary p-button-sm p-button-outlined shadow-xs toolbar-icon-btn rounded-3"
          v-tooltip.bottom="'Reload map data'"
          :loading="isLoading"
          aria-label="Reload locations"
          @click="loadData"
        >
          <i v-if="!isLoading" class="pi pi-refresh" style="font-size: 0.75rem;"></i>
        </Button>

        <router-link
          to="/lcp-nap-locations/map"
          class="btn btn-sm btn-outline-primary rounded-3 d-inline-flex align-items-center gap-1.5 px-3 py-1 shadow-xs fw-medium text-decoration-none"
        >
          <span>Open Full Map</span>
          <i class="pi pi-arrow-up-right" style="font-size: 0.7rem;"></i>
        </router-link>
      </div>
    </div>

    <!-- Map Container -->
    <div class="position-relative w-100 rounded-3 overflow-hidden border" style="height: 250px;">
      <div ref="mapContainer" class="w-100 h-100 dsh-map"></div>

      <!-- Loading overlay -->
      <div
        v-if="isLoading"
        class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-body bg-opacity-75"
        style="z-index: 1000;"
      >
        <div class="d-flex align-items-center gap-2 small text-secondary">
          <i class="pi pi-spin pi-spinner text-primary"></i>
          <span>Loading plant locations…</span>
        </div>
      </div>

      <!-- Error / Empty overlay -->
      <div
        v-else-if="error || (!sites.length && !isLoading)"
        class="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-body bg-opacity-90 p-3 text-center"
        style="z-index: 1000;"
      >
        <i class="pi pi-map-marker text-muted mb-2" style="font-size: 1.5rem;"></i>
        <div class="small fw-semibold text-body">{{ error || 'No plottable LCP NAP locations available' }}</div>
        <div class="text-secondary small mt-0.5">Ensure coordinate pairs are pinned in the LCP NAP records.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Button from 'primevue/button'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { LcpNapLocationService, parseCoordinates } from '../services/lcpNapLocations'
import { useTheme } from '../composables/useTheme'

const { isDark } = useTheme()

// Location names and addresses come from the API, and Leaflet renders a string
// tooltip via innerHTML, so any markup in them would execute in the admin's
// session. Escape before interpolating — matches LcpNapMap.vue.
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]))

const mapContainer = ref(null)
const isLoading = ref(true)
const error = ref(null)
const sites = ref([])
const baseLayerMode = ref('street')

let map = null
let clusterGroup = null
let activeBaseLayer = null
let resizeObserver = null

// Binangonan, Rizal default center
const FALLBACK_CENTER = [14.4655, 121.1922]

const TILE_LAYERS = {
  streetLight: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  streetDark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  }
}

const PALETTE = [
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

const lcpColor = (lcpName) => {
  if (!lcpName) return '#6c757d'
  const idx = hashString(String(lcpName).trim().toLowerCase()) % PALETTE.length
  return PALETTE[idx]
}

const siteIcon = (site) => {
  const color = site.color || '#e74c5a'
  const html = `
    <div class="dsh-map-pin" style="--pin-color: ${color}">
      <div class="dsh-pin-head">
        <span class="dsh-pin-dot"></span>
      </div>
      <div class="dsh-pin-tip"></div>
    </div>
  `
  return L.divIcon({
    className: 'dsh-map-marker-wrap',
    html,
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    tooltipAnchor: [0, -28],
    popupAnchor: [0, -28]
  })
}

const totalPorts = computed(() => sites.value.reduce((sum, s) => sum + (Number(s.portTotal) || 0), 0))

const setBaseLayer = (mode) => {
  baseLayerMode.value = mode
  if (!map) return

  if (activeBaseLayer) {
    map.removeLayer(activeBaseLayer)
    activeBaseLayer = null
  }

  let layerKey = 'streetLight'
  if (mode === 'satellite') {
    layerKey = 'satellite'
  } else if (isDark.value) {
    layerKey = 'streetDark'
  }

  const spec = TILE_LAYERS[layerKey]
  activeBaseLayer = L.tileLayer(spec.url, spec.options).addTo(map)
}

const renderMarkers = () => {
  if (!map || !clusterGroup) return
  clusterGroup.clearLayers()

  sites.value.forEach(site => {
    const marker = L.marker([site.lat, site.lng], { icon: siteIcon(site) })
    const locationName = escapeHtml(site.name || `Location #${site.id}`)
    const locAddress = escapeHtml([site.street, site.barangay, site.city].filter(Boolean).join(', '))
    const portCount = Number(site.portTotal)

    marker.bindTooltip(
      `<strong>${locationName}</strong>${Number.isFinite(portCount) ? ` · ${portCount} ports` : ''}${locAddress ? `<br/><span class="small text-secondary">${locAddress}</span>` : ''}`,
      { direction: 'top', opacity: 0.95 }
    )
    clusterGroup.addLayer(marker)
  })

  if (sites.value.length) {
    const bounds = L.latLngBounds(sites.value.map(s => [s.lat, s.lng]))
    map.fitBounds(bounds.pad(0.2), { maxZoom: 16 })
  }
}

const loadData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const locations = await LcpNapLocationService.getLocations()
    const rows = Array.isArray(locations) ? locations : []
    const mapped = []

    rows.forEach(row => {
      const coords = parseCoordinates(row.coordinates)
      if (!coords) return
      mapped.push({
        id: row.id,
        name: row.lcpnap || `${row.lcp || ''} ${row.nap || ''}`.trim() || `Location #${row.id}`,
        lcp: row.lcp || '',
        nap: row.nap || '',
        portTotal: row.portTotal ?? null,
        lat: coords.lat,
        lng: coords.lng,
        street: row.street || '',
        barangay: row.barangay || '',
        city: row.city || '',
        region: row.region || '',
        color: lcpColor(row.lcp)
      })
    })

    sites.value = mapped
    renderMarkers()
  } catch (err) {
    error.value = err?.message || 'Could not load LCP NAP locations.'
    sites.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    center: FALLBACK_CENTER,
    zoom: 13,
    minZoom: 4,
    maxZoom: 19,
    zoomControl: true,
    attributionControl: false
  })

  L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)

  clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 40,
    spiderfyOnMaxZoom: true,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount()
      return L.divIcon({
        html: `<div class="dsh-cluster-bubble"><span>${count}</span></div>`,
        className: 'dsh-cluster-wrap',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }
  })
  map.addLayer(clusterGroup)

  setBaseLayer(baseLayerMode.value)
  loadData()

  if (typeof ResizeObserver !== 'undefined' && mapContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      if (map) map.invalidateSize()
    })
    resizeObserver.observe(mapContainer.value)
  }
})

watch(isDark, () => {
  if (baseLayerMode.value === 'street') {
    setBaseLayer('street')
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.dsh-map {
  background: var(--bs-body-bg);
}

:deep(.dsh-map-marker-wrap) {
  background: transparent;
  border: none;
}

:deep(.dsh-map-pin) {
  position: relative;
  width: 24px;
  height: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.28));
  cursor: pointer;
  transition: transform 0.16s ease;
}

:deep(.dsh-map-pin:hover) {
  transform: translateY(-2px) scale(1.1);
}

:deep(.dsh-pin-head) {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--pin-color, var(--bs-primary, #e74c5a));
  border: 2px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}

:deep(.dsh-pin-dot) {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ffffff;
}

:deep(.dsh-pin-tip) {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid var(--pin-color, var(--bs-primary, #e74c5a));
  margin-top: -1px;
}

:deep(.dsh-cluster-wrap) {
  background: transparent;
  border: none;
}

:deep(.dsh-cluster-bubble) {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bs-primary, #e74c5a);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25), 0 0 0 3px rgba(255, 255, 255, 0.85);
}

:deep(.leaflet-tooltip) {
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  border: 1px solid var(--bs-border-color);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.78rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-tooltip-top:before) {
  border-top-color: var(--bs-body-bg);
}
</style>
