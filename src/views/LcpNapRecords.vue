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
      <router-link
        to="/lcp-nap-locations/map"
        class="btn btn-sm btn-outline-secondary rounded-3 d-inline-flex align-items-center gap-2 shadow-xs fw-medium text-decoration-none"
      >
        <i class="pi pi-map" style="font-size: 0.8rem;"></i>
        <span>View on Map</span>
      </router-link>
    </div>

    <!-- Data Table Container -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3">
      <DynamicApiTable
        ref="apiTableRef"
        endpoint="LCPNapLocations"
        create-button-label="Create Location"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DynamicApiTable from '../components/DynamicApiTable.vue'

const apiTableRef = ref(null)
</script>

