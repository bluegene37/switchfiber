<template>
  <div class="image-dropzone-wrapper sfa-tracker-image-dropzone">
    <!-- Existing/Current Image Preview -->
    <!--
    <div v-if="modelValue" class="dropzone-preview-card border rounded p-2 d-flex align-items-center justify-content-between sfa-tracker-image-dropzone-preview">
      <div class="d-flex align-items-center gap-3 overflow-hidden">
        <div class="preview-thumbnail-container" @click="showFullPreview = true">
          <img :src="previewSrc" alt="Uploaded Image" class="preview-thumbnail rounded" />
          <div class="preview-zoom-overlay">
            <i class="pi pi-eye text-white"></i>
          </div>
        </div>
        <div class="text-truncate">
          <div class="fw-semibold small text-truncate">{{ label || 'Image' }}</div>
          <small class="text-muted d-flex align-items-center gap-1 flex-wrap" style="font-size: 0.75rem;">
            <template v-if="originalSize">
              <span class="font-monospace">{{ originalSize }}<template v-if="compressedSize"> → {{ compressedSize }}</template></span>
              <span v-if="compressedSize" class="badge bg-info-subtle text-info border border-info border-opacity-25 rounded-pill fw-semibold" style="font-size: 0.65rem;">Compressed</span>
            </template>
            <template v-else>
              <span>{{ isBase64(modelValue) ? 'Base64 Image' : (isGoogleDrive(modelValue) ? 'Google Drive Link' : ((typeof modelValue === 'string' && modelValue.startsWith('http')) ? 'Remote URL' : 'Uploaded File')) }}</span>
              <span v-if="storedSizeLabel" class="font-monospace">· {{ storedSizeLabel }}</span>
            </template>
          </small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-1 flex-shrink-0">
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="showFullPreview = true"><i class="pi pi-eye"></i></button>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="downloadImage(modelValue, label)"><i class="pi pi-download"></i></button>
        <button v-if="!disabled" type="button" class="btn btn-sm btn-outline-danger" @click="removeImage"><i class="pi pi-trash"></i></button>
      </div>
    </div>
    -->
    <!-- Gene - Oct 23, 2026: Enhanced ImageDropzone preview card with loading state, safe previewSrc binding, and support for metadata objects & Google Drive -->
    <div v-if="hasStoredImage" class="dropzone-preview-card border rounded p-2 d-flex align-items-center justify-content-between sfa-tracker-image-dropzone-preview">
      <div class="d-flex align-items-center gap-3 overflow-hidden">
        <!-- Thumbnail container: spinner when loading, image if previewSrc is ready, icon fallback if unrenderable server path -->
        <div v-if="loading && !previewSrc" class="preview-thumbnail-container d-flex align-items-center justify-content-center bg-body-tertiary">
          <i class="pi pi-spin pi-spinner text-primary" style="font-size: 1.1rem;"></i>
        </div>
        <div v-else-if="previewSrc" class="preview-thumbnail-container" @click="showFullPreview = true">
          <img :src="previewSrc" alt="Uploaded Image" class="preview-thumbnail rounded" />
          <div class="preview-zoom-overlay">
            <i class="pi pi-eye text-white"></i>
          </div>
        </div>
        <div v-else class="preview-thumbnail-container d-flex align-items-center justify-content-center bg-body-tertiary text-secondary">
          <i class="pi pi-image text-muted" style="font-size: 1.1rem;"></i>
        </div>

        <div class="text-truncate">
          <div class="fw-semibold small text-truncate">{{ label || 'Image' }}</div>
          <small class="text-muted d-flex align-items-center gap-1 flex-wrap" style="font-size: 0.75rem;">
            <template v-if="loading && !previewSrc">
              <span class="text-primary d-inline-flex align-items-center gap-1">
                <i class="pi pi-spin pi-spinner" style="font-size: 0.65rem;"></i> Loading from server...
              </span>
            </template>
            <template v-else-if="originalSize">
              <span class="font-monospace">{{ originalSize }}<template v-if="compressedSize"> → {{ compressedSize }}</template></span>
              <span v-if="compressedSize" class="badge bg-info-subtle text-info border border-info border-opacity-25 rounded-pill fw-semibold" style="font-size: 0.65rem;">Compressed</span>
            </template>
            <template v-else>
              <span>{{ isBase64(modelValue) ? 'Base64 Image' : (isGoogleDrive(modelValue) ? 'Google Drive Link' : ((typeof modelValue === 'string' && modelValue.startsWith('http')) ? 'Remote URL' : (displayFileName || 'Uploaded File'))) }}</span>
              <span v-if="storedSizeLabel" class="font-monospace">· {{ storedSizeLabel }}</span>
            </template>
          </small>
          <small v-if="photoExif" class="text-muted d-flex align-items-center gap-2 flex-wrap" style="font-size: 0.7rem;">
            <span v-if="typeof photoExif.lat === 'number' && typeof photoExif.lng === 'number'" class="font-monospace" title="GPS location embedded in the photo">
              <i class="pi pi-map-marker" style="font-size: 0.65rem;"></i>
              {{ photoExif.lat.toFixed(5) }}, {{ photoExif.lng.toFixed(5) }}
            </span>
            <span v-if="photoExif.takenAt" title="Date the photo was taken">
              <i class="pi pi-calendar" style="font-size: 0.65rem;"></i>
              {{ formatTakenAt(photoExif.takenAt) }}
            </span>
          </small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-1 flex-shrink-0">
        <button
          v-if="previewSrc"
          type="button"
          class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center p-1"
          style="width: 32px; height: 32px;"
          title="Preview Image"
          @click="showFullPreview = true"
        >
          <i class="pi pi-eye" style="font-size: 0.85rem;"></i>
        </button>
        <button
          v-if="previewSrc"
          type="button"
          class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center p-1"
          style="width: 32px; height: 32px;"
          title="Download Image"
          @click="downloadImage(previewSrc, label)"
        >
          <i class="pi pi-download" style="font-size: 0.85rem;"></i>
        </button>
        <button
          v-if="!disabled"
          type="button"
          class="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center p-1"
          style="width: 32px; height: 32px;"
          title="Remove Image"
          @click="removeImage"
        >
          <i class="pi pi-trash" style="font-size: 0.85rem;"></i>
        </button>
      </div>
    </div>

    <!-- Dropzone Area (shown when no image is selected) -->
    <div
      v-show="!hasStoredImage"
      :id="dropzoneElementId"
      ref="dropzoneElement"
      class="dropzone-box border border-dashed rounded text-center p-3"
      :class="{ 
        'dropzone-disabled': disabled,
        'dropzone-required': required,
        'dropzone-optional': !required
      }"
    >
      <div class="dz-message d-flex flex-column align-items-center justify-content-center gap-1 cursor-pointer">
        <div 
          class="dz-icon-circle rounded-circle d-flex align-items-center justify-content-center mb-1"
          :class="required ? 'dz-icon-circle-required' : 'dz-icon-circle-optional'"
        >
          <i 
            class="pi pi-cloud-upload" 
            :style="{
              fontSize: '1.35rem',
              color: required ? 'var(--bs-primary, #e74c5a)' : '#64748b'
            }"
          ></i>
        </div>
        <div class="small fw-semibold text-dark">
          Drag & drop image here or <span :class="required ? 'text-primary text-decoration-underline' : 'text-secondary text-decoration-underline'">browse</span>
        </div>
        <div class="text-muted" style="font-size: 0.72rem;">
          PNG, JPG, WEBP, GIF (Max {{ maxFilesize }}MB)
        </div>
      </div>
    </div>

    <!-- Full Image Preview Modal -->
    <Dialog
      v-model:visible="showFullPreview"
      modal
      :header="label || 'Image Preview'"
      :style="{ width: '90vw', maxWidth: '600px' }"
      :closable="true"
    >
      <div class="text-center p-2">
        <!--
        <img
          :src="modelValue"
          alt="Full Image Preview"
          class="img-fluid rounded shadow-sm"
          style="max-height: 70vh; object-fit: contain;"
        />
        <ExifPanel v-if="showExifInfo" :src="modelValue" />
        -->
        <!-- Gene - Oct 23, 2026: Use previewSrc for full image preview to support Google Drive links and base64 URLs safely -->
        <img
          :src="previewSrc"
          alt="Full Image Preview"
          class="img-fluid rounded shadow-sm"
          style="max-height: 70vh; object-fit: contain;"
        />
        <ExifPanel v-if="showExifInfo" :src="previewSrc" />
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 flex-wrap">
          <button
            v-if="hasStoredImage"
            type="button"
            class="btn btn-sm d-flex align-items-center gap-1"
            :class="showExifInfo ? 'btn-secondary' : 'btn-outline-secondary'"
            @click="showExifInfo = !showExifInfo"
          >
            <i class="pi pi-info-circle"></i>
            <span>EXIF Info</span>
          </button>
          <button
            v-if="previewSrc"
            type="button"
            class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            @click="downloadImage(previewSrc, label)"
          >
            <i class="pi pi-download"></i>
            <span>Download</span>
          </button>
          <button
            v-if="previewSrc"
            type="button"
            class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            @click="openImageInNewTab(previewSrc)"
          >
            <i class="pi pi-external-link"></i>
            <span>Open in New Tab</span>
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="showFullPreview = false">
            Close
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Dropzone } from 'dropzone'
import 'dropzone/dist/dropzone.css'
import Dialog from 'primevue/dialog'
import exifr from 'exifr'
import ExifPanel from './ExifPanel.vue'
// import { downloadImage, openImageInNewTab } from '../utils/imageActions'
// Gene - Oct 23, 2026: Import getDirectImageUrl to resolve Google Drive links into direct images
import { downloadImage, openImageInNewTab, getDirectImageUrl } from '../utils/imageActions'

// Disable dropzone auto discovery
Dropzone.autoDiscover = false

/*
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  fieldId: {
    type: String,
    default: () => `dz-${Math.random().toString(36).substring(2, 9)}`
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  maxFilesize: {
    type: Number,
    default: 5 // in MB
  },
  acceptedFiles: {
    type: String,
    default: 'image/jpeg,image/png,image/webp,image/gif,image/bmp'
  }
})
*/
// Gene - Oct 23, 2026: Support [String, Object] for modelValue to avoid Vue prop warnings on LCPNapLocations objects, and add loading prop
const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  fieldId: {
    type: String,
    default: () => `dz-${Math.random().toString(36).substring(2, 9)}`
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  maxFilesize: {
    type: Number,
    default: 5 // in MB
  },
  acceptedFiles: {
    type: String,
    default: 'image/jpeg,image/png,image/webp,image/gif,image/bmp'
  }
})

/*
const emit = defineEmits(['update:modelValue', 'change', 'exif'])
*/
// Gene - Oct 11, 2026: Added file-selected and file-removed emits to pass compressed binary File/Blob to parent forms for multipart upload
const emit = defineEmits(['update:modelValue', 'change', 'exif', 'file-selected', 'file-removed'])

const dropzoneElement = ref(null)
const dropzoneElementId = ref(`dropzone-${props.fieldId}`)
const showFullPreview = ref(false)
const showExifInfo = ref(false)
let dropzoneInstance = null

// Fold the metadata panel away when the preview closes so the dialog
// reopens on the image itself.
watch(showFullPreview, (open) => {
  if (!open) showExifInfo.value = false
})

const isBase64 = (str) => {
  return typeof str === 'string' && (str.startsWith('data:image/') || str.length > 500)
}

// Gene - Oct 23, 2026: Helper to check if modelValue is a Google Drive URL
const isGoogleDrive = (str) => {
  return typeof str === 'string' && (str.includes('drive.google.com') || str.includes('lh3.googleusercontent.com'))
}

// Gene - Oct 23, 2026: Computed renderable image source resolving Google Drive IDs and base64 URLs
const previewSrc = computed(() => {
  if (!props.modelValue) return ''
  if (typeof props.modelValue === 'string') {
    return getDirectImageUrl(props.modelValue)
  }
  return ''
})

// Gene - Oct 23, 2026: Determine whether a stored reference exists (file path, object, or data URL)
const hasStoredImage = computed(() => {
  if (!props.modelValue) return false
  if (typeof props.modelValue === 'string') {
    const t = props.modelValue.trim()
    return t !== '' && t.toLowerCase() !== 'none' && t.toLowerCase() !== 'n/a'
  }
  if (typeof props.modelValue === 'object' && props.modelValue !== null) {
    return true
  }
  return false
})

const displayFileName = computed(() => {
  if (typeof props.modelValue === 'object' && props.modelValue) {
    return props.modelValue.fileName || props.modelValue.name || ''
  }
  if (typeof props.modelValue === 'string') {
    if (props.modelValue.includes('\\') || props.modelValue.includes('/')) {
      return props.modelValue.split(/[\\/]/).pop() || props.modelValue
    }
    return props.modelValue
  }
  return ''
})

// Compression tuning, mirrored from the user website's DropzoneUploader so
// admin-entered applications carry the same payload sizes as online ones.
const COMPRESS_MAX_DIMENSION = 1600
const COMPRESS_QUALITY = 0.8
const COMPRESS_THRESHOLD_BYTES = 300 * 1024

// Sizes shown on the preview card for the file uploaded in this session.
const originalSize = ref('')
const compressedSize = ref('')
// Important EXIF pulled off the original file ({ lat, lng, takenAt, camera }).
const photoExif = ref(null)

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return ''
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const approxDataUrlBytes = (dataUrl) => {
  const base64Part = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.round(base64Part.length * 3 / 4)
}

// Size label for images that arrived from the API rather than this session's
// upload (no original/compressed pair to show — just how big the value is).
const storedSizeLabel = computed(() => {
  if (originalSize.value || !isBase64(props.modelValue)) return ''
  return formatBytes(approxDataUrlBytes(props.modelValue))
})

const readAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(new Error('File could not be read'))
  reader.onload = (e) => resolve(e.target?.result || '')
  reader.readAsDataURL(file)
})

// Pull the metadata that matters for dispatch verification: where and when
// the photo was taken, and on what device. Must run on the ORIGINAL file —
// canvas re-encoding strips EXIF.
const extractImportantExif = async (file) => {
  try {
    const data = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate', 'Make', 'Model',
             'GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef']
    })
    if (!data) return null
    const dmsToDecimal = (dms, ref) => {
      if (typeof dms === 'number') return (ref === 'S' || ref === 'W') ? -dms : dms
      if (!Array.isArray(dms) || dms.length < 1) return null
      const [d = 0, m = 0, s = 0] = dms
      const dec = d + m / 60 + s / 3600
      return (ref === 'S' || ref === 'W') ? -dec : dec
    }
    const lat = typeof data.latitude === 'number' ? data.latitude : dmsToDecimal(data.GPSLatitude, data.GPSLatitudeRef)
    const lng = typeof data.longitude === 'number' ? data.longitude : dmsToDecimal(data.GPSLongitude, data.GPSLongitudeRef)
    const rawDate = data.DateTimeOriginal || data.CreateDate || null
    const takenAt = rawDate && !isNaN(new Date(rawDate).getTime()) ? new Date(rawDate).toISOString() : null
    const camera = [data.Make, data.Model].filter(Boolean).join(' ').trim() || null
    if (lat === null && !takenAt && !camera) return null
    return { lat, lng, takenAt, camera }
  } catch (e) {
    // A photo without readable EXIF is still a perfectly good upload.
    return null
  }
}

/*
const compressImage = async (file) => {
  let bitmap
  try {
    // createImageBitmap applies EXIF orientation, so the re-encoded copy
    // stays upright even though its metadata is gone.
    bitmap = await createImageBitmap(file)
  } catch (e) {
    return null // undecodable here — keep the original
  }
  try {
    const scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    // JPEG has no alpha channel; without this a transparent PNG turns black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bitmap, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', COMPRESS_QUALITY)
  } finally {
    bitmap.close()
  }
}
*/
// Gene - Oct 11, 2026: Enhanced compressImage to return both base64 preview dataURL and compressed binary Blob for multipart/form-data upload
const compressImage = async (file) => {
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch (e) {
    return null
  }
  try {
    const scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bitmap, 0, 0, w, h)
    const dataUrl = canvas.toDataURL('image/jpeg', COMPRESS_QUALITY)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', COMPRESS_QUALITY))
    return { dataUrl, blob }
  } finally {
    bitmap.close()
  }
}

const formatTakenAt = (iso) => {
  const d = new Date(iso)
  return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const initDropzone = () => {
  if (!dropzoneElement.value || dropzoneInstance) return

  try {
    dropzoneInstance = new Dropzone(dropzoneElement.value, {
      url: '#',
      autoProcessQueue: false,
      maxFiles: 1,
      maxFilesize: props.maxFilesize,
      acceptedFiles: props.acceptedFiles,
      createImageThumbnails: false,
      previewTemplate: '<div style="display:none"></div>',
      dictDefaultMessage: '',
      dictFileTooBig: `File is too large ({{filesize}}MB). Max size is ${props.maxFilesize}MB.`,
      dictInvalidFileType: 'Invalid file type. Please upload an image.'
    })

    /*
    dropzoneInstance.on('addedfile', async (file) => {
      if (props.disabled) return

      try {
        // EXIF first, from the untouched file, then the base64 — compressed
        // when the file is large enough for it to pay off and the re-encoded
        // copy actually comes out smaller.
        const meta = await extractImportantExif(file)
        const original = await readAsDataURL(file)
        const compressed = file.size > COMPRESS_THRESHOLD_BYTES ? await compressImage(file) : null

        let base64 = original
        originalSize.value = formatBytes(file.size)
        compressedSize.value = ''
        if (compressed && compressed.length < original.length) {
          base64 = compressed
          compressedSize.value = formatBytes(approxDataUrlBytes(compressed))
        }

        photoExif.value = meta
        emit('update:modelValue', base64)
        emit('change', base64)
        emit('exif', meta)
      } catch (e) {
        console.warn('Image could not be processed:', e)
      }

      // Clear Dropzone queue so it is ready for subsequent files
      setTimeout(() => {
        if (dropzoneInstance) {
          dropzoneInstance.removeAllFiles(true)
        }
      }, 100)
    })
    */
    // Gene - Oct 11, 2026: Emit binary compressed File/Blob alongside base64 preview for multipart upload
    dropzoneInstance.on('addedfile', async (file) => {
      if (props.disabled) return

      try {
        const meta = await extractImportantExif(file)
        const original = await readAsDataURL(file)
        const compressed = file.size > COMPRESS_THRESHOLD_BYTES ? await compressImage(file) : null

        let base64 = original
        let binaryBlob = file
        originalSize.value = formatBytes(file.size)
        compressedSize.value = ''
        if (compressed && compressed.blob && compressed.blob.size < file.size) {
          base64 = compressed.dataUrl
          const newName = file.name ? file.name.replace(/\.[^.]+$/, '.jpg') : 'compressed.jpg'
          binaryBlob = new File([compressed.blob], newName, { type: 'image/jpeg' })
          compressedSize.value = formatBytes(compressed.blob.size)
        }

        photoExif.value = meta
        emit('update:modelValue', base64)
        emit('change', base64)
        emit('exif', meta)
        emit('file-selected', { file: binaryBlob, col: props.fieldId, name: binaryBlob.name || file.name })
      } catch (e) {
        console.warn('Image could not be processed:', e)
      }

      // Clear Dropzone queue so it is ready for subsequent files
      setTimeout(() => {
        if (dropzoneInstance) {
          dropzoneInstance.removeAllFiles(true)
        }
      }, 100)
    })

    dropzoneInstance.on('error', (file, message) => {
      console.warn('Dropzone upload error:', message)
      if (typeof message === 'string') {
        alert(message)
      }
      if (dropzoneInstance) {
        dropzoneInstance.removeAllFiles(true)
      }
    })
  } catch (err) {
    console.error('Error initializing Dropzone:', err)
  }
}

/*
const removeImage = () => {
  originalSize.value = ''
  compressedSize.value = ''
  photoExif.value = null
  emit('update:modelValue', '')
  emit('change', '')
  emit('exif', null)
  if (dropzoneInstance) {
    dropzoneInstance.removeAllFiles(true)
  }
}
*/
// Gene - Oct 11, 2026: Emit file-removed on removal so parent form registers deletion flag and clears binary file
const removeImage = () => {
  originalSize.value = ''
  compressedSize.value = ''
  photoExif.value = null
  emit('update:modelValue', '')
  emit('change', '')
  emit('exif', null)
  emit('file-removed', { col: props.fieldId })
  if (dropzoneInstance) {
    dropzoneInstance.removeAllFiles(true)
  }
}

onMounted(() => {
  initDropzone()
})

onBeforeUnmount(() => {
  if (dropzoneInstance) {
    try {
      dropzoneInstance.destroy()
    } catch (e) {
      // ignore
    }
    dropzoneInstance = null
  }
})

// When the parent clears the field (new record, form reset) the session's
// size labels and EXIF chips belong to an image that is gone.
watch(() => props.modelValue, (val) => {
  if (!val) {
    originalSize.value = ''
    compressedSize.value = ''
    photoExif.value = null
  }
})

watch(() => props.disabled, (newVal) => {
  if (dropzoneInstance) {
    if (newVal) {
      dropzoneInstance.disable()
    } else {
      dropzoneInstance.enable()
    }
  }
})
</script>

<style scoped>
.image-dropzone-wrapper {
  width: 100%;
}

.dropzone-box {
  background-color: var(--bs-light, #f8f9fa);
  border-color: #dee2e6 !important;
  transition: all 0.2s ease-in-out;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.dropzone-box.dropzone-required:hover:not(.dropzone-disabled) {
  border-color: var(--bs-primary, #e74c5a) !important;
  background-color: rgba(var(--bs-primary-rgb, 231, 76, 90), 0.04);
}

.dropzone-box.dropzone-optional:hover:not(.dropzone-disabled) {
  border-color: #64748b !important;
  background-color: rgba(100, 116, 139, 0.04);
}

.dropzone-box.dropzone-required.dz-drag-hover {
  border-color: var(--bs-primary, #e74c5a) !important;
  background-color: rgba(var(--bs-primary-rgb, 231, 76, 90), 0.08);
}

.dropzone-box.dropzone-optional.dz-drag-hover {
  border-color: #64748b !important;
  background-color: rgba(100, 116, 139, 0.08);
}

.dz-icon-circle-required {
  width: 40px;
  height: 40px;
  background-color: rgba(var(--bs-primary-rgb, 231, 76, 90), 0.1);
}

.dz-icon-circle-optional {
  width: 40px;
  height: 40px;
  background-color: rgba(100, 116, 139, 0.12);
}

.dropzone-disabled {
  opacity: 0.6;
  cursor: not-allowed !important;
  pointer-events: none;
}

.dropzone-preview-card {
  background-color: var(--bs-body-bg, #fff);
  border-color: var(--bs-border-color, #dee2e6) !important;
  min-height: 58px;
}

.preview-thumbnail-container {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.preview-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-zoom-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
}

.preview-thumbnail-container:hover .preview-zoom-overlay {
  opacity: 1;
}
</style>
