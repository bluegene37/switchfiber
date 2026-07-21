<template>
  <div class="mt-3">
    <div v-if="error" class="alert alert-danger d-flex align-items-center rounded-3 p-3 mb-0">
      <i class="pi pi-exclamation-circle me-2"></i> Error loading {{ endpoint }}: {{ error }}
    </div>
    
    <DataTable 
      v-else 
      ref="dt"
      :value="data" 
      :loading="loading"
      responsiveLayout="scroll" 
      :paginator="true" 
      :rows="rowsPerPage" 
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
      v-model:filters="filters"
      filterDisplay="menu"
      :globalFilterFields="columns"
      class="p-datatable-sm small"
      stripedRows
    >
      <template #header>
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 py-2">
          
          <!-- Left: Rows per page -->
          <div class="d-flex align-items-center gap-2">
            <span class="mb-0 fw-medium text-body">Show</span>
            <select v-model="rowsPerPage" class="form-select form-select-sm text-center" style="width: 70px; cursor: pointer;">
              <option v-for="opt in rowOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <span class="mb-0 fw-medium text-body">entries</span>
          </div>

          <!-- Center: Buttons -->
          <div class="d-flex gap-2 justify-content-center" style="flex: 1;">
            <Button label="Create" icon="pi pi-plus" class="p-button-primary p-button-sm" @click="openCreateDialog" />
            <Button label="CSV" class="p-button-secondary p-button-sm p-button-outlined" @click="exportCSV" />
            <Button label="Print" class="p-button-secondary p-button-sm p-button-outlined" @click="printTable" />
          </div>
          
          <!-- Right: Search -->
          <div class="d-flex align-items-center gap-2">
            <label for="global-search" class="mb-0 fw-medium text-body">Search:</label>
            <InputText id="global-search" v-model="filters['global'].value" class="p-inputtext-sm" />
          </div>
        </div>
      </template>

      <Column v-for="col in columns" :key="col" :field="col" :header="col" :sortable="true">
        <template #body="slotProps">
          <span class="d-inline-block text-truncate" style="max-width: 200px;" :title="slotProps.data[col]">
            {{ slotProps.data[col] !== null ? slotProps.data[col] : '-' }}
          </span>
        </template>
      </Column>
      <template #empty>
        <div class="p-5 text-center text-secondary">
          No data available for {{ endpoint }}.
        </div>
      </template>
    </DataTable>

    <!-- Create Record Dialog -->
    <Dialog v-model:visible="displayCreateDialog" modal :header="`Create New Record`" :style="{ width: '90vw', maxWidth: '800px' }">
      <div class="row g-3 mt-1">
        <div class="col-12 col-md-6" v-for="col in formColumns" :key="col">
          <label :for="col" class="form-label fw-medium text-body small mb-1">{{ col }}</label>
          <InputText :id="col" v-model="formData[col]" class="w-100 p-inputtext-sm" />
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary p-button-sm" @click="displayCreateDialog = false" />
          <Button label="Save" icon="pi pi-check" class="p-button-primary p-button-sm" @click="saveData" :loading="saving" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import apiClient from '../services/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import { EndpointColumns } from '../models/columns'

const props = defineProps({
  endpoint: {
    type: String,
    required: true
  }
})

const data = ref([])
const loading = ref(false)
const error = ref(null)
const dt = ref()

const rowsPerPage = ref(10)
const rowOptions = ref([5, 10, 20, 50])

const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

// Dialog State
const displayCreateDialog = ref(false)
const formData = ref({})
const saving = ref(false)

// Dynamically generate column headers from the first object in the array,
// or fallback to the static mapping if the table is empty.
const columns = computed(() => {
  if (data.value && data.value.length > 0) {
    return Object.keys(data.value[0])
  }
  return EndpointColumns[props.endpoint] || []
})

// Filter out system-generated fields (id, dates) from the Create form
const formColumns = computed(() => {
  return columns.value.filter(col => {
    const lowerCol = col.toLowerCase()
    if (lowerCol === 'id') return false
    if (lowerCol.includes('created')) return false
    if (lowerCol.includes('modified')) return false
    if (lowerCol.includes('updated')) return false
    return true
  })
})

const exportCSV = () => {
  dt.value.exportCSV()
}

const printTable = () => {
  window.print()
}

const openCreateDialog = () => {
  formData.value = {}
  formColumns.value.forEach(col => {
    formData.value[col] = ''
  })
  displayCreateDialog.value = true
}

const saveData = async () => {
  saving.value = true
  try {
    const payload = { ...formData.value }
    // Convert string numbers to real numbers where possible to avoid backend schema errors
    Object.keys(payload).forEach(key => {
      if (payload[key] !== '' && !isNaN(payload[key])) {
        payload[key] = Number(payload[key])
      }
    })
    
    await apiClient.post(`/${props.endpoint}`, payload)
    
    // Refresh table
    await fetchData()
    displayCreateDialog.value = false
  } catch (err) {
    console.error(`Error creating record:`, err)
    alert(err.message || 'Failed to create record. See console for details.')
  } finally {
    saving.value = false
  }
}

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await apiClient.get(`/${props.endpoint}`)
    
    let unwrappedData = response
    if (response && !Array.isArray(response) && typeof response === 'object') {
      const arrayKey = Object.keys(response).find(key => Array.isArray(response[key]))
      if (arrayKey) {
        unwrappedData = response[arrayKey]
      } else {
        unwrappedData = []
      }
    }
    
    data.value = unwrappedData || []
  } catch (err) {
    console.error(`Error for ${props.endpoint}:`, err)
    error.value = err.message || 'Failed to fetch data'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
