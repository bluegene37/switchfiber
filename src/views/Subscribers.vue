<!-- Gene - Nov, 23, 2026: Empty / In Progress placeholder view for Subscribers menu (upcoming subscriber modules and sub-menus) -->
<template>
  <div class="d-flex flex-column gap-4 sfa-tracker-subscribers-view pb-5">
    <!-- Top Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 sfa-tracker-subscribers-header">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill px-2.5 py-1 text-xs fw-semibold d-inline-flex align-items-center gap-1.5">
            <i class="pi pi-id-card"></i> Subscribers (SUBS1)
          </span>
          <!-- Gene - Nov, 24, 2026: Hid In Progress pill now that Subscribers is wired to GET /api/RadiusUser -->
          <!--
          <span class="badge bg-warning bg-opacity-15 text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-1 text-xs fw-semibold d-inline-flex align-items-center gap-1.5">
            <span class="p-badge-dot bg-warning rounded-circle sfa-pulse-dot" style="width: 7px; height: 7px; display: inline-block;"></span>
            In Progress
          </span>
          -->
        </div>
        <h1 class="fs-3 fw-bold text-body mb-0">Subscribers</h1>
        <!--
        <p class="small text-secondary mt-1 mb-0">
          Manage subscriber accounts and profiles. Additional subscriber sub-menus will be added here.
        </p>
        -->
        <!-- Gene - Nov, 24, 2026: Updated Subscribers subtitle to reflect live RADIUS subscriber directory -->
        <p class="small text-secondary mt-1 mb-0">
          Manage RADIUS subscriber accounts, group profiles, and connection status.
        </p>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <router-link to="/landing" class="btn btn-outline-secondary rounded-3 px-3 py-2 text-sm fw-medium shadow-xs d-inline-flex align-items-center gap-1.5 text-decoration-none">
          <i class="pi pi-home"></i> Back to Home
        </router-link>
      </div>
    </div>

    <!-- Empty / In Progress Placeholder Card -->
    <!--
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-body p-4 p-md-5 text-center sfa-tracker-subscribers-empty">
      <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mb-3 mx-auto shadow-xs" style="width: 76px; height: 76px;">
        <i class="pi pi-users" style="font-size: 2.25rem;"></i>
      </div>

      <h2 class="fs-4 fw-bolder text-body mb-2 tracking-tight">Subscribers Module In Progress</h2>
      <p class="text-secondary mx-auto mb-4" style="max-width: 560px; font-size: 0.95rem; line-height: 1.6;">
        This section is currently empty and in progress. Subscriber records and additional sub-modules will be added here soon.
      </p>

      <div class="d-inline-flex align-items-center gap-2 bg-body-tertiary px-3 py-2 rounded-pill border border-secondary-subtle mx-auto text-xs text-secondary">
        <i class="pi pi-clock text-warning"></i>
        <span>Status: <strong class="text-body">In Progress</strong> &bull; Ready for upcoming Subscribers data &amp; sub-menus</span>
      </div>
    </div>
    -->
    <!-- Gene - Nov, 24, 2026: Wire Subscribers screen to GET /api/RadiusUser via DynamicApiTable (read-only list with connection filters & toggle) -->
    <!--
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 sfa-tracker-subscribers-table-card">
      <DynamicApiTable
        ref="apiTableRef"
        endpoint="RadiusUser"
        :read-only="true"
        :hide-create-button="true"
        create-button-label="Create Subscriber"
      />
    </div>
    -->
    <!-- Gene - Nov, 25, 2026: Enforce strict view-only mode (no create/edit/delete) and disable connect/disconnect toggle for Subscribers -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-body p-3 sfa-tracker-subscribers-table-card">
      <DynamicApiTable
        ref="apiTableRef"
        endpoint="RadiusUser"
        :read-only="true"
        :hide-create-button="true"
        :disable-connection-toggle="true"
        create-button-label="Create Subscriber"
      />
    </div>
  </div>
</template>

<script setup>
// Gene - Nov, 23, 2026: Subscribers placeholder screen — kept minimal until subscriber endpoints and sub-menus are added
// Gene - Nov, 24, 2026: Wire Subscribers view to DynamicApiTable backed by GET /api/RadiusUser
import { ref } from 'vue'
import DynamicApiTable from '../components/DynamicApiTable.vue'

const apiTableRef = ref(null)
</script>

<style scoped>
/*
.sfa-pulse-dot {
  animation: sfa-pulse 1.8s infinite ease-in-out;
}

@keyframes sfa-pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.6;
  }
}
*/
</style>
