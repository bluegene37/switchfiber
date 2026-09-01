<template>
  <div class="card stat-card shadow-sm border-0 rounded-4 p-3 p-md-4 h-100 bg-body sfa-tracker-stat-card">
    <div class="d-flex align-items-center justify-content-between gap-2">
      <div class="min-w-0">
        <p class="small text-secondary mb-1 fw-medium text-truncate">{{ title }}</p>
        <div v-if="loading" class="stat-skeleton rounded-2" aria-label="Loading value"></div>
        <h3 v-else class="fs-4 fw-bold text-body mb-0">{{ value }}</h3>
        <!-- Only rendered when a real month-over-month figure is supplied. -->
        <div v-if="typeof trend === 'number' && Number.isFinite(trend)" class="mt-2 d-flex align-items-center small">
          <span :class="trend > 0 ? 'text-success' : 'text-danger'" class="d-flex align-items-center fw-medium">
            <i :class="trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="me-1" style="font-size: 0.65rem;"></i>
            {{ Math.abs(trend) }}%
          </span>
          <span class="text-secondary ms-2 opacity-75">vs last month</span>
        </div>
      </div>
      <div class="p-3 rounded-3 flex-shrink-0" :class="iconBgClass">
        <i :class="['pi fs-4', icon, iconColorClass]"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  trend: { type: Number, default: null },
  icon: { type: String, required: true },
  iconBgClass: { type: String, default: 'bg-primary bg-opacity-10' },
  iconColorClass: { type: String, default: 'text-primary' },
  // While true the value is replaced by a shimmer placeholder, so an in-flight
  // count is visually distinct from "unavailable" (—) and from a real 0.
  loading: { type: Boolean, default: false }
})
</script>

<style scoped>
/* CSS hover instead of inline onmouseover handlers, which a production
   Content-Security-Policy would block. */
.stat-card {
  transition: transform 0.3s ease;
}

@media (hover: hover) {
  .stat-card:hover {
    transform: translateY(-5px);
  }
}

.stat-skeleton {
  width: 3.25rem;
  height: 1.75rem;
  background: linear-gradient(90deg, var(--bs-tertiary-bg, rgba(108, 117, 125, 0.12)) 25%, var(--bs-secondary-bg, rgba(108, 117, 125, 0.28)) 50%, var(--bs-tertiary-bg, rgba(108, 117, 125, 0.12)) 75%);
  background-size: 200% 100%;
  animation: stat-skeleton-shimmer 1.5s infinite linear;
}

@keyframes stat-skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
