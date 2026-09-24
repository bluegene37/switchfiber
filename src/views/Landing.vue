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

    <!-- 2. Daily Inspiration & Culture (Placed Prominently After User Login Info) -->
    <div class="card border-0 shadow-sm rounded-4 p-4 bg-body sfa-tracker-inspiration-section">
      <!-- Section Header with In-Place Controls -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div class="d-flex align-items-center gap-2.5">
          <div class="rounded-3 bg-primary bg-opacity-10 text-primary p-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
            <i class="pi pi-sparkles"></i>
          </div>
          <div>
            <h5 class="fw-bold text-body mb-0 fs-6">Daily Inspiration &amp; Culture</h5>
            <span class="text-secondary text-xs">Free public feeds &bull; Scripture, Photography, Sayings, TIL &amp; History</span>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button 
            type="button" 
            class="btn btn-sm btn-outline-secondary rounded-3 px-2.5 py-1 text-xs fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
            @click="openCustomizeModal"
          >
            <i class="pi pi-sliders-h"></i>
            <span>Customize Cards</span>
          </button>
          <button 
            type="button" 
            class="btn btn-sm btn-outline-secondary rounded-3 p-1 d-inline-flex align-items-center justify-content-center"
            style="width: 28px; height: 28px;"
            @click="toggleSection"
            :title="widgetPrefs.showSection ? 'Collapse Section' : 'Expand Section'"
            :aria-label="widgetPrefs.showSection ? 'Collapse Section' : 'Expand Section'"
          >
            <i :class="['pi', widgetPrefs.showSection ? 'pi-chevron-up' : 'pi-chevron-down', 'text-xs']"></i>
          </button>
        </div>
      </div>

      <!-- Section Body when Expanded -->
      <div v-if="widgetPrefs.showSection">
        <!-- If all widgets are hidden via toggles -->
        <div v-if="visibleWidgetsCount === 0" class="text-center py-4 px-3 rounded-4 bg-body-secondary border border-dashed border-secondary-subtle">
          <div class="rounded-circle bg-secondary bg-opacity-10 text-secondary p-3 d-inline-flex align-items-center justify-content-center mb-2">
            <i class="pi pi-eye-slash fs-4"></i>
          </div>
          <h6 class="fw-bold text-body mb-1 fs-6">All Inspiration Cards Are Hidden</h6>
          <p class="text-secondary text-xs mb-3" style="max-width: 420px; margin: 0 auto;">
            You have hidden all extra widgets. Click Customize Cards to choose which items you want to view on your home screen.
          </p>
          <button type="button" class="btn btn-sm btn-primary rounded-3 px-3 py-1.5 fw-semibold text-xs" @click="openCustomizeModal">
            Customize Cards
          </button>
        </div>

        <!-- Dynamic Grid: Image on Left (2 Rows), 4 Cards on Right (2 Columns x 2 Rows) -->
        <div v-else class="row g-3 align-items-stretch">
          <!-- Left Column: Picture of the Day (Spans 2 Rows on Desktop) -->
          <div 
            v-if="widgetPrefs.showPicture" 
            :class="hasAnyRightWidget ? 'col-12 col-lg-5 d-flex flex-column' : 'col-12 d-flex flex-column'"
          >
            <div class="card border-0 shadow-xs rounded-4 p-3 bg-body-secondary h-100 d-flex flex-column justify-content-between">
              <div class="d-flex flex-column flex-grow-1">
                <div class="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
                  <div class="d-flex align-items-center gap-1.5 text-success small fw-bold">
                    <i :class="['pi', pictureCategoryIcon]"></i>
                    <span>{{ pictureCategoryTitle }}</span>
                  </div>

                  <div class="d-flex align-items-center gap-1.5 flex-wrap">
                    <!-- Category Filter Buttons: All, Scenery, Dogs, Cats -->
                    <div class="btn-group btn-group-sm" role="group" aria-label="Photo category filter">
                      <button 
                        type="button" 
                        class="btn btn-xs py-0.5 px-2 text-xxs fw-semibold"
                        :class="imageCategory === 'all' ? 'btn-success' : 'btn-outline-secondary'"
                        @click="setImageCategory('all')"
                        title="Show dogs, cats, or landscapes"
                      >
                        All
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-xs py-0.5 px-2 text-xxs fw-semibold"
                        :class="imageCategory === 'landscapes' ? 'btn-success' : 'btn-outline-secondary'"
                        @click="setImageCategory('landscapes')"
                        title="Show only landscapes and scenery"
                      >
                        Scenery
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-xs py-0.5 px-2 text-xxs fw-semibold"
                        :class="imageCategory === 'dogs' ? 'btn-success' : 'btn-outline-secondary'"
                        @click="setImageCategory('dogs')"
                        title="Show only dogs"
                      >
                        🐶 Dogs
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-xs py-0.5 px-2 text-xxs fw-semibold"
                        :class="imageCategory === 'cats' ? 'btn-success' : 'btn-outline-secondary'"
                        @click="setImageCategory('cats')"
                        title="Show only cats"
                      >
                        🐱 Cats
                      </button>
                    </div>

                    <button 
                      type="button" 
                      class="btn btn-sm btn-link text-secondary p-0 text-xs text-decoration-none ms-1"
                      @click="fetchPicture"
                      :disabled="isLoadingPicture"
                      :title="'Load new photo in current category'"
                    >
                      <i :class="['pi', isLoadingPicture ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
                    </button>
                  </div>
                </div>

                <div class="rounded-3 overflow-hidden border border-secondary-subtle position-relative shadow-inner mb-2 flex-grow-1 d-flex flex-column" style="min-height: 280px; background: #111;">
                  <img 
                    :src="pictureData.url" 
                    :alt="'Photo of ' + pictureData.author" 
                    class="w-100 h-100 object-fit-cover flex-grow-1"
                    style="transition: transform 0.4s ease;"
                    loading="lazy"
                  />
                  <!-- Smooth Loading Spinner Overlay -->
                  <div v-if="isLoadingPicture" class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 text-white" style="backdrop-filter: blur(2px);">
                    <i class="pi pi-spin pi-spinner fs-3"></i>
                  </div>
                  <div class="position-absolute bottom-0 start-0 end-0 p-2.5 bg-dark bg-opacity-75 text-white d-flex align-items-center justify-content-between flex-wrap gap-1">
                    <span class="text-xs text-truncate">
                      <i class="pi pi-camera me-1"></i>{{ pictureData.author }}
                    </span>
                    <a :href="pictureData.pageUrl" target="_blank" rel="noopener noreferrer" class="text-white text-decoration-underline text-xxs d-inline-flex align-items-center gap-1 opacity-75">
                      <span>View Full Size</span>
                      <i class="pi pi-external-link" style="font-size: 0.6rem;"></i>
                    </a>
                  </div>
                </div>
              </div>

              <div class="pt-2 border-top border-secondary-subtle d-flex align-items-center justify-content-between text-muted text-xs">
                <span>{{ pictureData.sourceLabel }}</span>
                <span class="badge bg-success bg-opacity-10 text-success border border-success-subtle text-xxs">{{ pictureData.badgeLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Right Column: 4 Cards Arranged in 2 Columns x 2 Rows -->
          <div 
            v-if="hasAnyRightWidget" 
            :class="widgetPrefs.showPicture ? 'col-12 col-lg-7' : 'col-12'"
          >
            <div class="row g-3 h-100">
              <!-- 1. Daily Bible Verse of the Day (Row 1, Col 1) -->
              <div v-if="widgetPrefs.showVerse" class="col-12 col-md-6 d-flex flex-column">
                <div class="card border-0 shadow-xs rounded-4 p-3 bg-body-secondary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-1">
                      <div class="d-flex align-items-center gap-1.5 text-warning small fw-bold">
                        <i class="pi pi-bookmark"></i>
                        <span>Bible Verse</span>
                        <span v-if="bibleVerseData.theme" class="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle text-xxs ms-1">
                          {{ bibleVerseData.theme }}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-link text-secondary p-0 text-xs text-decoration-none"
                        @click="fetchBibleVerse"
                        :disabled="isLoadingVerse"
                        title="Shuffle inspiring Bible verse"
                      >
                        <i :class="['pi', isLoadingVerse ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
                      </button>
                    </div>

                    <div class="py-1">
                      <blockquote class="fst-italic text-body small mb-2 lh-base" style="font-family: Georgia, 'Times New Roman', serif; font-size: 0.85rem; max-height: 110px; overflow-y: auto;">
                        &ldquo;{{ bibleVerseData.text }}&rdquo;
                      </blockquote>
                      <div class="text-end fw-bold text-warning text-xs">
                        &mdash; {{ bibleVerseData.reference }}
                      </div>
                    </div>
                  </div>

                  <div class="mt-2 pt-2 border-top border-secondary-subtle d-flex align-items-center justify-content-between text-muted text-xs">
                    <span>Bible-API.com</span>
                    <span class="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle text-xxs">
                      {{ bibleVerseData.theme || 'Daily Bread' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 2. Saying / Quote of the Day (Row 1, Col 2) -->
              <div v-if="widgetPrefs.showQuote" class="col-12 col-md-6 d-flex flex-column">
                <div class="card border-0 shadow-xs rounded-4 p-3 bg-body-secondary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <div class="d-flex align-items-center gap-1.5 text-primary small fw-bold">
                        <i class="pi pi-comment"></i>
                        <span>Saying of the Day</span>
                      </div>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-link text-secondary p-0 text-xs text-decoration-none"
                        @click="fetchQuote"
                        :disabled="isLoadingQuote"
                        title="Get another quote"
                      >
                        <i :class="['pi', isLoadingQuote ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
                      </button>
                    </div>

                    <div class="py-1">
                      <p class="fst-italic text-body small mb-2" style="font-size: 0.85rem; line-height: 1.45; max-height: 110px; overflow-y: auto;">
                        &ldquo;{{ quoteData.quote }}&rdquo;
                      </p>
                      <div class="text-end text-secondary text-xs fw-semibold">
                        &mdash; {{ quoteData.author }}
                      </div>
                    </div>
                  </div>

                  <div class="mt-2 pt-2 border-top border-secondary-subtle d-flex align-items-center justify-content-between text-muted text-xs">
                    <span>Free Quote API</span>
                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle text-xxs">Daily Wisdom</span>
                  </div>
                </div>
              </div>

              <!-- 3. Today I Learned (TIL) (Row 2, Col 1) -->
              <div v-if="widgetPrefs.showTil" class="col-12 col-md-6 d-flex flex-column">
                <div class="card border-0 shadow-xs rounded-4 p-3 bg-body-secondary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <div class="d-flex align-items-center gap-1.5 text-info small fw-bold">
                        <i class="pi pi-lightbulb"></i>
                        <span>Today I Learned (TIL)</span>
                      </div>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-link text-secondary p-0 text-xs text-decoration-none"
                        @click="fetchTil"
                        :disabled="isLoadingTil"
                        title="Shuffle Today I Learned insight"
                      >
                        <i :class="['pi', isLoadingTil ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
                      </button>
                    </div>

                    <div>
                      <div class="d-flex align-items-center gap-1.5 mb-1.5">
                        <span class="badge bg-info bg-opacity-10 text-info border border-info-subtle text-xxs fw-semibold">
                          {{ tilData.category || 'Fascinating Insight' }}
                        </span>
                      </div>
                      
                      <div class="p-2.5 rounded-3 bg-body border border-secondary-subtle d-flex align-items-center" style="min-height: 100px;">
                        <p class="text-body small mb-0 lh-base" style="font-size: 0.8125rem; max-height: 95px; overflow-y: auto;">
                          {{ tilData.fact }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="mt-2 pt-2 border-top border-secondary-subtle d-flex align-items-center justify-content-between text-muted text-xs">
                    <span class="text-truncate">{{ tilData.source || 'Daily Knowledge Base' }}</span>
                    <span class="badge bg-info bg-opacity-10 text-info border border-info-subtle text-xxs">TIL Discovery</span>
                  </div>
                </div>
              </div>

              <!-- 4. Today in History (Row 2, Col 2) -->
              <div v-if="widgetPrefs.showHistory" class="col-12 col-md-6 d-flex flex-column">
                <div class="card border-0 shadow-xs rounded-4 p-3 bg-body-secondary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <div class="d-flex align-items-center gap-1.5 text-warning small fw-bold">
                        <i class="pi pi-history"></i>
                        <span>Today in History</span>
                      </div>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-link text-secondary p-0 text-xs text-decoration-none"
                        @click="fetchTodayInHistory"
                        :disabled="isLoadingHistory"
                        title="Shuffle historical event"
                      >
                        <i :class="['pi', isLoadingHistory ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
                      </button>
                    </div>

                    <div class="py-1">
                      <div class="mb-1.5">
                        <span class="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle rounded-pill px-2 py-0.5 text-xs font-monospace fw-bold">
                          Year {{ historyData.year }}
                        </span>
                      </div>
                      <p class="text-body small mb-0" style="font-size: 0.8125rem; line-height: 1.45; max-height: 95px; overflow-y: auto;">
                        {{ historyData.text }}
                      </p>
                    </div>
                  </div>

                  <div class="mt-2 pt-2 border-top border-secondary-subtle d-flex align-items-center justify-content-between text-muted text-xs">
                    <span>Wikipedia Archive</span>
                    <span class="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle text-xxs">Historical Fact</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Collapsed State Notice -->
      <div v-else class="d-flex align-items-center justify-content-between py-2 px-3 rounded-3 bg-body-secondary border border-secondary-subtle">
        <span class="text-secondary small">Daily Inspiration &amp; Culture feed is currently collapsed.</span>
        <button type="button" class="btn btn-sm btn-outline-primary rounded-3 px-2.5 py-1 text-xs fw-semibold" @click="toggleSection">
          Show Section
        </button>
      </div>
    </div>

    <!-- 3. Main Grid: Calendar & Telemetry (Left) | Time, Weather & Holidays (Right) -->
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

      <!-- Right Column: Operations Time, Field Weather & Philippine Public Holidays -->
      <div class="col-12 col-lg-7 d-flex flex-column gap-4">
        <!-- Live Operations Time & Shift Status Card (Positioned to the right of Operations Calendar) -->
        <div class="card border-0 shadow-sm rounded-4 p-3.5 bg-body sfa-tracker-clock-card">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2.5">
            <div class="d-flex align-items-center gap-3">
              <div class="d-flex align-items-center justify-content-center rounded-3 p-2 bg-primary bg-opacity-10 text-primary" style="width: 44px; height: 44px;">
                <i class="pi pi-clock fs-4"></i>
              </div>
              <div>
                <div class="d-flex align-items-baseline gap-2 flex-wrap">
                  <span class="fs-2 fw-bolder text-body font-monospace tracking-tight lh-1">
                    {{ formattedTime }}
                  </span>
                  <span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-0.5 text-xs fw-semibold">
                    {{ formattedTimezone }}
                  </span>
                </div>
                <div class="text-secondary text-xs mt-1 fw-medium">
                  {{ fullDateString }} &bull; Standard Operating Time
                </div>
              </div>
            </div>

            <div>
              <div class="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-3 bg-body-secondary border border-secondary-subtle">
                <span class="p-badge-dot bg-success rounded-circle" style="width: 7px; height: 7px; display: inline-block;"></span>
                <span class="text-xs fw-semibold text-body">Active Shift:</span>
                <span class="text-xs text-secondary">{{ currentShift.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Field Weather Widget (Free Open-Meteo API) -->
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-3 bg-warning bg-opacity-10 p-2 text-warning d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                <i class="pi pi-sun small"></i>
              </div>
              <div>
                <h5 class="fw-bold text-body mb-0 fs-6">Field Operations Weather</h5>
                <span class="text-secondary text-xs">Real-time live telemetry &bull; {{ activeLocationDisplayName }}</span>
              </div>
            </div>

            <!-- Location Selector: Manila, Rizal, Current Location -->
            <div class="d-flex align-items-center gap-1.5 flex-wrap">
              <div class="btn-group btn-group-sm" role="group">
                <button 
                  type="button"
                  class="btn btn-sm py-1 px-2.5 fw-medium text-xs"
                  :class="selectedLocationKey === 'manila' ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="changeWeatherLocation('manila')"
                >
                  Manila
                </button>
                <button 
                  type="button"
                  class="btn btn-sm py-1 px-2.5 fw-medium text-xs"
                  :class="selectedLocationKey === 'rizal' ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="changeWeatherLocation('rizal')"
                >
                  Rizal
                </button>
                <button 
                  type="button"
                  class="btn btn-sm py-1 px-2.5 fw-medium text-xs d-inline-flex align-items-center gap-1"
                  :class="selectedLocationKey === 'current' ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="changeWeatherLocation('current')"
                  :disabled="isDetectingLocation"
                >
                  <i :class="['pi', isDetectingLocation ? 'pi-spin pi-spinner' : 'pi-map-marker', 'text-xs']"></i>
                  <span>Current Location</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="locationErrorMessage" class="alert alert-warning py-1.5 px-2.5 mb-2 small text-xs rounded-3 d-flex align-items-center justify-content-between">
            <span><i class="pi pi-exclamation-triangle me-1"></i> {{ locationErrorMessage }}</span>
            <button type="button" class="btn-close btn-close-sm p-1" @click="locationErrorMessage = ''"></button>
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
      </div>
    </div>

    <!-- 4. In-Place Customize Feed Modal Dialog -->
    <div v-if="showCustomizeModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.55); z-index: 1060;">
      <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
        <div class="modal-content border-0 shadow-lg rounded-4 p-2 bg-body">
          <div class="modal-header border-0 pb-1">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-3 bg-primary bg-opacity-10 text-primary p-2 d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                <i class="pi pi-sliders-h"></i>
              </div>
              <div>
                <h5 class="modal-title fw-bold text-body fs-6 mb-0">Customize Home Screen Cards</h5>
                <span class="text-secondary text-xs">Toggle which cards appear on this screen</span>
              </div>
            </div>
            <button type="button" class="btn-close" aria-label="Close" @click="closeCustomizeModal"></button>
          </div>

          <div class="modal-body py-3">
            <p class="text-secondary text-xs mb-3">
              Your preferences are automatically saved in your browser and remembered across sessions.
            </p>

            <div class="d-flex flex-column gap-2.5">
              <!-- Toggle 1: Bible Verse -->
              <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
                <div class="d-flex align-items-center gap-2.5">
                  <i class="pi pi-bookmark text-warning"></i>
                  <div>
                    <div class="fw-bold small text-body">Daily Bible Verse</div>
                    <div class="text-secondary text-xs">Scripture verse from public domain Bible API</div>
                  </div>
                </div>
                <div class="form-check form-switch m-0">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    :checked="widgetPrefs.showVerse" 
                    @change="toggleWidget('showVerse')"
                  />
                </div>
              </div>

              <!-- Toggle 2: Saying -->
              <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
                <div class="d-flex align-items-center gap-2.5">
                  <i class="pi pi-comment text-primary"></i>
                  <div>
                    <div class="fw-bold small text-body">Daily Saying / Quote</div>
                    <div class="text-secondary text-xs">Inspirational quote of the day</div>
                  </div>
                </div>
                <div class="form-check form-switch m-0">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    :checked="widgetPrefs.showQuote" 
                    @change="toggleWidget('showQuote')"
                  />
                </div>
              </div>

              <!-- Toggle 2: TIL -->
              <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
                <div class="d-flex align-items-center gap-2.5">
                  <i class="pi pi-lightbulb text-info"></i>
                  <div>
                    <div class="fw-bold small text-body">Today I Learned (TIL)</div>
                    <div class="text-secondary text-xs">Fascinating daily discoveries &amp; inspiration</div>
                  </div>
                </div>
                <div class="form-check form-switch m-0">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    :checked="widgetPrefs.showTil" 
                    @change="toggleWidget('showTil')"
                  />
                </div>
              </div>

              <!-- Toggle 3: Picture -->
              <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
                <div class="d-flex align-items-center gap-2.5">
                  <i class="pi pi-image text-success"></i>
                  <div>
                    <div class="fw-bold small text-body">Picture of the Day</div>
                    <div class="text-secondary text-xs">Dogs, cats, or scenic landscapes</div>
                  </div>
                </div>
                <div class="form-check form-switch m-0">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    :checked="widgetPrefs.showPicture" 
                    @change="toggleWidget('showPicture')"
                  />
                </div>
              </div>

              <!-- Photo Category Selector (When Picture is enabled) -->
              <div v-if="widgetPrefs.showPicture" class="p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle ms-2">
                <div class="d-flex align-items-center justify-content-between mb-1.5">
                  <span class="text-secondary text-xs fw-semibold">Photo Content Filter:</span>
                  <span class="badge bg-success bg-opacity-10 text-success border border-success-subtle text-xxs">Curated</span>
                </div>
                <div class="btn-group btn-group-sm w-100" role="group">
                  <button 
                    type="button" 
                    class="btn btn-xs py-1 text-xxs fw-semibold"
                    :class="imageCategory === 'all' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setImageCategory('all')"
                  >
                    All Mix
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-xs py-1 text-xxs fw-semibold"
                    :class="imageCategory === 'landscapes' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setImageCategory('landscapes')"
                  >
                    Scenery
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-xs py-1 text-xxs fw-semibold"
                    :class="imageCategory === 'dogs' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setImageCategory('dogs')"
                  >
                    🐶 Dogs
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-xs py-1 text-xxs fw-semibold"
                    :class="imageCategory === 'cats' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setImageCategory('cats')"
                  >
                    🐱 Cats
                  </button>
                </div>
              </div>

              <!-- Toggle 4: History -->
              <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
                <div class="d-flex align-items-center gap-2.5">
                  <i class="pi pi-history text-warning"></i>
                  <div>
                    <div class="fw-bold small text-body">Today in History</div>
                    <div class="text-secondary text-xs">Historical milestone from Wikipedia</div>
                  </div>
                </div>
                <div class="form-check form-switch m-0">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    :checked="widgetPrefs.showHistory" 
                    @change="toggleWidget('showHistory')"
                  />
                </div>
              </div>

              <div class="border-top pt-2 mt-1">
                <!-- Master Section Toggle -->
                <div class="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-body-secondary border border-secondary-subtle">
                  <div>
                    <div class="fw-bold small text-body">Show Entire Inspiration Section</div>
                    <div class="text-secondary text-xs">Master toggle for all extra widgets</div>
                  </div>
                  <div class="form-check form-switch m-0">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      role="switch" 
                      :checked="widgetPrefs.showSection" 
                      @change="toggleSection"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer border-0 pt-0 d-flex align-items-center justify-content-between">
            <button type="button" class="btn btn-sm btn-link text-secondary text-decoration-none text-xs p-0" @click="resetWidgetPreferences">
              Reset to Defaults
            </button>
            <button type="button" class="btn btn-sm btn-primary rounded-3 px-3 py-1.5 fw-semibold text-xs" @click="closeCustomizeModal">
              Save &amp; Close
            </button>
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
const weatherLocations = {
  manila: { name: 'Manila', lat: 14.5995, lon: 120.9842 },
  rizal: { name: 'Rizal', lat: 14.5842, lon: 121.1764 }
}

const selectedLocationKey = ref('manila')
const currentLocationCoords = ref(null)
const isDetectingLocation = ref(false)
const locationErrorMessage = ref('')
const isLoadingWeather = ref(false)
const weatherData = ref(null)

const activeLocationDisplayName = computed(() => {
  if (selectedLocationKey.value === 'manila') return 'Manila, PH'
  if (selectedLocationKey.value === 'rizal') return 'Rizal Province, PH'
  if (selectedLocationKey.value === 'current') {
    if (currentLocationCoords.value) {
      return `Current Location (${currentLocationCoords.value.lat.toFixed(2)}°, ${currentLocationCoords.value.lon.toFixed(2)}°)`
    }
    return 'Current Location'
  }
  return 'Manila, PH'
})

const fetchWeatherForCoords = async (lat, lon) => {
  isLoadingWeather.value = true
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FManila`
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

const fetchWeather = async () => {
  if (selectedLocationKey.value === 'current' && currentLocationCoords.value) {
    await fetchWeatherForCoords(currentLocationCoords.value.lat, currentLocationCoords.value.lon)
    return
  }
  const loc = weatherLocations[selectedLocationKey.value] || weatherLocations.manila
  await fetchWeatherForCoords(loc.lat, loc.lon)
}

const changeWeatherLocation = (locKey) => {
  locationErrorMessage.value = ''
  if (locKey === 'current') {
    selectedLocationKey.value = 'current'
    if (currentLocationCoords.value) {
      fetchWeatherForCoords(currentLocationCoords.value.lat, currentLocationCoords.value.lon)
      return
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      isDetectingLocation.value = true
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          isDetectingLocation.value = false
          currentLocationCoords.value = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          }
          fetchWeatherForCoords(pos.coords.latitude, pos.coords.longitude)
        },
        () => {
          isDetectingLocation.value = false
          locationErrorMessage.value = 'Location permission unavailable. Showing Manila.'
          selectedLocationKey.value = 'manila'
          fetchWeather()
        },
        { timeout: 8000 }
      )
    } else {
      locationErrorMessage.value = 'Geolocation is not supported by your browser. Showing Manila.'
      selectedLocationKey.value = 'manila'
      fetchWeather()
    }
    return
  }

  selectedLocationKey.value = locKey
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
      message: 'Light rain reported. Ensure waterproof sealing on outdoor NAP drop boxes.',
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

// -------------------------------------------------------------
// Daily Inspiration, Arts & Culture: Free Public APIs & Customization
// -------------------------------------------------------------
const DEFAULT_WIDGET_PREFS = {
  showSection: true,
  showVerse: true,
  showQuote: true,
  showTil: true,
  showPicture: true,
  showHistory: true
}

const widgetPrefs = ref({ ...DEFAULT_WIDGET_PREFS })
const showCustomizeModal = ref(false)

const loadWidgetPreferences = () => {
  try {
    const saved = localStorage.getItem('sf_landing_widget_prefs')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.showTil === undefined && parsed.showPoem !== undefined) {
        parsed.showTil = parsed.showPoem
      }
      widgetPrefs.value = { ...DEFAULT_WIDGET_PREFS, ...parsed }
    }
  } catch (err) {
    widgetPrefs.value = { ...DEFAULT_WIDGET_PREFS }
  }

  try {
    const savedCat = localStorage.getItem('sf_landing_image_category')
    if (savedCat && ['all', 'landscapes', 'dogs', 'cats'].includes(savedCat)) {
      imageCategory.value = savedCat
    }
  } catch (err) {}
}

const saveWidgetPreferences = () => {
  try {
    localStorage.setItem('sf_landing_widget_prefs', JSON.stringify(widgetPrefs.value))
  } catch (err) {}
}

const toggleWidget = (key) => {
  widgetPrefs.value[key] = !widgetPrefs.value[key]
  saveWidgetPreferences()
}

const toggleSection = () => {
  widgetPrefs.value.showSection = !widgetPrefs.value.showSection
  saveWidgetPreferences()
}

const resetWidgetPreferences = () => {
  widgetPrefs.value = { ...DEFAULT_WIDGET_PREFS }
  imageCategory.value = 'all'
  saveWidgetPreferences()
  try {
    localStorage.setItem('sf_landing_image_category', 'all')
  } catch (err) {}
  fetchPicture()
}

const openCustomizeModal = () => {
  showCustomizeModal.value = true
}

const closeCustomizeModal = () => {
  showCustomizeModal.value = false
}

const visibleWidgetsCount = computed(() => {
  let count = 0
  if (widgetPrefs.value.showVerse) count++
  if (widgetPrefs.value.showQuote) count++
  if (widgetPrefs.value.showTil) count++
  if (widgetPrefs.value.showPicture) count++
  if (widgetPrefs.value.showHistory) count++
  return count
})

const hasAnyRightWidget = computed(() => {
  return Boolean(
    widgetPrefs.value.showVerse ||
    widgetPrefs.value.showQuote ||
    widgetPrefs.value.showTil ||
    widgetPrefs.value.showHistory
  )
})

// 1. Bible Verse of the Day (Popular Verses: Love, Family, Grace, Faith, Hope & Strength)
const POPULAR_INSPIRING_VERSES = [
  // Love
  {
    reference: '1 Corinthians 13:4-7',
    text: 'Love is patient and is kind; love doesn’t envy. Love doesn’t brag, is not proud, doesn’t behave itself inappropriately, doesn’t seek its own way, is not provoked, takes no account of evil; doesn’t rejoice in unrighteousness, but rejoices with the truth; bears all things, believes all things, hopes all things, and endures all things.',
    theme: 'Love & Patience',
    translation: 'World English Bible'
  },
  {
    reference: '1 John 4:18-19',
    text: 'There is no fear in love; but perfect love casts out fear. We love him, because he first loved us.',
    theme: 'Perfect Love',
    translation: 'World English Bible'
  },
  {
    reference: 'John 15:12',
    text: 'This is my commandment, that you love one another, even as I have loved you.',
    theme: 'Love One Another',
    translation: 'World English Bible'
  },
  {
    reference: 'Colossians 3:14',
    text: 'Above all these things, walk in love, which is the bond of perfection.',
    theme: 'Bond of Love',
    translation: 'World English Bible'
  },
  {
    reference: '1 Corinthians 16:14',
    text: 'Let all that you do be done in love.',
    theme: 'Love in All Things',
    translation: 'World English Bible'
  },
  {
    reference: 'Romans 12:10',
    text: 'In love of the brothers be tenderly affectionate to one another; in honor preferring one another.',
    theme: 'Brotherly Love',
    translation: 'World English Bible'
  },

  // Family & Unity
  {
    reference: 'Joshua 24:15',
    text: 'As for me and my house, we will serve Yahweh.',
    theme: 'Family & Devotion',
    translation: 'World English Bible'
  },
  {
    reference: 'Proverbs 22:6',
    text: 'Train up a child in the way he should go, and when he is old he will not depart from it.',
    theme: 'Family & Guidance',
    translation: 'World English Bible'
  },
  {
    reference: 'Ephesians 4:32',
    text: 'Be kind to one another, tenderhearted, forgiving each other, just as God also in Christ forgave you.',
    theme: 'Kindness & Family',
    translation: 'World English Bible'
  },
  {
    reference: 'Psalm 133:1',
    text: 'See how good and how pleasant it is for brothers to live together in unity!',
    theme: 'Family & Unity',
    translation: 'World English Bible'
  },
  {
    reference: 'Proverbs 17:17',
    text: 'A friend loves at all times; and a brother is born for adversity.',
    theme: 'Family & Loyalty',
    translation: 'World English Bible'
  },

  // Grace & Mercy
  {
    reference: 'Ephesians 2:8-9',
    text: 'For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, that no one would boast.',
    theme: 'Grace & Gift',
    translation: 'World English Bible'
  },
  {
    reference: '2 Corinthians 12:9',
    text: 'My grace is sufficient for you, for my power is made perfect in weakness.',
    theme: 'Sufficient Grace',
    translation: 'World English Bible'
  },
  {
    reference: 'Hebrews 4:16',
    text: 'Let us therefore draw near with boldness to the throne of grace, that we may receive mercy and find grace to help in time of need.',
    theme: 'Throne of Grace',
    translation: 'World English Bible'
  },
  {
    reference: 'John 1:16',
    text: 'From his fullness we all received grace upon grace.',
    theme: 'Grace Upon Grace',
    translation: 'World English Bible'
  },
  {
    reference: 'Titus 2:11',
    text: 'For the grace of God has appeared, bringing salvation to all men.',
    theme: 'Saving Grace',
    translation: 'World English Bible'
  },

  // Faith & Trust
  {
    reference: 'Proverbs 3:5-6',
    text: 'Trust in Yahweh with all your heart, and don’t lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.',
    theme: 'Faith & Trust',
    translation: 'World English Bible'
  },
  {
    reference: 'Hebrews 11:1',
    text: 'Now faith is assurance of things hoped for, proof of things not seen.',
    theme: 'Unwavering Faith',
    translation: 'World English Bible'
  },
  {
    reference: '2 Corinthians 5:7',
    text: 'For we walk by faith, not by sight.',
    theme: 'Walking by Faith',
    translation: 'World English Bible'
  },
  {
    reference: 'Mark 11:24',
    text: 'All things whatever you pray and ask for, believe that you have received them, and you will have them.',
    theme: 'Faith & Prayer',
    translation: 'World English Bible'
  },
  {
    reference: 'Matthew 17:20',
    text: 'If you have faith even as small as a grain of mustard seed, you will tell this mountain, ‘Move from here to there,’ and it will move; and nothing will be impossible for you.',
    theme: 'Power of Faith',
    translation: 'World English Bible'
  },

  // Hope, Peace & Strength
  {
    reference: 'Jeremiah 29:11',
    text: 'For I know the thoughts that I think toward you, says Yahweh, thoughts of peace, and not of evil, to give you hope and a future.',
    theme: 'Hope & Future',
    translation: 'World English Bible'
  },
  {
    reference: 'Philippians 4:13',
    text: 'I can do all things through Christ, who strengthens me.',
    theme: 'Strength & Hope',
    translation: 'World English Bible'
  },
  {
    reference: 'Isaiah 40:31',
    text: 'Those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.',
    theme: 'Renewed Strength',
    translation: 'World English Bible'
  },
  {
    reference: 'Psalm 23:1-3',
    text: 'Yahweh is my shepherd: I shall lack nothing. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.',
    theme: 'Comfort & Peace',
    translation: 'World English Bible'
  },
  {
    reference: 'Romans 8:28',
    text: 'We know that all things work together for good for those who love God, to those who are called according to his purpose.',
    theme: 'Hope & Purpose',
    translation: 'World English Bible'
  },
  {
    reference: 'Joshua 1:9',
    text: 'Be strong and courageous. Don’t be afraid, neither be dismayed: for Yahweh your God is with you wherever you go.',
    theme: 'Courage & Hope',
    translation: 'World English Bible'
  },
  {
    reference: 'Romans 15:13',
    text: 'Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope, in the power of the Holy Spirit.',
    theme: 'Abounding Hope',
    translation: 'World English Bible'
  },
  {
    reference: 'Matthew 11:28',
    text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.',
    theme: 'Peace & Rest',
    translation: 'World English Bible'
  },
  {
    reference: 'John 14:27',
    text: 'Peace I leave with you. My peace I give to you; not as the world gives, do I give to you. Don’t let your heart be troubled, neither let it be fearful.',
    theme: 'Peace & Comfort',
    translation: 'World English Bible'
  },
  {
    reference: 'Psalm 46:1',
    text: 'God is our refuge and strength, a very present help in trouble.',
    theme: 'Refuge & Strength',
    translation: 'World English Bible'
  },
  {
    reference: 'Zephaniah 3:17',
    text: 'Yahweh your God is among you, a mighty one who will save. He will rejoice over you with joy. He will calm you in his love.',
    theme: 'Unfailing Love & Hope',
    translation: 'World English Bible'
  }
]

const bibleVerseData = ref({
  reference: 'Jeremiah 29:11',
  text: 'For I know the thoughts that I think toward you, says Yahweh, thoughts of peace, and not of evil, to give you hope and a future.',
  theme: 'Hope & Future',
  translation: 'World English Bible'
})
const isLoadingVerse = ref(false)

const fetchBibleVerse = async () => {
  isLoadingVerse.value = true
  try {
    const pick = POPULAR_INSPIRING_VERSES[Math.floor(Math.random() * POPULAR_INSPIRING_VERSES.length)]
    const encoded = encodeURIComponent(pick.reference)
    const res = await fetch(`https://bible-api.com/${encoded}`, { signal: AbortSignal.timeout(4000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.text && data?.reference) {
        bibleVerseData.value = {
          reference: data.reference,
          text: data.text.trim().replace(/\s+/g, ' '),
          theme: pick.theme,
          translation: data.translation_name || 'World English Bible'
        }
        return
      }
    }
    // Fallback directly to curated uplifting text
    bibleVerseData.value = { ...pick }
  } catch (err) {
    const pick = POPULAR_INSPIRING_VERSES[Math.floor(Math.random() * POPULAR_INSPIRING_VERSES.length)]
    bibleVerseData.value = { ...pick }
  } finally {
    isLoadingVerse.value = false
  }
}

// 2. Saying / Quote of the Day
const quoteData = ref({
  quote: 'Quality is not an act, it is a habit.',
  author: 'Aristotle'
})
const isLoadingQuote = ref(false)

const fetchQuote = async () => {
  isLoadingQuote.value = true
  try {
    const res = await fetch('https://dummyjson.com/quotes/random', { signal: AbortSignal.timeout(4000) })
    if (res.ok) {
      const json = await res.json()
      if (json?.quote) {
        quoteData.value = {
          quote: json.quote,
          author: json.author || 'Anonymous'
        }
      }
    }
  } catch (err) {
    // fallback remains intact
  } finally {
    isLoadingQuote.value = false
  }
}

// 3. Today I Learned (TIL) & Daily Insight
const CURATED_TIL_INSIGHTS = [
  {
    fact: "Sea otters hold hands while sleeping so they don't drift away in ocean currents.",
    category: "Nature & Cooperation",
    source: "Marine Biology Archive"
  },
  {
    fact: "Honey never spoils. Archaeologists have excavated pots of honey in ancient Egyptian tombs that are over 3,000 years old and still completely edible.",
    category: "Science & Food Chemistry",
    source: "Smithsonian Institute"
  },
  {
    fact: "The Apollo 11 guidance computer operated on just 64 KB of memory at 0.043 MHz—far less processing power than a basic modern digital watch—yet safely guided humankind to the moon.",
    category: "Computing & Spaceflight",
    source: "NASA Historical Office"
  },
  {
    fact: "Fiber optic cables carry over 99% of all international digital communication data across hundreds of thousands of miles beneath the ocean floors at the speed of light.",
    category: "Telecommunications & Fiber",
    source: "Submarine Telecoms Forum"
  },
  {
    fact: "Trees in a forest communicate and share water and nutrients with struggling neighbors via an underground fungal network nicknamed the 'Wood Wide Web'.",
    category: "Ecology & Forestry",
    source: "Nature Science Journal"
  },
  {
    fact: "The first computer programmer in human history was Ada Lovelace in 1843, who developed the first machine algorithm for Charles Babbage's Analytical Engine.",
    category: "Computer History",
    source: "Computer History Museum"
  },
  {
    fact: "A single cumulus cloud can weigh over 1.1 million pounds (500,000 kg), floating effortlessly because the warm dry air underneath is even denser.",
    category: "Meteorology & Physics",
    source: "National Center for Atmospheric Research"
  },
  {
    fact: "The human brain generates approximately 20 watts of electrical power while awake—enough to power a low-wattage LED light bulb.",
    category: "Neuroscience",
    source: "Scientific American"
  },
  {
    fact: "When gazing at the Andromeda Galaxy with the naked eye, the starlight entering your retina began its journey across space 2.5 million years ago.",
    category: "Astronomy & Cosmology",
    source: "NASA Astrophysics"
  },
  {
    fact: "Bamboo is the fastest-growing woody plant on the planet, capable of growing up to 35 inches (91 centimeters) within a single 24-hour day.",
    category: "Botany & Nature",
    source: "Guinness World Records"
  },
  {
    fact: "The International Space Station orbits Earth at 17,500 mph (28,000 km/h), treating the crew to 16 breathtaking sunrises and sunsets every single day.",
    category: "Space Science",
    source: "European Space Agency"
  },
  {
    fact: "Humpback whale pods compose elaborate cultural songs with rhyming patterns that evolve each season and spread across entire ocean basins.",
    category: "Animal Culture & Sound",
    source: "Oceanographic Institute"
  },
  {
    fact: "Elephants are among the few species capable of recognizing their own reflections in mirrors, demonstrating high self-awareness, empathy, and lifelong family bonds.",
    category: "Animal Intelligence",
    source: "Wildlife Conservation Society"
  },
  {
    fact: "The speed of light in a vacuum is approximately 299,792 km per second—fast enough to circle the Earth's equator seven and a half times in a single second.",
    category: "Physics & Optics",
    source: "National Institute of Standards"
  },
  {
    fact: "The Voyager 1 spacecraft, launched in 1977, is currently over 15 billion miles away in interstellar space and still communicating science data back to Earth.",
    category: "Deep Space Engineering",
    source: "NASA Jet Propulsion Laboratory"
  },
  {
    fact: "Monarch butterflies navigate across 3,000 miles during annual migrations using a built-in magnetic compass and the position of the sun.",
    category: "Navigation & Biology",
    source: "National Geographic"
  },
  {
    fact: "The world's oldest known living tree is a Great Basin bristlecone pine named Methuselah in California, estimated to be over 4,850 years old.",
    category: "Nature & Longevity",
    source: "US Forest Service"
  },
  {
    fact: "The Northern and Southern Lights are created when solar wind particles collide with gases in Earth's atmosphere, releasing energy as glowing curtains of light.",
    category: "Atmospheric Science",
    source: "Geophysical Institute"
  }
]

const tilData = ref({
  fact: "Fiber optic cables carry over 99% of all international digital communication data across hundreds of thousands of miles beneath the ocean floors at the speed of light.",
  category: "Telecommunications & Fiber",
  source: "Submarine Telecoms Forum"
})
const isLoadingTil = ref(false)

const fetchTil = async () => {
  isLoadingTil.value = true
  try {
    // Pick from our curated inspiring insights to guarantee high-grade quality
    const pick = CURATED_TIL_INSIGHTS[Math.floor(Math.random() * CURATED_TIL_INSIGHTS.length)]
    tilData.value = { ...pick }
  } finally {
    isLoadingTil.value = false
  }
}

// 4. Curated Picture of the Day (Strictly Dogs, Cats & Landscapes/Scenery)
const CURATED_LANDSCAPES = [
  { id: '10', author: 'Paul Jarvis', title: 'Mountain Lake & Pine Forest' },
  { id: '11', author: 'Paul Jarvis', title: 'Deep Wilderness & River Path' },
  { id: '15', author: 'Paul Jarvis', title: 'Misty Woodland Waterfall' },
  { id: '28', author: 'Jerry Adney', title: 'Mountain Valley & Foggy Horizon' },
  { id: '29', author: 'Gofore', title: 'High Alpine Mountain Ridge' },
  { id: '49', author: 'Margaret Barley', title: 'Rugged Ocean Coastline' },
  { id: '54', author: 'Nicholas Swanson', title: 'Dramatic Snowcapped Peaks' },
  { id: '65', author: 'Alexander Shustov', title: 'Sunlit Forest Canopy' },
  { id: '70', author: 'Dorothe Wouters', title: 'Tranquil Lake Reflection' },
  { id: '110', author: 'Kenneth Thewissen', title: 'Evergreen Alpine Wilderness' },
  { id: '116', author: 'Anton Zelenov', title: 'Rolling Meadow Hills' },
  { id: '124', author: 'Anton Zelenov', title: 'Misty Alpine Valley' },
  { id: '142', author: 'Vadim Sherbakov', title: 'Open Coastal Ocean Horizon' },
  { id: '147', author: 'Krzysztof Hanusz', title: 'Sunset Over Mountain Range' },
  { id: '162', author: 'Dmitry Ratushny', title: 'Autumn Forest Trail' },
  { id: '184', author: 'Tim Van Damme', title: 'Desert Sandstone Canyon' },
  { id: '214', author: 'Kelly Sikkema', title: 'Golden Sunrise Over Foothills' },
  { id: '235', author: 'Paul Jarvis', title: 'Lush Pine Forest Panorama' },
  { id: '263', author: 'Vadim Sherbakov', title: 'Ocean Waves & Sea Cliffs' },
  { id: '274', author: 'Wojtek Witkowski', title: 'Mirror Lake & Alpine Basin' },
  { id: '318', author: 'Lukas Budimaier', title: 'High Summit Above Clouds' },
  { id: '325', author: 'Vadim Sherbakov', title: 'Turquoise Shoreline & Coastal Sands' },
  { id: '342', author: 'Vadim Sherbakov', title: 'Winding River & Mountain Bluff' },
  { id: '413', author: 'Lukas Budimaier', title: 'Pristine Snow Peak Summit' }
]

const imageCategory = ref('all') // 'all' | 'landscapes' | 'dogs' | 'cats'

const pictureCategoryTitle = computed(() => {
  if (imageCategory.value === 'dogs') return 'Dog of the Day'
  if (imageCategory.value === 'cats') return 'Cat of the Day'
  if (imageCategory.value === 'landscapes') return 'Scenery & Landscapes of the Day'
  return 'Picture of the Day (Dogs, Cats & Scenery)'
})

const pictureCategoryIcon = computed(() => {
  if (imageCategory.value === 'dogs') return 'pi-heart'
  if (imageCategory.value === 'cats') return 'pi-sparkles'
  if (imageCategory.value === 'landscapes') return 'pi-compass'
  return 'pi-image'
})

const setImageCategory = (catKey) => {
  if (['all', 'landscapes', 'dogs', 'cats'].includes(catKey)) {
    imageCategory.value = catKey
    try {
      localStorage.setItem('sf_landing_image_category', catKey)
    } catch (e) {}
    fetchPicture()
  }
}

const pictureData = ref({
  id: '10',
  author: 'Paul Jarvis • Mountain Lake & Pine Forest',
  url: 'https://picsum.photos/id/10/1000/600',
  pageUrl: 'https://unsplash.com',
  sourceLabel: 'Lorem Picsum / Unsplash • Scenery',
  badgeLabel: '🏔️ Scenic Landscape'
})
const isLoadingPicture = ref(false)

const formatDogBreed = (url) => {
  try {
    const match = url.match(/breeds\/([^/]+)/)
    if (match && match[1]) {
      const parts = match[1].split('-').reverse()
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    }
  } catch (e) {}
  return 'Canine Companion'
}

const fetchPicture = async () => {
  isLoadingPicture.value = true
  try {
    // Resolve target category
    let target = imageCategory.value
    if (target === 'all') {
      const pool = ['landscapes', 'dogs', 'cats']
      target = pool[Math.floor(Math.random() * pool.length)]
    }

    if (target === 'dogs') {
      const res = await fetch('https://dog.ceo/api/breeds/image/random', { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const json = await res.json()
        if (json?.status === 'success' && json?.message) {
          const breed = formatDogBreed(json.message)
          pictureData.value = {
            id: 'dog-' + Date.now(),
            author: `${breed} • Dog.ceo`,
            url: json.message,
            pageUrl: json.message,
            sourceLabel: 'Dog.ceo Free Dog API • Open Source',
            badgeLabel: '🐶 Dog Photography'
          }
          return
        }
      }
    } else if (target === 'cats') {
      const res = await fetch('https://api.thecatapi.com/v1/images/search?mime_types=jpg,png', { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const list = await res.json()
        if (Array.isArray(list) && list.length > 0 && list[0]?.url) {
          const cat = list[0]
          pictureData.value = {
            id: cat.id || 'cat-' + Date.now(),
            author: 'Curated Feline • TheCatAPI',
            url: cat.url,
            pageUrl: cat.url,
            sourceLabel: 'TheCatAPI.com • Free Feline API',
            badgeLabel: '🐱 Cat Photography'
          }
          return
        }
      }
    }

    // Default / Landscapes: strictly pick from CURATED_LANDSCAPES
    const pick = CURATED_LANDSCAPES[Math.floor(Math.random() * CURATED_LANDSCAPES.length)]
    pictureData.value = {
      id: pick.id,
      author: `${pick.author} • ${pick.title}`,
      url: `https://picsum.photos/id/${pick.id}/1000/600`,
      pageUrl: `https://unsplash.com/photos/${pick.id}`,
      sourceLabel: 'Lorem Picsum / Unsplash • Scenery',
      badgeLabel: '🏔️ Scenic Landscape'
    }
  } catch (err) {
    // Guaranteed scenic fallback on error
    const pick = CURATED_LANDSCAPES[Math.floor(Math.random() * CURATED_LANDSCAPES.length)]
    pictureData.value = {
      id: pick.id,
      author: `${pick.author} • ${pick.title}`,
      url: `https://picsum.photos/id/${pick.id}/1000/600`,
      pageUrl: 'https://unsplash.com',
      sourceLabel: 'Curated Offline Archive',
      badgeLabel: '🏔️ Scenic Landscape'
    }
  } finally {
    isLoadingPicture.value = false
  }
}

// 5. Today in History (Wikipedia On-This-Day)
const historyData = ref({
  year: '1969',
  text: 'ARPANET, the predecessor to the modern Internet, successfully sends its first node-to-node message across network routers.'
})
const isLoadingHistory = ref(false)

const fetchTodayInHistory = async () => {
  isLoadingHistory.value = true
  try {
    const now = new Date()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${mm}/${dd}`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const json = await res.json()
      if (json?.selected && json.selected.length > 0) {
        const pick = json.selected[Math.floor(Math.random() * json.selected.length)]
        historyData.value = {
          year: pick.year ? String(pick.year) : 'Milestone',
          text: pick.text
        }
      }
    }
  } catch (err) {
    // fallback remains intact
  } finally {
    isLoadingHistory.value = false
  }
}

// Hub Refresh Action
const refreshHub = () => {
  fetchWeather()
  measureApiPing()
  fetchBibleVerse()
  fetchQuote()
  fetchTil()
  fetchPicture()
  fetchTodayInHistory()
}

// Lifecycle Hooks
onMounted(() => {
  clockInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  // Network event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { isOnline.value = true })
    window.addEventListener('offline', () => { isOnline.value = false })
  }

  // Load custom widget preferences
  loadWidgetPreferences()

  // Fetch initial real-world data
  fetchWeather()
  fetchHolidays()
  measureApiPing()
  fetchBibleVerse()
  fetchQuote()
  fetchTil()
  fetchPicture()
  fetchTodayInHistory()
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

.text-xxs {
  font-size: 0.65rem;
  letter-spacing: 0.02em;
}
</style>
