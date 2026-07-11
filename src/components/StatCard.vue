<template>
  <div class="card shadow-sm border-0 rounded-4 p-4 h-100" style="transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
    <div class="d-flex align-items-center justify-content-between">
      <div>
        <p class="small text-secondary mb-1 fw-medium">{{ title }}</p>
        <h3 class="fs-4 fw-bold text-body mb-0">{{ value }}</h3>
        <div class="mt-2 d-flex align-items-center small">
          <span :class="trend > 0 ? 'text-success' : 'text-danger'" class="d-flex align-items-center fw-medium">
            <i :class="trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="me-1" style="font-size: 0.65rem;"></i>
            {{ Math.abs(trend) }}%
          </span>
          <span class="text-secondary ms-2 opacity-75">vs last month</span>
        </div>
      </div>
      <div class="p-3 rounded-3" :class="iconBgClass">
        <i :class="['pi fs-4', icon, iconColorClass]"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  trend: { type: Number, required: true },
  icon: { type: String, required: true },
  iconBgClass: { type: String, default: 'bg-primary bg-opacity-10' },
  iconColorClass: { type: String, default: 'text-primary' }
})
</script>
