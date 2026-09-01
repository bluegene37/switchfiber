<template>
  <div class="d-flex flex-column gap-4 sfa-tracker-models">
    <!-- Screen Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 sfa-tracker-models-header">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">Models</h1>
        <p class="small text-secondary mt-1 mb-0">
          Every table's columns, data types, and which fields are required — read straight from the API schema.
        </p>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <Button
          :label="isRefreshing ? 'Refreshing...' : 'Refresh from API'"
          icon="pi pi-refresh"
          class="p-button-outlined p-button-secondary p-button-sm rounded-3 shadow-xs"
          :loading="isRefreshing"
          @click="refreshFromApi"
        />
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column: Model List -->
      <div class="col-12 col-lg-4 col-xl-3 sfa-tracker-models-list-col">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden h-100 bg-body">
          <div class="card-header bg-body border-bottom p-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="d-flex align-items-center gap-2">
                <h6 class="fw-bold text-body mb-0">Tables</h6>
                <span class="badge bg-body-tertiary text-body border px-2 py-0.5 small fw-semibold">
                  <i class="pi pi-table text-primary me-1"></i> {{ models.length }} models
                </span>
              </div>
            </div>
            <div class="position-relative">
              <i class="pi pi-search position-absolute top-50 translate-middle-y text-secondary pointer-events-none" style="left: 0.75rem; font-size: 0.85rem; z-index: 2;"></i>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control form-control-sm bg-body-tertiary border-0 shadow-none rounded-3"
                placeholder="Search tables..."
                style="padding-left: 2.2rem; height: 34px;"
              />
            </div>
          </div>

          <div class="card-body p-2 overflow-y-auto model-list" style="max-height: calc(100dvh - 280px); min-height: 400px;">
            <div v-if="isLoading" class="text-center text-muted py-5 small">
              <i class="pi pi-spin pi-spinner fs-4 mb-2 d-block text-primary"></i>
              Loading schema...
            </div>

            <div v-else-if="filteredModels.length === 0" class="text-center text-muted py-5 small">
              <i class="pi pi-search-minus fs-4 mb-2 d-block opacity-50"></i>
              No tables found matching "{{ searchQuery }}"
            </div>

            <div v-else class="list-group list-group-flush gap-1">
              <button
                v-for="model in filteredModels"
                :key="model.endpoint"
                type="button"
                class="list-group-item list-group-item-action border-0 rounded-3 p-2.5 transition-all d-flex flex-column gap-1"
                :class="selectedEndpoint === model.endpoint ? 'bg-primary text-white shadow-sm fw-medium' : 'hover-bg'"
                @click="selectedEndpoint = model.endpoint"
              >
                <div class="d-flex align-items-center justify-content-between gap-2">
                  <span class="fw-semibold text-truncate small" :class="selectedEndpoint === model.endpoint ? 'text-white' : 'text-body'">
                    {{ model.label }}
                  </span>
                  <span
                    class="badge rounded-1 font-monospace px-2 py-0.5 flex-shrink-0"
                    :class="selectedEndpoint === model.endpoint ? 'field-count-active' : 'bg-body-tertiary text-secondary border fw-semibold'"
                    style="font-size: 0.7rem;"
                  >
                    {{ model.fieldCount }}
                  </span>
                </div>
                <div
                  class="font-monospace text-truncate opacity-75"
                  :class="selectedEndpoint === model.endpoint ? 'text-white-50' : 'text-secondary'"
                  style="font-size: 0.75rem;"
                >
                  /api/{{ model.endpoint }}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Column Detail -->
      <div class="col-12 col-lg-8 col-xl-9 sfa-tracker-models-detail-col">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden h-100 bg-body">
          <div class="card-header bg-body border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <h5 class="fw-bold text-body mb-0 font-monospace fs-6">
                {{ activeSchemaName || selectedEndpoint || '—' }}
              </h5>
              <!-- The single column count for the page; it follows the column
                   search so the number on screen always matches the rows. -->
              <span v-if="activeFields.length" class="badge bg-body-tertiary text-body border px-2.5 py-1 small fw-semibold">
                <i class="pi pi-list text-primary me-1"></i>
                <template v-if="isFilteringColumns">
                  {{ visibleFields.length }} of {{ activeFields.length }} columns
                </template>
                <template v-else>
                  {{ activeFields.length }} {{ activeFields.length === 1 ? 'column' : 'columns' }}
                </template>
              </span>
              <span v-if="requiredCount" class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 small fw-semibold">
                {{ requiredCount }} required in form
              </span>
            </div>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <!-- Create / Update schema toggle -->
              <div class="btn-group btn-group-sm p-1 bg-body-tertiary rounded-3 border" role="group">
                <button
                  v-for="m in ['create', 'update']"
                  :key="m"
                  type="button"
                  class="btn btn-sm rounded-2 py-1 px-2.5 text-nowrap text-capitalize"
                  :class="mode === m ? 'btn-primary shadow-sm fw-semibold' : 'btn-link text-body text-decoration-none border-0 opacity-75'"
                  :disabled="!availableModes.includes(m)"
                  @click="mode = m"
                >
                  <i :class="['pi', m === 'create' ? 'pi-plus-circle' : 'pi-pencil', 'me-1.5']"></i> {{ m }}
                </button>
              </div>

              <!-- Table / Raw JSON toggle -->
              <div class="btn-group btn-group-sm p-1 bg-body-tertiary rounded-3 border" role="group">
                <button
                  type="button"
                  class="btn btn-sm rounded-2 py-1 px-2.5 text-nowrap"
                  :class="viewMode === 'table' ? 'btn-primary shadow-sm fw-semibold' : 'btn-link text-body text-decoration-none border-0 opacity-75'"
                  @click="viewMode = 'table'"
                >
                  <i class="pi pi-table me-1.5"></i> Columns
                </button>
                <button
                  type="button"
                  class="btn btn-sm rounded-2 py-1 px-2.5 text-nowrap"
                  :class="viewMode === 'raw' ? 'btn-primary shadow-sm fw-semibold' : 'btn-link text-body text-decoration-none border-0 opacity-75'"
                  @click="viewMode = 'raw'"
                >
                  <i class="pi pi-code me-1.5"></i> Raw JSON
                </button>
              </div>
            </div>
          </div>

          <div class="card-body p-3">
            <div v-if="loadError" class="alert alert-warning d-flex align-items-center rounded-3 p-2 mb-3 small">
              <i class="pi pi-exclamation-triangle me-2"></i> {{ loadError }}
            </div>

            <!-- Explains why "API required" and "Form required" disagree -->
            <div
              v-if="viewMode === 'table' && activeFields.length"
              class="d-flex align-items-start gap-2 bg-body-tertiary border rounded-3 p-2.5 mb-3 small text-secondary"
            >
              <i class="pi pi-info-circle text-primary mt-1"></i>
              <span>
                The API marks every non-nullable property as required, so
                <strong class="text-body">API Required</strong> is nearly always ✓.
                <strong class="text-body">Form Required</strong> is what the create/edit dialogs actually enforce — system
                columns are filled in automatically<template v-if="usesOverride">, and this table also has a hand-tuned
                required list in <code>src/models/requiredFields.js</code></template>.
              </span>
            </div>

            <div v-if="isLoading" class="text-center text-muted py-5">
              <i class="pi pi-spin pi-spinner fs-3 text-primary mb-2 d-block"></i>
              <span class="small">Loading schema...</span>
            </div>

            <div v-else-if="!activeFields.length" class="text-center text-muted py-5 small">
              <i class="pi pi-inbox fs-3 mb-2 d-block opacity-50"></i>
              This endpoint has no {{ mode }} request schema in the API document.
            </div>

            <!-- Columns table -->
            <div v-else-if="viewMode === 'table'">
              <div class="position-relative mb-3" style="max-width: 22rem;">
                <i class="pi pi-search position-absolute top-50 translate-middle-y text-secondary pointer-events-none" style="left: 0.75rem; font-size: 0.85rem; z-index: 2;"></i>
                <input
                  v-model="columnSearch"
                  type="text"
                  class="form-control form-control-sm bg-body-tertiary border-0 shadow-none rounded-3"
                  placeholder="Search columns, types, or formats..."
                  style="padding-left: 2.2rem; padding-right: 2.2rem; height: 34px;"
                />
                <button
                  v-if="columnSearch"
                  type="button"
                  class="btn btn-link position-absolute end-0 top-50 translate-middle-y me-1 p-1 text-secondary text-decoration-none shadow-none border-0"
                  title="Clear search"
                  style="line-height: 1; z-index: 3;"
                  @click="columnSearch = ''"
                >
                  <i class="pi pi-times" style="font-size: 0.75rem;"></i>
                </button>
              </div>

              <div v-if="!visibleFields.length" class="text-center text-muted py-5 small border rounded-3">
                <i class="pi pi-search-minus fs-4 mb-2 d-block opacity-50"></i>
                No columns matching "{{ columnSearch }}"
              </div>

              <div
                v-else
                class="table-responsive border rounded-3 overflow-auto custom-scrollbar detail-pane"
                style="max-height: calc(100dvh - 430px); min-height: 320px;"
              >
                <table class="table table-sm table-hover align-middle mb-0 small">
                  <thead class="bg-body-tertiary sticky-top">
                    <tr>
                      <th scope="col" class="fw-semibold text-secondary ps-3 pe-2 py-2 text-end" style="width: 3.25rem;">#</th>
                      <th scope="col" class="fw-semibold text-body px-3 py-2">Column</th>
                      <th scope="col" class="fw-semibold text-body px-3 py-2">Type</th>
                      <th scope="col" class="fw-semibold text-body px-3 py-2">Format</th>
                      <th scope="col" class="fw-semibold text-body px-3 py-2 text-center">Nullable</th>
                      <th scope="col" class="fw-semibold text-body px-3 py-2 text-center">API Required</th>
                      <th scope="col" class="fw-semibold text-body px-3 py-2">Form Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(field, index) in visibleFields" :key="field.name">
                      <td class="ps-3 pe-2 py-2 font-monospace text-secondary text-end">{{ index + 1 }}</td>
                      <td class="px-3 py-2 font-monospace text-body fw-medium text-nowrap">{{ field.name }}</td>
                      <td class="px-3 py-2 font-monospace text-secondary text-nowrap">{{ field.type }}</td>
                      <td class="px-3 py-2 font-monospace text-secondary text-nowrap">{{ field.format || '—' }}</td>
                      <td class="px-3 py-2 text-center">
                        <i v-if="field.nullable" class="pi pi-check text-secondary" title="Accepts null"></i>
                        <span v-else class="text-secondary opacity-50">—</span>
                      </td>
                      <td class="px-3 py-2 text-center">
                        <i v-if="field.apiRequired" class="pi pi-check text-secondary" title="Flagged required by the API"></i>
                        <span v-else class="text-secondary opacity-50">—</span>
                      </td>
                      <td class="px-3 py-2 text-nowrap">
                        <span v-if="field.formRequired" class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-0.5 fw-semibold">
                          Required
                        </span>
                        <span v-else class="text-secondary" style="font-size: 0.75rem;">
                          {{ field.relaxedReason || 'Optional' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Raw schema JSON -->
            <div
              v-else
              class="bg-body-tertiary text-body p-3.5 rounded-3 border overflow-auto custom-scrollbar detail-pane"
              style="max-height: calc(100dvh - 380px); min-height: 320px;"
            >
              <JsonTreeNode :data="activeRawSchema" :depth="0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Button from 'primevue/button'
import JsonTreeNode from '../components/JsonTreeNode.vue'
import { resolveRequiredFields, hasRequiredOverride, isSystemField } from '../models/requiredFields'

// The spec is served as a static asset rather than imported, so its ~138 KB
// stays out of the JS bundle.
const BUNDLED_SPEC_URL = '/openapi.json'
// Proxied to the API host by vite (dev) and vercel.json (prod), which keeps the
// request same-origin and sidesteps the server's self-signed certificate.
const LIVE_SPEC_URL = '/openapi/v1.json'

const spec = ref(null)
const isLoading = ref(true)
const isRefreshing = ref(false)
const loadError = ref(null)

const searchQuery = ref('')
const columnSearch = ref('')
const selectedEndpoint = ref('')
const mode = ref('create')
const viewMode = ref('table')

/** OpenAPI 3.1 encodes nullability as "null" inside a type array. */
const isNullable = (prop) => Array.isArray(prop?.type) && prop.type.includes('null')

const readType = (prop) => {
  const t = prop?.type
  if (Array.isArray(t)) {
    const real = t.filter(x => x !== 'null')
    return real.length ? real.join(' | ') : 'null'
  }
  return t || 'unknown'
}

/**
 * Walks `paths` to pair each endpoint with its create/update request schema —
 * the same derivation scripts/generate_schema_meta.js performs at build time.
 */
const endpointSchemas = computed(() => {
  const map = {}
  for (const [routePath, operations] of Object.entries(spec.value?.paths || {})) {
    const segments = routePath.split('/')
    if (segments.length < 3 || segments[1] !== 'api') continue
    const endpoint = segments[2]

    for (const [method, operation] of Object.entries(operations)) {
      if (!['post', 'put', 'patch'].includes(method)) continue
      if (segments.length > 3 && !segments[3].startsWith('{')) continue

      const content = operation.requestBody?.content || {}
      let ref = null
      for (const media of Object.values(content)) {
        if (media?.schema?.$ref) {
          ref = media.schema.$ref.split('/').pop()
          break
        }
      }
      if (!ref) continue

      map[endpoint] = map[endpoint] || {}
      map[endpoint][method === 'post' ? 'create' : 'update'] = ref
    }
  }
  return map
})

const humanize = (name) => String(name).replace(/([a-z0-9])([A-Z])/g, '$1 $2')

const models = computed(() =>
  Object.keys(endpointSchemas.value)
    .sort()
    .map(endpoint => {
      const schemas = spec.value?.components?.schemas || {}
      const refs = endpointSchemas.value[endpoint]
      const primary = schemas[refs.create] || schemas[refs.update]
      return {
        endpoint,
        label: humanize(endpoint),
        fieldCount: Object.keys(primary?.properties || {}).length
      }
    })
)

const filteredModels = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return models.value
  return models.value.filter(m =>
    m.endpoint.toLowerCase().includes(q) || m.label.toLowerCase().includes(q)
  )
})

const availableModes = computed(() => {
  const refs = endpointSchemas.value[selectedEndpoint.value] || {}
  return ['create', 'update'].filter(m => refs[m])
})

const activeSchemaName = computed(() => endpointSchemas.value[selectedEndpoint.value]?.[mode.value] || '')

const activeRawSchema = computed(() => {
  const name = activeSchemaName.value
  return name ? spec.value?.components?.schemas?.[name] || null : null
})

const usesOverride = computed(() => hasRequiredOverride(selectedEndpoint.value))

const activeFields = computed(() => {
  const schema = activeRawSchema.value
  if (!schema) return []

  const properties = schema.properties || {}
  const apiRequired = new Set(schema.required || [])
  const columns = Object.keys(properties)

  // Ask the very same resolver the forms use, so this column can never drift
  // from what a user actually sees in the create/edit dialog.
  const formRequired = new Set(resolveRequiredFields(selectedEndpoint.value, columns, mode.value))

  return columns.map(name => {
    const prop = properties[name]
    const nullable = isNullable(prop)
    const required = formRequired.has(name)

    let relaxedReason = ''
    if (!required && apiRequired.has(name)) {
      if (isSystemField(name)) relaxedReason = 'Set automatically'
      else if (nullable) relaxedReason = 'Optional'
      else if (usesOverride.value) relaxedReason = 'Relaxed by override'
    }

    return {
      name,
      type: readType(prop),
      format: prop?.format || null,
      nullable,
      apiRequired: apiRequired.has(name),
      formRequired: required,
      relaxedReason
    }
  })
})

const requiredCount = computed(() => activeFields.value.filter(f => f.formRequired).length)

// Only meaningful in the Columns view; the Raw JSON view ignores the search.
const isFilteringColumns = computed(() =>
  viewMode.value === 'table' && Boolean(columnSearch.value.trim())
)

const visibleFields = computed(() => {
  const q = columnSearch.value.trim().toLowerCase()
  if (!q) return activeFields.value
  return activeFields.value.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.type.toLowerCase().includes(q) ||
    (f.format || '').toLowerCase().includes(q)
  )
})

// A filter left over from the previous table reads as an empty result.
watch([selectedEndpoint, mode], () => {
  columnSearch.value = ''
})

// Keep the mode toggle on something this endpoint actually defines.
watch(availableModes, (modes) => {
  if (modes.length && !modes.includes(mode.value)) mode.value = modes[0]
})

watch(models, (list) => {
  if (list.length && !list.some(m => m.endpoint === selectedEndpoint.value)) {
    selectedEndpoint.value = list[0].endpoint
  }
})

const loadSpec = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const doc = await res.json()
  if (!doc?.components?.schemas) throw new Error('Response is not an OpenAPI document')
  return doc
}

onMounted(async () => {
  try {
    const doc = await loadSpec(BUNDLED_SPEC_URL)
    spec.value = doc
  } catch (err) {
    console.error('[Models] Failed to load bundled OpenAPI document:', err)
    loadError.value = `Could not load the bundled schema (${err.message}). Try "Refresh from API".`
  } finally {
    isLoading.value = false
  }
})

const refreshFromApi = async () => {
  isRefreshing.value = true
  loadError.value = null
  try {
    const doc = await loadSpec(LIVE_SPEC_URL)
    spec.value = doc
  } catch (err) {
    console.warn('[Models] Live schema refresh failed, keeping the bundled copy:', err)
    // The bundled document is still on screen, so this is a notice, not a failure.
    loadError.value = `Could not reach the live schema (${err.message}). Still showing the bundled copy.`
  } finally {
    isRefreshing.value = false
  }
}
</script>

<style scoped>
.transition-all {
  transition: all 0.15s ease-in-out;
}

.hover-bg:hover {
  background-color: var(--bs-tertiary-bg);
}

.field-count-active {
  background-color: #ffffff !important;
  color: var(--bs-primary, #e74c5a) !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15) !important;
}

/* The header row stays put while a long column list scrolls under it. */
thead.sticky-top th {
  background-color: var(--bs-tertiary-bg);
  z-index: 1;
}

/* On a phone the two panes stack. Shrinking them keeps the table list from
   filling the screen before the column detail comes into view. */
@media (max-width: 991.98px) {
  .model-list {
    min-height: 0 !important;
    max-height: 45vh !important;
    max-height: 45dvh !important;
  }

  .detail-pane {
    min-height: 300px !important;
    max-height: 65vh !important;
    max-height: 65dvh !important;
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.35);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.55);
}
</style>
