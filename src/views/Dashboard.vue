<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header with Quick Timeframe Filters -->
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
      <div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h1 class="fs-3 fw-bold text-body mb-0">Executive Dashboard</h1>
          <span
            class="badge px-2.5 py-1 rounded-pill small d-flex align-items-center gap-1 border border-opacity-25"
            :class="apiHealth.class"
          >
            <i class="pi pi-circle-fill" style="font-size: 0.5rem;"></i> {{ apiHealth.label }}
          </span>
        </div>
        <p class="small text-secondary mt-1 mb-0">Subscriber analytics and operational metrics.</p>
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

        <Button 
          label="Export Report" 
          icon="pi pi-download" 
          class="p-button-secondary p-button-sm p-button-outlined shadow-xs rounded-3" 
          @click="handleExport" 
        />
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

    <!-- Illustrative charts notice: these series are not backed by the API yet. -->
    <div class="alert alert-warning d-flex align-items-start gap-2 rounded-3 p-3 mb-0 small" role="note">
      <i class="pi pi-info-circle mt-1 flex-shrink-0"></i>
      <div>
        <span class="fw-semibold">The six charts below use sample data.</span>
        Bandwidth, revenue, node telemetry, and SLA figures are illustrative placeholders — the API does not expose these
        series yet. The KPI cards and the applications table above/below are live.
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
      <div class="card-header bg-body border-bottom p-3 p-md-4 d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <div>
          <h3 class="fs-5 fw-bold text-body mb-0">Recent Applications</h3>
          <p class="small text-secondary mb-0 mt-1">Latest customer subscription applications</p>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <!-- Search Box -->
          <div class="position-relative" style="width: 210px;">
            <i class="pi pi-search position-absolute top-50 translate-middle-y text-secondary pointer-events-none" style="left: 0.7rem; font-size: 0.8rem; z-index: 2;"></i>
            <input 
              v-model="recentSearchQuery" 
              type="text" 
              class="form-control form-control-sm pe-4 rounded-3 shadow-none border" 
              placeholder="Search applications..." 
              style="padding-left: 2.1rem; font-size: 0.82rem; height: 32px;"
            />
            <button 
              v-if="recentSearchQuery" 
              type="button" 
              class="btn btn-link position-absolute top-50 end-0 translate-middle-y me-1 p-0 text-secondary text-decoration-none shadow-none border-0"
              @click="recentSearchQuery = ''"
            >
              <i class="pi pi-times" style="font-size: 0.7rem;"></i>
            </button>
          </div>
          <!-- Refresh Button -->
          <button @click="appStore.fetchApplications()" class="btn btn-sm btn-light border text-secondary shadow-xs d-flex align-items-center gap-1 rounded-3 px-2.5" style="height: 32px;">
            <i class="pi pi-refresh" :class="{ 'spin-icon': appStore.isLoadingConnections }"></i> <span class="d-none d-sm-inline">Refresh</span>
          </button>
          <!-- View All Button -->
          <Button
            label="View All"
            icon="pi pi-arrow-right"
            iconPos="right"
            class="p-button-secondary p-button-sm p-button-outlined shadow-xs rounded-3"
            style="height: 32px; font-size: 0.82rem;"
            @click="router.push('/application')"
          />
        </div>
      </div>

      <!-- Failure is shown rather than rendering an empty table that looks like "no records" -->
      <div v-if="appStore.connectionsError" class="alert alert-danger d-flex align-items-start gap-2 rounded-0 mb-0 p-3 small" role="alert">
        <i class="pi pi-exclamation-circle mt-1 flex-shrink-0"></i>
        <div>
          <div class="fw-semibold">Could not load applications</div>
          <div class="opacity-75">{{ appStore.connectionsError }}</div>
        </div>
      </div>

      <DataTable
        v-else
        :value="filteredRecentConnections"
        :loading="appStore.isLoadingConnections"
        scrollable
        :paginator="true"
        :rows="5"
        class="p-datatable-sm small"
      >
        <template #empty>
          <div class="text-center text-secondary py-4 small d-flex flex-column align-items-center gap-1">
            <i class="pi pi-inbox fs-4 opacity-50 mb-1"></i>
            <span>{{ recentSearchQuery ? `No applications matching "${recentSearchQuery}"` : 'No applications recorded yet.' }}</span>
          </div>
        </template>

        <Column field="name" header="Client Name" :sortable="true" style="min-width: 11rem"></Column>
        <Column field="node" header="City" :sortable="true" style="min-width: 8rem"></Column>
        <Column field="type" header="Applying For" :sortable="true" style="min-width: 9rem"></Column>
        <Column field="limit" header="Desired Plan" :sortable="true" style="min-width: 9rem"></Column>

        <Column field="status" header="Status" :sortable="true" style="min-width: 8rem">
          <template #body="{ data }">
            <Tag :severity="getSeverity(data.status)" :value="data.status" rounded></Tag>
          </template>
        </Column>

        <Column header="Actions" :exportable="false" style="min-width: 7rem" class="text-center">
          <template #body>
            <Button
              icon="pi pi-external-link"
              severity="secondary"
              text
              rounded
              aria-label="Open in Applications"
              v-tooltip.top="'Open in Applications'"
              @click="router.push('/application')"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAppStore } from '../stores/app'
import apiClient from '../services/api'
import StatCard from '../components/StatCard.vue'
import ChartCard from '../components/ChartCard.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const appStore = useAppStore()
const router = useRouter()
const toast = useToast()

// Live counts pulled from the API. `null` means "not loaded / unavailable" and
// renders as an em dash rather than an invented number.
const liveCounts = ref({
  applications: null,
  plans: null,
  activeSessions: null,
  radiusUsers: null,
  routers: null,
  vlans: null
})
const failedSources = ref([])

const countOf = (payload) => {
  let data = payload
  if (data && !Array.isArray(data) && typeof data === 'object') {
    const key = Object.keys(data).find(k => Array.isArray(data[k]))
    data = key ? data[key] : null
  }
  return Array.isArray(data) ? data.length : null
}

const loadCounts = async () => {
  const sources = [
    ['applications', '/Applications'],
    ['plans', '/Plans'],
    ['activeSessions', '/RadiusSession'],
    ['radiusUsers', '/RadiusUser'],
    ['routers', '/Routers'],
    ['vlans', '/Vlans']
  ]

  const failures = []
  await Promise.all(sources.map(async ([key, path]) => {
    try {
      liveCounts.value[key] = countOf(await apiClient.get(path))
    } catch {
      liveCounts.value[key] = null
      failures.push(path)
    }
  }))
  failedSources.value = failures
}

// Health badge reflects what the API actually returned on this page load.
const apiHealth = computed(() => {
  if (failedSources.value.length === 0 && liveCounts.value.plans !== null) {
    return { label: 'Systems Operational', class: 'bg-success bg-opacity-10 text-success border-success' }
  }
  if (failedSources.value.length >= 3) {
    return { label: 'API Unreachable', class: 'bg-danger bg-opacity-10 text-danger border-danger' }
  }
  if (failedSources.value.length > 0) {
    return { label: `Degraded — ${failedSources.value.length} endpoint(s) failing`, class: 'bg-warning bg-opacity-10 text-warning border-warning' }
  }
  return { label: 'Checking…', class: 'bg-secondary bg-opacity-10 text-secondary border-secondary' }
})

onMounted(() => {
  appStore.fetchApplications()
  loadCounts()
})

// Timeframe selector state
const selectedTimeframe = ref('30d')
const timeframes = [
  { label: 'Today', value: '1d' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'Year to Date', value: 'ytd' }
]

// KPI cards — every value is a real count from the API. Unavailable sources
// render as "—" instead of a placeholder figure.
const fmt = (n) => (n === null || n === undefined ? '—' : n.toLocaleString())

const kpiStats = computed(() => [
  {
    title: 'Applications',
    value: fmt(liveCounts.value.applications),
    icon: 'pi-users',
    iconBgClass: 'bg-primary bg-opacity-10',
    iconColorClass: 'text-primary'
  },
  {
    title: 'Active Sessions',
    value: fmt(liveCounts.value.activeSessions),
    icon: 'pi-wifi',
    iconBgClass: 'bg-success bg-opacity-10',
    iconColorClass: 'text-success'
  },
  {
    title: 'RADIUS Users',
    value: fmt(liveCounts.value.radiusUsers),
    icon: 'pi-id-card',
    iconBgClass: 'bg-info bg-opacity-10',
    iconColorClass: 'text-info'
  },
  {
    title: 'Active Plans',
    value: fmt(liveCounts.value.plans),
    icon: 'pi-tag',
    iconBgClass: 'bg-warning bg-opacity-10',
    iconColorClass: 'text-warning'
  },
  {
    title: 'Routers',
    value: fmt(liveCounts.value.routers),
    icon: 'pi-server',
    iconBgClass: 'bg-danger bg-opacity-10',
    iconColorClass: 'text-danger'
  },
  {
    title: 'VLANs',
    value: fmt(liveCounts.value.vlans),
    icon: 'pi-globe',
    iconBgClass: 'bg-secondary bg-opacity-10',
    iconColorClass: 'text-secondary'
  }
])

const recentConnections = computed(() => appStore.recentConnections)
const recentSearchQuery = ref('')

const filteredRecentConnections = computed(() => {
  const list = recentConnections.value || []
  const q = recentSearchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(item => {
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.node && item.node.toLowerCase().includes(q)) ||
      (item.type && item.type.toLowerCase().includes(q)) ||
      (item.limit && item.limit.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q))
    )
  })
})

const getSeverity = (status) => {
  switch (status) {
    case 'Active': return 'success'
    case 'Suspended': return 'danger'
    case 'Maintenance': return 'warn'
    default: return 'info'
  }
}

const handleExport = () => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const generatedAt = new Date().toLocaleString()

    doc.setFontSize(16)
    doc.text('Switch Fiber — Executive Summary', 40, 46)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Generated ${generatedAt}`, 40, 62)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: 84,
      head: [['Metric', 'Value']],
      body: kpiStats.value.map(s => [s.title, String(s.value)]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [231, 76, 90] }
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 24,
      head: [['Client Name', 'City', 'Applying For', 'Desired Plan', 'Status']],
      body: recentConnections.value.map(r => [r.name, r.node, r.type, r.limit, r.status]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [231, 76, 90] },
      // Keeps the export honest when the applications endpoint is unavailable.
      ...(recentConnections.value.length ? {} : { body: [['No application records available', '', '', '', '']] })
    })

    doc.save(`switchfiber-summary-${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.add({ severity: 'success', summary: 'Report exported', detail: 'The PDF summary has been downloaded.', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Export failed', detail: err.message || 'Could not generate the PDF report.', life: 5000 })
  }
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
      itemStyle: { color: '#e74c5a' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(231, 76, 90, 0.3)' }, { offset: 1, color: 'rgba(231, 76, 90, 0.02)' }]
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
