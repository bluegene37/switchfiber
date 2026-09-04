<template>
  <div class="d-flex flex-column gap-4 sfa-tracker-api-services">
    <!-- Screen Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 sfa-tracker-api-services-header">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">API Services</h1>
        <p class="small text-secondary mt-1 mb-0">
          Configure, toggle, and monitor API microservices and background integrations.
        </p>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <span class="badge bg-body-tertiary text-body border px-2.5 py-1.5 small fw-semibold">
          <i class="pi pi-circle-fill text-warning me-1.5" style="font-size: 0.5rem; vertical-align: middle;"></i>
          Under Provisioning
        </span>
      </div>
    </div>

    <!-- Empty State / Placeholder Card -->
    <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-body">
      <div class="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3 mx-auto" style="width: 72px; height: 72px;">
        <i class="pi pi-server" style="font-size: 2rem;"></i>
      </div>
      <h3 class="fs-5 fw-bold text-body mb-2">Microservices Configuration</h3>
      <p class="text-secondary small mx-auto mb-4" style="max-width: 480px;">
        This module will allow administrators to turn on and off API microservices, background dispatch workers, and integration pipelines. Microservice controls are currently being provisioned.
      </p>

      <div class="d-flex justify-content-center gap-2">
        <router-link to="/data-viewer" class="btn btn-outline-secondary btn-sm rounded-3">
          <i class="pi pi-database me-1"></i> Open API Viewer
        </router-link>
        <router-link to="/models" class="btn btn-outline-secondary btn-sm rounded-3">
          <i class="pi pi-table me-1"></i> View Schema Models
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// API Services placeholder view
</script>

<style scoped>
.sfa-tracker-api-services {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
