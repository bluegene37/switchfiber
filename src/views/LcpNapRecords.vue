<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">LCP NAP Records</h1>
        <p class="small text-secondary mt-1 mb-0">
          Maintain LCP NAP location records — pin each site on the map to capture its exact coordinates.
        </p>
      </div>
      <router-link to="/lcp-nap-locations/map" class="btn btn-sm btn-light border text-secondary d-inline-flex align-items-center gap-2">
        <i class="pi pi-map" style="font-size: 0.8rem;"></i>View on map
      </router-link>
    </div>

    <!-- Table card -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 d-flex flex-column gap-3">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <div class="position-relative" style="min-width: 240px;">
          <i class="pi pi-search position-absolute" style="left: 0.65rem; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--bs-secondary-color);"></i>
          <input
            v-model="globalSearch"
            type="text"
            class="form-control form-control-sm"
            style="padding-left: 2rem; border-radius: 8px;"
            placeholder="Search records"
          />
        </div>
        <button
          type="button"
          class="btn btn-sm btn-light border text-secondary ms-auto"
          :disabled="isLoading"
          title="Reload records"
          @click="loadData"
        >
          <i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }" style="font-size: 0.8rem;"></i>
        </button>
        <button type="button" class="btn btn-sm btn-primary d-inline-flex align-items-center gap-2" @click="openCreate">
          <i class="pi pi-plus" style="font-size: 0.8rem;"></i>Create Location
        </button>
      </div>

      <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-0 small rounded-3">
        <i class="pi pi-exclamation-triangle"></i>
        <span class="flex-grow-1">{{ error }}</span>
        <button type="button" class="btn btn-sm btn-outline-danger" @click="loadData">Try again</button>
      </div>

      <DataTable
        :value="filteredRecords"
        :loading="isLoading"
        dataKey="id"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        sortField="lcpnap"
        :sortOrder="1"
        size="small"
        stripedRows
        class="lnr-table"
      >
        <template #empty>
          <div class="text-center text-secondary small py-4">
            <i class="pi pi-inbox d-block mb-2 fs-4"></i>
            {{ globalSearch.trim() ? 'No records match your search.' : 'No location records yet — create the first one to put it on the map.' }}
          </div>
        </template>

        <Column field="lcpnap" header="LCP NAP" sortable>
          <template #body="{ data }">
            <span class="fw-semibold">{{ data.lcpnap || '—' }}</span>
          </template>
        </Column>
        <Column field="lcp" header="LCP" sortable>
          <template #body="{ data }">
            <span class="d-inline-flex align-items-center gap-2">
              <span class="lnm-color-dot" :style="{ background: lcpColor(data.lcp) }"></span>
              {{ data.lcp || '—' }}
            </span>
          </template>
        </Column>
        <Column field="nap" header="NAP" sortable />
        <Column field="portTotal" header="Ports" sortable style="width: 80px;" />
        <Column field="coordinates" header="Coordinates">
          <template #body="{ data }">
            <span v-if="parseCoordinates(data.coordinates)" class="badge rounded-pill bg-success bg-opacity-10 text-success">
              <i class="pi pi-map-marker me-1" style="font-size: 0.6rem;"></i>{{ data.coordinates }}
            </span>
            <span v-else class="badge rounded-pill bg-warning bg-opacity-10 text-warning" title="This record cannot be plotted until it has valid coordinates">
              <i class="pi pi-exclamation-triangle me-1" style="font-size: 0.6rem;"></i>no valid pin
            </span>
          </template>
        </Column>
        <Column field="street" header="Street" sortable />
        <Column field="barangay" header="Barangay" sortable />
        <Column field="city" header="City" sortable />
        <Column field="modifiedDate" header="Modified" sortable>
          <template #body="{ data }">
            <span class="small text-secondary">{{ formatDate(data.modifiedDate) }}</span>
          </template>
        </Column>
        <Column header="" style="width: 130px;">
          <template #body="{ data }">
            <div class="d-flex gap-1 justify-content-end">
              <button type="button" class="btn btn-sm btn-light border text-secondary" title="View" @click="openView(data)">
                <i class="pi pi-eye" style="font-size: 0.75rem;"></i>
              </button>
              <button type="button" class="btn btn-sm btn-light border text-secondary" title="Edit" @click="openEdit(data)">
                <i class="pi pi-pencil" style="font-size: 0.75rem;"></i>
              </button>
              <button type="button" class="btn btn-sm btn-light border text-danger" title="Delete" @click="openDelete(data)">
                <i class="pi pi-trash" style="font-size: 0.75rem;"></i>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- View dialog -->
    <Dialog v-model:visible="viewVisible" modal :header="viewRecord?.lcpnap || 'Location'" :style="{ width: 'min(920px, 96vw)' }">
      <div v-if="viewRecord" class="d-flex flex-column gap-3">
        <CoordinatePicker v-if="parseCoordinates(viewRecord.coordinates)" :model-value="viewRecord.coordinates" readonly height="420px" />
        <div v-else class="alert alert-warning small py-2 px-3 mb-0 rounded-3">
          <i class="pi pi-exclamation-triangle me-1"></i>
          This record has no valid coordinates, so it cannot be shown on the map. Edit it and drop a pin.
        </div>

        <div class="d-flex flex-column gap-2">
          <div class="lnr-link-row">
            <span class="lnm-color-dot" :style="{ background: lcpColor(viewRecord.lcp) }"></span>
            <span class="fw-semibold">{{ viewRecord.lcp || 'No LCP' }}</span>
            <span v-if="linkedLcp(viewRecord)" class="badge rounded-pill bg-success bg-opacity-10 text-success ms-auto" :title="linkedLcp(viewRecord).description || ''">
              <i class="pi pi-link me-1" style="font-size: 0.6rem;"></i>LCP record #{{ linkedLcp(viewRecord).id }}
            </span>
            <span v-else class="badge rounded-pill bg-warning bg-opacity-10 text-warning ms-auto">not in LCP list</span>
          </div>
          <div class="lnr-link-row">
            <i class="pi pi-box text-secondary" style="font-size: 0.75rem;"></i>
            <span class="fw-semibold">{{ viewRecord.nap || 'No NAP' }}</span>
            <span v-if="linkedNap(viewRecord)" class="badge rounded-pill bg-success bg-opacity-10 text-success ms-auto" :title="linkedNap(viewRecord).description || ''">
              <i class="pi pi-link me-1" style="font-size: 0.6rem;"></i>NAP record #{{ linkedNap(viewRecord).id }}
            </span>
            <span v-else class="badge rounded-pill bg-warning bg-opacity-10 text-warning ms-auto">not in NAP list</span>
          </div>
        </div>

        <div class="row g-2 small">
          <div class="col-6 col-md-2"><span class="text-secondary d-block">Ports</span><span class="fw-semibold">{{ viewRecord.portTotal ?? '—' }}</span></div>
          <div class="col-6 col-md-3"><span class="text-secondary d-block">Street</span><span class="fw-semibold">{{ viewRecord.street || '—' }}</span></div>
          <div class="col-6 col-md-2"><span class="text-secondary d-block">Barangay</span><span class="fw-semibold">{{ viewRecord.barangay || '—' }}</span></div>
          <div class="col-6 col-md-2"><span class="text-secondary d-block">City / Region</span><span class="fw-semibold">{{ [viewRecord.city, viewRecord.region].filter(Boolean).join(', ') || '—' }}</span></div>
          <div class="col-12 col-md-3"><span class="text-secondary d-block">Email</span><span class="fw-semibold">{{ viewRecord.userEmail || '—' }}</span></div>
        </div>

        <div v-if="photoRefs(viewRecord).length" class="small">
          <span class="text-secondary d-block mb-1">Site photos</span>
          <div class="d-flex flex-wrap gap-2">
            <template v-for="photo in photoRefs(viewRecord)" :key="photo.label">
              <a v-if="photo.url" :href="photo.url" target="_blank" rel="noopener" class="lnr-photo" :title="photo.label">
                <img :src="photo.url" :alt="photo.label" loading="lazy" />
              </a>
              <span v-else class="lnr-photo-ref" :title="photo.path">
                <i class="pi pi-image" style="font-size: 0.7rem;"></i>{{ photo.label }}
              </span>
            </template>
          </div>
        </div>

        <div class="small text-secondary">
          <i class="pi pi-history me-1" style="font-size: 0.7rem;"></i>
          Updated {{ formatDate(viewRecord.modifiedDate) }}<span v-if="viewRecord.modifiedBy"> by {{ viewRecord.modifiedBy }}</span>
        </div>
      </div>
      <template #footer>
        <a
          v-if="viewRecord && parseCoordinates(viewRecord.coordinates)"
          class="btn btn-sm btn-light border text-secondary d-inline-flex align-items-center gap-1"
          :href="`https://www.google.com/maps/dir/?api=1&destination=${viewRecord.coordinates.replace(/\s/g, '')}`"
          target="_blank"
          rel="noopener"
        >
          <i class="pi pi-directions" style="font-size: 0.8rem;"></i>Google Maps
        </a>
        <button type="button" class="btn btn-sm btn-primary" @click="viewVisible = false; openEdit(viewRecord)">
          <i class="pi pi-pencil me-1" style="font-size: 0.75rem;"></i>Edit
        </button>
      </template>
    </Dialog>

    <!-- Create / Edit dialog -->
    <Dialog
      v-model:visible="formVisible"
      modal
      :header="editingId ? `Edit ${form.lcpnap || 'location'}` : 'Create Location'"
      :style="{ width: 'min(1080px, 97vw)' }"
      :closable="!saving"
    >
      <div class="row g-3">
        <!-- Left: fields -->
        <div class="col-12 col-md-4 d-flex flex-column gap-3">
          <div>
            <label class="form-label small fw-semibold mb-1">LCP <span class="text-danger">*</span></label>
            <Select
              v-model="form.lcp"
              :options="lcpOptions"
              filter
              placeholder="Select LCP"
              class="w-100"
              size="small"
            />
            <div class="form-text small">Linked to the LCP master list ({{ lcpMaster.length }} records).</div>
          </div>
          <div>
            <label class="form-label small fw-semibold mb-1">NAP <span class="text-danger">*</span></label>
            <Select
              v-model="form.nap"
              :options="napOptions"
              filter
              placeholder="Select NAP"
              class="w-100"
              size="small"
            />
            <div class="form-text small">Linked to the NAP master list ({{ napMaster.length }} records).</div>
          </div>
          <div>
            <label class="form-label small fw-semibold mb-1">Port total <span class="text-danger">*</span></label>
            <InputNumber v-model="form.portTotal" :min="0" :max="512" showButtons class="w-100" size="small" />
          </div>

          <!-- Address: Region → City/Town → Barangay → Street. Auto-filled from
               the map pin; anything can still be corrected by hand. -->
          <div class="d-flex align-items-center justify-content-between">
            <span class="small fw-semibold text-secondary text-uppercase" style="letter-spacing: 0.05em; font-size: 0.68rem;">Address</span>
            <span v-if="geocoding" class="small text-secondary d-inline-flex align-items-center gap-1">
              <i class="pi pi-spinner pi-spin" style="font-size: 0.65rem;"></i>reading address from pin…
            </span>
          </div>
          <div>
            <label class="form-label small fw-semibold mb-1">Region</label>
            <Select
              v-model="form.region"
              :options="regionOptions"
              placeholder="Select region"
              class="w-100"
              size="small"
            />
          </div>
          <div>
            <label class="form-label small fw-semibold mb-1">City / Town</label>
            <Select
              v-model="form.city"
              :options="cityOptions"
              filter
              editable
              :placeholder="form.region ? 'Select city or town' : 'Select region first'"
              :disabled="!form.region"
              class="w-100"
              size="small"
            />
          </div>
          <div>
            <label class="form-label small fw-semibold mb-1">Barangay</label>
            <Select
              v-model="form.barangay"
              :options="barangayOptions"
              filter
              editable
              :placeholder="form.city ? 'Select barangay' : 'Select city first'"
              :disabled="!form.city"
              class="w-100"
              size="small"
            />
          </div>
          <div>
            <label class="form-label small fw-semibold mb-1">Street</label>
            <input v-model="form.street" type="text" class="form-control form-control-sm" placeholder="Street" />
          </div>
        </div>

        <!-- Right: pin picker -->
        <div class="col-12 col-md-8 d-flex flex-column gap-2">
          <label class="form-label small fw-semibold mb-0">Pin the site <span class="text-danger">*</span></label>
          <CoordinatePicker v-model="form.coordinates" height="440px" />
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="pi pi-compass" style="font-size: 0.7rem;"></i></span>
            <input
              v-model="form.coordinates"
              type="text"
              class="form-control"
              placeholder="latitude, longitude"
              :class="{ 'is-invalid': form.coordinates && !parseCoordinates(form.coordinates) }"
            />
          </div>
          <div v-if="form.coordinates && !parseCoordinates(form.coordinates)" class="small text-danger">
            Enter coordinates as "latitude, longitude" (e.g. 14.474414, 121.196214) or drop the pin on the map.
          </div>
          <div v-if="form.lcp && form.nap" class="small text-secondary">
            Will be saved as <span class="fw-semibold text-body">{{ composedName }}</span>
          </div>
        </div>

        <!-- Contact + photos, using the same dropzone (compression + EXIF) as
             the application forms. A photo with GPS EXIF pins the map when no
             pin has been dropped yet. -->
        <div class="col-12">
          <div class="border-top pt-3 row g-3">
            <div class="col-12 col-md-3">
              <label class="form-label small fw-semibold mb-1">Email address</label>
              <input v-model="form.userEmail" type="email" class="form-control form-control-sm" placeholder="name@switchfiber.ph" />
              <div class="form-text small">Saved on the record as the contact for this site.</div>
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label small fw-semibold mb-1">Site photo</label>
              <ImageDropzone
                v-model="form.image"
                fieldId="lcpnap-image"
                label="Site Photo"
                @exif="onPhotoExif"
              />
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label small fw-semibold mb-1">Site photo 2</label>
              <ImageDropzone
                v-model="form.image2"
                fieldId="lcpnap-image2"
                label="Site Photo 2"
                @exif="onPhotoExif"
              />
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label small fw-semibold mb-1">Reading photo</label>
              <ImageDropzone
                v-model="form.readingImage"
                fieldId="lcpnap-reading-image"
                label="Reading Photo"
                @exif="onPhotoExif"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-sm btn-light border text-secondary" :disabled="saving" @click="formVisible = false">Cancel</button>
        <button type="button" class="btn btn-sm btn-primary d-inline-flex align-items-center gap-2" :disabled="saving || !canSave" @click="saveRecord">
          <i :class="saving ? 'pi pi-spinner pi-spin' : 'pi pi-check'" style="font-size: 0.8rem;"></i>
          {{ editingId ? 'Save changes' : 'Create location' }}
        </button>
      </template>
    </Dialog>

    <!-- Delete confirm -->
    <Dialog v-model:visible="deleteVisible" modal header="Delete location" :style="{ width: 'min(420px, 94vw)' }" :closable="!deleting">
      <p class="small mb-0">
        Delete <span class="fw-semibold">{{ deleteRecord?.lcpnap || `record #${deleteRecord?.id}` }}</span>?
        It will disappear from the map and this list. This cannot be undone.
      </p>
      <template #footer>
        <button type="button" class="btn btn-sm btn-light border text-secondary" :disabled="deleting" @click="deleteVisible = false">Cancel</button>
        <button type="button" class="btn btn-sm btn-danger d-inline-flex align-items-center gap-2" :disabled="deleting" @click="confirmDelete">
          <i :class="deleting ? 'pi pi-spinner pi-spin' : 'pi pi-trash'" style="font-size: 0.8rem;"></i>Delete
        </button>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'
import CoordinatePicker from '../components/CoordinatePicker.vue'
import ImageDropzone from '../components/ImageDropzone.vue'
import { LcpNapLocationService, parseCoordinates } from '../services/lcpNapLocations'
import phAddressService from '../services/phAddressService'
import { reverseGeocode } from '../services/geocoding'
import { useAuthStore } from '../stores/auth'

const toast = useToast()
const authStore = useAuthStore()

const isLoading = ref(true)
const error = ref(null)
const records = ref([])
const lcpMaster = ref([])
const napMaster = ref([])
const globalSearch = ref('')

const viewVisible = ref(false)
const viewRecord = ref(null)

const formVisible = ref(false)
const editingId = ref(null)
const editingOriginal = ref(null)
const saving = ref(false)
const form = ref(makeEmptyForm())

const deleteVisible = ref(false)
const deleteRecord = ref(null)
const deleting = ref(false)

function makeEmptyForm() {
  return {
    lcp: null,
    nap: null,
    portTotal: 8,
    coordinates: '',
    street: '',
    barangay: '',
    city: '',
    region: '',
    userEmail: '',
    image: '',
    image2: '',
    readingImage: ''
  }
}

// A field photo taken on-site usually carries the site's GPS position in its
// EXIF — use it to drop the pin, but never move a pin someone already placed.
const onPhotoExif = (meta) => {
  if (!meta || typeof meta.lat !== 'number' || typeof meta.lng !== 'number') return
  if (parseCoordinates(form.value.coordinates)) return
  form.value.coordinates = `${meta.lat.toFixed(6)}, ${meta.lng.toFixed(6)}`
}

// ---------------------------------------------------------------------------
// Address cascade: Region → City/Town → Barangay, fed by the same PSGC data
// files behind the application form's address dropdowns. The service area is
// three regions for now — extend this list as coverage grows. City and
// barangay stay editable so legacy values and unmapped places survive.
// ---------------------------------------------------------------------------
const REGION_AREAS = [
  { name: 'Rizal', provinceCode: '045800000' },
  { name: 'Cavite', provinceCode: '042100000' },
  { name: 'Laguna', provinceCode: '043400000' }
]

const cityList = ref([]) // [{ code, name }] for the selected region
const barangayList = ref([]) // [{ code, name }] for the selected city
const geocoding = ref(false)
let lastGeocodedCoords = ''
let geocodeTimer = null
let geocodeAbort = null

const normPlace = (name) => String(name || '')
  .toLowerCase()
  .replace(/^city of\s+/, '')
  .replace(/\s+city$/, '')
  .replace(/\s+/g, ' ')
  .trim()

const regionOptions = computed(() => {
  const names = REGION_AREAS.map(r => r.name)
  if (form.value.region && !names.includes(form.value.region)) names.push(form.value.region)
  return names
})

const cityOptions = computed(() => {
  const names = cityList.value.map(c => c.name)
  if (form.value.city && !names.some(n => normPlace(n) === normPlace(form.value.city))) names.unshift(form.value.city)
  return names
})

const barangayOptions = computed(() => {
  const names = barangayList.value.map(b => b.name)
  if (form.value.barangay && !names.some(n => normPlace(n) === normPlace(form.value.barangay))) names.unshift(form.value.barangay)
  return names
})

watch(() => form.value.region, async (region) => {
  cityList.value = []
  const area = REGION_AREAS.find(r => r.name === region)
  if (!area) return
  try {
    cityList.value = await phAddressService.getCities(null, area.provinceCode)
  } catch {
    cityList.value = []
  }
})

watch(() => form.value.city, async (city) => {
  barangayList.value = []
  if (!city) return
  try {
    // The region watcher fills cityList asynchronously, so it may not have
    // landed yet when a geocode sets region and city back-to-back — resolve
    // the city against the service directly rather than racing it
    let cities = cityList.value
    if (!cities.length) {
      const area = REGION_AREAS.find(r => r.name === form.value.region)
      if (area) cities = await phAddressService.getCities(null, area.provinceCode)
    }
    const match = cities.find(c => normPlace(c.name) === normPlace(city))
    if (!match) return
    barangayList.value = await phAddressService.getBarangays(match.code)
  } catch {
    barangayList.value = []
  }
})

// Pin moved → read the address off the map and fill whatever resolves. The
// canonical dropdown spelling wins over OSM's when the two clearly match.
watch(() => form.value.coordinates, (coords) => {
  if (!formVisible.value) return
  if (geocodeTimer) clearTimeout(geocodeTimer)
  const parsed = parseCoordinates(coords)
  if (!parsed || coords === lastGeocodedCoords) return
  geocodeTimer = setTimeout(async () => {
    lastGeocodedCoords = coords
    if (geocodeAbort) geocodeAbort.abort()
    geocodeAbort = new AbortController()
    geocoding.value = true
    try {
      const addr = await reverseGeocode(parsed.lat, parsed.lng, { signal: geocodeAbort.signal })
      if (!addr) return
      const area = REGION_AREAS.find(r => addr.provinceLike.some(p => normPlace(p).includes(normPlace(r.name))))
      if (area) form.value.region = area.name

      // Match against fresh lists rather than racing the cascade watchers,
      // which load their options asynchronously after region/city change
      let cities = cityList.value
      if (area) {
        cities = await phAddressService.getCities(null, area.provinceCode).catch(() => cityList.value)
      }
      let canonicalCity = null
      if (addr.city) {
        canonicalCity = cities.find(c => normPlace(c.name) === normPlace(addr.city)) || null
        form.value.city = canonicalCity ? canonicalCity.name : addr.city
      }
      if (addr.barangay) {
        const raw = addr.barangay.replace(/^(barangay|brgy\.?)\s+/i, '')
        const brgys = canonicalCity
          ? await phAddressService.getBarangays(canonicalCity.code).catch(() => [])
          : barangayList.value
        const canonical = brgys.find(b => normPlace(b.name) === normPlace(raw))
        form.value.barangay = canonical ? canonical.name : raw
      }
      if (addr.street) form.value.street = addr.street
    } catch {
      // Offline or aborted — the pin still saved its coordinates, which is
      // the part that matters; the address can be typed
    } finally {
      geocoding.value = false
    }
  }, 600)
})

// Same deterministic LCP hue as the map page, so colors agree across both views
const lcpColor = (lcpName) => {
  const digits = String(lcpName || '').replace(/\D/g, '')
  let seed = digits ? Number(digits) : 0
  if (!seed) {
    for (const ch of String(lcpName || '')) seed = (seed * 31 + ch.charCodeAt(0)) % 100000
  }
  return `hsl(${Math.round((seed * 137.508) % 360)}, 62%, 44%)`
}

const normalizeName = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')

const linkedLcp = (row) => lcpMaster.value.find(r => normalizeName(r.name) === normalizeName(row?.lcp)) || null
const linkedNap = (row) => napMaster.value.find(r => normalizeName(r.name) === normalizeName(row?.nap)) || null

const photoRefs = (row) => {
  const entries = [
    { label: 'Enclosure', path: row.image },
    { label: 'Enclosure 2', path: row.image2 },
    { label: 'Reading', path: row.readingImage }
  ]
  return entries
    .filter(e => e.path && String(e.path).trim())
    .map(e => ({ ...e, url: /^(https?:\/\/|data:)/i.test(String(e.path).trim()) ? String(e.path).trim() : null }))
}

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const filteredRecords = computed(() => {
  const q = globalSearch.value.trim().toLowerCase()
  if (!q) return records.value
  return records.value.filter(r =>
    [r.lcpnap, r.lcp, r.nap, r.street, r.barangay, r.city, r.region, r.coordinates, r.modifiedBy]
      .some(v => String(v || '').toLowerCase().includes(q))
  )
})

// Master names, plus any name an existing record carries that the master list
// doesn't (so editing an old record never silently blanks its LCP or NAP)
const lcpOptions = computed(() => {
  const names = new Set(lcpMaster.value.map(r => r.name).filter(Boolean))
  if (form.value.lcp) names.add(form.value.lcp)
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
})
const napOptions = computed(() => {
  const names = new Set(napMaster.value.map(r => r.name).filter(Boolean))
  if (form.value.nap) names.add(form.value.nap)
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
})

const composedName = computed(() => [form.value.lcp, form.value.nap].filter(Boolean).join(' '))

const canSave = computed(() =>
  !!form.value.lcp &&
  !!form.value.nap &&
  !!parseCoordinates(form.value.coordinates) &&
  form.value.portTotal != null && form.value.portTotal >= 0
)

const loadData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const [locations, lcps, naps] = await Promise.all([
      LcpNapLocationService.getLocations(),
      LcpNapLocationService.getLcps().catch(() => []),
      LcpNapLocationService.getNaps().catch(() => [])
    ])
    records.value = Array.isArray(locations) ? locations : []
    lcpMaster.value = Array.isArray(lcps) ? lcps : []
    napMaster.value = Array.isArray(naps) ? naps : []
  } catch (err) {
    error.value = err?.message || 'Could not load location records. Check the connection and try again.'
  } finally {
    isLoading.value = false
  }
}

const openView = (row) => {
  viewRecord.value = row
  viewVisible.value = true
}

const openCreate = () => {
  editingId.value = null
  editingOriginal.value = null
  form.value = makeEmptyForm()
  form.value.userEmail = authStore.user?.email || ''
  lastGeocodedCoords = ''
  formVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row.id
  editingOriginal.value = row
  // The stored pin's address is already on the record — only a moved pin
  // should rewrite it
  lastGeocodedCoords = row.coordinates || ''
  form.value = {
    lcp: row.lcp || null,
    nap: row.nap || null,
    portTotal: row.portTotal ?? 0,
    coordinates: row.coordinates || '',
    street: row.street || '',
    barangay: row.barangay || '',
    city: row.city || '',
    region: row.region || '',
    userEmail: row.userEmail || '',
    image: row.image || '',
    image2: row.image2 || '',
    readingImage: row.readingImage || ''
  }
  formVisible.value = true
}

// The API requires every field on both create and update, so the payload
// always carries the full shape. Photo fields hold whatever filename the form
// shows; the email is the form's, falling back to the signed-in user.
const buildPayload = () => {
  const email = (form.value.userEmail || '').trim() || authStore.user?.email || ''
  const editor = authStore.user?.email || authStore.user?.username || email
  return {
    lcpnap: composedName.value,
    lcp: form.value.lcp || '',
    nap: form.value.nap || '',
    portTotal: form.value.portTotal ?? 0,
    coordinates: form.value.coordinates.trim(),
    street: form.value.street || '',
    barangay: form.value.barangay || '',
    city: form.value.city || '',
    region: form.value.region || '',
    image: form.value.image || '',
    image2: form.value.image2 || '',
    readingImage: form.value.readingImage || '',
    modifiedBy: editor,
    userEmail: email,
    modifiedDate: new Date().toISOString()
  }
}

const saveRecord = async () => {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    if (editingId.value) {
      await LcpNapLocationService.updateLocation(editingId.value, { id: editingId.value, ...buildPayload() })
      toast.add({ severity: 'success', summary: 'Location saved', detail: composedName.value, life: 2500 })
    } else {
      await LcpNapLocationService.createLocation(buildPayload())
      toast.add({ severity: 'success', summary: 'Location created', detail: composedName.value, life: 2500 })
    }
    formVisible.value = false
    await loadData()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Save failed', detail: err?.message || 'The record could not be saved.', life: 4000 })
  } finally {
    saving.value = false
  }
}

const openDelete = (row) => {
  deleteRecord.value = row
  deleteVisible.value = true
}

const confirmDelete = async () => {
  if (!deleteRecord.value || deleting.value) return
  deleting.value = true
  try {
    await LcpNapLocationService.deleteLocation(deleteRecord.value.id)
    toast.add({ severity: 'success', summary: 'Location deleted', detail: deleteRecord.value.lcpnap || `#${deleteRecord.value.id}`, life: 2500 })
    deleteVisible.value = false
    await loadData()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Delete failed', detail: err?.message || 'The record could not be deleted.', life: 4000 })
  } finally {
    deleting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.lnm-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.lnr-link-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 10px;
  font-size: 0.82rem;
}

.lnr-photo {
  display: block;
  width: 84px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--bs-border-color);
}
.lnr-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lnr-photo-ref {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  border: 1px dashed var(--bs-border-color);
  color: var(--bs-secondary-color);
  font-size: 0.72rem;
}

.lnr-table :deep(.p-datatable-tbody > tr > td) {
  font-size: 0.85rem;
}
</style>
