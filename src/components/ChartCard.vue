<template>
  <div class="card shadow-sm border-0 rounded-4 p-4 h-100">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h3 class="fs-5 fw-bold text-body mb-0">{{ title }}</h3>
      <button class="btn btn-link text-secondary p-0 text-decoration-none">
        <i class="pi pi-ellipsis-h"></i>
      </button>
    </div>
    <div class="w-100" style="height: 250px;">
      <v-chart class="chart" :option="option" autoresize />
    </div>
  </div>
</template>

<script setup>
import { provide } from 'vue'
import VChart, { THEME_KEY } from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// Provide dark theme if HTML element has .dark class (mocked statically here, can be dynamic)
provide(THEME_KEY, document.documentElement.classList.contains('dark') ? 'dark' : 'light')

defineProps({
  title: { type: String, required: true },
  option: { type: Object, required: true }
})
</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>
