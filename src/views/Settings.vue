<template>
  <div class="d-flex flex-column gap-4">
    <!-- Access Restricted State when Settings (id: 20) is disabled -->
    <div v-if="!canAccessSettings" class="card shadow-sm border-0 rounded-4 p-5 text-center bg-body">
      <div class="p-4 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex mx-auto mb-3">
        <i class="pi pi-lock fs-1"></i>
      </div>
      <h3 class="fw-bold text-body">Access Restricted</h3>
      <p class="text-secondary max-w-md mx-auto mb-0">You do not have permission to access System & Account Settings. Please contact your system administrator.</p>
    </div>

    <!-- Main Settings Container -->
    <template v-else>
      <!-- Header -->
      <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h1 class="fs-3 fw-bold text-body mb-0">System & Account Settings</h1>
          <p class="small text-secondary mt-1 mb-0">Customize application theme colors, manage user profile, security, and system preferences.</p>
        </div>
      </div>

      <!-- Main Content Container -->
      <div class="row g-4">
        <!-- Left Column: Navigation Tabs & Profile Overview Card -->
        <div class="col-12 col-lg-4">
          <!-- Profile Card -->
          <div class="card shadow-sm border-0 rounded-4 p-4 text-center mb-4 bg-body">
            <div class="position-relative d-inline-block mx-auto mb-3">
              <div 
                class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm mx-auto border border-3 border-white" 
                style="width: 88px; height: 88px; font-size: 2.25rem;"
              >
                {{ userInitial }}
              </div>
              <span class="position-absolute bottom-0 end-0 p-2 bg-success border border-light rounded-circle" title="Online"></span>
            </div>
            <h5 class="fw-bold text-body mb-1">{{ userDisplayName }}</h5>
            <p class="small text-secondary mb-3">{{ user?.email || 'admin@switchfiber.com' }}</p>
            <div class="d-inline-flex align-items-center px-3 py-1.5 bg-primary bg-opacity-10 text-primary rounded-pill small fw-semibold mx-auto">
              <i class="pi pi-shield me-2"></i>
              <span>{{ userRole }}</span>
            </div>
          </div>

          <!-- Quick Navigation -->
          <div class="list-group shadow-sm border-0 rounded-4 overflow-hidden">
            <button 
              v-if="canAccessTheme"
              @click="activeSection = 'theme'" 
              class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0"
              :class="{ 'bg-primary text-white fw-bold': activeSection === 'theme' }"
            >
              <div class="d-flex align-items-center gap-3">
                <i class="pi pi-palette fs-5"></i>
                <span>Theme & Appearance</span>
              </div>
              <i class="pi pi-chevron-right small"></i>
            </button>
          
          <button 
            @click="activeSection = 'profile'" 
            class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0"
            :class="{ 'bg-primary text-white fw-bold': activeSection === 'profile' }"
          >
            <div class="d-flex align-items-center gap-3">
              <i class="pi pi-user fs-5"></i>
              <span>Profile Information</span>
            </div>
            <i class="pi pi-chevron-right small"></i>
          </button>

          <button 
            @click="activeSection = 'security'" 
            class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0"
            :class="{ 'bg-primary text-white fw-bold': activeSection === 'security' }"
          >
            <div class="d-flex align-items-center gap-3">
              <i class="pi pi-lock fs-5"></i>
              <span>Security & Password</span>
            </div>
            <i class="pi pi-chevron-right small"></i>
          </button>

          <button 
            @click="activeSection = 'system'" 
            class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0"
            :class="{ 'bg-primary text-white fw-bold': activeSection === 'system' }"
          >
            <div class="d-flex align-items-center gap-3">
              <i class="pi pi-server fs-5"></i>
              <span>API & System Info</span>
            </div>
            <i class="pi pi-chevron-right small"></i>
          </button>
        </div>
      </div>

      <!-- Right Column: Settings Content Panes -->
      <div class="col-12 col-lg-8">

        <!-- 1. Theme & Appearance Section -->
        <div v-if="activeSection === 'theme'" class="card shadow-sm border-0 rounded-4 p-4 bg-body">
          <!-- Section Header -->
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
              <i class="pi pi-palette fs-4"></i>
            </div>
            <div>
              <h5 class="fw-bold text-body mb-1">Theme, Palette & Typography Design System</h5>
              <p class="small text-secondary mb-0">Explore the SwitchFiber brand color codes, interaction highlight states, and typography specifications.</p>
            </div>
          </div>

          <!-- Active Theme & Mode Toggle Banner -->
          <div class="p-3 rounded-4 border bg-body-tertiary mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
              <span 
                class="rounded-circle d-inline-block border border-2 border-white shadow-sm flex-shrink-0" 
                style="width: 36px; height: 36px; background-color: #e74c5a;"
              ></span>
              <div>
                <div class="fw-bold small text-body d-flex align-items-center gap-2">
                  <span>SwitchFiber Warm Rose Theme</span>
                  <span class="badge bg-primary rounded-pill px-2.5 py-0.5" style="font-size: 0.7rem;">Active</span>
                </div>
                <div class="text-secondary small mt-0.5" style="font-size: 0.75rem;">
                  Mode: <strong class="text-body">{{ isDark ? 'Dark Theme' : 'Light Theme' }}</strong> · Eye-Friendly 8-hour ergonomics palette
                </div>
              </div>
            </div>
            <button 
              @click="toggleTheme" 
              class="btn btn-primary btn-sm px-3.5 py-2 fw-semibold rounded-pill shadow-xs d-inline-flex align-items-center gap-2"
            >
              <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'"></i>
              <span>Switch to {{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
            </button>
          </div>

          <!-- 1. Primary & Brand Color Palette -->
          <div class="mb-4">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-body mb-0 d-flex align-items-center">
                <i class="pi pi-bookmark text-primary me-2 fs-6"></i>
                <span>Primary & Brand Colors</span>
              </h6>
              <span class="small text-secondary" style="font-size: 0.75rem;">Click any card to copy HEX</span>
            </div>
            <p class="small text-secondary mb-3">Core brand identity and primary interaction colors across buttons, navigation links, and active indicators.</p>

            <div class="row g-3 px-1 px-md-2">
              <div v-for="c in primaryColors" :key="c.hex" class="col-12 col-sm-6 col-xl-4">
                <div 
                  class="p-4 rounded-3 border bg-body-tertiary h-100 cursor-pointer color-swatch-card transition-all"
                  @click="copyHex(c.hex)"
                  v-tooltip.top="`Click to copy ${c.hex}`"
                >
                  <div class="d-flex align-items-center gap-3 mb-2.5">
                    <div 
                      class="rounded-3 shadow-xs border flex-shrink-0" 
                      :style="{ width: '42px', height: '42px', backgroundColor: c.hex }"
                    ></div>
                    <div class="overflow-hidden">
                      <div class="fw-bold small text-body text-truncate">{{ c.name }}</div>
                      <code class="small text-primary fw-bold">{{ c.hex }}</code>
                    </div>
                  </div>
                  <div class="small text-secondary text-truncate" style="font-size: 0.75rem;">{{ c.usage }}</div>
                  <div class="mt-2.5 pt-2 border-top d-flex align-items-center justify-content-between text-secondary" style="font-size: 0.7rem;">
                    <span class="font-monospace text-truncate">{{ c.token }}</span>
                    <i :class="copiedHex === c.hex ? 'pi pi-check text-success' : 'pi pi-copy'" class="ms-2" style="font-size: 0.75rem;"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Table & Interaction Highlights Palette -->
          <div class="mb-5 pt-4 border-top">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-body mb-0 d-flex align-items-center">
                <i class="pi pi-table text-primary me-2 fs-6"></i>
                <span>Table & Paginator Highlights</span>
              </h6>
              <span class="small text-secondary" style="font-size: 0.75rem;">Active selection & hover tokens</span>
            </div>
            <p class="small text-secondary mb-3">Highlight rules applied to data table row selections, row hover feedback, and pagination buttons.</p>

            <div class="row g-3 px-1 px-md-2">
              <div v-for="c in tableHighlightColors" :key="c.name" class="col-12 col-sm-6 col-xl-4">
                <div 
                  class="p-4 rounded-3 border bg-body-tertiary h-100 cursor-pointer color-swatch-card transition-all"
                  @click="copyHex(c.hex)"
                  v-tooltip.top="`Click to copy ${c.hex}`"
                >
                  <div class="d-flex align-items-center gap-3 mb-2.5">
                    <div 
                      class="rounded-3 shadow-xs border flex-shrink-0" 
                      :style="{ width: '42px', height: '42px', backgroundColor: c.previewColor || c.hex }"
                    ></div>
                    <div class="overflow-hidden">
                      <div class="fw-bold small text-body text-truncate">{{ c.name }}</div>
                      <code class="small text-primary fw-bold">{{ c.hex }}</code>
                    </div>
                  </div>
                  <div class="small text-secondary text-truncate" style="font-size: 0.75rem;">{{ c.usage }}</div>
                  <div class="mt-2.5 pt-2 border-top d-flex align-items-center justify-content-between text-secondary" style="font-size: 0.7rem;">
                    <span class="font-monospace text-truncate">{{ c.token }}</span>
                    <i :class="copiedHex === c.hex ? 'pi pi-check text-success' : 'pi pi-copy'" class="ms-2" style="font-size: 0.75rem;"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Live Component Visual Preview -->
          <div class="mb-5 pt-4 border-top">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <h6 class="fw-bold text-body mb-0 d-flex align-items-center">
                <i class="pi pi-eye text-primary me-2 fs-6"></i>
                <span>Live Component Visual Preview</span>
              </h6>
              <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2.5 py-1 small fw-semibold">Interactive Token Preview</span>
            </div>
            <p class="small text-secondary mb-4">Real-time simulation of table interaction states, pagination controls, and interface elements using the current theme token palette.</p>
            
            <!-- Table Row Interaction States -->
            <div class="mb-4 px-1 px-md-2">
              <div class="small fw-semibold text-secondary text-uppercase tracking-wider mb-3" style="font-size: 0.72rem; letter-spacing: 0.5px;">
                Table Row State Progression
              </div>
              
              <div class="d-flex flex-column gap-3">
                <!-- Normal Row -->
                <div class="d-flex align-items-center justify-content-between px-4 py-3.5 rounded-3 bg-body border shadow-xs flex-wrap gap-3">
                  <div class="d-flex align-items-center gap-3">
                    <span class="badge bg-secondary bg-opacity-10 text-secondary border px-2.5 py-1">#101</span>
                    <div>
                      <div class="text-body fw-semibold small">Normal Table Row</div>
                      <div class="text-secondary small" style="font-size: 0.75rem;">Default table surface layer</div>
                    </div>
                  </div>
                  <span class="badge bg-secondary bg-opacity-10 text-secondary border px-2.5 py-1 small">Default State</span>
                </div>

                <!-- Hovered Row (Soft Warm Tint) -->
                <div class="d-flex align-items-center justify-content-between px-4 py-3.5 rounded-3 border flex-wrap gap-3" style="background-color: var(--theme-row-hover-solid, #fdf2f4); border-color: #fdcfd3 !important;">
                  <div class="d-flex align-items-center gap-3">
                    <span class="badge bg-primary bg-opacity-15 text-primary border border-danger-subtle px-2.5 py-1">#102</span>
                    <div>
                      <div class="text-body fw-bold small">Hovered Table Row</div>
                      <div class="text-secondary small" style="font-size: 0.75rem;">Interactive hover feedback (Light Rose Tint: #FDF2F4)</div>
                    </div>
                  </div>
                  <span class="badge bg-primary bg-opacity-15 text-primary border border-danger-subtle px-2.5 py-1 small fw-semibold">Hover Active</span>
                </div>

                <!-- Selected Row (Theme Rose Highlight) -->
                <div class="d-flex align-items-center justify-content-between px-4 py-3.5 rounded-3 text-white shadow-xs flex-wrap gap-3" style="background-color: #e74c5a;">
                  <div class="d-flex align-items-center gap-3">
                    <span class="badge bg-white text-danger fw-bold px-2.5 py-1">#103</span>
                    <div>
                      <div class="fw-bold small text-white">Active Selected Row</div>
                      <div class="text-white text-opacity-85 small" style="font-size: 0.75rem;">Selected row highlight (Primary Highlight: #E74C5A)</div>
                    </div>
                  </div>
                  <span class="badge bg-white bg-opacity-25 text-white border border-white border-opacity-50 px-2.5 py-1 small fw-semibold">Selected State</span>
                </div>
              </div>
            </div>

            <!-- Visual Spacing Break -->
            <div class="my-4 pt-1"></div>

            <!-- Paginator Component Preview -->
            <div class="px-1 px-md-2 mb-2">
              <div class="p-4 rounded-3 bg-body border shadow-xs">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <div class="small fw-semibold text-body">Paginator Button States</div>
                    <div class="text-secondary small" style="font-size: 0.75rem;">Soft light theme highlight with subtle border</div>
                  </div>
                  
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="px-3 py-1.5 rounded-2 small fw-medium border text-secondary bg-body shadow-2xs">‹ Prev</span>
                    <span class="px-3 py-1.5 rounded-2 small fw-medium border text-secondary bg-body shadow-2xs">1</span>
                    <span class="px-3 py-1.5 rounded-2 small fw-bold text-danger border shadow-xs" style="background-color: #fef2f3; border-color: #e74c5a;">2 (Active)</span>
                    <span class="px-3 py-1.5 rounded-2 small fw-semibold text-danger border shadow-2xs" style="background-color: #fff5f6; border-color: #fdcfd3;">3 (Hover)</span>
                    <span class="px-3 py-1.5 rounded-2 small fw-medium border text-secondary bg-body shadow-2xs">Next ›</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Status & Functional Colors -->
          <div class="mb-5 pt-4 border-top">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-body mb-0 d-flex align-items-center">
                <i class="pi pi-check-circle text-success me-2 fs-6"></i>
                <span>Status & Functional Colors</span>
              </h6>
              <span class="small text-secondary" style="font-size: 0.75rem;">Semantic feedback states</span>
            </div>
            <p class="small text-secondary mb-3">System status badges, alerts, toast notifications, and operation indicators.</p>

            <div class="row g-3 px-1 px-md-2">
              <div v-for="c in statusColors" :key="c.hex" class="col-12 col-sm-6 col-xl-3">
                <div 
                  class="p-4 rounded-3 border bg-body-tertiary h-100 cursor-pointer color-swatch-card transition-all"
                  @click="copyHex(c.hex)"
                  v-tooltip.top="`Click to copy ${c.hex}`"
                >
                  <div class="d-flex align-items-center gap-3 mb-2.5">
                    <div 
                      class="rounded-3 shadow-xs border flex-shrink-0" 
                      :style="{ width: '38px', height: '38px', backgroundColor: c.hex }"
                    ></div>
                    <div class="overflow-hidden">
                      <div class="fw-bold small text-body text-truncate">{{ c.name }}</div>
                      <code class="small fw-bold" :style="{ color: c.hex }">{{ c.hex }}</code>
                    </div>
                  </div>
                  <div class="small text-secondary text-truncate" style="font-size: 0.75rem;">{{ c.usage }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Surface, Neutral & Canvas Palette -->
          <div class="mb-5 pt-4 border-top">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-body mb-0 d-flex align-items-center">
                <i class="pi pi-box text-secondary me-2 fs-6"></i>
                <span>Surface & Background Canvas</span>
              </h6>
              <span class="small text-secondary" style="font-size: 0.75rem;">Layout backgrounds & elevations</span>
            </div>
            <p class="small text-secondary mb-3">Theme background surfaces, elevated modal layers, and tooltip containers.</p>

            <div class="row g-3 px-1 px-md-2">
              <div v-for="c in surfaceColors" :key="c.name" class="col-12 col-sm-6 col-xl-4">
                <div 
                  class="p-4 rounded-3 border bg-body-tertiary h-100 cursor-pointer color-swatch-card transition-all"
                  @click="copyHex(c.hex)"
                  v-tooltip.top="`Click to copy ${c.hex}`"
                >
                  <div class="d-flex align-items-center gap-3 mb-2.5">
                    <div 
                      class="rounded-3 shadow-xs border flex-shrink-0" 
                      :style="{ width: '38px', height: '38px', backgroundColor: c.hex }"
                    ></div>
                    <div class="overflow-hidden">
                      <div class="fw-bold small text-body text-truncate">{{ c.name }}</div>
                      <code class="small text-body fw-bold">{{ c.hex }}</code>
                    </div>
                  </div>
                  <div class="small text-secondary text-truncate" style="font-size: 0.75rem;">{{ c.usage }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 6. Typography System & Font Stack -->
          <div class="pt-4 border-top">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-body mb-0 d-flex align-items-center">
                <i class="pi pi-align-left text-primary me-2 fs-6"></i>
                <span>Typography & Font Families</span>
              </h6>
              <span class="small text-secondary" style="font-size: 0.75rem;">Typeface hierarchy & font stacks</span>
            </div>
            <p class="small text-secondary mb-4">Standard font families and weight distributions configured across SwitchFiber with balanced spacing and optimal legibility.</p>

            <div class="d-flex flex-column gap-4 px-1 px-md-2">
              <!-- Body Font: Inter -->
              <div class="p-4 p-md-5 rounded-4 border bg-body-tertiary shadow-xs">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3.5 pb-2.5 border-bottom px-1 px-md-2">
                  <div class="fw-bold text-body d-flex align-items-center gap-2.5">
                    <span class="badge bg-primary text-white px-3 py-1.5 rounded-2">Body Font</span>
                    <span class="fs-6 fw-bold">Inter</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <span class="small text-secondary font-monospace px-3 py-1.5 bg-body rounded-2 border shadow-2xs" style="font-size: 0.75rem;">
                      var(--font-family-base)
                    </span>
                  </div>
                </div>
                
                <div class="small text-secondary mb-3.5 px-1 px-md-2" style="font-size: 0.8125rem;">
                  <strong>Font Stack:</strong> <code>"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif</code>
                </div>

                <!-- Spacious Sample Canvas with Generous Inset Padding -->
                <div class="mx-1 mx-md-2 p-4 p-md-4.5 rounded-3 bg-body border shadow-xs text-body">
                  <div class="text-secondary font-monospace small mb-3 pb-2 border-bottom" style="font-size: 0.85rem; letter-spacing: 2px;">
                    Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789
                  </div>
                  
                  <div class="d-flex flex-column gap-2.5" style="line-height: 1.7;">
                    <div class="small">
                      <span class="badge bg-secondary-subtle text-secondary border me-2.5 px-2 py-1">400 Regular</span>
                      The quick brown fox jumps over the lazy dog. Standard interface typography for body text and descriptions.
                    </div>
                    <div class="small fw-medium">
                      <span class="badge bg-secondary-subtle text-secondary border me-2.5 px-2 py-1">500 Medium</span>
                      The quick brown fox jumps over the lazy dog. Used for table cells, active form inputs, and interactive labels.
                    </div>
                    <div class="small fw-semibold">
                      <span class="badge bg-secondary-subtle text-secondary border me-2.5 px-2 py-1">600 SemiBold</span>
                      The quick brown fox jumps over the lazy dog. Applied to table headers, modal action buttons, and active tabs.
                    </div>
                    <div class="small fw-bold">
                      <span class="badge bg-secondary-subtle text-secondary border me-2.5 px-2 py-1">700 Bold</span>
                      The quick brown fox jumps over the lazy dog. Emphasized KPI statistics, card subtitles, and alert callouts.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Headings Font: Plus Jakarta Sans -->
              <div class="p-4 p-md-5 rounded-4 border bg-body-tertiary shadow-xs">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3.5 pb-2.5 border-bottom px-1 px-md-2">
                  <div class="fw-bold text-body d-flex align-items-center gap-2.5">
                    <span class="badge bg-primary text-white px-3 py-1.5 rounded-2">Heading Font</span>
                    <span class="fs-6 fw-bold">Plus Jakarta Sans</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <span class="small text-secondary font-monospace px-3 py-1.5 bg-body rounded-2 border shadow-2xs" style="font-size: 0.75rem;">
                      var(--font-family-heading)
                    </span>
                  </div>
                </div>
                
                <div class="small text-secondary mb-3.5 px-1 px-md-2" style="font-size: 0.8125rem;">
                  <strong>Font Stack:</strong> <code>"Plus Jakarta Sans", "Inter", sans-serif</code>
                </div>

                <!-- Spacious Sample Canvas with Generous Inset Padding -->
                <div class="mx-1 mx-md-2 p-4 p-md-4.5 rounded-3 bg-body border shadow-xs text-body" style="font-family: 'Plus Jakarta Sans', sans-serif;">
                  <div class="text-secondary font-monospace small mb-3 pb-2 border-bottom" style="font-size: 0.85rem; letter-spacing: 2px;">
                    Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789
                  </div>
                  
                  <div class="d-flex flex-column gap-2.5">
                    <h4 class="fw-bold text-body mb-1" style="font-family: 'Plus Jakarta Sans', sans-serif;">
                      SwitchFiber Enterprise Fiber Network Management
                    </h4>
                    <p class="text-secondary small mb-0" style="line-height: 1.7;">
                      Applied to page titles (H1–H6), dashboard summary figures, brand navigation titles, and elevated section headings.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Monospace Font: SFMono / Menlo / Consolas -->
              <div class="p-4 p-md-5 rounded-4 border bg-body-tertiary shadow-xs">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3.5 pb-2.5 border-bottom px-1 px-md-2">
                  <div class="fw-bold text-body d-flex align-items-center gap-2.5">
                    <span class="badge bg-secondary text-white px-3 py-1.5 rounded-2">Monospace Font</span>
                    <span class="fs-6 fw-bold">SFMono / Menlo / Consolas</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <span class="small text-secondary font-monospace px-3 py-1.5 bg-body rounded-2 border shadow-2xs" style="font-size: 0.75rem;">
                      font-monospace
                    </span>
                  </div>
                </div>
                
                <div class="small text-secondary mb-3.5 px-1 px-md-2" style="font-size: 0.8125rem;">
                  <strong>Font Stack:</strong> <code>"SFMono-Regular", Menlo, Monaco, Consolas, "Courier New", monospace</code>
                </div>

                <!-- Spacious Sample Canvas with Generous Inset Padding -->
                <div class="mx-1 mx-md-2 p-4 p-md-4.5 rounded-3 bg-body border shadow-xs font-monospace small text-body">
                  <div class="text-secondary small mb-3 pb-2 border-bottom" style="font-size: 0.85rem; letter-spacing: 1.5px;">
                    0123456789 :.-_/#?&=!$^*+@
                  </div>
                  <div class="d-flex flex-column gap-2.5" style="line-height: 1.75;">
                    <div><span class="badge bg-secondary-subtle text-secondary me-2.5 px-2 py-1">IP Address</span> 192.168.100.1 &bull; 10.200.4.254/24</div>
                    <div><span class="badge bg-secondary-subtle text-secondary me-2.5 px-2 py-1">Hardware MAC</span> 00:1A:2B:3C:4D:5E</div>
                    <div><span class="badge bg-secondary-subtle text-secondary me-2.5 px-2 py-1">Device Serial</span> SF-89210-LCP-PORT-04</div>
                    <div><span class="badge bg-secondary-subtle text-secondary me-2.5 px-2 py-1">VLAN Tag</span> VLAN-1042 [Primary Uplink]</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Profile Information Section -->
        <div v-if="activeSection === 'profile'" class="card shadow-sm border-0 rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
              <i class="pi pi-user fs-4"></i>
            </div>
            <div>
              <h5 class="fw-bold text-body mb-1">Profile Information</h5>
              <p class="small text-secondary mb-0">Update your account personal information and contact details.</p>
            </div>
          </div>

          <!-- Alert Notification Banner -->
          <div v-if="profileMsg.text" :class="['alert d-flex align-items-center rounded-3 p-3 mb-3 small', profileMsg.isError ? 'alert-danger' : 'alert-success']" role="alert">
            <i :class="['pi me-2 fs-5 flex-shrink-0', profileMsg.isError ? 'pi-exclamation-triangle' : 'pi-check-circle']"></i>
            <div>{{ profileMsg.text }}</div>
          </div>

          <form @submit.prevent="saveProfile">
            <div class="row g-3 mb-3">
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Username</label>
                <InputText v-model="profileForm.username" class="w-100 p-inputtext-sm" required />
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Email Address</label>
                <InputText v-model="profileForm.email" type="email" class="w-100 p-inputtext-sm" required />
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">First Name</label>
                <InputText v-model="profileForm.fname" class="w-100 p-inputtext-sm" />
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Last Name</label>
                <InputText v-model="profileForm.lname" class="w-100 p-inputtext-sm" />
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label small fw-semibold text-secondary">Contact Number</label>
              <InputText v-model="profileForm.contactnumber" class="w-100 p-inputtext-sm" />
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm d-flex align-items-center gap-2" :disabled="isSavingProfile">
                <span v-if="isSavingProfile" class="spinner-border spinner-border-sm" role="status"></span>
                <i v-else class="pi pi-check"></i>
                <span>{{ isSavingProfile ? 'Saving...' : 'Save Profile Changes' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 3. Security Section -->
        <div v-else-if="activeSection === 'security'" class="card shadow-sm border-0 rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
              <i class="pi pi-lock fs-4"></i>
            </div>
            <div>
              <h5 class="fw-bold text-body mb-1">Security & Password</h5>
              <p class="small text-secondary mb-0">Ensure your account security by updating your account password.</p>
            </div>
          </div>

          <!-- Alert Notification Banner -->
          <div v-if="securityMsg.text" :class="['alert d-flex align-items-center rounded-3 p-3 mb-3 small', securityMsg.isError ? 'alert-danger' : 'alert-success']" role="alert">
            <i :class="['pi me-2 fs-5 flex-shrink-0', securityMsg.isError ? 'pi-exclamation-triangle' : 'pi-check-circle']"></i>
            <div>{{ securityMsg.text }}</div>
          </div>

          <form @submit.prevent="updatePassword">
            <div class="mb-3">
              <label class="form-label small fw-semibold text-secondary">Current Password</label>
              <Password v-model="securityForm.currentPassword" :toggleMask="true" :feedback="false" class="w-100 d-flex" inputClass="w-100 p-inputtext-sm" required />
            </div>

            <div class="row g-3 mb-4">
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">New Password</label>
                <Password v-model="securityForm.newPassword" :toggleMask="true" :feedback="false" class="w-100 d-flex" inputClass="w-100 p-inputtext-sm" required />
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Confirm New Password</label>
                <Password v-model="securityForm.confirmPassword" :toggleMask="true" :feedback="false" class="w-100 d-flex" inputClass="w-100 p-inputtext-sm" required />
              </div>
            </div>

            <div class="d-flex justify-content-end">
              <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm d-flex align-items-center gap-2" :disabled="isUpdatingPassword">
                <span v-if="isUpdatingPassword" class="spinner-border spinner-border-sm" role="status"></span>
                <i v-else class="pi pi-lock-open"></i>
                <span>{{ isUpdatingPassword ? 'Updating...' : 'Update Password' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 4. System & API Info -->
        <div v-else-if="activeSection === 'system'" class="card shadow-sm border-0 rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
              <i class="pi pi-server fs-4"></i>
            </div>
            <div>
              <h5 class="fw-bold text-body mb-1">API & System Configuration</h5>
              <p class="small text-secondary mb-0">Backend environment parameters and system build information.</p>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Target API Endpoint Host</label>
            <InputText :modelValue="apiUrl" readonly class="w-100 p-inputtext-sm bg-body-tertiary" />
          </div>

          <div class="p-3 rounded-3 bg-body-tertiary border text-secondary small">
            <div class="row g-2">
              <div class="col-6"><strong>Application:</strong> Switch Fiber Management Platform</div>
              <div class="col-6"><strong>Version:</strong> v1.2.0-production</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </template>
</div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import { usePermissions } from '../composables/usePermissions'
import apiClient from '../services/api'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const { canAccessTheme, canAccessSettings } = usePermissions()
const toast = useToast()

const activeSection = ref(canAccessTheme.value ? 'theme' : 'profile')

watch(canAccessTheme, (allowed) => {
  if (!allowed && activeSection.value === 'theme') {
    activeSection.value = 'profile'
  }
})
const user = computed(() => authStore.user)

const apiUrl = ref(import.meta.env.VITE_API_URL || 'https://103.249.198.43:8090')

const isSavingProfile = ref(false)
const isUpdatingPassword = ref(false)
const profileMsg = ref({ text: '', isError: false })
const securityMsg = ref({ text: '', isError: false })

const copiedHex = ref('')
const copyHex = (hex) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(hex)
    copiedHex.value = hex
    toast.add({ severity: 'info', summary: 'Copied to Clipboard', detail: `${hex} copied!`, life: 2500 })
    setTimeout(() => {
      if (copiedHex.value === hex) copiedHex.value = ''
    }, 2000)
  }
}

// 1. Primary & Brand Colors
const primaryColors = ref([
  { name: 'Primary Rose Red', hex: '#E74C5A', token: '--bs-primary', usage: 'Primary buttons, active tabs, brand icons' },
  { name: 'Primary Dark (Hover)', hex: '#D63A48', token: '--bs-primary-hover', usage: 'Button hover and focused interactive states' },
  { name: 'Primary Active (Deep)', hex: '#C02E3C', token: '--bs-primary-active', usage: 'Button pressed states & deep highlights' },
  { name: 'Primary Subtle Tint', hex: '#FEF2F3', token: '--bs-primary-bg-subtle', usage: 'Subtle badge bg, paginator hover, soft pills' },
  { name: 'Primary Border Subtle', hex: '#FDCFD3', token: '--bs-primary-border-subtle', usage: 'Active tab borders & delicate card outlines' },
  { name: 'Primary White Contrast', hex: '#FFFFFF', token: '--p-primary-contrast-color', usage: 'Text on primary buttons & highlighted rows' }
])

// 2. Table & Interaction Highlights
const tableHighlightColors = ref([
  { name: 'Selected Row Highlight', hex: '#E74C5A', token: '--theme-row-highlight', usage: 'Active selected row with pure white text and buttons' },
  { name: 'Row Hover Solid', hex: '#FDF2F4', token: '--theme-row-hover-solid', usage: 'Solid background on hovered table rows' },
  { name: 'Row Hover Translucent', hex: 'rgba(231, 76, 90, 0.06)', previewColor: '#FDF2F4', token: '--theme-row-hover', usage: 'Subtle translucent table row hover layer' },
  { name: 'Paginator Active Page', hex: '#E74C5A', token: '.p-paginator-page-selected', usage: 'Current active page number pill in table paginator' },
  { name: 'Paginator Hover / Light Red', hex: '#FEF2F3', previewColor: '#FEF2F3', token: '.p-paginator-page:hover', usage: 'Hover state for pagination navigation buttons' },
  { name: 'Date Filter Active Preset', hex: '#E74C5A', token: '--theme-chip-active-bg', usage: 'Active state on Today, This Week, This Month buttons' },
  { name: 'Date Filter Hover Preset', hex: '#FEF2F3', previewColor: '#FEF2F3', token: '--theme-chip-hover-bg', usage: 'Soft hover on Today, This Week, This Month buttons' }
])

// 3. Status & Semantic Colors
const statusColors = ref([
  { name: 'Success / Green', hex: '#10B981', token: '--bs-success', usage: 'Active status, online status, systems operational' },
  { name: 'Warning / Amber', hex: '#F59E0B', token: '--bs-warning', usage: 'Pending status, caution alerts, theme switcher sun' },
  { name: 'Danger / Red', hex: '#EF4444', token: '--bs-danger', usage: 'Delete actions, error banners, system degraded' },
  { name: 'Info / Sky Blue', hex: '#0EA5E9', token: '--bs-info', usage: 'Informational badges, helper tips, filter summary' }
])

// 4. Surface & Neutral Canvas
const surfaceColors = ref([
  { name: 'Light App Body Canvas', hex: '#F8F9FA', token: '--bs-body-bg (Light)', usage: 'Default page background in light theme' },
  { name: 'Light Card & Modals', hex: '#FFFFFF', token: '--bs-card-bg (Light)', usage: 'Data table containers, cards, dialogs' },
  { name: 'Dark App Body Canvas', hex: '#212529', token: '--bs-body-bg (Dark)', usage: 'Main background canvas in dark theme' },
  { name: 'Dark Surface Card', hex: '#2B3035', token: '--bs-card-bg (Dark)', usage: 'Elevated cards & data tables in dark theme' },
  { name: 'Theme Tooltip Slate', hex: '#1E2227', token: '--theme-tooltip-bg', usage: 'Floating tooltips with theme border, omnibox footer hints' }
])

const userDisplayName = computed(() => {
  if (!user.value) return 'Admin User'
  if (user.value.fname || user.value.lname) return `${user.value.fname || ''} ${user.value.lname || ''}`.trim()
  if (user.value.username) return user.value.username
  return user.value.email || 'Admin User'
})

const userInitial = computed(() => {
  return (userDisplayName.value || 'A').charAt(0).toUpperCase()
})

const userRole = computed(() => {
  if (!user.value) return 'Super Admin'
  return user.value.role || (user.value.accesslevel_id === 1 ? 'Super Admin' : 'User')
})

const profileForm = ref({
  username: user.value?.username || '',
  email: user.value?.email || '',
  fname: user.value?.fname || '',
  lname: user.value?.lname || '',
  contactnumber: user.value?.contactnumber || ''
})

const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Load full user record from API on mount to sync profile details
const loadUserProfile = async () => {
  if (!user.value || !user.value.id) return
  try {
    const res = await apiClient.get(`/Users/${user.value.id}`).catch(() => null)
    if (res && (res.id || res.username)) {
      profileForm.value.username = res.username || user.value.username || ''
      profileForm.value.email = res.userEmail || res.email || user.value.email || ''
      profileForm.value.fname = res.fname || res.firstName || user.value.fname || ''
      profileForm.value.lname = res.lname || res.lastName || user.value.lname || ''
      profileForm.value.contactnumber = res.contactnumber || res.contactNumber || user.value.contactnumber || ''
    }
  } catch (err) {
    console.warn('Could not fetch latest user details:', err)
  }
}

onMounted(() => {
  loadUserProfile()
})

const saveProfile = async () => {
  profileMsg.value = { text: '', isError: false }
  if (!profileForm.value.username.trim() || !profileForm.value.email.trim()) {
    profileMsg.value = { text: 'Username and Email address are required.', isError: true }
    return
  }

  isSavingProfile.value = true
  try {
    const userId = Number(user.value?.id || 1)
    const existingUser = await apiClient.get(`/Users/${userId}`).catch(() => null)

    const updatePayload = {
      ...(existingUser || {}),
      id: userId,
      username: profileForm.value.username.trim(),
      fname: profileForm.value.fname.trim(),
      lname: profileForm.value.lname.trim(),
      name: `${profileForm.value.fname.trim()} ${profileForm.value.lname.trim()}`.trim(),
      userEmail: profileForm.value.email.trim(),
      email: profileForm.value.email.trim(),
      contactNumber: profileForm.value.contactnumber.trim(),
      contactnumber: profileForm.value.contactnumber.trim(),
      // Form Audit Trail Standard: UPDATE (PUT) populates modifiedBy with logged-in user id
      modifiedBy: userId
    }

    await apiClient.put(`/Users/${userId}`, updatePayload).catch(async () => {
      return await apiClient.put('/Users', updatePayload)
    })

    // Update authStore reactivity & storage for instant application UI refresh
    if (authStore.user) {
      authStore.user.username = updatePayload.username
      authStore.user.fname = updatePayload.fname
      authStore.user.lname = updatePayload.lname
      authStore.user.email = updatePayload.email
      authStore.user.contactnumber = updatePayload.contactnumber

      const storage = localStorage.getItem('token') ? localStorage : sessionStorage
      storage.setItem('user', JSON.stringify(authStore.user))
    }

    profileMsg.value = { text: 'Profile information updated successfully!', isError: false }
    toast.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully!', life: 4000 })
  } catch (err) {
    console.error('Error saving profile:', err)
    profileMsg.value = { text: err.message || 'Failed to update profile. Please try again.', isError: true }
    toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to update profile.', life: 4000 })
  } finally {
    isSavingProfile.value = false
  }
}

const updatePassword = async () => {
  securityMsg.value = { text: '', isError: false }

  if (!securityForm.value.currentPassword) {
    securityMsg.value = { text: 'Please enter your current password.', isError: true }
    return
  }
  if (!securityForm.value.newPassword) {
    securityMsg.value = { text: 'Please enter a new password.', isError: true }
    return
  }
  if (securityForm.value.newPassword.length < 3) {
    securityMsg.value = { text: 'New password must be at least 3 characters long.', isError: true }
    return
  }
  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    securityMsg.value = { text: 'New password and confirmation password do not match.', isError: true }
    return
  }

  isUpdatingPassword.value = true
  try {
    const userId = Number(user.value?.id || 1)
    const existingUser = await apiClient.get(`/Users/${userId}`).catch(() => null)

    if (existingUser && existingUser.password && String(existingUser.password) !== String(securityForm.value.currentPassword)) {
      securityMsg.value = { text: 'Current password entered is incorrect.', isError: true }
      isUpdatingPassword.value = false
      return
    }

    const passwordPayload = {
      ...(existingUser || {}),
      id: userId,
      password: securityForm.value.newPassword,
      // Form Audit Trail Standard: UPDATE (PUT) populates modifiedBy with logged-in user id
      modifiedBy: userId
    }

    await apiClient.put(`/Users/${userId}`, passwordPayload).catch(async () => {
      return await apiClient.put('/Users', passwordPayload)
    })

    securityForm.value.currentPassword = ''
    securityForm.value.newPassword = ''
    securityForm.value.confirmPassword = ''

    securityMsg.value = { text: 'Password updated successfully!', isError: false }
    toast.add({ severity: 'success', summary: 'Password Changed', detail: 'Password updated successfully!', life: 4000 })
  } catch (err) {
    console.error('Error updating password:', err)
    securityMsg.value = { text: err.message || 'Failed to update password. Please try again.', isError: true }
    toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to update password.', life: 4000 })
  } finally {
    isUpdatingPassword.value = false
  }
}
</script>

<style scoped>
.theme-card:hover,
.color-swatch-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--bs-primary-border-subtle) !important;
}
</style>
