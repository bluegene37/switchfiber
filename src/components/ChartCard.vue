<template>
  <div class="card shadow-sm border-0 rounded-4 p-4 h-100 bg-body sfa-tracker-chart-card">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h3 class="fs-5 fw-bold text-body mb-0">{{ title }}</h3>
      <button class="btn btn-link text-secondary p-0 text-decoration-none" aria-label="More Options">
        <i class="pi pi-ellipsis-h"></i>
      </button>
    </div>
    <div class="w-100 sfa-tracker-chart-card-canvas" style="height: 250px;">
      <!-- notMerge: every option passed in is a complete spec. The default merge
           mode let a placeholder state's centered title survive into the real
           chart rendered after it, overlaying "Loading…" on live data. -->
      <v-chart class="chart" :option="computedOption" :theme="theme" :update-options="{ notMerge: true }" autoresize />
    </div>
  </div>
</template>

<script setup>
import { computed, provide } from 'vue'
import VChart, { THEME_KEY } from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, GaugeChart, RadarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  RadarComponent
} from 'echarts/components'
import { useTheme } from '../composables/useTheme'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  RadarComponent
])

const { isDark } = useTheme()
const theme = computed(() => (isDark.value ? 'dark' : 'light'))

provide(THEME_KEY, theme)

const props = defineProps({
  title: { type: String, required: true },
  option: { type: Object, required: true }
})

// Ensure transparent background so ECharts canvas inherits card theme background
const computedOption = computed(() => {
  return {
    backgroundColor: 'transparent',
    ...props.option
  }
})
</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>
