<template>
  <div class="mt-3">
    <div v-if="error" class="alert alert-danger d-flex align-items-center rounded-3 p-3 mb-0">
      <i class="pi pi-exclamation-circle me-2"></i> Error loading {{ endpoint }}: {{ error }}
    </div>
    
    <DataTable 
      v-else 
      :value="data" 
      :loading="loading"
      responsiveLayout="scroll" 
      :paginator="true" 
      :rows="10" 
      class="p-datatable-sm small"
      stripedRows
    >
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import apiClient from '../services/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const props = defineProps({
  endpoint: {
    type: String,
    required: true
  }
})

const data = ref([])
const loading = ref(false)
const error = ref(null)

// Dynamically generate column headers from the first object in the array
const columns = computed(() => {
  if (data.value && data.value.length > 0) {
    return Object.keys(data.value[0])
  }
  return []
})

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await apiClient.get(`/${props.endpoint}`)
    console.log(`Response for ${props.endpoint}:`, response)
    data.value = response || []
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
