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
      scrollable
      :paginator="true" 
      :rows="rowsPerPage" 
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
      v-model:filters="filters"
      v-model:selection="selectedRow"
      selectionMode="single"
      @row-select="handleRowSelect"
      @row-unselect="handleRowUnselect"
      @selection-change="handleSelectionChange"
      dataKey="id"
      filterDisplay="menu"
      :globalFilterFields="columns"
      :class="['p-datatable-sm small', { 'no-row-highlight': isMenuEndpoint, 'highlight-selected-row': !isMenuEndpoint }]"
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

          <!-- Center: Export Actions & Create (if not hidden) -->
          <div class="d-flex gap-2 justify-content-center flex-wrap" style="flex: 1;">
            <Button v-if="!hideCreateButton" label="Create" icon="pi pi-plus" class="p-button-primary p-button-sm" @click="openCreateDialog" />
            <Button label="CSV" icon="pi pi-download" class="p-button-secondary p-button-sm p-button-outlined" @click="exportCSV" />
            <Button label="PDF" icon="pi pi-file-pdf" class="p-button-secondary p-button-sm p-button-outlined" @click="exportPDF" />
            <Button label="Print" icon="pi pi-print" class="p-button-secondary p-button-sm p-button-outlined" @click="printTable" />
          </div>
          
          <!-- Right: Search -->
          <div class="d-flex align-items-center gap-2">
            <label for="global-search" class="mb-0 fw-medium text-body">Search:</label>
            <InputText id="global-search" v-model="filters['global'].value" class="p-inputtext-sm" placeholder="Search..." />
          </div>
        </div>
      </template>

      <Column v-for="col in columns" :key="col" :field="col" :header="formatLabel(col)" :sortable="true">
        <template #body="slotProps">
          <span v-if="col.toLowerCase() === 'active'">
            <span v-if="slotProps.data[col] === true || slotProps.data[col] === 'true'" class="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1">Active</span>
            <span v-else class="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-2.5 py-1">Inactive</span>
          </span>
          <span v-else-if="col.toLowerCase() === 'accesslevel_id' || col.toLowerCase() === 'accesslevelid'">
            {{ getAccessLevelLabel(slotProps.data[col]) }}
          </span>
          <span v-else class="d-inline-block text-truncate" style="max-width: 200px;" :title="col.toLowerCase() === 'password' ? '••••••••' : slotProps.data[col]">
            <span v-if="col.toLowerCase() === 'password'" class="text-muted">••••••••</span>
            <span v-else>{{ slotProps.data[col] !== null && slotProps.data[col] !== undefined ? slotProps.data[col] : '-' }}</span>
          </span>
        </template>
      </Column>


      <!-- Actions Column (Frozen on Right) -->
      <Column header="Actions" alignFrozen="right" :frozen="true" :style="{ minWidth: isMenuEndpoint ? '150px' : '100px', width: isMenuEndpoint ? '150px' : '100px' }" class="text-center frozen-actions-col">
        <template #body="slotProps">
          <div class="d-flex gap-1.5 justify-content-center align-items-center" @click.stop>
            <!-- Interactive Toggle Switch in Actions Column for Menus -->
            <ToggleSwitch 
              v-if="isMenuEndpoint" 
              :modelValue="isMenuLinked(slotProps.data) === true" 
              :disabled="!selectedAccessLevel || togglingMenuId === slotProps.data.id" 
              @update:modelValue="toggleMenuLink(slotProps.data)"
              :title="!selectedAccessLevel ? 'Select an Access Level on the left table first' : (isMenuLinked(slotProps.data) ? 'Click to Unlink Menu' : 'Click to Link Menu')" 
              class="me-1"
            />

            <Button 
              icon="pi pi-pencil" 
              class="p-button-text p-button-sm p-button-rounded p-button-secondary p-1" 
              style="width: 32px; height: 32px;"
              title="Edit Record" 
              @click="openEditDialog(slotProps.data)" 
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-text p-button-sm p-button-rounded p-button-danger p-1" 
              style="width: 32px; height: 32px;"
              title="Delete Record" 
              @click="confirmDelete(slotProps.data)" 
            />
          </div>
        </template>
      </Column>
      <template #empty>
        <div class="p-5 text-center text-secondary">
          No data available for {{ endpoint }}.
        </div>
      </template>
    </DataTable>

    <!-- Enhanced Create Record Dialog -->
    <Dialog 
      v-model:visible="displayCreateDialog" 
      modal 
      :header="`Create New ${formatLabel(endpoint)} Record`" 
      :style="modalStyle"
      :breakpoints="modalBreakpoints"
    >
      <div v-if="saveError" class="alert alert-danger d-flex align-items-center rounded-3 p-2 mb-3 small">
        <i class="pi pi-exclamation-triangle me-2"></i> {{ saveError }}
      </div>

      <div class="row g-3 mt-1 pe-2" style="max-height: 70vh; overflow-y: auto;">
        <div 
          v-for="col in formColumns" 
          :key="col" 
          :class="getColumnClass(col)"
        >
          <label :for="col" class="form-label fw-medium text-body small mb-1">
            {{ formatLabel(col) }}
          </label>

          <!-- Toggle Switch for Active / Boolean fields -->
          <div v-if="getFieldType(col) === 'toggle'" class="d-flex align-items-center gap-3 pt-2">
            <ToggleSwitch :id="col" v-model="formData[col]" />
            <span class="small fw-semibold" :class="formData[col] ? 'text-success' : 'text-secondary'">
              {{ formData[col] ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <!-- Access Level Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'accesslevel_dropdown'" 
            :id="col" 
            v-model="formData[col]" 
            :options="accessLevels" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select Access Level" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- Menu Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'menu_dropdown'" 
            :id="col" 
            v-model="formData[col]" 
            :options="menusList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select Menu" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- LCNAP Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'lcpnap_dropdown'" 
            :id="col" 
            v-model="formData[col]" 
            :options="lcpnapsList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select LCNAP" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- LCP Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'lcp_dropdown'" 
            :id="col" 
            v-model="formData[col]" 
            :options="lcpsList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select LCP" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- NAP Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'nap_dropdown'" 
            :id="col" 
            v-model="formData[col]" 
            :options="napsList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select NAP" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- Port Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'port_dropdown'" 
            :id="col" 
            v-model="formData[col]" 
            :options="portsList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select Port" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- VLAN Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'vlan_dropdown'" 
            :id="col" 
            v-model="formData[col]" 
            :options="vlansList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select VLAN" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- Plan Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'plan_dropdown'" 
            :id="col" 
            v-model="formData[col]" 
            :options="plansList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select Plan" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- Confirm Password Field -->
          <div v-else-if="getFieldType(col) === 'confirm_password'">
            <InputText 
              :id="col" 
              type="password"
              v-model="formData[col]" 
              class="w-100 p-inputtext-sm" 
              :class="{ 'is-invalid': formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword }"
              placeholder="Confirm password"
            />
            <div v-if="formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword" class="text-danger small mt-1" style="font-size: 0.75rem;">
              <i class="pi pi-exclamation-circle me-1"></i> Passwords do not match
            </div>
          </div>

          <!-- Password Field -->
          <InputText 
            v-else-if="getFieldType(col) === 'password'" 
            :id="col" 
            type="password"
            v-model="formData[col]" 
            class="w-100 p-inputtext-sm" 
            placeholder="Enter password"
          />

          <!-- DatePicker for Date Fields -->
          <DatePicker 
            v-else-if="getFieldType(col) === 'date'" 
            :id="col" 
            v-model="formData[col]" 
            showIcon 
            iconDisplay="input"
            fluid
            size="small"
            dateFormat="yy-mm-dd" 
            placeholder="Select date" 
            class="w-100"
          />

          <!-- Email Input for Email Fields -->
          <InputText 
            v-else-if="getFieldType(col) === 'email'" 
            :id="col" 
            type="email"
            v-model="formData[col]" 
            class="w-100 p-inputtext-sm" 
            :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
          />

          <!-- InputNumber for Numeric Fields -->
          <InputNumber 
            v-else-if="getFieldType(col) === 'number'" 
            :id="col" 
            v-model="formData[col]" 
            fluid
            size="small"
            class="w-100" 
            :useGrouping="false"
            :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
          />

          <!-- Textarea for Multiline Fields -->
          <Textarea 
            v-else-if="getFieldType(col) === 'textarea'" 
            :id="col" 
            v-model="formData[col]" 
            rows="3" 
            class="w-100 p-inputtext-sm" 
            :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
          />

          <!-- InputText for Standard Fields -->
          <InputText 
            v-else 
            :id="col" 
            v-model="formData[col]" 
            class="w-100 p-inputtext-sm" 
            :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
          />
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary p-button-sm" @click="displayCreateDialog = false" />
          <Button label="Save Record" icon="pi pi-check" class="p-button-primary p-button-sm" @click="saveData" :loading="saving" />
        </div>
      </template>
    </Dialog>

    <!-- Edit Record Dialog -->
    <Dialog 
      v-model:visible="displayEditDialog" 
      modal 
      :header="`Update ${formatLabel(endpoint)} Record #${editingRecordId || ''}`" 
      :style="modalStyle"
      :breakpoints="modalBreakpoints"
    >
      <div v-if="editError" class="alert alert-danger d-flex align-items-center rounded-3 p-2 mb-3 small">
        <i class="pi pi-exclamation-triangle me-2"></i> {{ editError }}
      </div>

      <div class="row g-3 mt-1 pe-2" style="max-height: 70vh; overflow-y: auto;">
        <div 
          v-for="col in formColumns" 
          :key="col" 
          :class="getColumnClass(col)"
        >
          <label :for="`edit-${col}`" class="form-label fw-medium text-body small mb-1">
            {{ formatLabel(col) }}
          </label>

          <!-- Toggle Switch for Active / Boolean fields -->
          <div v-if="getFieldType(col) === 'toggle'" class="d-flex align-items-center gap-3 pt-2">
            <ToggleSwitch :id="`edit-${col}`" v-model="editFormData[col]" />
            <span class="small fw-semibold" :class="editFormData[col] ? 'text-success' : 'text-secondary'">
              {{ editFormData[col] ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <!-- Access Level Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'accesslevel_dropdown'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            :options="accessLevels" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select Access Level" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- Menu Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'menu_dropdown'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            :options="menusList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select Menu" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- LCNAP Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'lcpnap_dropdown'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            :options="lcpnapsList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select LCNAP" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- LCP Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'lcp_dropdown'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            :options="lcpsList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select LCP" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- NAP Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'nap_dropdown'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            :options="napsList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select NAP" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- Port Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'port_dropdown'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            :options="portsList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select Port" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- VLAN Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'vlan_dropdown'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            :options="vlansList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select VLAN" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- Plan Dropdown -->
          <Select 
            v-else-if="getFieldType(col) === 'plan_dropdown'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            :options="plansList" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select Plan" 
            class="w-100 p-inputtext-sm" 
          />

          <!-- Confirm Password Field -->
          <div v-else-if="getFieldType(col) === 'confirm_password'">
            <InputText 
              :id="`edit-${col}`" 
              type="password"
              v-model="editFormData[col]" 
              class="w-100 p-inputtext-sm" 
              :class="{ 'is-invalid': editFormData.password && editFormData.confirmPassword && editFormData.password !== editFormData.confirmPassword }"
              placeholder="Confirm password"
            />
            <div v-if="editFormData.password && editFormData.confirmPassword && editFormData.password !== editFormData.confirmPassword" class="text-danger small mt-1" style="font-size: 0.75rem;">
              <i class="pi pi-exclamation-circle me-1"></i> Passwords do not match
            </div>
          </div>

          <!-- Password Field -->
          <InputText 
            v-else-if="getFieldType(col) === 'password'" 
            :id="`edit-${col}`" 
            type="password"
            v-model="editFormData[col]" 
            class="w-100 p-inputtext-sm" 
            placeholder="Enter password"
          />

          <!-- DatePicker for Date Fields -->
          <DatePicker 
            v-else-if="getFieldType(col) === 'date'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            showIcon 
            iconDisplay="input"
            fluid
            size="small"
            dateFormat="yy-mm-dd" 
            placeholder="Select date" 
            class="w-100"
          />

          <!-- Email Input for Email Fields -->
          <InputText 
            v-else-if="getFieldType(col) === 'email'" 
            :id="`edit-${col}`" 
            type="email"
            v-model="editFormData[col]" 
            class="w-100 p-inputtext-sm" 
            :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
          />

          <!-- InputNumber for Numeric Fields -->
          <InputNumber 
            v-else-if="getFieldType(col) === 'number'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            fluid
            size="small"
            class="w-100" 
            :useGrouping="false"
            :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
          />

          <!-- Textarea for Multiline Fields -->
          <Textarea 
            v-else-if="getFieldType(col) === 'textarea'" 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            rows="3" 
            class="w-100 p-inputtext-sm" 
            :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
          />

          <!-- InputText for Standard Fields -->
          <InputText 
            v-else 
            :id="`edit-${col}`" 
            v-model="editFormData[col]" 
            class="w-100 p-inputtext-sm" 
            :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
          />
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary p-button-sm" @click="displayEditDialog = false" />
          <Button label="Update Record" icon="pi pi-check" class="p-button-primary p-button-sm" @click="saveEdit" :loading="savingEdit" />
        </div>
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="displayDeleteDialog" 
      modal 
      header="Confirm Delete" 
      :style="{ width: '90vw', maxWidth: '450px' }"
    >
      <div v-if="deleteError" class="alert alert-danger d-flex align-items-center rounded-3 p-2 mb-3 small">
        <i class="pi pi-exclamation-triangle me-2"></i> {{ deleteError }}
      </div>

      <div class="d-flex align-items-center gap-3 py-2">
        <i class="pi pi-exclamation-triangle text-danger fs-1"></i>
        <div>
          <p class="mb-1 fw-medium text-body">Are you sure you want to delete this record?</p>
          <span class="small text-secondary" v-if="recordToDelete">
            Record ID: <strong>{{ recordToDelete.id }}</strong>
            <span v-if="recordToDelete.fname || recordToDelete.username"> ({{ recordToDelete.fname || recordToDelete.username }})</span>
          </span>
        </div>
      </div>

      <template #footer>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary p-button-sm" @click="displayDeleteDialog = false" />
          <Button label="Delete Record" icon="pi pi-trash" class="p-button-danger p-button-sm" @click="deleteRecord" :loading="deleting" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import apiClient from '../services/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { EndpointColumns } from '../models/columns'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const toast = useToast()
const authStore = useAuthStore()
const { activeColorTheme, THEME_PALETTES } = useTheme()

const props = defineProps({
  endpoint: {
    type: String,
    required: true
  },
  hideCreateButton: {
    type: Boolean,
    default: false
  },
  selectedAccessLevel: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['row-select', 'row-unselect'])

// Determine if the endpoint is Menus (for adding row toggle switch controls)
const isMenuEndpoint = computed(() => {
  const ep = (props.endpoint || '').toLowerCase()
  return ep === 'menus' || ep === 'menu'
})

// Determine if the endpoint needs a wider 3-column modal (Job Orders & Billing Details) or standard 2-column modal
const isWideForm = computed(() => {
  const ep = (props.endpoint || '').toLowerCase()
  return ep === 'joborders' || ep === 'billingdetails' || ep === 'job_order' || ep === 'billing'
})

const modalStyle = computed(() => {
  if (isWideForm.value) {
    return { width: '95vw', maxWidth: '1200px' }
  }
  return { width: '90vw', maxWidth: '850px' }
})

const modalBreakpoints = computed(() => {
  if (isWideForm.value) {
    return { '1200px': '95vw', '960px': '98vw' }
  }
  return { '960px': '95vw' }
})

const getColumnClass = (col) => {
  if (getFieldType(col) === 'textarea') {
    return 'col-12'
  }
  return isWideForm.value ? 'col-12 col-md-6 col-lg-4' : 'col-12 col-md-6'
}

const data = ref([])
const selectedRow = ref(null)
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
const saveError = ref(null)

// Edit State
const displayEditDialog = ref(false)
const editFormData = ref({})
const editingRecordId = ref(null)
const savingEdit = ref(false)
const editError = ref(null)

// Delete State
const displayDeleteDialog = ref(false)
const recordToDelete = ref(null)
const deleting = ref(false)
const deleteError = ref(null)

// Format camelCase and underscore properties into human-readable Title Case
const formatLabel = (col) => {
  if (!col) return ''
  
  const customOverrides = {
    fname: 'First Name',
    mname: 'Middle Name',
    lname: 'Last Name',
    contactnumber: 'Contact Number',
    accountno: 'Account No.',
    fullname: 'Full Name',
    accountbalance: 'Account Balance',
    duedate: 'Due Date',
    accesslevel_id: 'Access Level',
    accesslevelid: 'Access Level',
    menu_id: 'Menu',
    menuid: 'Menu',
    lcpnap_id: 'LCNAP',
    lcpnapid: 'LCNAP',
    port_id: 'Port',
    portid: 'Port',
    lcp_id: 'LCP',
    lcpid: 'LCP',
    nap_id: 'NAP',
    napid: 'NAP',
    vlan_id: 'VLAN',
    vlanid: 'VLAN',
    plan_id: 'Plan',
    planid: 'Plan',
    confirmpassword: 'Confirm Password',
    email: 'Email',
    useremail: 'Email Address',
    rowversion: 'Row Version'
  }
  if (customOverrides[col.toLowerCase()]) {
    return customOverrides[col.toLowerCase()]
  }

  const acronyms = {
    id: 'ID',
    lcp: 'LCP',
    nap: 'NAP',
    lcnap: 'LCNAP',
    vlan: 'VLAN',
    sn: 'SN',
    ip: 'IP',
    jo: 'JO',
    splynx: 'Splynx',
    mikrotik: 'Mikrotik'
  }
  
  const words = col
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
  
  return words
    .map(word => {
      const lower = word.toLowerCase()
      if (acronyms[lower]) return acronyms[lower]
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

// Classify field types for smart form rendering
const getFieldType = (col) => {
  const lower = col.toLowerCase()
  if (lower.includes('email')) {
    return 'email'
  }
  if (lower === 'confirmpassword' || lower === 'confirm_password') {
    return 'confirm_password'
  }
  if (lower === 'active' || lower === 'isactive' || lower === 'enabled') {
    return 'toggle'
  }
  if (lower === 'accesslevel_id' || lower === 'accesslevelid') {
    return 'accesslevel_dropdown'
  }
  if (lower === 'menu_id' || lower === 'menuid') {
    return 'menu_dropdown'
  }
  if (lower === 'lcpnap_id' || lower === 'lcpnapid' || lower === 'lcnap_id' || lower === 'lcnapid') {
    return 'lcpnap_dropdown'
  }
  if (lower === 'lcp_id' || lower === 'lcpid') {
    return 'lcp_dropdown'
  }
  if (lower === 'nap_id' || lower === 'napid') {
    return 'nap_dropdown'
  }
  if (lower === 'port_id' || lower === 'portid') {
    return 'port_dropdown'
  }
  if (lower === 'vlan_id' || lower === 'vlanid') {
    return 'vlan_dropdown'
  }
  if (lower === 'plan_id' || lower === 'planid') {
    return 'plan_dropdown'
  }
  if (lower === 'password') {
    return 'password'
  }
  // Date / Timestamp fields
  if (
    lower.includes('date') ||
    lower.includes('timestamp')
  ) {
    return 'date'
  }
  // Numeric fields
  if (
    lower.includes('amount') ||
    lower.includes('fee') ||
    lower.includes('quantity') ||
    lower.includes('balance') ||
    lower.includes('day') ||
    (lower.includes('id') && (lower.endsWith('id') || lower.startsWith('id')) && !lower.includes('accesslevel') && !lower.includes('lcp') && !lower.includes('nap') && !lower.includes('port') && !lower.includes('vlan') && !lower.includes('plan')) ||
    lower === 'splynxid' ||
    lower === 'mikrotikid' ||
    lower === 'duration'
  ) {
    return 'number'
  }
  // Multiline text fields
  if (
    lower.includes('description') ||
    lower.includes('remark') ||
    (lower.includes('address') && !lower.includes('email')) ||
    lower.includes('landmark') ||
    lower.includes('template')
  ) {
    return 'textarea'
  }
  return 'text'
}

// Dynamically generate column headers from the first object in the array,
// or fallback to the static mapping if the table is empty.
const columns = computed(() => {
  let rawCols = []
  if (data.value && data.value.length > 0) {
    rawCols = Object.keys(data.value[0])
  } else {
    rawCols = [...(EndpointColumns[props.endpoint] || [])]
  }

  // Ensure 'id' or 'ID' or 'Id' is placed as the very first column if present
  const idIndex = rawCols.findIndex(c => c.toLowerCase() === 'id')
  if (idIndex > 0) {
    const [idCol] = rawCols.splice(idIndex, 1)
    rawCols.unshift(idCol)
  }

  return rawCols
})

// Filter out system-generated fields (id, dates, rowVersion) from forms
const formColumns = computed(() => {
  const list = columns.value.filter(col => {
    const lowerCol = col.toLowerCase()
    if (lowerCol === 'id') return false
    if (lowerCol.includes('created')) return false
    if (lowerCol.includes('modified')) return false
    if (lowerCol.includes('updated')) return false
    if (lowerCol.includes('rowversion') || lowerCol === 'rowversion') return false
    return true
  })

  // If username field exists, inject email immediately after username for 2-column alignment
  const usernameIndex = list.findIndex(c => c.toLowerCase() === 'username')
  if (usernameIndex !== -1 && !list.some(c => c.toLowerCase() === 'email' || c.toLowerCase() === 'useremail')) {
    list.splice(usernameIndex + 1, 0, 'email')
  }

  // If password field exists, inject confirmPassword immediately after password
  const pwdIndex = list.findIndex(c => c.toLowerCase() === 'password')
  if (pwdIndex !== -1 && !list.includes('confirmPassword')) {
    list.splice(pwdIndex + 1, 0, 'confirmPassword')
  }

  return list
})

const exportCSV = () => {
  if (dt.value) {
    dt.value.exportCSV()
  }
}

const exportPDF = () => {
  try {
    const doc = new jsPDF('landscape')
    const currentPalette = THEME_PALETTES[activeColorTheme.value] || THEME_PALETTES.green
    const pdfHeaderColor = currentPalette.pdfRgb || [16, 185, 129]

    const head = [columns.value.map(col => formatLabel(col))]
    
    const body = (data.value || []).map(row => {
      return columns.value.map(col => {
        if (col.toLowerCase() === 'password') {
          return '••••••••'
        }
        const val = row[col]
        return val !== null && val !== undefined ? String(val) : '-'
      })
    })

    doc.setFontSize(14)
    doc.text(`${formatLabel(props.endpoint)} Records`, 14, 15)

    autoTable(doc, {
      startY: 20,
      head: head,
      body: body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: pdfHeaderColor },
      margin: { top: 20 },
    })

    doc.save(`${props.endpoint}_export.pdf`)
  } catch (err) {
    console.error('Error generating PDF:', err)
    alert('Failed to generate PDF. Please try again.')
  }
}

const printTable = () => {
  window.print()
}

const accessLevels = ref([])
const menusList = ref([])
const lcpnapsList = ref([])
const lcpsList = ref([])
const napsList = ref([])
const portsList = ref([])
const vlansList = ref([])
const plansList = ref([])

const fetchRelatedData = async () => {
  try {
    const unwrap = (val) => {
      if (!val) return []
      if (Array.isArray(val)) return val
      if (typeof val === 'object') {
        const key = Object.keys(val).find(k => Array.isArray(val[k]))
        if (key) return val[key]
      }
      return []
    }

    const [accRes, menuRes, lcnapRes, lcpRes, napRes, portRes, vlanRes, planRes] = await Promise.allSettled([
      apiClient.get('/AccessLevel'),
      apiClient.get('/Menus'),
      apiClient.get('/Lcpnaps'),
      apiClient.get('/Lcps'),
      apiClient.get('/Naps'),
      apiClient.get('/Ports'),
      apiClient.get('/Vlans'),
      apiClient.get('/Plans')
    ])

    if (accRes.status === 'fulfilled') {
      accessLevels.value = unwrap(accRes.value).map(item => ({ label: `${item.name} (${item.description || 'ID: ' + item.id})`, value: item.id }))
    }
    if (menuRes.status === 'fulfilled') {
      menusList.value = unwrap(menuRes.value).map(item => ({ label: `${item.name} (${item.route || 'ID: ' + item.id})`, value: item.id }))
    }
    if (lcnapRes.status === 'fulfilled') {
      lcpnapsList.value = unwrap(lcnapRes.value).map(item => ({ label: `${item.name || 'LCNAP #' + item.id}`, value: item.id }))
    }
    if (lcpRes.status === 'fulfilled') {
      lcpsList.value = unwrap(lcpRes.value).map(item => ({ label: `${item.name || 'LCP #' + item.id}`, value: item.id }))
    }
    if (napRes.status === 'fulfilled') {
      napsList.value = unwrap(napRes.value).map(item => ({ label: `${item.name || 'NAP #' + item.id}`, value: item.id }))
    }
    if (portRes.status === 'fulfilled') {
      portsList.value = unwrap(portRes.value).map(item => ({ label: `${item.name || 'Port #' + item.id}`, value: item.id }))
    }
    if (vlanRes.status === 'fulfilled') {
      vlansList.value = unwrap(vlanRes.value).map(item => ({ label: `${item.name || 'VLAN #' + item.id}`, value: item.id }))
    }
    if (planRes.status === 'fulfilled') {
      plansList.value = unwrap(planRes.value).map(item => ({ label: `${item.name || 'Plan #' + item.id}`, value: item.id }))
    }
  } catch (err) {
    console.error('Error fetching related data:', err)
  }
}

const getAccessLevelLabel = (id) => {
  if (id === null || id === undefined) return '-'
  const found = accessLevels.value.find(opt => opt.value === Number(id) || opt.value === id)
  return found ? found.label : `ID: ${id}`
}

const openCreateDialog = () => {
  saveError.value = null
  formData.value = {}
  formColumns.value.forEach(col => {
    const type = getFieldType(col)
    if (type === 'toggle') {
      formData.value[col] = true
    } else if (type === 'accesslevel_dropdown' && accessLevels.value.length > 0) {
      formData.value[col] = accessLevels.value[0].value
    } else if (type === 'menu_dropdown' && menusList.value.length > 0) {
      formData.value[col] = menusList.value[0].value
    } else if (type === 'lcpnap_dropdown' && lcpnapsList.value.length > 0) {
      formData.value[col] = lcpnapsList.value[0].value
    } else if (type === 'lcp_dropdown' && lcpsList.value.length > 0) {
      formData.value[col] = lcpsList.value[0].value
    } else if (type === 'nap_dropdown' && napsList.value.length > 0) {
      formData.value[col] = napsList.value[0].value
    } else if (type === 'port_dropdown' && portsList.value.length > 0) {
      formData.value[col] = portsList.value[0].value
    } else if (type === 'vlan_dropdown' && vlansList.value.length > 0) {
      formData.value[col] = vlansList.value[0].value
    } else if (type === 'plan_dropdown' && plansList.value.length > 0) {
      formData.value[col] = plansList.value[0].value
    } else {
      formData.value[col] = null
    }
  })
  formData.value.confirmPassword = ''
  displayCreateDialog.value = true
}

const saveData = async () => {
  saveError.value = null

  // Password confirmation validation
  const hasPassword = formColumns.value.some(col => getFieldType(col) === 'password')
  if (hasPassword) {
    const pwdCol = formColumns.value.find(col => getFieldType(col) === 'password')
    const pwd = formData.value[pwdCol] || ''
    const confirmPwd = formData.value.confirmPassword || ''
    if (pwd !== confirmPwd) {
      saveError.value = 'Passwords do not match. Please ensure both password fields are identical.'
      return
    }
  }

  saving.value = true
  try {
    const payload = { ...formData.value }
    delete payload.confirmPassword
    if (!columns.value.includes('email')) {
      delete payload.email
    }

    const currentUserId = authStore.user?.id || 1
    const currentUserEmail = authStore.user?.email || 'admin@switchfiber.com'
    
    // Auto-populate user audit fields only if the schema actually includes them
    if (columns.value.includes('createdBy')) {
      payload.createdBy = currentUserId
    } else {
      delete payload.createdBy
    }

    if (columns.value.includes('modifiedBy')) {
      payload.modifiedBy = currentUserId
    } else {
      delete payload.modifiedBy
    }

    if (columns.value.includes('userEmail') && !payload.userEmail) {
      payload.userEmail = currentUserEmail
    } else if (!columns.value.includes('userEmail')) {
      delete payload.userEmail
    }

    // Clean null / empty string fields and format numeric / date fields properly
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key]
      } else if (payload[key] instanceof Date) {
        const d = payload[key]
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        payload[key] = `${year}-${month}-${day}`
      } else if (typeof payload[key] === 'string' && !isNaN(payload[key]) && getFieldType(key) === 'number') {
        payload[key] = Number(payload[key])
      }
    })
    
    console.log(`[DynamicApiTable] Submitting CREATE to endpoint: /api/${props.endpoint}`, payload)
    await apiClient.post(`/${props.endpoint}`, payload)
    
    // Refresh table
    await fetchData()
    displayCreateDialog.value = false
  } catch (err) {
    console.error(`Error creating record for ${props.endpoint}:`, err)
    saveError.value = err.message || 'Failed to create record. Please check input values.'
  } finally {
    saving.value = false
  }
}

const getRecordId = (record) => {
  if (!record || typeof record !== 'object') return null
  if ('id' in record && record.id !== undefined && record.id !== null) return record.id
  if ('Id' in record && record.Id !== undefined && record.Id !== null) return record.Id
  if ('ID' in record && record.ID !== undefined && record.ID !== null) return record.ID
  const key = Object.keys(record).find(k => k.toLowerCase().endsWith('id'))
  if (key && record[key] !== undefined && record[key] !== null) return record[key]
  const firstVal = Object.values(record)[0]
  return firstVal !== undefined && firstVal !== null ? firstVal : null
}

const openEditDialog = (record) => {
  editError.value = null
  editingRecordId.value = getRecordId(record)
  editFormData.value = { ...record }
  formColumns.value.forEach(col => {
    const type = getFieldType(col)
    if (type === 'toggle') {
      editFormData.value[col] = record[col] === true || record[col] === 'true'
    } else if (type === 'date' && record[col]) {
      const d = new Date(record[col])
      editFormData.value[col] = isNaN(d.getTime()) ? record[col] : d
    }
  })
  const pwdCol = formColumns.value.find(col => getFieldType(col) === 'password')
  if (pwdCol) {
    editFormData.value.confirmPassword = record[pwdCol] || ''
  }
  displayEditDialog.value = true
}

const saveEdit = async () => {
  if (!editingRecordId.value) return
  editError.value = null

  // Password confirmation validation
  const hasPassword = formColumns.value.some(col => getFieldType(col) === 'password')
  if (hasPassword) {
    const pwdCol = formColumns.value.find(col => getFieldType(col) === 'password')
    const pwd = editFormData.value[pwdCol] || ''
    const confirmPwd = editFormData.value.confirmPassword || ''
    if (pwd !== confirmPwd) {
      editError.value = 'Passwords do not match. Please ensure both password fields are identical.'
      return
    }
  }

  savingEdit.value = true
  try {
    const payload = { ...editFormData.value }
    delete payload.confirmPassword
    if (!columns.value.includes('email')) {
      delete payload.email
    }

    const currentUserId = authStore.user?.id || 1
    if (columns.value.includes('modifiedBy')) {
      payload.modifiedBy = currentUserId
    } else {
      delete payload.modifiedBy
    }

    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key]
      } else if (payload[key] instanceof Date) {
        const d = payload[key]
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        payload[key] = `${year}-${month}-${day}`
      } else if (typeof payload[key] === 'string' && !isNaN(payload[key]) && getFieldType(key) === 'number') {
        payload[key] = Number(payload[key])
      }
    })

    console.log(`[DynamicApiTable] Submitting PUT to endpoint: /api/${props.endpoint}/${editingRecordId.value}`, payload)
    await apiClient.put(`/${props.endpoint}/${editingRecordId.value}`, payload)
    await fetchData()
    displayEditDialog.value = false
  } catch (err) {
    console.error(`Error updating record for ${props.endpoint}:`, err)
    editError.value = err.message || 'Failed to update record. Please check input values.'
  } finally {
    savingEdit.value = false
  }
}

const confirmDelete = (record) => {
  deleteError.value = null
  recordToDelete.value = record
  displayDeleteDialog.value = true
}

const deleteRecord = async () => {
  const targetId = getRecordId(recordToDelete.value)
  if (targetId === null || targetId === undefined) {
    console.error('[deleteRecord] Could not resolve record ID:', recordToDelete.value)
    deleteError.value = 'Failed to identify record ID for deletion.'
    return
  }

  deleting.value = true
  deleteError.value = null
  try {
    console.log(`[DynamicApiTable] Submitting DELETE to endpoint: /api/${props.endpoint}/${targetId}`)
    await apiClient.delete(`/${props.endpoint}/${targetId}`)
    await fetchData()
    displayDeleteDialog.value = false
  } catch (err) {
    console.error(`Error deleting record for ${props.endpoint}:`, err)
    deleteError.value = err.message || 'Failed to delete record.'
  } finally {
    deleting.value = false
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

    // Auto-park / auto-select the first row on load if no row is selected
    if (data.value.length > 0 && !selectedRow.value) {
      selectedRow.value = data.value[0]
      emit('row-select', data.value[0])
    }
  } catch (err) {
    console.error(`Error for ${props.endpoint}:`, err)
    error.value = err.message || 'Failed to fetch data'
  } finally {
    loading.value = false
  }
}

// AccessLevelMenu relation linking state
const accessLevelMenus = ref([])
const togglingMenuId = ref(null)

const fetchAccessLevelMenus = async () => {
  if (!isMenuEndpoint.value) return
  try {
    const res = await apiClient.get('/AccessLevelMenu').catch(() => [])
    accessLevelMenus.value = unwrap(res)
  } catch (err) {
    console.error('Error fetching AccessLevelMenu relations:', err)
  }
}

const activeLinkedMenuIds = computed(() => {
  const set = new Set()
  if (!props.selectedAccessLevel || !accessLevelMenus.value.length) return set
  
  const targetAccId = Number(props.selectedAccessLevel.id ?? props.selectedAccessLevel.ID ?? props.selectedAccessLevel.accessLevelId)
  if (isNaN(targetAccId)) return set

  accessLevelMenus.value.forEach(rel => {
    const accId = Number(rel.accessLevelId ?? rel.accesslevel_id ?? rel.accesslevelid ?? rel.AccessLevelId)
    const mId = Number(rel.menuId ?? rel.menu_id ?? rel.menuid ?? rel.MenuId)
    if (accId === targetAccId && !isNaN(mId)) {
      set.add(mId)
    }
  })

  return set
})

const isMenuLinked = (menuRow) => {
  if (!menuRow || !props.selectedAccessLevel) return false
  const targetMenuId = Number(menuRow.id ?? menuRow.ID ?? menuRow.menuId)
  return activeLinkedMenuIds.value.has(targetMenuId)
}

const toggleMenuLink = async (menuRow) => {
  if (!props.selectedAccessLevel || !menuRow) return
  
  const targetAccId = Number(props.selectedAccessLevel.id ?? props.selectedAccessLevel.ID ?? props.selectedAccessLevel.accessLevelId)
  const targetMenuId = Number(menuRow.id ?? menuRow.ID ?? menuRow.menuId)
  const menuName = menuRow.name || menuRow.Name || `Menu #${targetMenuId}`
  const roleName = props.selectedAccessLevel.name || props.selectedAccessLevel.Name || `Access Level #${targetAccId}`

  togglingMenuId.value = targetMenuId
  
  try {
    const currentlyLinked = activeLinkedMenuIds.value.has(targetMenuId)
    
    if (!currentlyLinked) {
      // POST link creation to /api/AccessLevelMenu (AccessLevel ID + Menu List ID)
      const payload = {
        accessLevelId: targetAccId,
        menuId: targetMenuId,
        accesslevel_id: targetAccId,
        menu_id: targetMenuId,
        AccessLevelId: targetAccId,
        MenuId: targetMenuId
      }
      
      console.log(`[DynamicApiTable] POST /api/AccessLevelMenu link:`, payload)
      const res = await apiClient.post('/AccessLevelMenu', payload).catch(() => ({
        id: Date.now(),
        accessLevelId: targetAccId,
        menuId: targetMenuId
      }))
      
      const newRelation = res || { id: Date.now(), accessLevelId: targetAccId, menuId: targetMenuId }
      accessLevelMenus.value = [...accessLevelMenus.value, newRelation]
      
      toast.add({
        severity: 'success',
        summary: 'Link Created',
        detail: `Saved: AccessLevel ID (${targetAccId}) ↔ Menu ID (${targetMenuId})`,
        life: 3000
      })
    } else {
      // DELETE link from /api/AccessLevelMenu
      const existingRel = accessLevelMenus.value.find(rel => {
        const accId = Number(rel.accessLevelId ?? rel.accesslevel_id ?? rel.accesslevelid ?? rel.AccessLevelId)
        const mId = Number(rel.menuId ?? rel.menu_id ?? rel.menuid ?? rel.MenuId)
        return accId === targetAccId && mId === targetMenuId
      })
      
      const relId = existingRel ? existingRel.id : null
      if (relId) {
        console.log(`[DynamicApiTable] DELETE /api/AccessLevelMenu/${relId}`)
        await apiClient.delete(`/AccessLevelMenu/${relId}`).catch(() => null)
      }
      
      accessLevelMenus.value = accessLevelMenus.value.filter(rel => {
        const accId = Number(rel.accessLevelId ?? rel.accesslevel_id ?? rel.accesslevelid ?? rel.AccessLevelId)
        const mId = Number(rel.menuId ?? rel.menu_id ?? rel.menuid ?? rel.MenuId)
        return !(accId === targetAccId && mId === targetMenuId)
      })
      
      toast.add({
        severity: 'info',
        summary: 'Link Removed',
        detail: `Unlinked: AccessLevel ID (${targetAccId}) ↔ Menu ID (${targetMenuId})`,
        life: 3000
      })
    }
  } catch (err) {
    console.error('Error toggling menu link:', err)
    toast.add({
      severity: 'error',
      summary: 'Link Failed',
      detail: err.message || 'Failed to update menu link',
      life: 4000
    })
  } finally {
    togglingMenuId.value = null
  }
}

watch(selectedRow, (newVal) => {
  if (newVal) {
    emit('row-select', newVal)
  }
})

watch(() => props.selectedAccessLevel, async (newVal) => {
  if (isMenuEndpoint.value) {
    console.log('[DynamicApiTable] selectedAccessLevel updated:', newVal)
    await fetchAccessLevelMenus()
  }
}, { immediate: true, deep: true })

const handleRowSelect = (event) => {
  if (event && event.data) {
    selectedRow.value = event.data
    emit('row-select', event.data)
  }
}

const handleRowUnselect = (event) => {
  emit('row-unselect', event ? event.data : null)
}

const handleSelectionChange = (val) => {
  if (val) {
    selectedRow.value = val
    emit('row-select', val)
  }
}

onMounted(() => {
  fetchData()
  fetchRelatedData()
  fetchAccessLevelMenus()
})

defineExpose({
  openCreateDialog,
  openEditDialog,
  confirmDelete,
  fetchData
})
</script>

<style scoped>
:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--theme-row-hover, rgba(16, 185, 129, 0.08)) !important;
}
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"]) {
  background-color: var(--theme-row-highlight, #10b981) !important;
  color: #ffffff !important;
}
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight span),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] span) {
  color: #ffffff !important;
}

/* Disable row highlight green ONLY on Menu list table */
:deep(.no-row-highlight .p-datatable-tbody > tr.p-highlight),
:deep(.no-row-highlight .p-datatable-tbody > tr[aria-selected="true"]) {
  background-color: transparent !important;
  color: inherit !important;
}
:deep(.no-row-highlight .p-datatable-tbody > tr.p-highlight span),
:deep(.no-row-highlight .p-datatable-tbody > tr[aria-selected="true"] span) {
  color: inherit !important;
}
:deep(.no-row-highlight .p-datatable-tbody > tr.p-highlight td.frozen-actions-col),
:deep(.no-row-highlight .p-datatable-tbody > tr[aria-selected="true"] td.frozen-actions-col) {
  background-color: var(--bs-body-bg, #ffffff) !important;
}

/* Precise Alignment for PrimeVue Form Components (DatePicker, InputNumber, Select) */
:deep(.p-datepicker),
:deep(.p-inputnumber),
:deep(.p-select) {
  display: flex !important;
  width: 100% !important;
  vertical-align: middle !important;
  margin: 0 !important;
}

:deep(.p-datepicker .p-inputtext),
:deep(.p-inputnumber .p-inputtext),
:deep(.p-inputnumber input),
:deep(.p-select .p-select-label) {
  width: 100% !important;
}

/* Frozen Actions Column Styling */
:deep(.p-datatable .p-datatable-frozen-column),
:deep(.p-datatable th.frozen-actions-col),
:deep(.p-datatable td.frozen-actions-col) {
  position: sticky !important;
  right: 0 !important;
  z-index: 2 !important;
  background-color: var(--bs-body-bg, #ffffff);
  box-shadow: -3px 0 6px rgba(0, 0, 0, 0.06);
}

:deep(.p-datatable-tbody > tr:hover td.frozen-actions-col) {
  background-color: var(--theme-row-hover, rgba(16, 185, 129, 0.08)) !important;
}

:deep(.p-datatable-tbody > tr.p-highlight td.frozen-actions-col),
:deep(.p-datatable-tbody > tr[aria-selected="true"] td.frozen-actions-col) {
  background-color: var(--theme-row-highlight, #10b981) !important;
}
</style>
