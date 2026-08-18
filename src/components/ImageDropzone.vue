<template>
  <div class="image-dropzone-wrapper">
    <!-- Existing/Current Image Preview -->
    <div v-if="modelValue" class="dropzone-preview-card border rounded p-2 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-3 overflow-hidden">
        <div class="preview-thumbnail-container" @click="showFullPreview = true">
          <img :src="modelValue" alt="Uploaded Image" class="preview-thumbnail rounded" />
          <div class="preview-zoom-overlay">
            <i class="pi pi-eye text-white"></i>
          </div>
        </div>
        <div class="text-truncate">
          <div class="fw-semibold small text-truncate">{{ label || 'Image' }}</div>
          <small class="text-muted" style="font-size: 0.75rem;">
            {{ isBase64(modelValue) ? 'Base64 Image' : (modelValue.startsWith('http') ? 'Remote URL' : 'Uploaded File') }}
          </small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-1 flex-shrink-0">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center p-1"
          style="width: 32px; height: 32px;"
          title="Preview Image"
          @click="showFullPreview = true"
        >
          <i class="pi pi-eye" style="font-size: 0.85rem;"></i>
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
      v-show="!modelValue"
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
        <img
          :src="modelValue"
          alt="Full Image Preview"
          class="img-fluid rounded shadow-sm"
          style="max-height: 70vh; object-fit: contain;"
        />
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2">
          <a
            v-if="modelValue && !isBase64(modelValue)"
            :href="modelValue"
            target="_blank"
            class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          >
            <i class="pi pi-external-link"></i>
            <span>Open in New Tab</span>
          </a>
          <button type="button" class="btn btn-sm btn-primary" @click="showFullPreview = false">
            Close
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Dropzone } from 'dropzone'
import 'dropzone/dist/dropzone.css'
import Dialog from 'primevue/dialog'

// Disable dropzone auto discovery
Dropzone.autoDiscover = false

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

const emit = defineEmits(['update:modelValue', 'change'])

const dropzoneElement = ref(null)
const dropzoneElementId = ref(`dropzone-${props.fieldId}`)
const showFullPreview = ref(false)
let dropzoneInstance = null

const isBase64 = (str) => {
  return typeof str === 'string' && (str.startsWith('data:image/') || str.length > 500)
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

    dropzoneInstance.on('addedfile', (file) => {
      if (props.disabled) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64Data = e.target.result
        emit('update:modelValue', base64Data)
        emit('change', base64Data)
      }
      reader.readAsDataURL(file)

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

const removeImage = () => {
  emit('update:modelValue', '')
  emit('change', '')
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
  background-color: #fff;
  border-color: #dee2e6 !important;
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
