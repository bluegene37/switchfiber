<template>
  <div class="position-relative rounded-3 overflow-hidden border cpk-shell" :style="{ height }">
    <div ref="mapContainer" class="cpk-map"></div>

    <!-- Place & Coordinate Search Bar -->
    <div v-if="!readonly" class="cpk-search">
      <div class="position-relative">
        <i :class="searching ? 'pi pi-spinner pi-spin' : 'pi pi-search'" class="cpk-search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control form-control-sm cpk-search-input shadow-sm"
          placeholder="Search place, street, or paste coordinates..."
          @keydown.enter.prevent="pickFirstResult"
          @keydown.esc="searchResults = []"
        />
        <button
          v-if="searchQuery.trim()"
          type="button"
          class="btn btn-sm position-absolute end-0 top-50 translate-middle-y p-1 me-1 text-secondary border-0 bg-transparent shadow-none"
          style="line-height: 1; z-index: 5;"
          @click="searchQuery = ''; searchResults = []"
          title="Clear search"
        >
          <i class="pi pi-times" style="font-size: 0.65rem;"></i>
        </button>
      </div>

      <!-- Quick Territory Jump Chips -->
      <div v-if="!searchQuery && !hasPin" class="cpk-territory-chips mt-1.5 d-none d-sm-flex align-items-center gap-1 overflow-x-auto pb-1">
        <button
          v-for="chip in TERRITORY_CHIPS"
          :key="chip.name"
          type="button"
          class="btn btn-xs cpk-chip"
          @click="jumpToTerritory(chip)"
        >
          {{ chip.name }}
        </button>
      </div>

      <!-- Search Results Dropdown -->
      <div v-if="searchResults.length" class="cpk-search-results shadow-lg">
        <button
          v-for="(result, i) in searchResults"
          :key="i"
          type="button"
          class="cpk-search-result"
          @click="pickResult(result)"
        >
          <div class="cpk-res-icon d-flex align-items-center justify-content-center rounded-circle flex-shrink-0">
            <i class="pi pi-map-marker" style="font-size: 0.7rem;"></i>
          </div>
          <div class="overflow-hidden">
            <div class="fw-semibold text-body text-truncate small lh-sm">{{ result.title || result.label }}</div>
            <div class="text-secondary text-truncate small" style="font-size: 0.7rem;">{{ result.subtitle || result.label }}</div>
          </div>
        </button>
      </div>
      <div v-else-if="searchQuery.trim().length >= 3 && searchSettled && !searching" class="cpk-search-results shadow">
        <div class="cpk-search-result text-secondary small py-2 px-3" style="cursor: default;">
          <i class="pi pi-info-circle me-1"></i> No places found. Try typing a street or municipality name.
        </div>
      </div>
    </div>

    <!-- Map Tool Controls (Layer, Locate, Recenter) -->
    <div class="cpk-controls">
      <button
        type="button"
        class="btn btn-sm rounded-3 shadow-xs d-inline-flex align-items-center justify-content-center cpk-ctrl-btn"
        :class="satellite ? 'btn-primary text-white shadow-xs' : 'btn-light border text-secondary bg-body'"
        :title="satellite ? 'Switch to Street map' : 'Switch to Satellite'"
        @click.stop="satellite = !satellite"
      >
        <i :class="satellite ? 'pi pi-map' : 'pi pi-globe'" style="font-size: 0.8rem;"></i>
      </button>

      <button
        v-if="!readonly && geolocationAvailable"
        type="button"
        class="btn btn-sm btn-light border text-secondary bg-body rounded-3 shadow-xs d-inline-flex align-items-center justify-content-center cpk-ctrl-btn"
        :disabled="locating"
        title="Pin my current GPS location"
        @click.stop="useMyLocation"
      >
        <i :class="locating ? 'pi pi-spinner pi-spin text-primary' : 'pi pi-crosshairs'" style="font-size: 0.8rem;"></i>
      </button>

      <button
        v-if="hasPin"
        type="button"
        class="btn btn-sm btn-light border text-secondary bg-body rounded-3 shadow-xs d-inline-flex align-items-center justify-content-center cpk-ctrl-btn"
        title="Recenter map on pin"
        @click.stop="recenterPin"
      >
        <i class="pi pi-compass" style="font-size: 0.8rem;"></i>
      </button>
    </div>

    <!-- Pinned Location Bottom Toolbar -->
    <div v-if="hasPin" class="cpk-pin-bar shadow-sm d-flex align-items-center justify-content-between gap-2">
      <div class="d-flex align-items-center gap-1.5 overflow-hidden">
        <span class="cpk-pin-indicator rounded-circle flex-shrink-0"></span>
        <span class="font-monospace small fw-semibold text-body text-truncate">
          {{ parsed.lat.toFixed(6) }}, {{ parsed.lng.toFixed(6) }}
        </span>
      </div>
      <div class="d-flex align-items-center gap-1 flex-shrink-0">
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-xs btn-link text-secondary text-decoration-none p-0 px-1"
          title="Clear pinned location"
          @click="clearPin"
        >
          <i class="pi pi-trash me-0.5" style="font-size: 0.65rem;"></i> Clear
        </button>
      </div>
    </div>

    <!-- Hint until a pin exists -->
    <div v-else-if="!readonly" class="cpk-hint shadow-sm">
      <i class="pi pi-map-marker text-primary me-1" style="font-size: 0.75rem;"></i>
      Click anywhere on map to drop pin — drag marker to adjust
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { parseCoordinates } from '../services/lcpNapLocations'
import { searchPlaces } from '../services/geocoding'
import { useTheme } from '../composables/useTheme'

const props = defineProps({
  // The API's storage format: "lat, lng" as one string
  modelValue: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  height: {
    type: String,
    default: '280px'
  }
})

const emit = defineEmits(['update:modelValue'])

const { isDark } = useTheme()

const mapContainer = ref(null)
const satellite = ref(false)
const locating = ref(false)
const geolocationAvailable = typeof navigator !== 'undefined' && !!navigator.geolocation

// Place search
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const searchSettled = ref(false)
let searchTimer = null
let searchAbort = null

// Binangonan, Rizal default center
const FALLBACK_CENTER = [14.4655, 121.1922]

// Quick territory presets in SwitchFiber coverage
const TERRITORY_CHIPS = [
  { name: 'Binangonan', coords: [14.4655, 121.1922] },
  { name: 'Angono', coords: [14.5255, 121.1568] },
  { name: 'Taytay', coords: [14.5694, 121.1328] },
  { name: 'Cardona', coords: [14.4856, 121.2289] },
  { name: 'Antipolo', coords: [14.5842, 121.1763] }
]

let map = null
let marker = null
let baseLayer = null
let resizeObserver = null

const parsed = computed(() => parseCoordinates(props.modelValue))
const hasPin = computed(() => !!parsed.value)

const TILES = {
  light: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  },
  dark: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    className: 'osm-dark-tiles',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Imagery &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
  }
}

const applyBaseLayer = () => {
  if (!map) return
  const def = satellite.value ? TILES.satellite : (isDark.value ? TILES.dark : TILES.light)
  if (baseLayer) map.removeLayer(baseLayer)
  baseLayer = L.tileLayer(def.url, {
    maxZoom: def.maxZoom,
    className: def.className || '',
    attribution: def.attribution
  }).addTo(map)
}

watch(satellite, applyBaseLayer)
watch(isDark, applyBaseLayer)

const pinIcon = () => L.divIcon({
  className: 'cpk-pin-wrap',
  html: '<div class="cpk-pin"><span class="cpk-pin-head"><i class="pi pi-map-marker"></i></span><span class="cpk-pin-tip"></span></div>',
  iconSize: [34, 42],
  iconAnchor: [17, 40]
})

const emitLatLng = (lat, lng) => {
  emit('update:modelValue', `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
}

const placeMarker = (lat, lng, { pan = false } = {}) => {
  if (!map) return
  if (!marker) {
    marker = L.marker([lat, lng], { icon: pinIcon(), draggable: !props.readonly })
    if (!props.readonly) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        emitLatLng(pos.lat, pos.lng)
      })
    }
    marker.addTo(map)
  } else {
    marker.setLatLng([lat, lng])
  }
  if (pan) map.setView([lat, lng], Math.max(map.getZoom(), 17))
}

const recenterPin = () => {
  if (parsed.value && map) {
    map.setView([parsed.value.lat, parsed.value.lng], Math.max(map.getZoom(), 17), { animate: true })
  }
}

const clearPin = () => {
  if (props.readonly) return
  if (marker && map) {
    map.removeLayer(marker)
    marker = null
  }
  emit('update:modelValue', '')
}

const jumpToTerritory = (chip) => {
  if (!map || !chip?.coords) return
  map.setView(chip.coords, 14, { animate: true })
}

// Keep the pin in sync when the value changes from outside
watch(parsed, (val) => {
  if (!map) return
  if (val) {
    placeMarker(val.lat, val.lng, { pan: true })
  } else if (marker) {
    map.removeLayer(marker)
    marker = null
  }
})

watch(searchQuery, (q) => {
  searchSettled.value = false
  if (searchTimer) clearTimeout(searchTimer)
  if (searchAbort) searchAbort.abort()
  if (String(q || '').trim().length < 2) {
    searchResults.value = []
    searching.value = false
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    searchAbort = new AbortController()
    try {
      searchResults.value = await searchPlaces(q, { signal: searchAbort.signal })
      searchSettled.value = true
    } catch {
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 400)
})

const pickResult = (result) => {
  searchQuery.value = ''
  searchResults.value = []
  placeMarker(result.lat, result.lng, { pan: true })
  emitLatLng(result.lat, result.lng)
}

const pickFirstResult = () => {
  if (searchResults.value.length) pickResult(searchResults.value[0])
}

const useMyLocation = () => {
  if (!geolocationAvailable || props.readonly) return
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      placeMarker(pos.coords.latitude, pos.coords.longitude, { pan: true })
      emitLatLng(pos.coords.latitude, pos.coords.longitude)
    },
    () => {
      locating.value = false
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

onMounted(() => {
  const start = parsed.value ? [parsed.value.lat, parsed.value.lng] : FALLBACK_CENTER
  map = L.map(mapContainer.value, {
    center: start,
    zoom: parsed.value ? 17 : 13,
    minZoom: 4,
    maxZoom: 19,
    attributionControl: true
  })
  map.zoomControl.setPosition('bottomright')
  applyBaseLayer()

  if (parsed.value) placeMarker(parsed.value.lat, parsed.value.lng)

  if (!props.readonly) {
    map.on('click', (e) => {
      placeMarker(e.latlng.lat, e.latlng.lng)
      emitLatLng(e.latlng.lat, e.latlng.lng)
    })
  }

  resizeObserver = new ResizeObserver(() => map && map.invalidateSize())
  resizeObserver.observe(mapContainer.value)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (searchAbort) searchAbort.abort()
  if (resizeObserver) resizeObserver.disconnect()
  if (map) {
    map.remove()
    map = null
    marker = null
  }
})
</script>

<style scoped>
.cpk-shell {
  background: var(--bs-tertiary-bg);
}
.cpk-map {
  position: absolute;
  inset: 0;
}
.cpk-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cpk-ctrl-btn {
  width: 30px;
  height: 30px;
  padding: 0;
}
.cpk-search {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1001;
  width: min(320px, calc(100% - 100px));
}
.cpk-search-icon {
  position: absolute;
  left: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  pointer-events: none;
  z-index: 1;
}
.cpk-search-input {
  padding-left: 2rem;
  padding-right: 1.8rem;
  border-radius: 8px;
  font-size: 0.78rem;
  background: var(--bs-body-bg);
}
.cpk-territory-chips {
  scrollbar-width: none;
}
.cpk-chip {
  padding: 0.15rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bs-body-bg) 92%, transparent);
  border: 1px solid var(--bs-border-color);
  color: var(--bs-secondary-color);
  white-space: nowrap;
  backdrop-filter: blur(4px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.15s ease;
}
.cpk-chip:hover {
  background: var(--bs-primary, #e74c5a);
  border-color: var(--bs-primary, #e74c5a);
  color: #fff;
}
.cpk-search-results {
  margin-top: 4px;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 10px;
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
}
.cpk-search-result {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.45rem 0.65rem;
  border: 0;
  background: transparent;
  color: var(--bs-body-color);
  text-align: left;
  border-bottom: 1px solid var(--bs-border-color-translucent, rgba(0, 0, 0, 0.05));
  transition: background-color 0.12s ease;
}
.cpk-search-result:last-child {
  border-bottom: 0;
}
.cpk-search-result:hover {
  background: var(--bs-tertiary-bg);
}
.cpk-res-icon {
  width: 22px;
  height: 22px;
  background: var(--bs-primary-bg-subtle, #fef2f3);
  color: var(--bs-primary, #e74c5a);
}
.cpk-pin-bar {
  position: absolute;
  left: 10px;
  bottom: 8px;
  z-index: 1000;
  background: color-mix(in srgb, var(--bs-body-bg) 95%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid var(--bs-border-color);
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  max-width: calc(100% - 100px);
}
.cpk-pin-indicator {
  width: 7px;
  height: 7px;
  background: var(--bs-success, #10b981);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
}
.cpk-hint {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  z-index: 1000;
  background: color-mix(in srgb, var(--bs-body-bg) 94%, transparent);
  border: 1px solid var(--bs-border-color);
  border-radius: 999px;
  padding: 0.25rem 0.8rem;
  font-size: 0.72rem;
  color: var(--bs-secondary-color);
  white-space: nowrap;
  pointer-events: none;
  backdrop-filter: blur(6px);
}
.btn-xs {
  padding: 0.1rem 0.4rem;
  font-size: 0.7rem;
}
</style>

<style>
.cpk-pin-wrap {
  background: transparent;
  border: 0;
}
.cpk-pin {
  position: relative;
  width: 34px;
  height: 42px;
  display: flex;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
}
.cpk-pin-head {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 50%;
  background: var(--bs-primary, #e74c5a);
  border: 2px solid #fff;
  color: #fff;
}
.cpk-pin-head .pi {
  font-size: 0.85rem;
}
.cpk-pin-tip {
  position: absolute;
  bottom: 4px;
  width: 10px;
  height: 10px;
  background: var(--bs-primary, #e74c5a);
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg);
}

[data-bs-theme='dark'] .cpk-pin-head,
[data-bs-theme='dark'] .cpk-pin-tip {
  border-color: #d8dbe0;
}

.osm-dark-tiles {
  filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
}
</style>
