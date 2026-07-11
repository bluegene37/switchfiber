<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">Dashboard Overview</h1>
        <p class="small text-secondary mt-1 mb-0">Real-time network and business metrics.</p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary d-flex align-items-center shadow-sm">
          <i class="pi pi-download me-2"></i> Export Report
        </button>
        <button class="btn btn-primary d-flex align-items-center shadow-sm">
          <i class="pi pi-plus me-2"></i> New Customer
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="row g-4">
      <div class="col-12 col-sm-6 col-lg-3" v-for="stat in kpiStats" :key="stat.title">
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

    <!-- Charts Row -->
    <div class="row g-4">
      <div class="col-12 col-lg-6">
        <ChartCard title="Network Bandwidth Usage (Gbps)" :option="bandwidthChartOption" />
      </div>
      <div class="col-12 col-lg-6">
        <ChartCard title="Subscriber Growth" :option="growthChartOption" />
      </div>
    </div>

    <!-- Connection Manager (PrimeVue DataTable) -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
      <div class="card-header bg-body border-bottom p-4">
        <h3 class="fs-5 fw-bold text-body mb-0">Recent Connections</h3>
      </div>
      
      <DataTable :value="recentConnections" responsiveLayout="scroll" :paginator="true" :rows="5" class="p-datatable-sm small">
        <Column field="name" header="Client Name" :sortable="true"></Column>
        <Column field="node" header="Server Node" :sortable="true"></Column>
        <Column field="type" header="Connection Type" :sortable="true"></Column>
        <Column field="limit" header="Bandwidth Limit" :sortable="true"></Column>
        
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
import { computed, ref, onMounted } from 'vue'
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

const kpiStats = computed(() => appStore.kpiStats)
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

// ECharts Options
const bandwidthChartOption = ref({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: { type: 'value' },
  series: [
    { name: 'Download', type: 'line', smooth: true, data: [42, 38, 85, 94, 88, 110, 65], itemStyle: { color: '#0066FF' } },
    { name: 'Upload', type: 'line', smooth: true, data: [15, 12, 35, 40, 38, 45, 25], itemStyle: { color: '#10B981' } } // Emerald
  ]
})

const growthChartOption = ref({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
  yAxis: { type: 'value' },
  series: [
    {
      name: 'Subscribers',
      type: 'bar',
      barWidth: '60%',
      data: [10200, 10500, 10900, 11200, 11800, 12450],
      itemStyle: { color: '#8B5CF6' },
      borderRadius: [4, 4, 0, 0]
    }
  ]
})
</script>
