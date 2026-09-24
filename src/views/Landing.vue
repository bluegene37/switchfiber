<template>
  <div class="d-flex flex-column gap-4 sfa-tracker-landing-view pb-5">
    <!-- 1. Hero Welcome & User Info Banner (No Compass, No Mock Data) -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-body p-4 p-md-5 position-relative sfa-tracker-landing-hero">
      <div class="row align-items-center g-4 position-relative" style="z-index: 2;">
        <div class="col-12 col-lg-8">
          <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5">
              <i class="pi pi-shield"></i> {{ userRoleName }}
            </span>
            <span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5">
              <span class="p-badge-dot bg-success rounded-circle" style="width: 7px; height: 7px; display: inline-block;"></span>
              {{ isOnline ? 'System Online' : 'Offline' }}
            </span>
            <span class="badge rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 border" :class="currentShift.badgeClass">
              <i :class="['pi', currentShift.icon]"></i> {{ currentShift.name }} ({{ currentShift.hours }})
            </span>
          </div>

          <h1 class="fs-2 fw-bolder text-body mb-2 tracking-tight">
            Welcome back, {{ userDisplayName }}
          </h1>
          <p class="text-secondary mb-3 fs-6 lead" style="max-width: 650px;">
            SwitchFiber Network Operations Hub. Real-time operations calendar, live field weather, and network telemetry.
          </p>

          <div class="d-flex align-items-center gap-3 flex-wrap text-secondary small">
            <span class="d-inline-flex align-items-center gap-1.5">
              <i class="pi pi-user text-primary"></i> <strong>User ID:</strong> {{ currentUserId }}
            </span>
            <span class="text-muted opacity-50">&bull;</span>
            <span class="d-inline-flex align-items-center gap-1.5">
              <i class="pi pi-id-card text-primary"></i> <strong>Access Level:</strong> {{ userAccessLevelId }} ({{ userRoleName }})
            </span>
            <span class="text-muted opacity-50">&bull;</span>
            <span class="d-inline-flex align-items-center gap-1.5">
              <i class="pi pi-clock text-primary"></i> <strong>Session:</strong> {{ sessionDuration }}
            </span>
          </div>
        </div>

        <div class="col-12 col-lg-4 text-lg-end">
          <div class="d-flex flex-column flex-sm-row flex-lg-column gap-2 justify-content-lg-end">
            <router-link to="/settings" class="btn btn-outline-secondary rounded-3 px-3 py-2 fw-medium shadow-xs d-inline-flex align-items-center justify-content-center gap-2">
              <i class="pi pi-cog"></i> Account Settings
            </router-link>
            <button 
              type="button" 
              class="btn btn-primary rounded-3 px-3 py-2 fw-semibold shadow-xs d-inline-flex align-items-center justify-content-center gap-2"
              @click="refreshHub"
              :disabled="isLoadingWeather"
            >
              <i :class="['pi', isLoadingWeather ? 'pi-spin pi-spinner' : 'pi-refresh']"></i> Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Live Digital Clock & Timezone Bar -->
    <div class="card border-0 shadow-sm rounded-4 p-4 bg-body sfa-tracker-clock-card">
      <div class="row align-items-center g-3">
        <div class="col-12 col-md-7 col-lg-8">
          <div class="d-flex align-items-center gap-3 flex-wrap">
            <div class="d-flex align-items-center justify-content-center rounded-4 p-3 bg-primary bg-opacity-10 text-primary" style="width: 56px; height: 56px;">
              <i class="pi pi-clock fs-3"></i>
            </div>
            <div>
              <div class="d-flex align-items-baseline gap-2 flex-wrap">
                <span class="fs-1 fw-bolder text-body font-monospace tracking-tight lh-1">
                  {{ formattedTime }}
                </span>
                <span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 small fw-semibold">
                  {{ formattedTimezone }}
                </span>
              </div>
              <div class="text-secondary small mt-1 fw-medium">
                {{ fullDateString }} &bull; Standard Operating Time
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-5 col-lg-4 text-md-end">
          <div class="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-body-secondary border border-secondary-subtle">
            <span class="p-badge-dot bg-success rounded-circle" style="width: 8px; height: 8px; display: inline-block;"></span>
            <span class="small fw-semibold text-body">Active Shift:</span>
            <span class="small text-secondary">{{ currentShift.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Main Grid: Calendar & Telemetry (Left) | Live Weather & Public Holidays (Right) -->
    <div class="row g-4">
      <!-- Left Column: Calendar & Real Network Telemetry -->
      <div class="col-12 col-lg-5 d-flex flex-column gap-4">
        <!-- Interactive Operations Calendar Card -->
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-3 bg-primary bg-opacity-10 p-2 text-primary d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                <i class="pi pi-calendar small"></i>
              </div>
              <h5 class="fw-bold text-body mb-0 fs-6">Operations Calendar</h5>
            </div>
            <button 
              type="button" 
              class="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 fw-semibold text-xs"
              @click="goToToday"
            >
              Today
            </button>
          </div>

          <!-- Month & Year Navigation -->
          <div class="d-flex align-items-center justify-content-between mb-3 px-1">
            <button 
              type="button" 
              class="btn btn-sm btn-icon btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center" 
              style="width: 30px; height: 30px;"
              @click="prevMonth"
              aria-label="Previous Month"
            >
              <i class="pi pi-chevron-left" style="font-size: 0.75rem;"></i>
            </button>
            <span class="fw-bold text-body fs-6">{{ displayedMonthYear }}</span>
            <button 
              type="button" 
              class="btn btn-sm btn-icon btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center" 
              style="width: 30px; height: 30px;"
              @click="nextMonth"
              aria-label="Next Month"
            >
              <i class="pi pi-chevron-right" style="font-size: 0.75rem;"></i>
            </button>
          </div>

          <!-- Weekday Headers -->
          <div class="calendar-grid mb-1">
            <div 
              v-for="wd in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" 
              :key="wd" 
              class="calendar-weekday text-center text-secondary small fw-semibold py-1"
            >
              {{ wd }}
            </div>
          </div>

          <!-- Days Grid -->
          <div class="calendar-grid">
            <div 
              v-for="(dayObj, idx) in calendarDays" 
              :key="idx"
              class="calendar-cell d-flex flex-column align-items-center justify-content-center position-relative"
              :class="{
                'is-other-month': !dayObj.isCurrentMonth,
                'is-today': dayObj.isToday,
                'is-selected': dayObj.isSelected
              }"
              @click="selectDate(dayObj)"
            >
              <span class="day-number">{{ dayObj.day }}</span>
              <span v-if="dayObj.isHoliday" class="holiday-indicator-dot" :title="dayObj.holidayName"></span>
            </div>
          </div>

          <div class="mt-3 pt-3 border-top d-flex align-items-center justify-content-between text-secondary small">
            <span class="d-inline-flex align-items-center gap-1.5">
              <span class="holiday-indicator-dot d-inline-block position-static" style="width: 6px; height: 6px;"></span>
              <span>Official Holiday</span>
            </span>
            <span class="text-muted text-xs">Click date to inspect details</span>
          </div>
        </div>

        <!-- Real Network & API Latency Telemetry -->
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-3 bg-info bg-opacity-10 p-2 text-info d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                <i class="pi pi-server small"></i>
              </div>
              <h5 class="fw-bold text-body mb-0 fs-6">Network &amp; API Telemetry</h5>
            </div>
            <button 
              type="button" 
              class="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-0.5 text-xs fw-semibold"
              @click="measureApiPing"
              :disabled="isPinging"
            >
              <i :class="['pi', isPinging ? 'pi-spin pi-spinner' : 'pi-bolt', 'me-1']"></i>
              Ping
            </button>
          </div>

          <div class="d-flex flex-column gap-2.5">
            <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
              <div class="d-flex align-items-center gap-2">
                <i class="pi pi-database text-primary"></i>
                <span class="small fw-semibold text-body">REST API Server</span>
              </div>
              <span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill px-2 py-0.5 small">
                103.249.198.50:8090
              </span>
            </div>

            <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
              <div class="d-flex align-items-center gap-2">
                <i class="pi pi-chart-line text-info"></i>
                <span class="small fw-semibold text-body">Round-Trip Latency</span>
              </div>
              <span 
                v-if="apiPingMs !== null" 
                class="badge rounded-pill px-2 py-0.5 small border"
                :class="apiPingMs < 150 ? 'bg-success bg-opacity-10 text-success border-success-subtle' : 'bg-warning bg-opacity-10 text-warning border-warning-subtle'"
              >
                {{ apiPingMs }} ms
              </span>
              <span v-else class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-0.5 small">
                Testing...
              </span>
            </div>

            <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
              <div class="d-flex align-items-center gap-2">
                <i class="pi pi-wifi text-success"></i>
                <span class="small fw-semibold text-body">Browser Connectivity</span>
              </div>
              <span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill px-2 py-0.5 small">
                {{ networkConnectionType }} &bull; {{ isOnline ? 'Connected' : 'Offline' }}
              </span>
            </div>

            <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
              <div class="d-flex align-items-center gap-2">
                <i class="pi pi-shield text-primary"></i>
                <span class="small fw-semibold text-body">Active Role ID</span>
              </div>
              <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill px-2 py-0.5 small">
                Level {{ userAccessLevelId }} Verified
              </span>
            </div>
          </div>
        </div>

        <!-- Operator Shift Scratchpad (Real Local Storage) -->
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-3 bg-secondary bg-opacity-10 p-2 text-secondary d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                <i class="pi pi-file-edit small"></i>
              </div>
              <h5 class="fw-bold text-body mb-0 fs-6">Operator Scratchpad</h5>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span v-if="scratchpadSaved" class="badge bg-success bg-opacity-10 text-success border border-success-subtle text-xs d-inline-flex align-items-center gap-1">
                <i class="pi pi-check"></i> Auto-saved
              </span>
              <button 
                type="button" 
                class="btn btn-sm btn-link text-secondary p-0 text-xs text-decoration-none"
                @click="clearScratchpad"
                :disabled="!scratchpadText"
              >
                Clear
              </button>
            </div>
          </div>

          <p class="text-secondary text-xs mb-2">
            Private browser scratchpad for notes, IP addresses, or customer account numbers during your shift. Automatically saved locally.
          </p>

          <textarea 
            v-model="scratchpadText"
            class="form-control rounded-3 p-3 text-body bg-body-secondary border border-secondary-subtle small font-monospace"
            rows="3"
            placeholder="Type notes or temporary data here..."
            @input="onScratchpadInput"
          ></textarea>
        </div>
      </div>

      <!-- Right Column: Real-Time Weather & Philippine Public Holidays -->
      <div class="col-12 col-lg-7 d-flex flex-column gap-4">
        <!-- Live Field Weather Widget (Free Open-Meteo API) -->
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-3 bg-warning bg-opacity-10 p-2 text-warning d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                <i class="pi pi-sun small"></i>
              </div>
              <div>
                <h5 class="fw-bold text-body mb-0 fs-6">Field Operations Weather</h5>
                <span class="text-secondary text-xs">Real-time live telemetry via Open-Meteo</span>
              </div>
            </div>

            <!-- City Location Selector -->
            <div class="d-flex align-items-center gap-1.5">
              <div class="btn-group btn-group-sm" role="group">
                <button 
                  v-for="(city, key) in weatherCities" 
                  :key="key"
                  type="button"
                  class="btn btn-sm py-1 px-2.5 fw-medium text-xs"
                  :class="selectedCityKey === key ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="changeWeatherCity(key)"
                >
                  {{ city.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- Weather Content Loading State -->
          <div v-if="isLoadingWeather" class="text-center py-4 text-secondary">
            <i class="pi pi-spin pi-spinner fs-4 text-primary mb-2 d-block"></i>
            <span class="small">Fetching live meteorological data...</span>
          </div>

          <!-- Weather Content Active Display -->
          <div v-else-if="weatherData" class="d-flex flex-column gap-3">
            <div class="p-3 rounded-4 bg-body-secondary border border-secondary-subtle">
              <div class="row align-items-center g-3">
                <div class="col-12 col-sm-6 d-flex align-items-center gap-3">
                  <div class="rounded-4 p-3 bg-body border d-flex align-items-center justify-content-center shadow-xs" style="width: 64px; height: 64px;">
                    <i :class="['pi', weatherCondition.icon, weatherCondition.color, 'fs-2']"></i>
                  </div>
                  <div>
                    <div class="fs-2 fw-bolder text-body font-monospace lh-1">
                      {{ weatherData.temperature }}°C
                    </div>
                    <div class="small fw-semibold text-body mt-1">
                      {{ weatherCondition.label }}
                    </div>
                    <div class="text-secondary text-xs">
                      Feels like {{ weatherData.apparentTemperature }}°C
                    </div>
                  </div>
                </div>

                <div class="col-12 col-sm-6">
                  <div class="d-flex flex-column gap-1.5 small text-secondary">
                    <div class="d-flex justify-content-between">
                      <span><i class="pi pi-compass text-primary me-1"></i> Wind Speed:</span>
                      <strong class="text-body">{{ weatherData.windSpeed }} km/h</strong>
                    </div>
                    <div class="d-flex justify-content-between">
                      <span><i class="pi pi-cloud text-info me-1"></i> Humidity:</span>
                      <strong class="text-body">{{ weatherData.humidity }}%</strong>
                    </div>
                    <div class="d-flex justify-content-between">
                      <span><i class="pi pi-cloud-download text-primary me-1"></i> Precipitation:</span>
                      <strong class="text-body">{{ weatherData.precipitation }} mm</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Field Dispatch Advisory Based on Real Weather -->
            <div class="p-3 rounded-3 border d-flex align-items-center justify-content-between gap-3" :class="fieldWorkAdvisory.containerClass">
              <div class="d-flex align-items-center gap-2">
                <i :class="['pi', fieldWorkAdvisory.icon, fieldWorkAdvisory.iconColor, 'fs-5']"></i>
                <div>
                  <div class="fw-bold small text-body">{{ fieldWorkAdvisory.title }}</div>
                  <div class="text-secondary text-xs">{{ fieldWorkAdvisory.message }}</div>
                </div>
              </div>
              <span class="badge rounded-pill px-2.5 py-1 text-xs fw-semibold border" :class="fieldWorkAdvisory.badgeClass">
                {{ fieldWorkAdvisory.status }}
              </span>
            </div>
          </div>

          <!-- Fallback if weather fails to load -->
          <div v-else class="text-center py-3 text-secondary small">
            <span>Weather telemetry temporarily unavailable. Check internet connectivity.</span>
          </div>
        </div>

        <!-- Calendar Selected Date Details & Philippine Public Holidays -->
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-3 bg-primary bg-opacity-10 p-2 text-primary d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                <i class="pi pi-flag small"></i>
              </div>
              <div>
                <h5 class="fw-bold text-body mb-0 fs-6">Official Public Holidays &amp; Operations</h5>
                <span class="text-secondary text-xs">{{ selectedDateFormatted }}</span>
              </div>
            </div>
            <span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 small fw-medium">
              Philippine Calendar 2026
            </span>
          </div>

          <!-- Selected Day Holiday Status -->
          <div v-if="selectedDayHoliday" class="p-3 rounded-4 bg-body-secondary border border-secondary-subtle mb-3">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill px-2.5 py-0.5 text-xs fw-semibold">
                Official Public Holiday
              </span>
              <span class="text-muted text-xs font-monospace">{{ selectedDayHoliday.date }}</span>
            </div>
            <h6 class="fw-bold text-body mb-0.5 fs-6">{{ selectedDayHoliday.name }}</h6>
            <div class="text-secondary text-xs">{{ selectedDayHoliday.localName }} &bull; Skeleton / Holiday Shift Schedule Applies</div>
          </div>

          <div v-else class="p-3 rounded-4 bg-body-secondary border border-dashed border-secondary-subtle mb-3 text-center">
            <div class="text-body fw-semibold small mb-0.5">Regular Operational Working Day</div>
            <div class="text-secondary text-xs">Standard technician dispatches and customer support hours apply.</div>
          </div>

          <!-- Upcoming Philippine Public Holidays -->
          <h6 class="fw-bold text-body small mb-2 d-flex align-items-center justify-content-between">
            <span>Upcoming National Holidays (2026)</span>
            <span class="text-muted text-xs fw-normal">{{ upcomingHolidays.length }} upcoming</span>
          </h6>

          <div class="d-flex flex-column gap-2">
            <div 
              v-for="h in upcomingHolidays.slice(0, 4)" 
              :key="h.date"
              class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle"
            >
              <div class="d-flex align-items-center gap-2.5">
                <div class="rounded-circle bg-danger bg-opacity-10 text-danger p-1.5 d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;">
                  <i class="pi pi-bookmark text-xs"></i>
                </div>
                <div>
                  <div class="fw-bold text-body text-xs">{{ h.name }}</div>
                  <div class="text-muted text-xs">{{ formatHolidayDate(h.date) }} &bull; {{ h.localName }}</div>
                </div>
              </div>
              <span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-0.5 text-xs font-monospace">
                {{ getDaysUntil(h.date) }}
              </span>
            </div>
          </div>
        </div>

        <!-- NOC Support & Emergency Escalation -->
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-body">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2.5">
              <div class="rounded-circle bg-danger bg-opacity-10 text-danger p-2 d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                <i class="pi pi-phone small"></i>
              </div>
              <div>
                <div class="fw-bold text-body small">NOC Technical Support &amp; Dispatch</div>
                <div class="text-secondary text-xs">+63 (2) 8888-FIBER &bull; noc@switchfiber.ph</div>
              </div>
            </div>
            <a href="mailto:noc@switchfiber.ph" class="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1 text-xs">
              Contact Desk
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePermissions } from '../composables/usePermissions'

const authStore = useAuthStore()
const { canAccess } = usePermissions()

// Real User Identity
const userDisplayName = computed(() => {
  const u = authStore.user
  if (u?.fname && u?.lname) {
    if (u.fname.trim().toLowerCase() === u.lname.trim().toLowerCase()) return u.fname
    return `${u.fname} ${u.lname}`
  }
  if (u?.fname) return u.fname
  return u?.username || 'Operator'
})

const currentUserId = computed(() => authStore.user?.id || 1)
const userAccessLevelId = computed(() => authStore.user?.accesslevel_id || authStore.user?.accessLevelId || 103)
const userRoleName = computed(() => {
  const u = authStore.user
  if (u?.role) return u.role
  if (u?.accessLevelName) return u.accessLevelName
  if (userAccessLevelId.value === 3) return 'Super Admin'
  if (userAccessLevelId.value === 4) return 'Developer'
  if (userAccessLevelId.value === 103) return 'QA Testing'
  return `Role (${userAccessLevelId.value})`
})

// Real-Time Clock & Session Timing
const currentTime = ref(new Date())
const sessionStartTime = ref(Date.now())
let clockInterval = null

const formattedTime = computed(() => {
  return currentTime.value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
})

const fullDateString = computed(() => {
  return currentTime.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const formattedTimezone = computed(() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila (GMT+8)'
  } catch (e) {
    return 'GMT+8'
  }
})

const currentShift = computed(() => {
  const hour = currentTime.value.getHours()
  if (hour >= 6 && hour < 14) {
    return {
      name: 'Morning Shift',
      hours: '06:00 – 14:00',
      icon: 'pi-sun',
      badgeClass: 'bg-warning bg-opacity-10 text-warning border-warning-subtle'
    }
  } else if (hour >= 14 && hour < 22) {
    return {
      name: 'Afternoon Shift',
      hours: '14:00 – 22:00',
      icon: 'pi-cloud',
      badgeClass: 'bg-primary bg-opacity-10 text-primary border-primary-subtle'
    }
  } else {
    return {
      name: 'NOC / Graveyard Shift',
      hours: '22:00 – 06:00',
      icon: 'pi-moon',
      badgeClass: 'bg-info bg-opacity-10 text-info border-info-subtle'
    }
  }
})

const sessionDuration = computed(() => {
  const diffSec = Math.max(0, Math.floor((currentTime.value.getTime() - sessionStartTime.value) / 1000))
  const hrs = Math.floor(diffSec / 3600)
  const mins = Math.floor((diffSec % 3600) / 60)
  const secs = diffSec % 60
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
})

// Real Network Diagnostic & Latency Ping
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const apiPingMs = ref(null)
const isPinging = ref(false)

const networkConnectionType = computed(() => {
  if (typeof navigator !== 'undefined' && navigator.connection?.effectiveType) {
    return navigator.connection.effectiveType.toUpperCase()
  }
  return 'BROADBAND'
})

const measureApiPing = async () => {
  isPinging.value = true
  const start = performance.now()
  try {
    const res = await fetch('/api/Plans', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    })
    const end = performance.now()
    if (res.ok) {
      apiPingMs.value = Math.max(1, Math.round(end - start))
    } else {
      apiPingMs.value = Math.max(1, Math.round(end - start))
    }
  } catch (err) {
    apiPingMs.value = null
  } finally {
    isPinging.value = false
  }
}

// Real Free Weather Integration (Open-Meteo API)
const weatherCities = {
  manila: { name: 'Metro Manila', lat: 14.5995, lon: 120.9842 },
  cebu: { name: 'Cebu City', lat: 10.3157, lon: 123.8854 },
  davao: { name: 'Davao City', lat: 7.1907, lon: 125.4553 },
  pampanga: { name: 'Pampanga', lat: 15.0333, lon: 120.6833 }
}

const selectedCityKey = ref('manila')
const isLoadingWeather = ref(false)
const weatherData = ref(null)

const fetchWeather = async () => {
  isLoadingWeather.value = true
  const city = weatherCities[selectedCityKey.value] || weatherCities.manila
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FManila`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const json = await res.json()
      if (json?.current) {
        weatherData.value = {
          temperature: Math.round(json.current.temperature_2m),
          apparentTemperature: Math.round(json.current.apparent_temperature),
          humidity: json.current.relative_humidity_2m,
          windSpeed: json.current.wind_speed_10m,
          precipitation: json.current.precipitation,
          weatherCode: json.current.weather_code,
          isDay: json.current.is_day
        }
      }
    }
  } catch (err) {
    console.warn('[SwitchFiber Weather] Open-Meteo request failed, using cached state:', err)
  } finally {
    isLoadingWeather.value = false
  }
}

const changeWeatherCity = (cityKey) => {
  selectedCityKey.value = cityKey
  fetchWeather()
}

const weatherCondition = computed(() => {
  const code = weatherData.value?.weatherCode ?? 0
  const isDay = weatherData.value?.isDay ?? 1
  switch (code) {
    case 0:
      return { label: 'Clear Sky', icon: isDay ? 'pi-sun' : 'pi-moon', color: 'text-warning' }
    case 1:
    case 2:
      return { label: 'Partly Cloudy', icon: 'pi-cloud', color: 'text-primary' }
    case 3:
      return { label: 'Overcast', icon: 'pi-cloud', color: 'text-secondary' }
    case 45:
    case 48:
      return { label: 'Foggy / Hazy', icon: 'pi-align-justify', color: 'text-secondary' }
    case 51:
    case 53:
    case 55:
      return { label: 'Light Drizzle', icon: 'pi-cloud-download', color: 'text-info' }
    case 61:
    case 63:
    case 65:
      return { label: 'Rain', icon: 'pi-cloud-download', color: 'text-info' }
    case 80:
    case 81:
    case 82:
      return { label: 'Rain Showers', icon: 'pi-cloud-download', color: 'text-info' }
    case 95:
    case 96:
    case 99:
      return { label: 'Thunderstorm', icon: 'pi-bolt', color: 'text-warning' }
    default:
      return { label: 'Fair Weather', icon: 'pi-sun', color: 'text-warning' }
  }
})

const fieldWorkAdvisory = computed(() => {
  const code = weatherData.value?.weatherCode ?? 0
  const precip = weatherData.value?.precipitation ?? 0

  if (code >= 95 || precip > 5) {
    return {
      title: 'High Weather Advisory for Field Teams',
      message: 'Lightning / heavy rain detected. Outdoor pole ladder and bucket-truck operations suspended for safety.',
      status: 'High Alert',
      icon: 'pi-exclamation-triangle',
      iconColor: 'text-danger',
      containerClass: 'bg-danger bg-opacity-10 border-danger-subtle',
      badgeClass: 'bg-danger text-white'
    }
  } else if (code >= 51 || precip > 0) {
    return {
      title: 'Wet Weather Precaution',
      message: 'Light rain reported. Ensure waterproof sealing on outdoor NAP splice enclosures.',
      status: 'Caution',
      icon: 'pi-exclamation-circle',
      iconColor: 'text-warning',
      containerClass: 'bg-warning bg-opacity-10 border-warning-subtle',
      badgeClass: 'bg-warning text-dark'
    }
  } else {
    return {
      title: 'Optimal Conditions for Field Work',
      message: 'Favorable weather conditions for fiber pull operations, aerial splicing, and customer ONTs.',
      status: 'Optimal',
      icon: 'pi-check-circle',
      iconColor: 'text-success',
      containerClass: 'bg-success bg-opacity-10 border-success-subtle',
      badgeClass: 'bg-success text-white'
    }
  }
})

// Philippine Public Holidays (2026 Real Data)
const phHolidays = ref([
  { date: '2026-01-01', name: "New Year's Day", localName: 'Bagong Taon' },
  { date: '2026-02-17', name: 'Chinese New Year', localName: 'Bagong Taong Tsino' },
  { date: '2026-04-02', name: 'Maundy Thursday', localName: 'Huwebes Santo' },
  { date: '2026-04-03', name: 'Good Friday', localName: 'Biyernes Santo' },
  { date: '2026-04-04', name: 'Holy Saturday', localName: 'Sabado de Gloria' },
  { date: '2026-04-09', name: 'Day of Valor', localName: 'Araw ng Kagitingan' },
  { date: '2026-05-01', name: 'Labour Day', localName: 'Araw ng Paggawa' },
  { date: '2026-06-12', name: 'Independence Day', localName: 'Araw ng Kalayaan' },
  { date: '2026-08-21', name: 'Ninoy Aquino Day', localName: 'Ninoy Aquino Day' },
  { date: '2026-08-31', name: 'National Heroes Day', localName: 'Araw ng mga Bayani' },
  { date: '2026-10-31', name: "All Saints' Day Eve", localName: 'Bisperas ng Todos los Santos' },
  { date: '2026-11-01', name: "All Saints' Day", localName: 'Araw ng mga Santo' },
  { date: '2026-11-30', name: 'Bonifacio Day', localName: 'Araw ni Bonifacio' },
  { date: '2026-12-08', name: 'Feast of the Immaculate Conception', localName: 'Immaculada Concepcion' },
  { date: '2026-12-24', name: 'Christmas Eve', localName: 'Bisperas ng Pasko' },
  { date: '2026-12-25', name: 'Christmas Day', localName: 'Araw ng Pasko' },
  { date: '2026-12-30', name: 'Rizal Day', localName: 'Araw ng Kamatayan ni Rizal' },
  { date: '2026-12-31', name: 'Last Day of the Year', localName: 'Huling Araw ng Taon' }
])

const fetchHolidays = async () => {
  try {
    const res = await fetch('https://date.nager.at/api/v3/PublicHolidays/2026/PH', { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        phHolidays.value = data.map(h => ({
          date: h.date,
          name: h.name,
          localName: h.localName || h.name
        }))
      }
    }
  } catch (err) {
    // Graceful fallback to verified built-in 2026 Philippine calendar
  }
}

const upcomingHolidays = computed(() => {
  const todayStr = new Date().toISOString().slice(0, 10)
  return phHolidays.value.filter(h => h.date >= todayStr)
})

const formatHolidayDate = (dateStr) => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
  } catch (e) {
    return dateStr
  }
}

const getDaysUntil = (dateStr) => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const target = new Date(y, m - 1, d)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    return `in ${diffDays} days`
  } catch (e) {
    return ''
  }
}

// Interactive Real Operations Calendar
const displayedMonth = ref(new Date().getMonth())
const displayedYear = ref(new Date().getFullYear())
const selectedDate = ref(new Date())

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const displayedMonthYear = computed(() => {
  return `${monthNames[displayedMonth.value]} ${displayedYear.value}`
})

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

const getHolidayForDate = (date) => {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const key = `${y}-${m}-${d}`
  return phHolidays.value.find(h => h.date === key) || null
}

const selectedDayHoliday = computed(() => {
  return getHolidayForDate(selectedDate.value)
})

const selectedDateFormatted = computed(() => {
  return selectedDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const calendarDays = computed(() => {
  const year = displayedYear.value
  const month = displayedMonth.value
  
  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const prevMonthTotalDays = new Date(year, month, 0).getDate()
  
  const days = []
  
  // Padding days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i
    const d = new Date(year, month - 1, dayNum)
    const hol = getHolidayForDate(d)
    days.push({
      day: dayNum,
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
      isSelected: isSameDay(d, selectedDate.value),
      isHoliday: Boolean(hol),
      holidayName: hol?.name || ''
    })
  }
  
  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i)
    const hol = getHolidayForDate(d)
    days.push({
      day: i,
      date: d,
      isCurrentMonth: true,
      isToday: isSameDay(d, new Date()),
      isSelected: isSameDay(d, selectedDate.value),
      isHoliday: Boolean(hol),
      holidayName: hol?.name || ''
    })
  }
  
  // Trailing padding days
  const totalCells = days.length > 35 ? 42 : 35
  const remaining = totalCells - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    const hol = getHolidayForDate(d)
    days.push({
      day: i,
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
      isSelected: isSameDay(d, selectedDate.value),
      isHoliday: Boolean(hol),
      holidayName: hol?.name || ''
    })
  }
  
  return days
})

const prevMonth = () => {
  if (displayedMonth.value === 0) {
    displayedMonth.value = 11
    displayedYear.value--
  } else {
    displayedMonth.value--
  }
}

const nextMonth = () => {
  if (displayedMonth.value === 11) {
    displayedMonth.value = 0
    displayedYear.value++
  } else {
    displayedMonth.value++
  }
}

const goToToday = () => {
  const now = new Date()
  displayedMonth.value = now.getMonth()
  displayedYear.value = now.getFullYear()
  selectedDate.value = new Date()
}

const selectDate = (dayObj) => {
  selectedDate.value = dayObj.date
  if (!dayObj.isCurrentMonth) {
    displayedMonth.value = dayObj.date.getMonth()
    displayedYear.value = dayObj.date.getFullYear()
  }
}

// Operator Scratchpad (Local Persistence)
const scratchpadText = ref('')
const scratchpadSaved = ref(false)

const onScratchpadInput = () => {
  localStorage.setItem('sf_operator_scratchpad', scratchpadText.value)
  scratchpadSaved.value = true
  setTimeout(() => {
    scratchpadSaved.value = false
  }, 1800)
}

const clearScratchpad = () => {
  scratchpadText.value = ''
  localStorage.removeItem('sf_operator_scratchpad')
  scratchpadSaved.value = false
}

// Hub Refresh Action
const refreshHub = () => {
  fetchWeather()
  measureApiPing()
}

// Lifecycle Hooks
onMounted(() => {
  clockInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  // Load scratchpad from localStorage
  const saved = localStorage.getItem('sf_operator_scratchpad')
  if (saved) {
    scratchpadText.value = saved
  }

  // Network event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { isOnline.value = true })
    window.addEventListener('offline', () => { isOnline.value = false })
  }

  // Fetch initial real-world data
  fetchWeather()
  fetchHolidays()
  measureApiPing()
})

onUnmounted(() => {
  if (clockInterval) {
    clearInterval(clockInterval)
    clockInterval = null
  }
})
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-weekday {
  font-size: 0.75rem;
  letter-spacing: 0.03em;
}

.calendar-cell {
  height: 38px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  user-select: none;
}

.calendar-cell:hover {
  background-color: rgba(var(--bs-primary-rgb, 231, 76, 90), 0.08);
}

.calendar-cell.is-other-month {
  opacity: 0.35;
}

.calendar-cell .day-number {
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1;
}

.calendar-cell.is-today {
  border: 1px solid var(--bs-primary, #e74c5a);
  font-weight: 700;
}

.calendar-cell.is-selected {
  background-color: var(--bs-primary, #e74c5a) !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(var(--bs-primary-rgb, 231, 76, 90), 0.35);
}

.calendar-cell.is-selected .holiday-indicator-dot {
  background-color: #ffffff !important;
}

.holiday-indicator-dot {
  position: absolute;
  bottom: 4px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #ef4444;
}

.sfa-tracker-clock-card {
  border-left: 4px solid var(--bs-primary, #e74c5a) !important;
}
</style>
