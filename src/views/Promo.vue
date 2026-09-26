<template>
  <div class="d-flex flex-column gap-4 sfa-tracker-promo-view pb-5">
    <!-- Breadcrumb & Top Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 sfa-tracker-promo-header">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill px-2.5 py-1 text-xs fw-semibold d-inline-flex align-items-center gap-1.5">
            <i class="pi pi-gift"></i> Promo (PR1)
          </span>
          <span class="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle rounded-pill px-2.5 py-1 text-xs fw-semibold d-inline-flex align-items-center gap-1.5">
            <span class="p-badge-dot bg-warning rounded-circle sfa-pulse-dot" style="width: 7px; height: 7px; display: inline-block;"></span>
            Work In Progress
          </span>
          <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle rounded-pill px-2.5 py-1 text-xs fw-semibold">
            API Pending
          </span>
        </div>
        <h1 class="fs-3 fw-bold text-body mb-0">Promo &amp; Campaign Management</h1>
        <p class="small text-secondary mt-1 mb-0">
          Configure subscriber promotional offers, seasonal campaign discounts, and fiber bundle incentives.
        </p>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <router-link to="/landing" class="btn btn-outline-secondary rounded-3 px-3 py-2 text-sm fw-medium shadow-xs d-inline-flex align-items-center gap-1.5">
          <i class="pi pi-home"></i> Back to Home
        </router-link>
        <router-link to="/discounts" class="btn btn-primary rounded-3 px-3 py-2 text-sm fw-semibold shadow-xs d-inline-flex align-items-center gap-1.5">
          <i class="pi pi-ticket"></i> View Discounts
        </router-link>
      </div>
    </div>

    <!-- Main Work in Progress Hero Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-body p-4 p-md-5 text-center sfa-tracker-promo-hero">
      <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mb-3 mx-auto shadow-xs" style="width: 76px; height: 76px;">
        <i class="pi pi-gift" style="font-size: 2.25rem;"></i>
      </div>

      <h2 class="fs-4 fw-bolder text-body mb-2 tracking-tight">Promo Module Under Development</h2>
      <p class="text-secondary mx-auto mb-4" style="max-width: 620px; font-size: 0.95rem; line-height: 1.6;">
        The Promo management endpoint is currently scheduled for backend API integration. Once connected to the REST services, this screen will provide centralized control over promotional voucher codes, referral perks, and marketing discount packages.
      </p>

      <div class="d-inline-flex align-items-center gap-2 bg-body-tertiary px-3 py-2 rounded-pill border border-secondary-subtle mx-auto mb-4 text-xs text-secondary">
        <i class="pi pi-info-circle text-primary"></i>
        <span>Endpoint: <code class="font-monospace text-body">/api/Promos</code> (Pending server-side deployment)</span>
      </div>

      <!-- Quick Action Navigation -->
      <div class="d-flex flex-wrap gap-2 justify-content-center">
        <router-link to="/discounts" class="btn btn-sm btn-outline-primary rounded-3 px-3 py-2 fw-medium d-inline-flex align-items-center gap-1.5">
          <i class="pi pi-ticket"></i> Active Discounts (DISC1)
        </router-link>
        <router-link to="/discount-types" class="btn btn-sm btn-outline-secondary rounded-3 px-3 py-2 fw-medium d-inline-flex align-items-center gap-1.5">
          <i class="pi pi-percentage"></i> Discount Types (DT1)
        </router-link>
        <router-link to="/plan" class="btn btn-sm btn-outline-secondary rounded-3 px-3 py-2 fw-medium d-inline-flex align-items-center gap-1.5">
          <i class="pi pi-tag"></i> Fiber Plans (PL1)
        </router-link>
      </div>
    </div>

    <!-- Feature Architecture & Roadmap Cards -->
    <div class="row g-3 sfa-tracker-promo-features">
      <div class="col-12 col-md-6 col-xl-3">
        <div class="card h-100 border-0 shadow-sm rounded-4 p-3.5 bg-body">
          <div class="d-flex align-items-center gap-2.5 mb-2.5">
            <div class="rounded-3 bg-primary bg-opacity-10 text-primary p-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
              <i class="pi pi-qrcode fs-6"></i>
            </div>
            <h6 class="fw-bold text-body mb-0 fs-6">Voucher Codes</h6>
          </div>
          <p class="text-secondary small mb-0" style="line-height: 1.5;">
            Generate single-use or multi-redemption campaign codes with custom expiry dates and subscriber caps.
          </p>
        </div>
      </div>

      <div class="col-12 col-md-6 col-xl-3">
        <div class="card h-100 border-0 shadow-sm rounded-4 p-3.5 bg-body">
          <div class="d-flex align-items-center gap-2.5 mb-2.5">
            <div class="rounded-3 bg-success bg-opacity-10 text-success p-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
              <i class="pi pi-bolt fs-6"></i>
            </div>
            <h6 class="fw-bold text-body mb-0 fs-6">Speed Boost Promos</h6>
          </div>
          <p class="text-secondary small mb-0" style="line-height: 1.5;">
            Automate promotional bandwidth upgrades for targeted subscriber plans during introductory periods.
          </p>
        </div>
      </div>

      <div class="col-12 col-md-6 col-xl-3">
        <div class="card h-100 border-0 shadow-sm rounded-4 p-3.5 bg-body">
          <div class="d-flex align-items-center gap-2.5 mb-2.5">
            <div class="rounded-3 bg-info bg-opacity-10 text-info p-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
              <i class="pi pi-map-marker fs-6"></i>
            </div>
            <h6 class="fw-bold text-body mb-0 fs-6">Area Zone Targeting</h6>
          </div>
          <p class="text-secondary small mb-0" style="line-height: 1.5;">
            Restrict and launch special installation discount campaigns linked directly to specific LCP / NAP zones.
          </p>
        </div>
      </div>

      <div class="col-12 col-md-6 col-xl-3">
        <div class="card h-100 border-0 shadow-sm rounded-4 p-3.5 bg-body">
          <div class="d-flex align-items-center gap-2.5 mb-2.5">
            <div class="rounded-3 bg-warning bg-opacity-10 text-warning p-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
              <i class="pi pi-chart-line fs-6"></i>
            </div>
            <h6 class="fw-bold text-body mb-0 fs-6">Redemption Analytics</h6>
          </div>
          <p class="text-secondary small mb-0" style="line-height: 1.5;">
            Track customer conversion rates, active promo subscriptions, and campaign ROI metrics in real time.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Promo View - Work In Progress placeholder screen for upcoming Promo management API
</script>

<style scoped>
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
</style>
