<template>
  <div class="card stat-card shadow-sm border-0 rounded-4 p-3 p-md-4 h-100 bg-body">
    <div class="d-flex align-items-center justify-content-between gap-2">
      <div class="min-w-0">
        <p class="small text-secondary mb-1 fw-medium text-truncate">{{ title }}</p>
        <h3 class="fs-4 fw-bold text-body mb-0">{{ value }}</h3>
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
  iconColorClass: { type: String, default: 'text-primary' }
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
</style>
