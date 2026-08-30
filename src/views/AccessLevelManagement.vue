<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">Access Level & Menu Management</h1>
        <p class="small text-secondary mt-1 mb-0">Select an Access Level on the left to toggle live menu permissions on the right.</p>
      </div>
    </div>

    <!-- 2 Column Screen: Left = Access Level API, Right = Menu API -->
    <div class="row g-4">
      <!-- Left Column: Access Level Table -->
      <div class="col-12 col-xl-6">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden h-100 bg-body">
          <div class="card-header bg-body border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <i class="pi pi-shield text-primary fs-5"></i>
              <h5 class="fw-bold text-body mb-0">Access Level</h5>
            </div>
            <div class="d-flex align-items-center gap-2">
              <Button 
                label="Create Access Level" 
                icon="pi pi-plus" 
                class="p-button-primary p-button-sm rounded-3 px-3.5 shadow-xs" 
                @click="openCreateAccessLevel" 
              />
            </div>
          </div>
          <div class="card-body p-3">
            <DynamicApiTable 
              ref="accessLevelTableRef"
              endpoint="AccessLevel"
              hide-create-button
              auto-select-first-row
              @row-select="handleAccessLevelSelect"
              @row-unselect="handleAccessLevelUnselect"
            />
          </div>
        </div>
      </div>

      <!-- Right Column: Menu List Table -->
      <div class="col-12 col-xl-6">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden h-100 bg-body">
          <div class="card-header bg-body border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <i class="pi pi-list text-primary fs-5"></i>
              <h5 class="fw-bold text-body mb-0 me-1">Menu List</h5>
            </div>
            <div class="d-flex align-items-center gap-2">
              <Button 
                label="Create Menu" 
                icon="pi pi-plus" 
                class="p-button-primary p-button-sm rounded-3 px-3.5 shadow-xs" 
                @click="openCreateMenu" 
              />
            </div>
          </div>
          <div class="card-body p-3">
            <DynamicApiTable 
              ref="menuTableRef"
              endpoint="Menus" 
              hide-create-button
              :selected-access-level="selectedAccessLevel"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import DynamicApiTable from '../components/DynamicApiTable.vue'

const selectedAccessLevel = ref(null)
const accessLevelTableRef = ref(null)
const menuTableRef = ref(null)

const handleAccessLevelSelect = (row) => {
  if (!row) {
    selectedAccessLevel.value = null
    return
  }
  selectedAccessLevel.value = { ...row }
  console.log('[AccessLevelManagement] Selected Access Level:', selectedAccessLevel.value)
}

const handleAccessLevelUnselect = () => {
  // Deliberately keep the last selection. The DataTable treats a click as a
  // selection toggle and can fire row-unselect in the same tick as row-select,
  // which blanked the menu panel and made the level look unassigned. A blank
  // panel has no use here — the selection only ever moves to another level.
}

const openCreateAccessLevel = () => {
  if (accessLevelTableRef.value) {
    accessLevelTableRef.value.openCreateDialog()
  }
}

const openCreateMenu = () => {
  if (menuTableRef.value) {
    menuTableRef.value.openCreateDialog()
  }
}
</script>
