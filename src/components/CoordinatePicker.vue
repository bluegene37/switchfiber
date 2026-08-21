<template>
  <div class="position-relative rounded-3 overflow-hidden border cpk-shell" :style="{ height }">
    <div ref="mapContainer" class="cpk-map"></div>

    <!-- Place search -->
    <div v-if="!readonly" class="cpk-search">
      <div class="position-relative">
        <i :class="searching ? 'pi pi-spinner pi-spin' : 'pi pi-search'" class="cpk-search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control form-control-sm cpk-search-input shadow-sm"
          placeholder="Search a place or street"
          @keydown.enter.prevent="pickFirstResult"
          @keydown.esc="searchResults = []"
        />
      </div>
      <div v-if="searchResults.length" class="cpk-search-results shadow">
        <button
          v-for="(result, i) in searchResults"
          :key="i"
          type="button"
          class="cpk-search-result"
          @click="pickResult(result)"
        >
          <i class="pi pi-map-marker" style="font-size: 0.65rem;"></i>
          <span class="text-truncate">{{ result.label }}</span>
        </button>
      </div>
      <div v-else-if="searchQuery.trim().length >= 3 && searchSettled && !searching" class="cpk-search-results shadow">
        <div class="cpk-search-result" style="cursor: default;">No places found — try a wider search</div>
      </div>
    </div>

    <!-- Layer + locate controls -->
    <div class="cpk-controls">
      <button
        type="button"
        class="btn btn-sm rounded-3 shadow-xs d-inline-flex align-items-center justify-content-center"
        :class="satellite ? 'btn-primary text-white' : 'btn-light border text-secondary bg-body'"
        :title="satellite ? 'Switch to street map' : 'Switch to satellite'"
        @click.stop="satellite = !satellite"
      >
        <i :class="satellite ? 'pi pi-map' : 'pi pi-globe'" style="font-size: 0.75rem;"></i>
      </button>
      <button
        v-if="!readonly && geolocationAvailable"
        type="button"
        class="btn btn-sm btn-light border text-secondary bg-body rounded-3 shadow-xs d-inline-flex align-items-center justify-content-center"
        :disabled="locating"
        title="Pin my current location"
        @click.stop="useMyLocation"
      >
        <i :class="locating ? 'pi pi-spinner pi-spin' : 'pi pi-crosshairs'" style="font-size: 0.75rem;"></i>
      </button>
    </div>

    <!-- Hint until a pin exists -->
    <div v-if="!readonly && !hasPin" class="cpk-hint shadow-sm">
      <i class="pi pi-map-marker me-1" style="font-size: 0.7rem;"></i>
      Click the map to drop the pin — drag it to fine-tune
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

// Place search (Nominatim, debounced to stay inside its usage policy)
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const searchSettled = ref(false)
let searchTimer = null
let searchAbort = null

// Binangonan, Rizal — where the plant lives; used only until a pin exists
const FALLBACK_CENTER = [14.4655, 121.1922]

let map = null
let marker = null
let baseLayer = null
let resizeObserver = null

const parsed = computed(() => parseCoordinates(props.modelValue))
const hasPin = computed(() => !!parsed.value)

const TILES = {
  light: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', maxZoom: 20 },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', maxZoom: 20 },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19 }
}

const applyBaseLayer = () => {
  if (!map) return
  const def = satellite.value ? TILES.satellite : (isDark.value ? TILES.dark : TILES.light)
  if (baseLayer) map.removeLayer(baseLayer)
  baseLayer = L.tileLayer(def.url, {
    maxZoom: def.maxZoom,
    attribution: satellite.value
      ? 'Imagery &copy; Esri'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
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

// Keep the pin in sync when the value changes from outside (typed coordinates,
// a different record opened in the same dialog, a form reset)
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
  if (String(q || '').trim().length < 3) {
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
      // Aborted or offline — stale results are worse than none
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 450)
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
      // Denied or unavailable — the map click path still works
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
    attributionControl: true
  })
  // The place search occupies the top-left corner
  map.zoomControl.setPosition('bottomright')
  applyBaseLayer()

  if (parsed.value) placeMarker(parsed.value.lat, parsed.value.lng)

  if (!props.readonly) {
    map.on('click', (e) => {
      placeMarker(e.latlng.lat, e.latlng.lng)
      emitLatLng(e.latlng.lat, e.latlng.lng)
    })
  }

  // Dialogs mount this while animating open at a zero/partial size — refit
  // whenever the container settles
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
.cpk-search {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1001;
  width: min(260px, calc(100% - 100px));
}
.cpk-search-icon {
  position: absolute;
  left: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  color: var(--bs-secondary-color);
  pointer-events: none;
  z-index: 1;
}
.cpk-search-input {
  padding-left: 1.9rem;
  border-radius: 8px;
  font-size: 0.78rem;
}
.cpk-search-results {
  margin-top: 4px;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 10px;
  overflow: hidden;
  max-height: 180px;
  overflow-y: auto;
}
.cpk-search-result {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 0;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 0.74rem;
  text-align: left;
}
.cpk-search-result:hover {
  background: var(--bs-tertiary-bg);
}
.cpk-hint {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  z-index: 1000;
  background: color-mix(in srgb, var(--bs-body-bg) 92%, transparent);
  border: 1px solid var(--bs-border-color);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.72rem;
  color: var(--bs-secondary-color);
  white-space: nowrap;
  pointer-events: none;
}
</style>

<!-- The pin is injected by Leaflet outside this component's scope -->
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
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
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
</style>
