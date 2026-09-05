<template>
  <div class="card stat-card shadow-sm border-0 rounded-4 p-3 h-100 bg-body sfa-tracker-stat-card position-relative overflow-hidden">
    <div class="d-flex flex-column justify-content-between h-100">
      <!-- Top Row: Card Title & Icon Badge -->
      <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
        <span class="small text-secondary fw-semibold text-truncate" :title="title" style="font-size: 0.8rem;">
          {{ title }}
        </span>
        <div class="stat-icon-wrapper rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center" :class="iconBgClass">
          <i :class="['pi', icon, iconColorClass]" style="font-size: 1.05rem;"></i>
        </div>
      </div>

      <!-- Center: Formatted Metric Value (Full Width, Auto-scaled) -->
      <div class="min-w-0 my-auto py-1">
        <div v-if="loading" class="stat-skeleton rounded-2" aria-label="Loading value"></div>
        <h3
          v-else
          class="fw-bold text-body mb-0 stat-value text-truncate"
          :class="valueFontSizeClass"
          :title="String(value)"
        >
          {{ value }}
        </h3>
      </div>

      <!-- Bottom: MoM Trend Indicator -->
      <div v-if="typeof trend === 'number' && Number.isFinite(trend)" class="mt-2 d-flex align-items-center small text-truncate">
        <span :class="trend > 0 ? 'text-success' : 'text-danger'" class="d-flex align-items-center fw-semibold flex-shrink-0" style="font-size: 0.78rem;">
          <i :class="trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="me-1" style="font-size: 0.65rem;"></i>
          {{ Math.abs(trend) }}%
        </span>
        <span class="text-secondary ms-1.5 opacity-75 text-truncate" style="font-size: 0.72rem;">vs last month</span>
      </div>
      <div v-else class="mt-1" style="height: 0.75rem;"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
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

// Dynamically scale font size based on character count so long figures like ₱28,881,110.00 never overflow
const valueFontSizeClass = computed(() => {
  const len = String(props.value ?? '').length
  if (len > 13) return 'stat-value-xs'
  if (len > 10) return 'stat-value-sm'
  if (len > 7) return 'stat-value-md'
  return 'stat-value-lg'
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  min-height: 112px;
}

@media (hover: hover) {
  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.08) !important;
  }
}

.stat-icon-wrapper {
  width: 36px;
  height: 36px;
  min-width: 36px;
  transition: transform 0.2s ease;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.08);
}

.stat-value {
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.stat-value-lg {
  font-size: 1.5rem; /* For short numbers like 853, 84.5% */
}

.stat-value-md {
  font-size: 1.3rem; /* For numbers like ₱711,447.00 */
}

.stat-value-sm {
  font-size: 1.12rem; /* For numbers like ₱3,281,850.51 */
}

.stat-value-xs {
  font-size: 0.98rem; /* For very long numbers like ₱28,881,110.00 */
}

.stat-skeleton {
  width: 4rem;
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
