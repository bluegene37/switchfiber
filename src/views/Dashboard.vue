<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header with Quick Timeframe Filters -->
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
      <div>
        <div class="d-flex align-items-center gap-2">
          <h1 class="fs-3 fw-bold text-body mb-0">Executive Dashboard</h1>
          <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill small d-flex align-items-center gap-1">
            <i class="pi pi-circle-fill text-success" style="font-size: 0.5rem;"></i> Systems Operational
          </span>
        </div>
        <p class="small text-secondary mt-1 mb-0">Real-time network traffic, subscriber analytics, and operational metrics.</p>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <!-- Timeframe Buttons -->
        <div class="btn-group bg-body border rounded-3 p-1 shadow-sm" role="group">
          <button 
            v-for="tf in timeframes" 
            :key="tf.value" 
            @click="selectedTimeframe = tf.value" 
            class="btn btn-sm border-0 rounded-2 fw-semibold px-3 py-1.5 transition-all"
            :class="selectedTimeframe === tf.value ? 'btn-primary text-white shadow-xs' : 'btn-link text-secondary text-decoration-none'"
          >
            {{ tf.label }}
          </button>
        </div>

        <button @click="handleExport" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 shadow-sm rounded-3 py-1.5 px-3">
          <i class="pi pi-download"></i> Export Report
        </button>
      </div>
    </div>

    <!-- KPI Summary Cards Grid -->
    <div class="row g-3">
      <div class="col-12 col-sm-6 col-xl-2" v-for="stat in kpiStats" :key="stat.title">
        <StatCard 
          :title="stat.title" 
          :value="stat.value" 
          :trend="stat.trend" 
          :icon="stat.icon" 
          :iconBgClass="stat.iconBgClass" 
          :iconColorClass="stat.iconColorClass" 
        />
      </div>
    </div>

    <!-- Main Charts Row 1: Bandwidth Traffic & Plan Distribution -->
    <div class="row g-4">
      <div class="col-12 col-xl-7">
        <ChartCard title="Network Bandwidth Traffic (Gbps)" :option="bandwidthChartOption" />
      </div>
      <div class="col-12 col-xl-5">
        <ChartCard title="Subscriber Plan Distribution" :option="planDistributionChartOption" />
      </div>
    </div>

    <!-- Main Charts Row 2: Monthly Revenue & Job Orders Breakdown -->
    <div class="row g-4">
      <div class="col-12 col-xl-6">
        <ChartCard title="Monthly Revenue & ARPU (₱)" :option="revenueChartOption" />
      </div>
      <div class="col-12 col-xl-6">
        <ChartCard title="Job Order Status Breakdown" :option="jobOrdersChartOption" />
      </div>
    </div>

    <!-- Main Charts Row 3: Regional Radar & System Health Gauge -->
    <div class="row g-4">
      <div class="col-12 col-lg-6 col-xl-7">
        <ChartCard title="Regional Node Performance & Latency Radar" :option="nodeRadarChartOption" />
      </div>
      <div class="col-12 col-lg-6 col-xl-5">
        <ChartCard title="Overall Network Uptime & SLA Health" :option="uptimeGaugeChartOption" />
      </div>
    </div>

    <!-- Recent Connections DataTable -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden mb-2">
      <div class="card-header bg-body border-bottom p-4 d-flex align-items-center justify-content-between">
        <div>
          <h3 class="fs-5 fw-bold text-body mb-0">Recent Connections</h3>
          <p class="small text-secondary mb-0 mt-1">Live customer fiber connections across nodes</p>
        </div>
        <button @click="appStore.fetchApplications()" class="btn btn-sm btn-light border text-secondary shadow-xs d-flex align-items-center gap-1">
          <i class="pi pi-refresh" :class="{ 'spin-icon': appStore.isLoadingConnections }"></i> Refresh
        </button>
      </div>
      
      <DataTable :value="recentConnections" responsiveLayout="scroll" :paginator="true" :rows="5" class="p-datatable-sm small">
        <Column field="name" header="Client Name" :sortable="true"></Column>
        <Column field="node" header="Server Node" :sortable="true"></Column>
        <Column field="type" header="Plan Type" :sortable="true"></Column>
        <Column field="limit" header="Bandwidth" :sortable="true"></Column>
        
        <Column field="status" header="Status" :sortable="true">
          <template #body="{ data }">
            <Tag :severity="getSeverity(data.status)" :value="data.status" rounded></Tag>
          </template>
        </Column>
        
        <Column header="Actions" :exportable="false" style="min-width:8rem">
          <template #body="{ data }">
            <Button 
              :icon="data.status === 'Active' ? 'pi pi-pause' : 'pi pi-play'" 
              :severity="data.status === 'Active' ? 'danger' : 'success'" 
              text 
              rounded 
              @click="toggleConnectionState(data.id)"
              v-tooltip.top="data.status === 'Active' ? 'Disconnect' : 'Reconnect'"
            />
            <Button icon="pi pi-credit-card" severity="secondary" text rounded v-tooltip.top="'View Billing'" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useAppStore } from '../stores/app'
import StatCard from '../components/StatCard.vue'
import ChartCard from '../components/ChartCard.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const appStore = useAppStore()

onMounted(() => {
  appStore.fetchApplications()
})

// Timeframe selector state
const selectedTimeframe = ref('30d')
const timeframes = [
  { label: 'Today', value: '1d' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'Year to Date', value: 'ytd' }
]

// Extended KPI Stats
const kpiStats = computed(() => [
  { 
    title: 'Total Applications', 
    value: appStore.recentConnections.length ? appStore.recentConnections.length.toString() : '248', 
    trend: 14.2, 
    icon: 'pi-users', 
    iconBgClass: 'bg-primary bg-opacity-10', 
    iconColorClass: 'text-primary' 
  },
  { 
    title: 'Active Connections', 
    value: '11,892', 
    trend: 4.8, 
    icon: 'pi-wifi', 
    iconBgClass: 'bg-success bg-opacity-10', 
    iconColorClass: 'text-success' 
  },
  { 
    title: 'Monthly Revenue', 
    value: '₱1,285,400', 
    trend: 8.4, 
    icon: 'pi-dollar', 
    iconBgClass: 'bg-info bg-opacity-10', 
    iconColorClass: 'text-info' 
  },
  { 
    title: 'Avg ARPU / Month', 
    value: '₱1,450', 
    trend: 3.2, 
    icon: 'pi-chart-line', 
    iconBgClass: 'bg-warning bg-opacity-10', 
    iconColorClass: 'text-warning' 
  },
  { 
    title: 'Pending Job Orders', 
    value: '38', 
    trend: -12.5, 
    icon: 'pi-clipboard', 
    iconBgClass: 'bg-danger bg-opacity-10', 
    iconColorClass: 'text-danger' 
  },
  { 
    title: 'Network Peak Load', 
    value: '1.42 Tbps', 
    trend: 6.1, 
    icon: 'pi-server', 
    iconBgClass: 'bg-secondary bg-opacity-10', 
    iconColorClass: 'text-secondary' 
  }
])

const recentConnections = computed(() => appStore.recentConnections)

const getSeverity = (status) => {
  switch (status) {
    case 'Active': return 'success'
    case 'Suspended': return 'danger'
    case 'Maintenance': return 'warn'
    default: return 'info'
  }
}

const toggleConnectionState = async (id) => {
  await appStore.toggleConnection(id)
}

const handleExport = () => {
  alert('Generating executive PDF report... Download will begin shortly.')
}

// 1. Network Bandwidth Line Chart
const bandwidthChartOption = ref({
  tooltip: { trigger: 'axis' },
  legend: { data: ['Download Peak', 'Upload Peak'], top: '0%' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { 
    type: 'category', 
    boundaryGap: false, 
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] 
  },
  yAxis: { type: 'value', name: 'Gbps' },
  series: [
    { 
      name: 'Download Peak', 
      type: 'line', 
      smooth: true, 
      data: [42, 38, 85, 94, 88, 110, 65], 
      itemStyle: { color: '#0d6efd' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(13, 110, 253, 0.35)' }, { offset: 1, color: 'rgba(13, 110, 253, 0.02)' }]
        }
      }
    },
    { 
      name: 'Upload Peak', 
      type: 'line', 
      smooth: true, 
      data: [18, 14, 38, 45, 40, 52, 28], 
      itemStyle: { color: '#10b981' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.3)' }, { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }]
        }
      }
    }
  ]
})

// 2. Subscriber Plan Doughnut Chart
const planDistributionChartOption = ref({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', right: '5%', top: 'center' },
  series: [
    {
      name: 'Plans',
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: '14', fontWeight: 'bold' } },
      data: [
        { value: 4500, name: 'Fiber 50Mbps', itemStyle: { color: '#3b82f6' } },
        { value: 3800, name: 'Fiber 100Mbps', itemStyle: { color: '#10b981' } },
        { value: 2100, name: 'Fiber 200Mbps', itemStyle: { color: '#8b5cf6' } },
        { value: 950, name: 'Enterprise 500Mbps', itemStyle: { color: '#f59e0b' } },
        { value: 542, name: 'Fiber 1Gbps', itemStyle: { color: '#ec4899' } }
      ]
    }
  ]
})

// 3. Monthly Revenue & ARPU Combo Chart
const revenueChartOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { data: ['Revenue (₱k)', 'ARPU (₱)'], top: '0%' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'] },
  yAxis: [
    { type: 'value', name: 'Revenue (₱k)', min: 0, max: 1600 },
    { type: 'value', name: 'ARPU (₱)', min: 1000, max: 2000 }
  ],
  series: [
    {
      name: 'Revenue (₱k)',
      type: 'bar',
      barWidth: '45%',
      data: [980, 1040, 1120, 1190, 1240, 1285, 1340],
      itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }
    },
    {
      name: 'ARPU (₱)',
      type: 'line',
      yAxisIndex: 1,
      data: [1380, 1400, 1420, 1435, 1440, 1450, 1465],
      itemStyle: { color: '#f59e0b' }
    }
  ]
})

// 4. Job Orders Status Breakdown Chart
const jobOrdersChartOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['Completed', 'In Progress', 'Pending'], top: '0%' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  yAxis: { type: 'value' },
  series: [
    { name: 'Completed', type: 'bar', stack: 'total', data: [12, 18, 15, 22, 25, 14, 8], itemStyle: { color: '#10b981' } },
    { name: 'In Progress', type: 'bar', stack: 'total', data: [5, 7, 6, 8, 10, 4, 3], itemStyle: { color: '#3b82f6' } },
    { name: 'Pending', type: 'bar', stack: 'total', data: [3, 4, 2, 5, 4, 2, 1], itemStyle: { color: '#f59e0b' } }
  ]
})

// 5. Regional Node Radar Chart
const nodeRadarChartOption = ref({
  tooltip: { trigger: 'item' },
  legend: { data: ['Manila Core', 'Laguna Node', 'Batangas Node'], bottom: '0%' },
  radar: {
    indicator: [
      { name: 'Uptime %', max: 100 },
      { name: 'Bandwidth Load', max: 100 },
      { name: 'Low Latency', max: 100 },
      { name: 'CPU Usage', max: 100 },
      { name: 'Memory Usage', max: 100 }
    ],
    radius: '65%'
  },
  series: [
    {
      name: 'Node Health Comparison',
      type: 'radar',
      data: [
        { value: [99.9, 82, 94, 65, 70], name: 'Manila Core', itemStyle: { color: '#0d6efd' } },
        { value: [99.5, 74, 88, 58, 62], name: 'Laguna Node', itemStyle: { color: '#10b981' } },
        { value: [98.8, 68, 80, 52, 55], name: 'Batangas Node', itemStyle: { color: '#8b5cf6' } }
      ]
    }
  ]
})

// 6. Overall System Health Gauge Chart
const uptimeGaugeChartOption = ref({
  tooltip: { formatter: '{a} <br/>{b} : {c}%' },
  series: [
    {
      name: 'System Uptime',
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 90,
      max: 100,
      splitNumber: 5,
      axisLine: {
        lineStyle: {
          width: 18,
          color: [
            [0.6, '#ef4444'],
            [0.85, '#f59e0b'],
            [1, '#10b981']
          ]
        }
      },
      pointer: { icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', length: '60%', width: 6 },
      title: { offsetCenter: [0, '-20%'], fontSize: 13, color: '#6b7280' },
      detail: { fontSize: 24, fontWeight: 'bold', offsetCenter: [0, '25%'], formatter: '{value}%' },
      data: [{ value: 99.98, name: 'SLA Operational Uptime' }]
    }
  ]
})

// Dynamic Timeframe Data Switching
watch(selectedTimeframe, (newVal) => {
  if (newVal === '1d') {
    bandwidthChartOption.value.series[0].data = [20, 25, 45, 60, 55, 75, 40]
    bandwidthChartOption.value.series[1].data = [8, 10, 20, 28, 24, 35, 18]
  } else if (newVal === '7d') {
    bandwidthChartOption.value.series[0].data = [50, 65, 80, 105, 95, 120, 85]
    bandwidthChartOption.value.series[1].data = [22, 30, 42, 55, 48, 62, 40]
  } else if (newVal === '30d') {
    bandwidthChartOption.value.series[0].data = [42, 38, 85, 94, 88, 110, 65]
    bandwidthChartOption.value.series[1].data = [18, 14, 38, 45, 40, 52, 28]
  } else if (newVal === 'ytd') {
    bandwidthChartOption.value.series[0].data = [30, 45, 70, 85, 115, 140, 160]
    bandwidthChartOption.value.series[1].data = [12, 20, 32, 42, 58, 70, 80]
  }
})
</script>

<style scoped>
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
