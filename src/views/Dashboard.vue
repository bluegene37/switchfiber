<template>
  <div class="d-flex flex-column gap-4 sfa-tracker-dashboard">
    <!-- Header with Quick Timeframe Filters -->
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 sfa-tracker-dashboard-header">
      <div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h1 class="fs-3 fw-bold text-body mb-0">Executive Dashboard</h1>
          <span
            class="badge px-2.5 py-1 rounded-pill small d-flex align-items-center gap-1 border border-opacity-25"
            :class="apiHealth.class"
            v-tooltip.bottom="failedSourcesSummary"
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
          :disabled="isLoadingCounts"
          :loading="isLoadingCounts"
          v-tooltip.bottom="isLoadingCounts ? 'Waiting for live data to finish loading…' : null"
          @click="handleExport"
        />
      </div>
    </div>

    <!-- KPI Summary Cards Grid -->
    <div class="row g-3 sfa-tracker-dashboard-kpis">
      <div class="col-12 col-sm-6 col-xl-2" v-for="stat in visibleKpiStats" :key="stat.title">
        <StatCard
          :title="stat.title"
          :value="stat.value"
          :trend="stat.trend"
          :icon="stat.icon"
          :iconBgClass="stat.iconBgClass"
          :iconColorClass="stat.iconColorClass"
          :loading="stat.loading"
        />
      </div>
    </div>

    <!-- Network Plant & LCP NAP Infrastructure Map -->
    <div class="row g-4">
      <div class="col-12">
        <DashboardMapCard @stats="onMapStats" />
      </div>
    </div>

    <!-- Main Charts Row 1: Applications over time & requested plans, both real,
         scoped to the timeframe the header buttons select. -->
    <div class="row g-4">
      <div class="col-12 col-xl-7">
        <ChartCard :title="`Applications Trend (${activeTimeframeLabel})`" :option="applicationsTrendChartOption" />
      </div>
      <div class="col-12 col-xl-5">
        <ChartCard :title="`Requested Plans (${activeTimeframeLabel})`" :option="planDistributionChartOption" />
      </div>
    </div>

    <!-- Main Charts Row 2: Live Status Breakdowns. Applications follows the
         selected timeframe; Job Orders spans the whole table. -->
    <div class="row g-4">
      <div class="col-12 col-lg-6">
        <ChartCard :title="`Application Status (${activeTimeframeLabel})`" :option="applicationsChartOption" />
      </div>
      <div class="col-12 col-lg-6">
        <ChartCard title="Job Order Status Breakdown" :option="jobOrdersChartOption" />
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
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
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
import { ApplicationService } from '../services/applications'
import { usePermissions } from '../composables/usePermissions'
import { buildCategoricalRamp, buildPaletteFromHex, MASTER_THEME_COLOR } from '../composables/useTheme'
import StatCard from '../components/StatCard.vue'
import ChartCard from '../components/ChartCard.vue'
import DashboardMapCard from '../components/DashboardMapCard.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const appStore = useAppStore()
const router = useRouter()
const toast = useToast()
const { canAccess } = usePermissions()

// Live counts pulled from the API. `null` means "not loaded / unavailable" and
// renders as an em dash rather than an invented number. Only sources a card on
// THIS screen consumes are fetched — the endpoints that are permanently empty
// (Invoices, RadiusSession) or failing (BillingDetails) stay on the navbar
// bell's watch list but no longer put a permanent "Degraded" badge on a
// dashboard that doesn't render them.
const liveCounts = ref({
  applications: null,
  jobOrders: null,
  plans: null,
  radiusUsers: null,
  routers: null,
  naps: null,
  ports: null,
  users: null,
  lcpnapNodes: null,
  lcpnapPorts: null
})
// Labels (not paths) of sources that failed on this load — shown on the badge
// hover and the PDF's outage note.
const failedSources = ref([])
const totalCountSources = ref(0)

// Per-source in-flight flags so each KPI card can show a shimmer until its own
// request settles, instead of an em dash that reads as "no data".
const pendingCounts = ref({})

// The whole-table sources behind the KPI cards. Applications is NOT here: its
// real size is 15,449+ and the unbounded GET silently caps at 5,000 rows (and
// nearly took the backend down doing it) — its count comes from the paged
// endpoint's totalCount for a one-row payload instead.
const COUNT_SOURCES = [
  { key: 'jobOrders', label: 'Job Orders', path: '/JobOrders', tallyField: 'status' },
  { key: 'plans', label: 'Active Plans', path: '/Plans' },
  { key: 'radiusUsers', label: 'RADIUS Users', path: '/RadiusUser' },
  { key: 'routers', label: 'Routers', path: '/Routers' },
  { key: 'naps', label: 'NAPs', path: '/Naps' },
  { key: 'ports', label: 'Ports', path: '/Ports' },
  { key: 'users', label: 'Users', path: '/Users' }
]

// `applications` is tallied from the timeframe window (see loadWindowData);
// `jobOrders` from the full table. `null` = not resolved, distinct from zero.
const statusTallies = ref({ applications: null, jobOrders: null })

const rowsOf = (payload) => {
  let data = payload
  if (data && !Array.isArray(data) && typeof data === 'object') {
    const key = Object.keys(data).find(k => Array.isArray(data[k]))
    data = key ? data[key] : null
  }
  return Array.isArray(data) ? data : null
}

const countOf = (payload) => {
  const rows = rowsOf(payload)
  return rows ? rows.length : null
}

const loadCounts = async () => {
  const failures = []
  totalCountSources.value = COUNT_SOURCES.length + 1 // + the paged Applications count
  pendingCounts.value.applications = true
  COUNT_SOURCES.forEach(({ key }) => { pendingCounts.value[key] = true })

  const tasks = COUNT_SOURCES.map(async ({ key, label, path, tallyField }) => {
    try {
      const payload = await apiClient.get(path)
      liveCounts.value[key] = countOf(payload)
      if (tallyField) {
        const tallies = {}
        ;(rowsOf(payload) || []).forEach(row => {
          const status = String(row?.[tallyField] || '').trim().toLowerCase()
          if (!status) return
          tallies[status] = (tallies[status] || 0) + 1
        })
        statusTallies.value[key] = tallies
      }
    } catch {
      liveCounts.value[key] = null
      if (tallyField) statusTallies.value[key] = null
      failures.push(label)
    } finally {
      pendingCounts.value[key] = false
    }
  })

  // The exact table size for one row of payload — the headline number must not
  // inherit the unbounded GET's silent 5,000-row cap.
  tasks.push((async () => {
    try {
      const paged = await apiClient.get('/Applications/paged', { params: { pageNumber: 1, pageSize: 1 } })
      const total = Number(paged?.totalCount)
      liveCounts.value.applications = Number.isFinite(total) ? total : null
      if (!Number.isFinite(total)) failures.push('Applications')
    } catch {
      liveCounts.value.applications = null
      failures.push('Applications')
    } finally {
      pendingCounts.value.applications = false
    }
  })())

  await Promise.all(tasks)
  failedSources.value = failures
}

// Health badge reflects what the API actually returned on this page load.
const apiHealth = computed(() => {
  if (failedSources.value.length === 0 && liveCounts.value.plans !== null) {
    return { label: 'Systems Operational', class: 'bg-success bg-opacity-10 text-success border-success' }
  }
  if (totalCountSources.value > 0 && failedSources.value.length >= totalCountSources.value / 2) {
    return { label: 'API Unreachable', class: 'bg-danger bg-opacity-10 text-danger border-danger' }
  }
  if (failedSources.value.length > 0) {
    return { label: `Degraded — ${failedSources.value.length} endpoint(s) failing`, class: 'bg-warning bg-opacity-10 text-warning border-warning' }
  }
  return { label: 'Checking…', class: 'bg-secondary bg-opacity-10 text-secondary border-secondary' }
})

// Hover detail for the health badge: every failing endpoint by name.
const failedSourcesSummary = computed(() => {
  if (failedSources.value.length === 0) return null
  return `Failing: ${failedSources.value.join(', ')}`
})

// LCP NAP plant truth comes from the map card's own load — one fetch feeds
// both the plotted markers and the two infrastructure KPI cards.
const onMapStats = ({ nodes, ports }) => {
  liveCounts.value.lcpnapNodes = Number.isFinite(nodes) ? nodes : null
  liveCounts.value.lcpnapPorts = Number.isFinite(ports) ? ports : null
}

onMounted(() => {
  appStore.fetchApplications()
  loadCounts()
  loadWindowData()
})

// Timeframe selector state. The buttons drive the window every
// applications-derived chart is computed from — they are not decorative.
const selectedTimeframe = ref('30d')
const timeframes = [
  { label: 'Today', value: '1d' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'Year to Date', value: 'ytd' }
]
const activeTimeframeLabel = computed(() =>
  timeframes.find(tf => tf.value === selectedTimeframe.value)?.label || ''
)

// Bounds for the selected window, half-open on today so "Today" means today.
const timeframeBounds = (value) => {
  const now = new Date()
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  let from
  if (value === '1d') from = startOfDay(now)
  else if (value === '7d') from = startOfDay(new Date(now.getTime() - 6 * 86400000))
  else if (value === 'ytd') from = new Date(now.getFullYear(), 0, 1)
  else from = startOfDay(new Date(now.getTime() - 29 * 86400000))
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return { from, to }
}

// The applications inside the selected window, fetched once per timeframe via
// the server's date filter (~200 KB for a month) and shared by the trend line,
// the requested-plans doughnut, and the status doughnut. This replaces the two
// unbounded full-table downloads the old dashboard issued on every visit.
const windowRows = ref(null)   // null = not resolved; [] = genuinely empty
const windowLoading = ref(false)
const windowFailed = ref(false)
let windowToken = 0

const loadWindowData = async () => {
  const token = ++windowToken
  windowLoading.value = true
  windowFailed.value = false
  try {
    const { from, to } = timeframeBounds(selectedTimeframe.value)
    const payload = await ApplicationService.filterApplications({
      fromDate: from.toISOString(),
      toDate: to.toISOString()
    })
    if (token !== windowToken) return
    windowRows.value = rowsOf(payload) || []
    const tallies = {}
    windowRows.value.forEach(row => {
      const status = String(row?.status || '').trim().toLowerCase()
      if (!status) return
      tallies[status] = (tallies[status] || 0) + 1
    })
    statusTallies.value = { ...statusTallies.value, applications: tallies }
  } catch {
    if (token !== windowToken) return
    windowRows.value = null
    windowFailed.value = true
    statusTallies.value = { ...statusTallies.value, applications: null }
  } finally {
    if (token === windowToken) windowLoading.value = false
  }
}

watch(selectedTimeframe, () => { loadWindowData() })

// KPI cards — every value is a real count from the API. Unavailable sources
// render as "—" instead of a placeholder figure.
const fmt = (n) => (n === null || n === undefined ? '—' : n.toLocaleString())

// Each card names the menu code that governs the screen its number comes from,
// so a user whose menu hides a screen is not shown its count here either —
// same gate as the sidebar, the routes, and the omnibox. Cards with no
// governing menu (RADIUS) stay visible to everyone.
const kpiStats = computed(() => [
  {
    title: 'Applications',
    code: 'application.all',
    value: fmt(liveCounts.value.applications),
    loading: !!pendingCounts.value.applications,
    icon: 'pi-users',
    iconBgClass: 'bg-primary bg-opacity-10',
    iconColorClass: 'text-primary'
  },
  {
    title: 'Job Orders',
    code: 'job-orders.all',
    value: fmt(liveCounts.value.jobOrders),
    loading: !!pendingCounts.value.jobOrders,
    icon: 'pi-ticket',
    iconBgClass: 'bg-primary bg-opacity-10',
    iconColorClass: 'text-primary'
  },
  {
    title: 'RADIUS Users',
    code: null,
    value: fmt(liveCounts.value.radiusUsers),
    loading: !!pendingCounts.value.radiusUsers,
    icon: 'pi-id-card',
    iconBgClass: 'bg-info bg-opacity-10',
    iconColorClass: 'text-info'
  },
  {
    title: 'Active Plans',
    code: 'file-maintenance.plan',
    value: fmt(liveCounts.value.plans),
    loading: !!pendingCounts.value.plans,
    icon: 'pi-tag',
    iconBgClass: 'bg-warning bg-opacity-10',
    iconColorClass: 'text-warning'
  },
  {
    title: 'Routers',
    code: 'file-maintenance.router',
    value: fmt(liveCounts.value.routers),
    loading: !!pendingCounts.value.routers,
    icon: 'pi-wifi',
    iconBgClass: 'bg-danger bg-opacity-10',
    iconColorClass: 'text-danger'
  },
  {
    title: 'NAPs',
    code: 'file-maintenance.nap',
    value: fmt(liveCounts.value.naps),
    loading: !!pendingCounts.value.naps,
    icon: 'pi-box',
    iconBgClass: 'bg-warning bg-opacity-10',
    iconColorClass: 'text-warning'
  },
  {
    title: 'Ports',
    code: 'file-maintenance.port',
    value: fmt(liveCounts.value.ports),
    loading: !!pendingCounts.value.ports,
    icon: 'pi-link',
    iconBgClass: 'bg-danger bg-opacity-10',
    iconColorClass: 'text-danger'
  },
  {
    title: 'Users',
    code: 'users-management.user',
    value: fmt(liveCounts.value.users),
    loading: !!pendingCounts.value.users,
    icon: 'pi-user',
    iconBgClass: 'bg-secondary bg-opacity-10',
    iconColorClass: 'text-secondary'
  },
  {
    title: 'LCP NAP Nodes',
    code: 'lcp-nap-locations.map',
    value: fmt(liveCounts.value.lcpnapNodes),
    loading: liveCounts.value.lcpnapNodes === null,
    icon: 'pi-sitemap',
    iconBgClass: 'bg-success bg-opacity-10',
    iconColorClass: 'text-success'
  },
  {
    title: 'Plant Ports',
    code: 'lcp-nap-locations.map',
    value: fmt(liveCounts.value.lcpnapPorts),
    loading: liveCounts.value.lcpnapPorts === null,
    icon: 'pi-share-alt',
    iconBgClass: 'bg-success bg-opacity-10',
    iconColorClass: 'text-success'
  }
])

const visibleKpiStats = computed(() =>
  kpiStats.value.filter(stat => !stat.code || canAccess(stat.code))
)

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

const isLoadingCounts = computed(() => Object.values(pendingCounts.value).some(Boolean))

const handleExport = () => {
  // A report of nothing but placeholders is worse than no report: it looks
  // broken and can circulate as if it were real figures.
  const hasAnyData =
    Object.values(liveCounts.value).some(v => v !== null) ||
    (recentConnections.value || []).length > 0
  if (!hasAnyData) {
    toast.add({
      severity: 'warn',
      summary: 'Nothing to export',
      detail: 'No live data is available — the API is currently unreachable. Try again once the connection recovers.',
      life: 5000
    })
    return
  }

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
      // The user's own view of the cards — a metric their menu hides does not
      // reappear in a PDF with their name on it.
      body: visibleKpiStats.value.map(s => [s.title, s.value === '—' ? 'N/A' : String(s.value)]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [231, 76, 90] }
    })

    // Live status breakdowns, matching the dashboard doughnuts. Applications is
    // scoped to the selected timeframe, exactly like its chart.
    const breakdownRows = []
    ;[
      ['Job Orders', statusTallies.value.jobOrders],
      [`Applications (${activeTimeframeLabel.value})`, statusTallies.value.applications]
    ].forEach(([category, tallies]) => {
      Object.entries(tallies || {}).forEach(([status, count]) => {
        breakdownRows.push([category, titleCaseStatus(status), String(count)])
      })
    })
    if (breakdownRows.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 24,
        head: [['Category', 'Status', 'Count']],
        body: breakdownRows,
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [231, 76, 90] }
      })
    }

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 24,
      head: [['Client Name', 'City', 'Applying For', 'Desired Plan', 'Status']],
      body: recentConnections.value.map(r => [r.name, r.node, r.type, r.limit, r.status]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [231, 76, 90] },
      // Keeps the export honest when the applications endpoint is unavailable.
      ...(recentConnections.value.length ? {} : { body: [['No application records available', '', '', '', '']] })
    })

    // Full disclosure of what was down at export time, so N/A rows are
    // attributable to an outage rather than read as real zeros.
    if (failedSources.value.length > 0) {
      const note = `Unavailable at export time (endpoint failing): ${failedSources.value.join(', ')}`
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(doc.splitTextToSize(note, 515), 40, doc.lastAutoTable.finalY + 20)
      doc.setTextColor(0)
    }

    doc.save(`switchfiber-summary-${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.add({ severity: 'success', summary: 'Report exported', detail: 'The PDF summary has been downloaded.', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Export failed', detail: err.message || 'Could not generate the PDF report.', life: 5000 })
  }
}

// Chart series colours.
//
// ECharts renders to canvas and cannot read CSS custom properties, so the palette
// is resolved here from the same MASTER_THEME_COLOR that drives the CSS tokens —
// changing that one hex still recolours every chart.
//
// Categorical series (plan tiers, node names) step through the brand hue. Only
// genuinely semantic series keep fixed status colours.
const brandRamp = buildCategoricalRamp(MASTER_THEME_COLOR, 5)
const BRAND = {
  deep: brandRamp[0],
  mid: brandRamp[1],
  base: brandRamp[2],
  light: brandRamp[3],
  pale: brandRamp[4]
}
const rgbaOf = (hex, alpha) => `rgba(${buildPaletteFromHex(hex).rgb}, ${alpha})`

// Mirrors the semantic tokens in style.css; these must not follow the brand hue.
const STATUS = {
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

// 1. Applications Trend — real submissions per bucket inside the selected
// window. Bucket size follows the window: hours for Today, days for 7/30
// days, months for Year to Date.
const trendBuckets = computed(() => {
  if (!Array.isArray(windowRows.value)) return null
  const tf = selectedTimeframe.value
  const { from, to } = timeframeBounds(tf)
  const buckets = []
  const index = new Map()

  if (tf === '1d') {
    for (let h = 0; h < 24; h++) {
      const label = `${String(h).padStart(2, '0')}:00`
      index.set(label, buckets.length)
      buckets.push({ label, count: 0 })
    }
  } else if (tf === 'ytd') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let m = 0; m <= to.getMonth(); m++) {
      index.set(String(m), buckets.length)
      buckets.push({ label: months[m], count: 0 })
    }
  } else {
    for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86400000)) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      index.set(key, buckets.length)
      buckets.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 })
    }
  }

  windowRows.value.forEach(row => {
    const d = new Date(row?.dateTime || row?.modifiedDate || '')
    if (isNaN(d.getTime())) return
    let key
    if (tf === '1d') key = `${String(d.getHours()).padStart(2, '0')}:00`
    else if (tf === 'ytd') key = String(d.getMonth())
    else key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const at = index.get(key)
    if (at !== undefined) buckets[at].count += 1
  })
  return buckets
})

// Centered placeholder in the same shape ChartCard expects, for the states a
// series cannot express: still loading, fetch failed, or a genuinely empty window.
const chartPlaceholder = (text) => ({
  title: {
    text,
    left: 'center',
    top: 'middle',
    textStyle: { fontSize: 13, fontWeight: 'normal', color: '#9ca3af' }
  }
})

const applicationsTrendChartOption = computed(() => {
  if (windowFailed.value) return chartPlaceholder('Applications data unavailable')
  if (windowLoading.value && !Array.isArray(windowRows.value)) return chartPlaceholder('Loading applications…')
  const buckets = trendBuckets.value
  if (!buckets) return chartPlaceholder('Loading applications…')
  if (windowRows.value.length === 0) return chartPlaceholder('No applications in this window')
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: buckets.map(b => b.label) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: 'Applications',
        type: 'line',
        smooth: true,
        data: buckets.map(b => b.count),
        itemStyle: { color: BRAND.base },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: rgbaOf(BRAND.base, 0.35) }, { offset: 1, color: rgbaOf(BRAND.base, 0.02) }]
          }
        }
      }
    ]
  }
})

// 2. Requested Plans — tallied from the window's own desiredPlan values, so it
// costs no request of its own. Top plans get their own slice; the tail folds
// into Others so a long list of one-off plan spellings cannot shred the chart.
const planDistributionChartOption = computed(() => {
  if (windowFailed.value) return chartPlaceholder('Applications data unavailable')
  if (!Array.isArray(windowRows.value)) return chartPlaceholder('Loading plans…')
  const tally = {}
  windowRows.value.forEach(row => {
    const plan = String(row?.desiredPlan || '').trim()
    if (!plan) return
    tally[plan] = (tally[plan] || 0) + 1
  })
  const entries = Object.entries(tally).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return chartPlaceholder('No plans requested in this window')

  const TOP = 6
  const top = entries.slice(0, TOP)
  const othersCount = entries.slice(TOP).reduce((sum, [, n]) => sum + n, 0)
  const ramp = buildCategoricalRamp(MASTER_THEME_COLOR, Math.min(entries.length, TOP + 1))
  const data = top.map(([name, value], i) => ({ value, name, itemStyle: { color: ramp[i % ramp.length] } }))
  if (othersCount > 0) data.push({ value: othersCount, name: 'Others', itemStyle: { color: '#9ca3af' } })

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [
      {
        name: 'Requested Plans',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: '14', fontWeight: 'bold' } },
        data
      }
    ]
  }
})

// 4. Live Status Breakdown doughnuts — one per transactional endpoint.
// Canonical statuses keep fixed semantic colours; anything else the backend
// introduces still shows up, coloured from the brand ramp.
const titleCaseStatus = (key) => key.replace(/\b\w/g, c => c.toUpperCase())

const buildStatusDoughnut = ({ counts, meta, sourceLabel, seriesName, noun }) => {
  const slices = []

  Object.entries(meta).forEach(([key, m]) => {
    if (counts && counts[key]) {
      slices.push({ value: counts[key], name: m.label, itemStyle: { color: m.color } })
    }
  })
  let rampIndex = 0
  Object.entries(counts || {}).forEach(([key, value]) => {
    if (meta[key]) return
    slices.push({ value, name: titleCaseStatus(key), itemStyle: { color: brandRamp[rampIndex++ % brandRamp.length] } })
  })

  if (slices.length === 0) {
    const fetchFailed = failedSources.value.includes(sourceLabel) ||
      (sourceLabel === 'Applications' && windowFailed.value)
    return {
      title: {
        text: fetchFailed
          ? `${seriesName} data unavailable`
          : (counts === null ? `Loading ${noun}…` : `No ${noun} recorded yet`),
        left: 'center',
        top: 'middle',
        textStyle: { fontSize: 13, fontWeight: 'normal', color: '#9ca3af' }
      }
    }
  }

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [
      {
        name: seriesName,
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: '14', fontWeight: 'bold' } },
        data: slices
      }
    ]
  }
}

const jobOrdersChartOption = computed(() => buildStatusDoughnut({
  counts: statusTallies.value.jobOrders,
  meta: {
    inprogress: { label: 'In Progress', color: STATUS.warning },
    completed: { label: 'Completed', color: STATUS.success },
    activated: { label: 'Activated', color: BRAND.base }
  },
  sourceLabel: 'Job Orders',
  seriesName: 'Job Orders',
  noun: 'job orders'
}))

// Scoped to the selected timeframe window, like the trend and plan charts —
// the statuses are spelled the way the data spells them ('Inprogress').
const applicationsChartOption = computed(() => buildStatusDoughnut({
  counts: statusTallies.value.applications,
  meta: {
    inprogress: { label: 'In Progress', color: STATUS.warning },
    submitted: { label: 'Submitted', color: BRAND.light },
    schedule: { label: 'Schedule', color: BRAND.base },
    cancelled: { label: 'Cancelled', color: STATUS.danger },
    duplicate: { label: 'Duplicate', color: STATUS.warning }
  },
  sourceLabel: 'Applications',
  seriesName: 'Applications',
  noun: 'applications'
}))

</script>

<style scoped>
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
