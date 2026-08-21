<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">LCP NAP Locations</h1>
        <p class="small text-secondary mt-1 mb-0">
          Every LCP cabinet and NAP box on the plant, plotted where it stands in the field.
        </p>
      </div>
      <!-- Live stats derived from the plotted set & navigation -->
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <template v-if="sites.length">
          <span class="lnm-stat-chip"><i class="pi pi-server"></i>{{ lcpGroups.length }} LCP{{ lcpGroups.length === 1 ? '' : 's' }}</span>
          <span class="lnm-stat-chip"><i class="pi pi-box"></i>{{ sites.length }} NAP site{{ sites.length === 1 ? '' : 's' }}</span>
          <span class="lnm-stat-chip"><i class="pi pi-share-alt"></i>{{ totalPorts }} ports</span>
        </template>
        <router-link
          to="/lcp-nap-locations/records"
          class="btn btn-sm btn-outline-secondary rounded-3 d-inline-flex align-items-center gap-2 shadow-xs fw-medium text-decoration-none ms-sm-1"
        >
          <i class="pi pi-table" style="font-size: 0.8rem;"></i>
          <span>View Records</span>
        </router-link>
      </div>
    </div>

    <!-- Map Card -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 d-flex flex-column gap-3">
      <!-- Toolbar -->
      <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
        <div class="d-flex align-items-center gap-2">
          <span class="small fw-semibold text-secondary text-uppercase tracking-wider">Map Controls</span>
        </div>

        <div class="d-flex align-items-center gap-2 ms-auto">
          <!-- Base layer -->
          <div class="d-inline-flex align-items-center gap-1.5">
            <button
              type="button"
              class="btn btn-sm rounded-3 px-3 py-1 fw-medium text-nowrap d-inline-flex align-items-center gap-1.5 shadow-xs"
              :class="baseLayerMode === 'street' ? 'btn-primary text-white shadow-sm' : 'btn-light border text-secondary bg-body-tertiary'"
              @click="setBaseLayer('street')"
            >
              <i class="pi pi-map" style="font-size: 0.75rem;"></i>
              <span>Street</span>
            </button>
            <button
              type="button"
              class="btn btn-sm rounded-3 px-3 py-1 fw-medium text-nowrap d-inline-flex align-items-center gap-1.5 shadow-xs"
              :class="baseLayerMode === 'satellite' ? 'btn-primary text-white shadow-sm' : 'btn-light border text-secondary bg-body-tertiary'"
              @click="setBaseLayer('satellite')"
            >
              <i class="pi pi-globe" style="font-size: 0.75rem;"></i>
              <span>Satellite</span>
            </button>
          </div>

          <Button
            class="p-button-secondary p-button-sm p-button-outlined shadow-xs toolbar-icon-btn rounded-3"
            v-tooltip.bottom="'Reload locations'"
            :loading="isLoading"
            aria-label="Reload locations"
            @click="loadData"
          >
            <i v-if="!isLoading" class="pi pi-refresh"></i>
          </Button>
        </div>
      </div>

      <!-- Unplottable rows notice -->
      <div v-if="unmappedRows.length && showUnmappedNote" class="alert alert-warning d-flex align-items-start gap-2 py-2 px-3 mb-0 small rounded-3">
        <i class="pi pi-map-marker mt-1 text-warning"></i>
        <div class="flex-grow-1">
          <strong>{{ unmappedRows.length }} location{{ unmappedRows.length === 1 ? '' : 's' }}</strong> without valid coordinates cannot be plotted on the map:
          <span class="text-body fw-medium">{{ unmappedRows.map(r => r.lcpnap || `record #${r.id}`).slice(0, 5).join(', ') }}{{ unmappedRows.length > 5 ? ` and ${unmappedRows.length - 5} more` : '' }}</span>.
          <router-link to="/lcp-nap-locations/records" class="fw-semibold text-primary text-decoration-underline ms-1">Open records to add pin</router-link>
        </div>
        <button type="button" class="btn-close btn-sm mt-1" aria-label="Dismiss" @click="showUnmappedNote = false"></button>
      </div>

      <!-- Site list + map -->
      <div class="d-flex flex-column flex-md-row gap-3">
        <!-- Site list: every lcpnap, searchable; clicking one flies the map
             to it and opens the same detail drawer a marker click does -->
        <div class="lnm-site-list border rounded-3">
          <div class="lnm-site-list-head">
            <span class="lnm-legend-title p-0">
              <i class="pi pi-list" style="font-size: 0.7rem;"></i>
              Sites
              <span v-if="sites.length" class="lnm-legend-count">{{ listMode === 'group' ? filteredGroups.length : filteredListSites.length }}</span>
            </span>
            <!-- Two views of the same list: every site flat, or the LCP groups
                 with a site counter each -->
            <div class="lnm-group-tabs mt-2">
              <button
                type="button"
                class="lnm-group-tab"
                :class="{ active: listMode === 'all' }"
                @click="listMode = 'all'"
              >
                All
              </button>
              <button
                type="button"
                class="lnm-group-tab"
                :class="{ active: listMode === 'group' }"
                @click="listMode = 'group'"
              >
                Group
              </button>
            </div>
            <div class="position-relative mt-2">
              <i class="pi pi-search lnm-search-icon"></i>
              <input
                v-model="listQuery"
                type="text"
                class="form-control form-control-sm lnm-search-input"
                :placeholder="listMode === 'group' ? 'Search LCP group' : 'Search LCP, NAP, street...'"
                @keydown.esc="listQuery = ''"
              />
              <button
                v-if="listQuery.trim()"
                type="button"
                class="btn btn-sm position-absolute end-0 top-50 translate-middle-y p-1 me-1 text-secondary border-0 bg-transparent shadow-none"
                style="line-height: 1; z-index: 5;"
                @click="listQuery = ''"
                title="Clear search"
              >
                <i class="pi pi-times" style="font-size: 0.65rem;"></i>
              </button>
            </div>
          </div>
          <div class="lnm-site-list-body">
            <!-- All: one row per site -->
            <template v-if="listMode === 'all'">
              <button
                v-for="site in filteredListSites"
                :key="site.key"
                type="button"
                class="lnm-site-item"
                :class="{ active: selectedSite?.key === site.key }"
                @click="selectSite(site, { fly: true })"
              >
                <span class="lnm-color-dot" :style="{ background: site.color }"></span>
                <span class="text-truncate">{{ site.name }}</span>
                <i v-if="selectedSite?.key === site.key" class="pi pi-map-marker ms-auto" style="font-size: 0.65rem;"></i>
              </button>
              <div v-if="!filteredListSites.length" class="small text-secondary text-center py-3 px-2">
                {{ sites.length ? `No site matches "${listQuery.trim()}"` : 'No sites yet' }}
              </div>
            </template>

            <!-- Group: one row per LCP, counter on the right; clicking zooms
                 the map to that group's spread -->
            <template v-else>
              <button
                v-for="group in filteredGroups"
                :key="group.name"
                type="button"
                class="lnm-site-item"
                :title="`Zoom to ${group.name}`"
                @click="zoomToGroup(group)"
              >
                <span class="lnm-color-dot" :style="{ background: group.color }"></span>
                <span class="text-truncate">{{ group.name }}</span>
                <span class="lnm-legend-count ms-auto">{{ group.count }}</span>
              </button>
              <div v-if="!filteredGroups.length" class="small text-secondary text-center py-3 px-2">
                {{ sites.length ? `No group matches "${listQuery.trim()}"` : 'No sites yet' }}
              </div>
            </template>
          </div>
        </div>

        <!-- Map area -->
        <div class="position-relative lnm-map-shell rounded-3 overflow-hidden flex-grow-1">
          <div ref="mapContainer" class="lnm-map"></div>

        <!-- Loading overlay -->
        <div v-if="isLoading" class="lnm-overlay">
          <div class="spinner-border text-primary" role="status" style="width: 2rem; height: 2rem;"></div>
          <div class="small text-secondary mt-2">Loading locations…</div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="lnm-overlay">
          <i class="pi pi-exclamation-triangle text-warning fs-3"></i>
          <div class="small text-secondary mt-2 text-center px-4">{{ error }}</div>
          <button type="button" class="btn btn-sm btn-primary mt-3" @click="loadData">Try again</button>
        </div>

        <!-- Empty state -->
        <div v-else-if="!sites.length" class="lnm-overlay">
          <i class="pi pi-map-marker text-secondary fs-3"></i>
          <div class="small text-secondary mt-2 text-center px-4">
            No sites have coordinates yet. Add a location record with coordinates to see it plotted here.
          </div>
        </div>

        <!-- Site detail drawer -->
        <transition name="lnm-drawer">
          <div v-if="selectedSite" class="lnm-drawer shadow">
            <div class="d-flex align-items-start justify-content-between gap-2 mb-1">
              <div>
                <div class="fw-bold text-body lh-sm">{{ selectedSite.name }}</div>
                <div class="small text-secondary">
                  {{ [selectedSite.street, selectedSite.barangay ? `Brgy. ${selectedSite.barangay}` : '', selectedSite.city, selectedSite.region].filter(Boolean).join(', ') || 'No address on record' }}
                </div>
              </div>
              <button type="button" class="btn-close" aria-label="Close details" @click="clearSelection"></button>
            </div>

            <!-- Linked master records: the ids future create / edit flows write against -->
            <div class="d-flex flex-column gap-2 my-3">
              <div class="lnm-link-row">
                <span class="lnm-color-dot" :style="{ background: selectedSite.color }"></span>
                <span class="fw-semibold">{{ selectedSite.lcp || 'No LCP' }}</span>
                <span v-if="selectedSite.lcpRecord" class="badge rounded-pill bg-success bg-opacity-10 text-success ms-auto" :title="selectedSite.lcpRecord.description || ''">
                  <i class="pi pi-link me-1" style="font-size: 0.6rem;"></i>LCP record #{{ selectedSite.lcpRecord.id }}
                </span>
                <span v-else class="badge rounded-pill bg-warning bg-opacity-10 text-warning ms-auto" title="No row with this name exists in the LCP master list">
                  not in LCP list
                </span>
              </div>
              <div class="lnm-link-row">
                <i class="pi pi-box text-secondary" style="font-size: 0.75rem;"></i>
                <span class="fw-semibold">{{ selectedSite.nap || 'No NAP' }}</span>
                <span v-if="selectedSite.napRecord" class="badge rounded-pill bg-success bg-opacity-10 text-success ms-auto" :title="selectedSite.napRecord.description || ''">
                  <i class="pi pi-link me-1" style="font-size: 0.6rem;"></i>NAP record #{{ selectedSite.napRecord.id }}
                </span>
                <span v-else class="badge rounded-pill bg-warning bg-opacity-10 text-warning ms-auto" title="No row with this name exists in the NAP master list">
                  not in NAP list
                </span>
              </div>
            </div>

            <!-- Capacity -->
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="lnm-stat-chip"><i class="pi pi-share-alt"></i>{{ selectedSite.portTotal ?? '—' }} ports</span>
              <span class="lnm-stat-chip text-lowercase"><i class="pi pi-compass"></i>{{ selectedSite.lat.toFixed(6) }}, {{ selectedSite.lng.toFixed(6) }}</span>
            </div>

            <!-- Photos -->
            <div v-if="selectedSite.photos.length" class="mb-3">
              <div class="small fw-semibold text-secondary mb-1">Site photos</div>
              <div class="d-flex flex-wrap gap-2">
                <template v-for="photo in selectedSite.photos" :key="photo.label">
                  <a v-if="photo.url" :href="photo.url" target="_blank" rel="noopener" class="lnm-photo" :title="photo.label">
                    <img :src="photo.url" :alt="photo.label" loading="lazy" />
                  </a>
                  <span v-else class="lnm-photo-ref" :title="photo.path">
                    <i class="pi pi-image" style="font-size: 0.7rem;"></i>{{ photo.label }}
                  </span>
                </template>
              </div>
            </div>

            <!-- Audit -->
            <div class="small text-secondary mb-3">
              <i class="pi pi-history me-1" style="font-size: 0.7rem;"></i>
              Updated {{ formatDate(selectedSite.modifiedDate) }}<span v-if="selectedSite.modifiedBy"> by {{ selectedSite.modifiedBy }}</span>
            </div>

            <div class="d-flex flex-column gap-2">
              <div class="d-flex gap-2">
                <a
                  class="btn btn-sm btn-primary rounded-3 d-inline-flex align-items-center gap-1.5 flex-grow-1 justify-content-center shadow-xs fw-semibold"
                  :href="`https://www.google.com/maps/dir/?api=1&destination=${selectedSite.lat},${selectedSite.lng}`"
                  target="_blank"
                  rel="noopener"
                >
                  <i class="pi pi-directions" style="font-size: 0.8rem;"></i>
                  <span>Open in Google Maps</span>
                </a>
                <button
                  type="button"
                  class="btn btn-sm btn-light border text-secondary bg-body-tertiary rounded-3 shadow-xs d-inline-flex align-items-center justify-content-center px-2.5"
                  :title="copied ? 'Copied' : 'Copy coordinates'"
                  @click="copyCoordinates"
                >
                  <i :class="copied ? 'pi pi-check text-success' : 'pi pi-copy'" style="font-size: 0.8rem;"></i>
                </button>
              </div>
              <router-link
                :to="{ path: '/lcp-nap-locations/records', query: { search: selectedSite.name } }"
                class="btn btn-sm btn-outline-secondary rounded-3 d-inline-flex align-items-center justify-content-center gap-1.5 shadow-xs text-decoration-none fw-medium"
              >
                <i class="pi pi-table" style="font-size: 0.75rem;"></i>
                <span>View Record in Table</span>
              </router-link>
            </div>
          </div>
        </transition>
        </div>
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

const mapContainer = ref(null)
const isLoading = ref(true)
const error = ref(null)
const sites = ref([])
const unmappedRows = ref([])
const showUnmappedNote = ref(true)
const selectedSite = ref(null)
const baseLayerMode = ref('street')
const copied = ref(false)

let map = null
let clusterGroup = null
let activeBaseLayer = null
let resizeObserver = null
const markersByKey = new Map()

// Binangonan, Rizal — the network's home turf; only shown before data arrives
const FALLBACK_CENTER = [14.4655, 121.1922]

// ---------------------------------------------------------------------------
// Base layers. All keyless: Carto for street (light + dark variants so the map
// follows the console theme), Esri World Imagery for the satellite view field
// techs use to find an actual pole or wall.
// ---------------------------------------------------------------------------
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
      attribution: 'Imagery &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
    }
  }
}

const resolveTileLayer = () => {
  if (baseLayerMode.value === 'satellite') return TILE_LAYERS.satellite
  return isDark.value ? TILE_LAYERS.streetDark : TILE_LAYERS.streetLight
}

const applyBaseLayer = () => {
  if (!map) return
  const def = resolveTileLayer()
  if (activeBaseLayer) map.removeLayer(activeBaseLayer)
  activeBaseLayer = L.tileLayer(def.url, def.options).addTo(map)
}

const setBaseLayer = (mode) => {
  baseLayerMode.value = mode
  applyBaseLayer()
}

watch(isDark, () => applyBaseLayer())

// ---------------------------------------------------------------------------
// Marker identity: each LCP gets a stable hue so every NAP hanging off the same
// cabinet reads as one family at a glance. Golden-angle spacing keeps ~250 LCPs
// visually distinct without a lookup table.
// ---------------------------------------------------------------------------
const lcpHue = (lcpName) => {
  const digits = String(lcpName || '').replace(/\D/g, '')
  let seed = digits ? Number(digits) : 0
  if (!seed) {
    for (const ch of String(lcpName || '')) seed = (seed * 31 + ch.charCodeAt(0)) % 100000
  }
  return Math.round((seed * 137.508) % 360)
}
const lcpColor = (lcpName) => `hsl(${lcpHue(lcpName)}, 62%, 44%)`

const napShortLabel = (napName) => {
  const digits = String(napName || '').replace(/\D/g, '')
  return digits ? String(Number(digits)) : '?'
}

const siteIcon = (site, selected = false) => L.divIcon({
  className: 'lnm-marker-wrap',
  html: `
    <div class="lnm-marker${selected ? ' lnm-marker-selected' : ''}" style="--mk:${site.color}">
      <span class="lnm-marker-chip">${napShortLabel(site.nap)}</span>
      <span class="lnm-marker-tip"></span>
    </div>`,
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  tooltipAnchor: [0, -40]
})

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const normalizeName = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')

const buildPhotos = (row) => {
  const entries = [
    { label: 'Enclosure', path: row.image },
    { label: 'Enclosure 2', path: row.image2 },
    { label: 'Reading', path: row.readingImage }
  ]
  return entries
    .filter(e => e.path && String(e.path).trim())
    .map(e => ({
      ...e,
      // Only absolute URLs are renderable; bare storage paths (SharePoint-style
      // attachment references) are shown as labeled references instead of
      // broken <img> tags.
      url: /^(https?:\/\/|data:)/i.test(String(e.path).trim()) ? String(e.path).trim() : null
    }))
}

const loadData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const [locations, lcps, naps] = await Promise.all([
      LcpNapLocationService.getLocations(),
      LcpNapLocationService.getLcps().catch(() => []),
      LcpNapLocationService.getNaps().catch(() => [])
    ])

    const lcpByName = new Map((Array.isArray(lcps) ? lcps : []).map(r => [normalizeName(r.name), r]))
    const napByName = new Map((Array.isArray(naps) ? naps : []).map(r => [normalizeName(r.name), r]))

    const rows = Array.isArray(locations) ? locations : []
    const mapped = []
    const unmapped = []

    rows.forEach(row => {
      const coords = parseCoordinates(row.coordinates)
      if (!coords) {
        unmapped.push(row)
        return
      }
      mapped.push({
        key: `loc-${row.id}`,
        id: row.id,
        name: row.lcpnap || `${row.lcp || ''} ${row.nap || ''}`.trim() || `Location #${row.id}`,
        lcp: row.lcp || '',
        nap: row.nap || '',
        lcpRecord: lcpByName.get(normalizeName(row.lcp)) || null,
        napRecord: napByName.get(normalizeName(row.nap)) || null,
        portTotal: row.portTotal ?? null,
        lat: coords.lat,
        lng: coords.lng,
        street: row.street || '',
        barangay: row.barangay || '',
        city: row.city || '',
        region: row.region || '',
        modifiedBy: row.modifiedBy || row.userEmail || '',
        modifiedDate: row.modifiedDate || null,
        photos: buildPhotos(row),
        color: lcpColor(row.lcp)
      })
    })

    sites.value = mapped
    unmappedRows.value = unmapped
    showUnmappedNote.value = unmapped.length > 0
    selectedSite.value = null
    renderMarkers()
  } catch (err) {
    error.value = err?.message || 'Could not load LCP NAP locations. Check the connection and try again.'
    sites.value = []
    unmappedRows.value = []
  } finally {
    isLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------
const totalPorts = computed(() => sites.value.reduce((sum, s) => sum + (Number(s.portTotal) || 0), 0))

const lcpGroups = computed(() => {
  const groups = new Map()
  sites.value.forEach(site => {
    const name = site.lcp || 'Ungrouped'
    if (!groups.has(name)) groups.set(name, { name, color: site.color, count: 0, sites: [] })
    const g = groups.get(name)
    g.count += 1
    g.sites.push(site)
  })
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
})

const listQuery = ref('')
const listMode = ref('all') // 'all' = every site | 'group' = LCP groups with counts

const filteredListSites = computed(() => {
  const q = listQuery.value.trim().toLowerCase()
  const list = q
    ? sites.value.filter(s => [s.name, s.lcp, s.nap, s.street, s.barangay, s.city, s.region].some(v => String(v || '').toLowerCase().includes(q)))
    : sites.value
  return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }))
})

const filteredGroups = computed(() => {
  const q = listQuery.value.trim().toLowerCase()
  if (!q) return lcpGroups.value
  return lcpGroups.value.filter(g => String(g.name).toLowerCase().includes(q))
})

// ---------------------------------------------------------------------------
// Map lifecycle
// ---------------------------------------------------------------------------
const renderMarkers = () => {
  if (!map || !clusterGroup) return
  clusterGroup.clearLayers()
  markersByKey.clear()

  sites.value.forEach(site => {
    const marker = L.marker([site.lat, site.lng], { icon: siteIcon(site) })
    marker.bindTooltip(
      `<strong>${site.name}</strong>${site.portTotal != null ? ` · ${site.portTotal} ports` : ''}`,
      { direction: 'top', opacity: 0.95 }
    )
    marker.on('click', () => selectSite(site))
    markersByKey.set(site.key, marker)
    clusterGroup.addLayer(marker)
  })

  if (sites.value.length) {
    const bounds = L.latLngBounds(sites.value.map(s => [s.lat, s.lng]))
    map.fitBounds(bounds.pad(0.25), { maxZoom: 17 })
  }
}

const refreshMarkerIcons = () => {
  markersByKey.forEach((marker, key) => {
    const site = sites.value.find(s => s.key === key)
    if (site) marker.setIcon(siteIcon(site, selectedSite.value?.key === key))
  })
}

const selectSite = (site, { fly = false } = {}) => {
  selectedSite.value = site
  copied.value = false
  refreshMarkerIcons()
  if (map) {
    if (fly) {
      map.flyTo([site.lat, site.lng], Math.max(map.getZoom(), 17), { duration: 0.8 })
    } else {
      map.panTo([site.lat, site.lng])
    }
  }
}

const clearSelection = () => {
  selectedSite.value = null
  refreshMarkerIcons()
}

const zoomToGroup = (group) => {
  if (!map || !group.sites.length) return
  clearSelection()
  const bounds = L.latLngBounds(group.sites.map(s => [s.lat, s.lng]))
  map.fitBounds(bounds.pad(0.4), { maxZoom: 17 })
}

const copyCoordinates = async () => {
  if (!selectedSite.value) return
  try {
    await navigator.clipboard.writeText(`${selectedSite.value.lat}, ${selectedSite.value.lng}`)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1600)
  } catch {
    copied.value = false
  }
}

const formatDate = (value) => {
  if (!value) return 'unknown date'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

onMounted(() => {
  map = L.map(mapContainer.value, {
    center: FALLBACK_CENTER,
    zoom: 13,
    zoomControl: true,
    attributionControl: true
  })
  map.zoomControl.setPosition('topright')
  applyBaseLayer()

  clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    maxClusterRadius: 48,
    // Uniform cluster color regardless of the LCP hues inside — counts read
    // instantly and the per-LCP colors stay meaningful on the leaf markers
    iconCreateFunction: (cluster) => L.divIcon({
      className: 'lnm-cluster-wrap',
      html: `<div class="lnm-cluster">${cluster.getChildCount()}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  })
  map.addLayer(clusterGroup)

  resizeObserver = new ResizeObserver(() => map && map.invalidateSize())
  resizeObserver.observe(mapContainer.value)

  loadData()
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.lnm-map-shell {
  height: clamp(480px, calc(100vh - 320px), 900px);
  background: var(--bs-tertiary-bg);
}

.lnm-site-list {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: clamp(480px, calc(100vh - 320px), 900px);
  background: var(--bs-body-bg);
  overflow: hidden;
}
@media (max-width: 767.98px) {
  .lnm-site-list {
    width: 100%;
    height: 220px;
  }
}
.lnm-site-list-head {
  padding: 0.6rem 0.7rem 0.5rem;
  border-bottom: 1px solid var(--bs-border-color);
}
.lnm-group-tabs {
  display: flex;
  gap: 0.3rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
  scrollbar-width: thin;
}
.lnm-group-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 999px;
  background: var(--bs-tertiary-bg);
  color: var(--bs-secondary-color);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.15s ease-in-out;
}
.lnm-group-tab:hover {
  border-color: var(--bs-primary-border-subtle, #fdcfd3);
  color: var(--bs-primary, #e74c5a);
}
.lnm-group-tab.active {
  background: var(--bs-primary, #e74c5a);
  border-color: var(--bs-primary, #e74c5a);
  color: #fff;
}
.lnm-group-tab.active .lnm-color-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}
.lnm-site-list-head .lnm-legend-title {
  padding: 0;
}
.lnm-site-list-body {
  overflow-y: auto;
  padding: 0.35rem;
  flex-grow: 1;
}
.lnm-site-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 0.8rem;
  text-align: left;
}
.lnm-site-item:hover {
  background: var(--bs-tertiary-bg);
}
.lnm-site-item.active {
  background: var(--bs-primary, #e74c5a);
  color: #fff;
}
.lnm-site-item.active .lnm-color-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.lnm-map {
  position: absolute;
  inset: 0;
}

.lnm-overlay {
  position: absolute;
  inset: 0;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--bs-body-bg) 78%, transparent);
  backdrop-filter: blur(2px);
}

.lnm-stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  color: var(--bs-secondary-color);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}
.lnm-stat-chip .pi {
  font-size: 0.7rem;
  color: var(--bs-primary);
}

.lnm-search-wrap {
  min-width: 260px;
  max-width: 340px;
  flex: 1 1 260px;
}
.lnm-search-icon {
  position: absolute;
  left: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  pointer-events: none;
}
.lnm-search-input {
  padding-left: 2rem;
  border-radius: 8px;
}

.lnm-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--bs-body-bg) 80%, transparent);
}

.lnm-legend-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--bs-secondary-color);
}
.lnm-legend-count {
  margin-left: auto;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--bs-secondary-color);
  background: var(--bs-tertiary-bg);
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
}

.lnm-drawer {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 1045;
  width: min(330px, calc(100% - 24px));
  overflow-y: auto;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 14px;
  padding: 1rem;
}
.lnm-drawer-enter-active,
.lnm-drawer-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.lnm-drawer-enter-from,
.lnm-drawer-leave-to {
  transform: translateX(24px);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .lnm-drawer-enter-active,
  .lnm-drawer-leave-active {
    transition: none;
  }
}

.lnm-link-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 10px;
  font-size: 0.82rem;
}

.lnm-photo {
  display: block;
  width: 84px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--bs-border-color);
}
.lnm-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lnm-photo-ref {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  border: 1px dashed var(--bs-border-color);
  color: var(--bs-secondary-color);
  font-size: 0.72rem;
  max-width: 100%;
}
</style>

<!-- Leaflet renders marker HTML outside this component's scope, so marker and
     cluster styling has to be global. Everything is prefixed lnm- to stay
     contained to this view's markers. -->
<style>
.lnm-marker-wrap,
.lnm-cluster-wrap {
  background: transparent;
  border: 0;
}

.lnm-marker {
  position: relative;
  width: 34px;
  height: 42px;
  display: flex;
  justify-content: center;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
  transition: transform 0.15s ease;
  transform-origin: bottom center;
}
.lnm-marker:hover {
  transform: scale(1.12);
}
.lnm-marker-selected {
  transform: scale(1.18);
}
.lnm-marker-selected .lnm-marker-chip {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mk) 35%, transparent);
}

/* The signature mark: a NAP enclosure chip — rounded box, LCP family color,
   NAP number inside — instead of an anonymous teardrop pin. */
.lnm-marker-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 30px;
  border-radius: 9px;
  background: var(--mk);
  border: 2px solid #fff;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  user-select: none;
}
.lnm-marker-tip {
  position: absolute;
  bottom: 4px;
  width: 10px;
  height: 10px;
  background: var(--mk);
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg);
}

.lnm-cluster {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bs-primary, #e74c5a);
  border: 2px solid #fff;
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 0 0 6px color-mix(in srgb, var(--bs-primary, #e74c5a) 25%, transparent);
}

[data-bs-theme='dark'] .lnm-marker-chip,
[data-bs-theme='dark'] .lnm-marker-tip,
[data-bs-theme='dark'] .lnm-cluster {
  border-color: #d8dbe0;
}

/* Leaflet controls follow the console theme */
[data-bs-theme='dark'] .leaflet-control-zoom a {
  background: #2b2f36;
  color: #d8dbe0;
  border-color: #3a3f47;
}
[data-bs-theme='dark'] .leaflet-control-attribution {
  background: rgba(30, 33, 38, 0.8);
  color: #9aa0a8;
}
[data-bs-theme='dark'] .leaflet-control-attribution a {
  color: #c2c7cf;
}
</style>
