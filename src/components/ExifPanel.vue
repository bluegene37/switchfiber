<template>
  <div class="exif-panel border rounded-3 p-3 mt-3 text-start">
    <div v-if="loading" class="d-flex align-items-center gap-2 text-muted small">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Reading EXIF metadata…</span>
    </div>

    <div v-else-if="error" class="d-flex align-items-center gap-2 text-muted small">
      <i class="pi pi-exclamation-circle"></i>
      <span>EXIF metadata could not be read for this image.</span>
    </div>

    <div v-else-if="!sections.length" class="d-flex align-items-center gap-2 text-muted small">
      <i class="pi pi-info-circle"></i>
      <span>No EXIF metadata found in this image.</span>
    </div>

    <div v-else class="row g-3">
      <div v-for="sec in sections" :key="sec.key" class="col-12 col-md-6">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h6 class="small fw-bold text-body mb-0 d-flex align-items-center gap-2">
            <i :class="sec.icon" class="text-secondary"></i> {{ sec.title }}
          </h6>
          <a
            v-if="sec.mapUrl"
            :href="sec.mapUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="small text-decoration-none d-flex align-items-center gap-1"
          >
            <i class="pi pi-external-link" style="font-size: 0.7rem;"></i> View on Map
          </a>
        </div>
        <table class="table table-sm mb-0 exif-table">
          <tbody>
            <tr v-for="row in sec.rows" :key="row.label">
              <td class="text-muted small exif-label">{{ row.label }}</td>
              <td class="small fw-medium text-body text-break">{{ row.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { extractExifSections } from '../utils/exif'

const props = defineProps({
  src: {
    type: String,
    default: ''
  }
})

const loading = ref(false)
const error = ref(false)
const sections = ref([])

// Re-parse whenever the image changes; the panel is only mounted while
// visible, so parsing here keeps the work lazy.
watch(
  () => props.src,
  async (src) => {
    sections.value = []
    error.value = false
    if (!src) return
    loading.value = true
    try {
      sections.value = await extractExifSections(src)
    } catch (e) {
      console.warn('EXIF extraction failed:', e)
      error.value = true
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.exif-panel {
  background-color: var(--bs-tertiary-bg, #f8f9fa);
  max-height: 40vh;
  overflow-y: auto;
}

.exif-table td {
  background-color: transparent;
  padding: 0.2rem 0.4rem;
  border-color: var(--bs-border-color-translucent, rgba(0, 0, 0, 0.08));
}

.exif-label {
  width: 40%;
  white-space: nowrap;
}
</style>
