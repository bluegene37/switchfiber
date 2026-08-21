<template>
  <div class="w-100">
    <div v-if="error" class="alert alert-danger d-flex align-items-center rounded-3 p-3 mb-0">
      <i class="pi pi-exclamation-circle me-2"></i> Error loading {{ endpoint }}: {{ error }}
    </div>
    
    <!-- Standalone Skeleton Loader View (Shown ONLY while data is loading; hides underlying table completely) -->
    <div v-else-if="loading" class="card border-0 shadow-sm rounded-4 overflow-hidden p-3 bg-body">
      <!-- Top Row Header Placeholder -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 border-bottom pb-3">
        <!-- Left Side: Search & Quick Filter Skeleton -->
        <div class="d-flex align-items-center gap-2 flex-wrap flex-grow-1 flex-md-grow-0">
          <div class="skeleton-box rounded-3" style="width: 240px; height: 32px;"></div>
          <div class="skeleton-box rounded-3" style="width: 120px; height: 32px;"></div>
        </div>

        <!-- Right Side: Tools, Export & Create Skeleton -->
        <div class="d-flex align-items-center gap-2 flex-wrap ms-auto">
          <div class="skeleton-box rounded-3" style="width: 32px; height: 32px;"></div>
          <div class="skeleton-box rounded-3" style="width: 32px; height: 32px;"></div>
          <div class="skeleton-box rounded-3" style="width: 32px; height: 32px;"></div>
          <div class="skeleton-box rounded-3" style="width: 85px; height: 32px;"></div>
          <div v-if="showCreateButton" class="skeleton-box rounded-3" style="width: 120px; height: 32px;"></div>
        </div>
      </div>

      <!-- Shimmer Skeleton Rows -->
      <div class="d-flex flex-column gap-2">
        <!-- Table Header Row Skeleton -->
        <div class="d-flex align-items-center justify-content-between py-2 px-3 bg-body-tertiary rounded-3 border">
          <div v-for="c in 6" :key="c" class="skeleton-box rounded-2" :style="{ width: c === 1 ? '40px' : '110px', height: '16px' }"></div>
        </div>
        <!-- Table Data Rows Skeleton -->
        <div 
          v-for="r in 6" 
          :key="r" 
          class="d-flex align-items-center justify-content-between py-2.5 px-3 border-bottom rounded-3 bg-body"
        >
          <div class="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden">
            <div class="skeleton-box rounded-2 flex-shrink-0" style="width: 32px; height: 16px;"></div>
            <div 
              v-for="c in Math.min((columns && columns.length > 1 ? columns.length - 1 : 5), 5)" 
              :key="c" 
              class="skeleton-box rounded-2 flex-grow-1"
              :style="{ 
                height: '16px', 
                maxWidth: c === 1 ? '160px' : c === 2 ? '140px' : '100px',
                opacity: 1 - (c * 0.1)
              }"
            ></div>
          </div>
          <div class="d-flex align-items-center gap-1.5 ms-3 flex-shrink-0">
            <div class="skeleton-box rounded-circle" style="width: 26px; height: 26px;"></div>
            <div class="skeleton-box rounded-circle" style="width: 26px; height: 26px;"></div>
            <div class="skeleton-box rounded-circle" style="width: 26px; height: 26px;"></div>
          </div>
        </div>
      </div>

      <!-- Bottom Paginator Skeleton -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-3 pt-2 border-top">
        <div class="skeleton-box rounded-2" style="width: 200px; height: 26px;"></div>
        <div class="d-flex align-items-center gap-2.5 ms-auto">
          <div class="skeleton-box rounded-2" style="width: 120px; height: 26px;"></div>
          <div class="skeleton-box rounded-2" style="width: 220px; height: 28px;"></div>
        </div>
      </div>
    </div>
    
    <!-- Main Data View (Shown when data is loaded) -->
    <div v-else>
      <!-- Actual DataTable -->
      <DataTable 
        ref="dt"
        :value="filteredData" 
        scrollable
        :size="tableSize"
        :paginator="true" 
        :rows="rowsPerPage" 
        v-model:first="firstRowIndex"
        v-model:sortField="sortField"
        v-model:sortOrder="sortOrder"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        v-model:selection="selectedRow"
        selectionMode="single"
        @row-select="handleRowSelect"
        @row-unselect="handleRowUnselect"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        :dataKey="tableDataKey"
        filterDisplay="menu"
        :globalFilterFields="displayedColumns"
        :class="['small highlight-selected-row', densityClass]"
      >
      <template #header>
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 gap-md-3 py-1.5 table-toolbar">
          <!-- Left Zone: Search, Status Quick Filter & Reset Button -->
          <div class="d-flex align-items-center gap-2 flex-wrap flex-grow-1 flex-md-grow-0">
            <!-- Enhanced Search Box with Inner Icon & Instant Clear -->
            <div class="position-relative toolbar-search-wrapper">
              <i class="pi pi-search search-icon text-secondary pointer-events-none"></i>
              <input 
                id="global-search" 
                v-model="filters['global'].value" 
                type="text"
                class="form-control form-control-sm toolbar-search-input rounded-3 shadow-none border" 
                :placeholder="`Search ${formatLabel(endpoint)}...`" 
                aria-label="Search records" 
              />
              <button 
                v-if="filters['global'].value" 
                type="button" 
                class="btn btn-link position-absolute top-50 end-0 translate-middle-y me-1 p-1 text-secondary text-decoration-none shadow-none border-0 clear-search-btn"
                @click="filters['global'].value = null"
                v-tooltip.top="'Clear search'"
                aria-label="Clear search"
              >
                <i class="pi pi-times" style="font-size: 0.75rem;"></i>
              </button>
            </div>

            <!-- Connection Filter (RadiusUser only), defaulting to All -->
            <div v-if="isRadiusUserEndpoint" class="d-inline-flex align-items-center gap-1.5">
              <button
                v-for="opt in CONNECTION_FILTER_OPTIONS"
                :key="opt.value"
                type="button"
                class="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1.5 px-2.5 py-1 fw-medium text-nowrap connection-filter-btn"
                :class="connectionFilter === opt.value
                  ? 'btn-primary text-white shadow-sm'
                  : 'border text-secondary bg-body-tertiary shadow-xs'"
                :aria-pressed="connectionFilter === opt.value"
                v-tooltip.top="opt.value === '' ? 'Show all accounts' : `Show only ${opt.label} accounts`"
                @click="setConnectionFilter(opt.value)"
              >
                <i :class="['pi', opt.icon]" style="font-size: 0.75rem;"></i>
                <span>{{ opt.label }}</span>
                <span
                  class="badge rounded-pill connection-filter-count"
                  :class="connectionFilter === opt.value
                    ? 'bg-white bg-opacity-25 text-white'
                    : 'bg-secondary bg-opacity-10 text-secondary'"
                >
                  {{ connectionCounts[opt.countKey] }}
                </span>
              </button>
            </div>

            <!-- Quick Status Filter (when active or status column exists) -->
            <div v-if="hasStatusFilter" class="toolbar-filter-select">
              <select 
                v-model="selectedStatusFilter" 
                class="form-select form-select-sm rounded-3 fw-medium text-body bg-body shadow-xs border" 
                aria-label="Filter by status"
              >
                <option value="">Status: All</option>
                <option v-for="opt in statusFilterOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Active Filter Count Badge & Reset Button -->
            <button 
              v-if="activeFilterCount > 0"
              type="button" 
              class="btn btn-sm btn-outline-danger border-dashed rounded-3 d-inline-flex align-items-center gap-1.5 px-2.5 py-1 small shadow-xs"
              @click="clearAllFilters"
              v-tooltip.top="'Reset all applied filters'"
              aria-label="Reset all applied filters"
            >
              <i class="pi pi-filter-slash" style="font-size: 0.75rem;"></i>
              <span>Reset ({{ activeFilterCount }})</span>
            </button>
          </div>

          <!-- Right Zone: View Controls (Refresh, Density, Columns), Consolidated Export & Primary Action -->
          <div class="d-flex align-items-center gap-2 flex-wrap ms-auto">
            <!-- Refresh Button -->
            <Button
              class="p-button-secondary p-button-sm p-button-outlined shadow-xs toolbar-icon-btn rounded-3"
              v-tooltip.bottom="'Refresh Data'"
              :loading="refreshing"
              aria-label="Refresh data"
              @click="refreshData"
            >
              <i v-if="!refreshing" class="pi pi-refresh"></i>
            </Button>

            <!-- Table Row Density Switcher -->
            <Button 
              class="p-button-secondary p-button-sm p-button-outlined shadow-xs toolbar-icon-btn rounded-3"
              v-tooltip.bottom="`Density: ${densityLabel}`"
              aria-label="Toggle Row Density"
              @click="toggleDensity"
            >
              <i :class="densityIcon"></i>
            </Button>

            <!-- Column Visibility Chooser -->
            <Button 
              class="p-button-secondary p-button-sm p-button-outlined shadow-xs toolbar-icon-btn rounded-3"
              v-tooltip.bottom="'Customize Columns'"
              aria-label="Customize Columns"
              @click="toggleColumnPicker"
            >
              <i class="pi pi-sliders-h"></i>
            </Button>

            <Popover ref="columnPopover">
              <div class="p-2 column-picker-panel" style="min-width: 220px; max-width: 280px;">
                <div class="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                  <span class="fw-bold small text-body">Visible Columns</span>
                  <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none small fw-medium reset-columns-btn" @click="resetColumns">Reset All</button>
                </div>
                <div class="d-flex flex-column gap-1.5 overflow-y-auto" style="max-height: 240px;">
                  <label 
                    v-for="col in columns" 
                    :key="col" 
                    class="d-flex align-items-center gap-2 small cursor-pointer py-1 px-1.5 rounded hover-bg mb-0"
                  >
                    <input 
                      type="checkbox" 
                      class="form-check-input mt-0" 
                      :checked="visibleColumns.includes(col)"
                      :disabled="visibleColumns.length === 1 && visibleColumns.includes(col)"
                      @change="toggleColumnVisibility(col)"
                    />
                    <span class="text-truncate text-body">{{ formatLabel(col) }}</span>
                  </label>
                </div>
              </div>
            </Popover>

            <!-- Consolidated Export Dropdown -->
            <Button 
              class="p-button-secondary p-button-sm p-button-outlined shadow-xs rounded-3 px-2.5 d-inline-flex align-items-center gap-1.5"
              aria-label="Export Data"
              v-tooltip.bottom="'Export to CSV, Excel, or PDF'"
              aria-haspopup="true"
              aria-controls="export_menu"
              @click="toggleExportMenu"
            >
              <i class="pi pi-download text-secondary"></i>
              <span class="d-none d-sm-inline fw-medium">Export</span>
              <i class="pi pi-chevron-down small opacity-75"></i>
            </Button>
            <Menu ref="exportMenu" id="export_menu" :model="exportMenuItems" :popup="true" />

            <!-- Primary Action: Create Button -->
            <Button 
              v-if="showCreateButton" 
              class="p-button-primary p-button-sm rounded-3 px-3 px-sm-3.5 shadow-xs ms-1 fw-semibold d-inline-flex align-items-center gap-1.5" 
              :aria-label="createButtonLabel || 'Create'" 
              @click="openCreateDialog"
            >
              <i class="pi pi-plus"></i>
              <span class="d-none d-sm-inline">{{ createButtonLabel || 'Create' }}</span>
              <span class="d-sm-none">Create</span>
            </Button>
          </div>
        </div>
      </template>

      <!-- Paginator Start: Dynamic Record Range Summary -->
      <template #paginatorstart>
        <div class="small text-secondary d-flex align-items-center my-1 flex-wrap">
          <i class="pi pi-database text-primary opacity-75 me-2"></i>
          <span>Showing <strong class="text-body">{{ recordRangeStart }}</strong> to <strong class="text-body">{{ recordRangeEnd }}</strong> of <strong class="text-body">{{ filteredRecordsCount }}</strong> {{ filteredRecordsCount === 1 ? 'record' : 'records' }}</span>
          <span v-if="filteredRecordsCount !== totalRecordsCount" class="badge bg-secondary bg-opacity-10 text-secondary border ms-2" style="font-size: 0.72rem;">
            Filtered from {{ totalRecordsCount }}
          </span>
        </div>
      </template>

      <!-- Paginator End: Rows Per Page Selector (Grouped with Navigation) -->
      <template #paginatorend>
        <div class="d-flex align-items-center gap-2 my-1">
          <span class="mb-0 small text-secondary text-nowrap me-1">Rows per page:</span>
          <select v-model="rowsPerPage" class="form-select form-select-sm paginator-rows-select shadow-xs" aria-label="Rows per page">
            <option v-for="opt in rowOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
      </template>

      <!-- Dynamic Visible Columns -->
      <Column
        v-for="col in displayedColumns"
        :key="col"
        :field="col"
        :header="formatLabel(col)"
        :sortable="true"
        :frozen="isLeftFrozenColumn(col)"
        alignFrozen="left"
        :class="isLeftFrozenColumn(col) ? 'frozen-left-col' : ''"
        :headerClass="isStatusColumn(col) ? 'text-center' : ''"
        :bodyClass="isStatusColumn(col) ? 'text-center' : ''"
      >
        <template #body="slotProps">
          <div v-if="col.toLowerCase() === 'active'" class="d-flex justify-content-center">
            <span v-if="slotProps.data[col] === true || slotProps.data[col] === 'true'" class="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1">Active</span>
            <span v-else class="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-2.5 py-1">Inactive</span>
          </div>
          <!-- `disabled` is inverted against `active`: true means the account is cut off -->
          <div v-else-if="col.toLowerCase() === 'disabled'" class="d-flex justify-content-center">
            <span v-if="slotProps.data[col] === true || slotProps.data[col] === 'true'" class="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2.5 py-1">Disabled</span>
            <span v-else class="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1">Enabled</span>
          </div>
          <!-- Agreement Checkbox Column display -->
          <div v-else-if="getFieldType(col) === 'agreement_checkbox'" class="d-flex justify-content-center">
            <span v-if="isAgreementChecked(slotProps.data[col])" class="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1">
              <i class="pi pi-check me-1 small"></i>Yes, I Agree
            </span>
            <span v-else class="text-muted">-</span>
          </div>
          <div v-else-if="col.toLowerCase().includes('status')" class="d-flex justify-content-center">
            <span 
              v-if="slotProps.data[col] !== null && slotProps.data[col] !== undefined && slotProps.data[col] !== ''"
              class="badge rounded-pill px-2.5 py-1 fw-semibold border"
              :class="getStatusBadgeConfig(slotProps.data[col]).class"
            >
              {{ getStatusBadgeConfig(slotProps.data[col]).label }}
            </span>
            <span v-else class="text-muted">-</span>
          </div>
          <span v-else-if="getFieldType(col) === 'image_upload'">
            <span v-if="slotProps.data[col]" class="d-inline-flex align-items-center gap-1.5 cursor-pointer" @click.stop="openImagePreview(slotProps.data[col], formatLabel(col))">
              <img :src="slotProps.data[col]" alt="Thumbnail" class="rounded border" style="width: 28px; height: 28px; object-fit: cover;" />
              <span class="small text-primary text-decoration-underline" style="font-size: 0.78rem;">View</span>
            </span>
            <span v-else class="text-muted">-</span>
          </span>
          <span v-else-if="getFieldType(col) === 'coordinates'">
            <template v-for="coordVal in [getRowCoordinateValue(slotProps.data, col)]" :key="col">
              <a
                v-if="coordVal && parseCoordinates(coordVal)"
                :href="`https://www.google.com/maps/dir/?api=1&destination=${String(coordVal).replace(/\s+/g, '')}`"
                target="_blank"
                rel="noopener"
                class="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 text-decoration-none d-inline-flex align-items-center gap-1.5 px-2.5 py-1 shadow-xs fw-semibold"
                :title="`Open in Google Maps (${coordVal})`"
                @click.stop
              >
                <i class="pi pi-map-marker text-success" style="font-size: 0.7rem;"></i>
                <span class="font-monospace">{{ coordVal }}</span>
                <i class="pi pi-external-link text-success" style="font-size: 0.6rem;"></i>
              </a>
              <span v-else-if="coordVal" class="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2.5 py-1">
                <i class="pi pi-map-marker me-1" style="font-size: 0.65rem;"></i>{{ coordVal }}
              </span>
              <span v-else class="badge rounded-pill bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-0.5" style="font-size: 0.75rem;">
                <i class="pi pi-exclamation-circle me-1" style="font-size: 0.65rem;"></i>No GPS
              </span>
            </template>
          </span>
          <span v-else-if="col.toLowerCase() === 'accesslevel_id' || col.toLowerCase() === 'accesslevelid'">
            {{ getAccessLevelLabel(slotProps.data[col]) }}
          </span>
          <span v-else-if="isUserRefField(col)">
            {{ getUserDisplayName(slotProps.data[col]) }}
          </span>
          <span v-else-if="getFieldType(col) === 'textarea' || col.toLowerCase().includes('description')" class="d-inline-block text-wrap py-1" style="min-width: 250px; max-width: 480px; white-space: normal; word-break: break-word;">
            {{ slotProps.data[col] !== null && slotProps.data[col] !== undefined ? slotProps.data[col] : '-' }}
          </span>
          <span v-else class="d-inline-block text-truncate" style="max-width: 240px;" :title="slotProps.data[col]">
            <span v-if="typeof slotProps.data[col] === 'object' && slotProps.data[col] !== null">
              {{ slotProps.data[col].name || slotProps.data[col].title || slotProps.data[col].label || slotProps.data[col].id || '-' }}
            </span>
            <span v-else>{{ slotProps.data[col] !== null && slotProps.data[col] !== undefined ? slotProps.data[col] : '-' }}</span>
          </span>
        </template>
      </Column>

      <!-- Connection Status (RadiusUser only) — the state as a pill, in its own
           column ahead of the switch that changes it. Tracks the in-flight value
           while a connect / disconnect is running, so it never disagrees with the
           switch beside it. -->
      <Column
        v-if="isRadiusUserEndpoint"
        header="Connection Status"
        :style="{ minWidth: '180px', width: '180px' }"
        headerClass="text-center"
        bodyClass="text-center"
      >
        <template #body="slotProps">
          <div class="d-flex justify-content-center">
            <span
              class="badge rounded-pill px-2.5 py-1 fw-semibold border"
              :class="isRowConnected(slotProps.data)
                ? 'bg-success bg-opacity-10 text-success border-success border-opacity-25'
                : 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25'"
            >
              {{ isRowConnected(slotProps.data) ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </template>
      </Column>

      <!-- Connection Toggle (RadiusUser only). With the caption hidden the switch
           sits alone and the header carries the meaning; when the caption is on it
           reads after the switch in a fixed-width slot, so the switches stay
           aligned down the column instead of shifting with the word beside them. -->
      <Column
        v-if="isRadiusUserEndpoint"
        header="Connection"
        :style="{
          minWidth: SHOW_CONNECTION_STATE_LABEL ? '165px' : '120px',
          width: SHOW_CONNECTION_STATE_LABEL ? '165px' : '120px'
        }"
        headerClass="text-center"
        bodyClass="text-center"
      >
        <template #body="slotProps">
          <div
            class="d-flex justify-content-center align-items-center gap-2"
            :class="{ 'connection-cell': SHOW_CONNECTION_STATE_LABEL }"
            @click.stop
          >
            <ToggleSwitch
              :modelValue="isRowConnected(slotProps.data)"
              :disabled="isConnectionPending(slotProps.data) || !radiusNameOf(slotProps.data)"
              @update:modelValue="value => toggleConnection(slotProps.data, value)"
              :aria-label="`Toggle connection for ${radiusNameOf(slotProps.data) || 'this account'}`"
              v-tooltip.top="isRowConnected(slotProps.data) ? 'Disconnect this account' : 'Connect this account'"
            />

            <span v-if="SHOW_CONNECTION_STATE_LABEL" class="connection-state small fw-semibold">
              <span v-if="isConnectionPending(slotProps.data)" class="text-secondary d-inline-flex align-items-center gap-1">
                <i class="pi pi-spin pi-spinner" style="font-size: 0.75rem;"></i>
                <span>Working…</span>
              </span>
              <span v-else :class="isRowConnected(slotProps.data) ? 'text-success' : 'text-danger'">
                {{ isRowConnected(slotProps.data) ? 'Connected' : 'Disconnected' }}
              </span>
            </span>

            <!-- Caption off: the request still needs to be visible while it runs -->
            <i
              v-else-if="isConnectionPending(slotProps.data)"
              class="pi pi-spin pi-spinner text-secondary"
              style="font-size: 0.8rem;"
            ></i>
          </div>
        </template>
      </Column>

      <!-- Actions Column (Frozen on Right) -->
      <Column header="Actions" alignFrozen="right" :frozen="true" :style="{ minWidth: isMenuEndpoint ? '150px' : '105px', width: isMenuEndpoint ? '150px' : '105px' }" class="text-center frozen-actions-col">
        <template #body="slotProps">
          <div class="d-flex gap-1 justify-content-center align-items-center" @click.stop>
            <!-- Interactive Toggle Switch & Status Pill in Actions Column for Menus -->
            <div v-if="isMenuEndpoint" class="d-flex align-items-center me-1">
              <ToggleSwitch 
                :modelValue="isMenuLinked(slotProps.data) === true" 
                :disabled="isToggleSwitchDisabled(slotProps.data)" 
                @update:modelValue="toggleMenuLink(slotProps.data)"
                :title="getToggleSwitchTitle(slotProps.data)" 
              />
            </div>

            <Button 
              icon="pi pi-eye" 
              class="p-button-text p-button-sm p-button-rounded p-button-secondary p-0 action-row-btn" 
              v-tooltip.top="'View Details'" 
              aria-label="View Details"
              @click="openViewDialog(slotProps.data)" 
            />
            <Button
              v-if="!readOnly"
              icon="pi pi-pencil"
              class="p-button-text p-button-sm p-button-rounded p-button-secondary p-0 action-row-btn"
              v-tooltip.top="'Edit Record'"
              aria-label="Edit Record"
              @click="openEditDialog(slotProps.data)"
            />
            <Button
              v-if="!readOnly"
              icon="pi pi-trash"
              class="p-button-text p-button-sm p-button-rounded p-0 delete-btn action-row-btn"
              v-tooltip.top="'Delete Record'"
              aria-label="Delete Record"
              @click="confirmDelete(slotProps.data)"
            />
          </div>
        </template>
      </Column>

      <!-- Empty State -->
      <template #empty>
        <!-- Still verifying: never assert "no data" until a request has settled -->
        <div
          v-if="!hasFetched || refreshing"
          class="p-5 d-flex flex-column align-items-center justify-content-center gap-2"
        >
          <div v-for="r in 3" :key="r" class="skeleton-box rounded-2" :style="{ width: r === 1 ? '220px' : r === 2 ? '300px' : '180px', height: '14px' }"></div>
          <span class="small text-secondary mt-2">Checking for records&hellip;</span>
        </div>

        <div v-else class="p-5 text-center text-secondary d-flex flex-column align-items-center justify-content-center">
          <div class="rounded-circle bg-body-tertiary p-3 mb-3 d-inline-flex align-items-center justify-content-center border" style="width: 56px; height: 56px;">
            <i :class="activeFilterCount > 0 ? 'pi pi-search-minus' : 'pi pi-inbox'" class="text-secondary fs-4"></i>
          </div>
          <h6 class="fw-bold text-body mb-1">
            {{ activeFilterCount > 0 ? 'No matching records found' : `No records available for ${formatLabel(endpoint)}` }}
          </h6>
          <p class="small text-secondary mb-3" style="max-width: 380px;">
            {{ activeFilterCount > 0 ? 'Try modifying or clearing your search keywords and status filters to find what you are looking for.' : 'There are currently no entries recorded in this dataset.' }}
          </p>
          <div class="d-flex align-items-center gap-2">
            <Button 
              v-if="activeFilterCount > 0" 
              label="Clear Filters" 
              icon="pi pi-filter-slash" 
              class="p-button-outlined p-button-sm rounded-3 shadow-xs" 
              @click="clearAllFilters" 
            />
            <Button 
              v-if="showCreateButton" 
              :label="`Create ${formatLabel(endpoint)}`" 
              icon="pi pi-plus" 
              class="p-button-primary p-button-sm rounded-3 shadow-xs" 
              @click="openCreateDialog" 
            />
          </div>
        </div>
      </template>
    </DataTable>
    </div>

    <!-- Enhanced Create Record Dialog -->
    <Dialog 
      v-model:visible="displayCreateDialog" 
      modal 
      :header="`Create New ${formatLabel(endpoint)} Record`" 
      :style="modalStyle"
      :breakpoints="modalBreakpoints"
    >
      <div v-if="saveError" id="form-error-create" class="alert alert-danger d-flex align-items-center rounded-3 p-2 mb-3 small">
        <i class="pi pi-exclamation-triangle me-2"></i> {{ saveError }}
      </div>

      <div class="pe-2 mt-2" style="max-height: 72vh; overflow-y: auto;">
        <div 
          v-for="sec in formSections" 
          :key="sec.key" 
          class="card border rounded-3 p-3 mb-3 bg-body shadow-sm"
        >
          <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
            <h6 class="fw-bold mb-0 text-body d-flex align-items-center gap-2" :class="sec.badgeClass">
              <i :class="sec.icon"></i> {{ sec.title }}
            </h6>
            <span class="badge bg-secondary-subtle text-secondary border rounded-pill px-2 py-1 small fw-normal">
              {{ (sec.columns || []).length }} {{ (sec.columns || []).length === 1 ? 'field' : 'fields' }}
            </span>
          </div>

          <div class="row g-3">
            <div
              v-for="col in sec.columns"
              :key="col"
              :id="fieldWrapId('create', col)"
              :class="[
                getColumnClass(col),
                {
                  'd-flex flex-column': isApplicationEndpoint && (normalizeColKey(col) === 'remarks' || normalizeColKey(col) === 'installationaddress'),
                  'field-invalid': hasFieldError('create', col) || (normalizeColKey(col) === 'barangay1' && (hasFieldError('create', 'barangay1') || hasFieldError('create', 'barangay2'))) || (normalizeColKey(col) === 'visitwithother' && (hasFieldError('create', 'visitWithOther') || hasFieldError('create', 'userEmail')))
                }
              ]"
            >
              <label v-if="normalizeColKey(col) !== 'barangay1' && normalizeColKey(col) !== 'visitwithother'" :for="col" class="form-label fw-medium text-body small mb-1">
                {{ formatLabel(col) }}
                <span v-if="isFieldRequired(col)" class="text-danger ms-1" title="Required">*</span>
                <span v-else-if="eitherOrHint(col)" class="badge bg-secondary-subtle text-secondary border rounded-pill ms-1 fw-normal" style="font-size: 0.65rem;">{{ eitherOrHint(col) }}</span>
              </label>

              <!-- Combined Barangay 1 & Barangay 2 Column (Stacked) -->
              <div v-if="normalizeColKey(col) === 'barangay1'" class="d-flex flex-column gap-2">
                <div>
                  <label :for="`create-barangay1`" class="form-label fw-medium text-body small mb-1">
                    Barangay 1
                    <span v-if="isFieldRequired('barangay1')" class="text-danger ms-1" title="Required">*</span>
                  </label>
                  <InputText 
                    id="create-barangay1" 
                    v-model="formData.barangay1" 
                    class="w-100 p-inputtext-sm" 
                    placeholder="Enter barangay 1" 
                  />
                </div>
                <div>
                  <label :for="`create-barangay2`" class="form-label fw-medium text-body small mb-1">
                    Barangay 2
                    <span v-if="isFieldRequired('barangay2')" class="text-danger ms-1" title="Required">*</span>
                  </label>
                  <InputText 
                    id="create-barangay2" 
                    v-model="formData.barangay2" 
                    class="w-100 p-inputtext-sm" 
                    placeholder="Enter barangay 2" 
                  />
                </div>
              </div>

              <!-- Combined Visit With (Other) & User Email Column (Stacked) -->
              <div v-else-if="normalizeColKey(col) === 'visitwithother'" class="d-flex flex-column gap-2">
                <div>
                  <label :for="`create-visitwithother`" class="form-label fw-medium text-body small mb-1">
                    Visit With (Other)
                    <span v-if="isFieldRequired('visitWithOther')" class="text-danger ms-1" title="Required">*</span>
                  </label>
                  <InputText 
                    id="create-visitwithother" 
                    v-model="formData.visitWithOther" 
                    class="w-100 p-inputtext-sm" 
                    placeholder="Enter visit with (other)" 
                  />
                </div>
                <div>
                  <label :for="`create-useremail`" class="form-label fw-medium text-body small mb-1">
                    User Email
                    <span v-if="isFieldRequired('userEmail')" class="text-danger ms-1" title="Required">*</span>
                  </label>
                  <InputText 
                    id="create-useremail" 
                    v-model="formData.userEmail" 
                    class="w-100 p-inputtext-sm" 
                    placeholder="Enter user email" 
                  />
                </div>
              </div>

              <!-- Toggle Switch for Active / Boolean fields -->
              <div v-else-if="getFieldType(col) === 'toggle'" class="d-flex align-items-center gap-3 pt-2">
                <ToggleSwitch :id="col" v-model="formData[col]" />
                <span class="small fw-semibold" :class="formData[col] ? 'text-success' : 'text-secondary'">
                  {{ formData[col] ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <!-- Agreement Checkbox -->
              <div v-else-if="getFieldType(col) === 'agreement_checkbox'" class="d-flex align-items-center gap-2 pt-2">
                <Checkbox 
                  :inputId="col" 
                  v-model="formData[col]" 
                  :binary="true" 
                  trueValue="Yes, I Agree" 
                  falseValue="" 
                />
                <label :for="col" class="form-check-label small fw-medium mb-0 cursor-pointer user-select-none">
                  Yes, I Agree
                </label>
              </div>

              <!-- Access Level Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'accesslevel_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="accessLevels" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Access Level" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Menu Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'menu_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="menusList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Menu" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- LCNAP Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'lcpnap_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="lcpnapsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select LCNAP" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- LCNAP Port Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'lcpnapport_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="lcpnapportsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select LCNAP Port" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- LCP Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'lcp_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="lcpsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select LCP" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- NAP Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'nap_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="napsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select NAP" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Port Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'port_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="portsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Port" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- VLAN Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'vlan_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="vlansList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select VLAN" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Plan Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'plan_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="getPlanOptions(col, formData[col])" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Desired Plan" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Referred By Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'referredby_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="getReferrerOptions(formData[col])" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Referrer" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Region Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'region_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="createRegionOptions" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                @change="onRegionChanged(formData)"
                placeholder="Select Region" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Province Dropdown -->
              <div v-else-if="getFieldType(col) === 'province_dropdown'" class="position-relative">
                <Select 
                  :id="col" 
                  v-model="formData[col]" 
                  :options="createProvinceOptions" 
                  optionLabel="label" 
                  optionValue="value" 
                  :filter="true"
                  :disabled="isCityDisabled(formData)"
                  @change="onProvinceChanged(formData)"
                  placeholder="Select Province"
                  class="w-100 p-inputtext-sm"
                />
                <div 
                  v-if="isCityDisabled(formData)" 
                  class="position-absolute top-0 start-0 w-100 h-100" 
                  style="cursor: pointer; z-index: 2;" 
                  title="Please select Region first"
                  @click.stop="notifyAddressStep(formData, 'province', 'create')"
                ></div>
                <div 
                  v-if="shouldShowAddressHint(formData, 'province', 'create')" 
                  class="address-step-hint mt-1 d-flex align-items-center gap-1"
                >
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ getAddressStepBlocker(formData, 'province')?.summary }}</span>
                </div>
              </div>

              <!-- City / Municipality Dropdown -->
              <div v-else-if="getFieldType(col) === 'city_dropdown'" class="position-relative">
                <Select
                  :id="col"
                  v-model="formData[col]"
                  :options="createCityOptions"
                  optionLabel="label"
                  optionValue="value"
                  :filter="true"
                  :disabled="isCityDisabled(formData)"
                  @change="onCityChanged(formData)"
                  :virtualScrollerOptions="{ itemSize: 38 }"
                  :placeholder="getCityPlaceholder(formData)"
                  class="w-100 p-inputtext-sm"
                />
                <div 
                  v-if="isCityDisabled(formData)" 
                  class="position-absolute top-0 start-0 w-100 h-100" 
                  style="cursor: pointer; z-index: 2;" 
                  title="Please select Region first"
                  @click.stop="notifyAddressStep(formData, 'city', 'create')"
                ></div>
                <div 
                  v-if="shouldShowAddressHint(formData, 'city', 'create')" 
                  class="address-step-hint mt-1 d-flex align-items-center gap-1"
                >
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ getAddressStepBlocker(formData, 'city')?.summary }}</span>
                </div>
              </div>

              <!-- Barangay Dropdown -->
              <div v-else-if="getFieldType(col) === 'barangay_dropdown'" class="position-relative">
                <Select
                  :id="col"
                  v-model="formData[col]"
                  :options="createBarangayOptions"
                  optionLabel="label"
                  optionValue="value"
                  :filter="true"
                  :disabled="isBarangayDisabled(formData)"
                  :virtualScrollerOptions="{ itemSize: 38 }"
                  :placeholder="getBarangayPlaceholder(formData)"
                  class="w-100 p-inputtext-sm"
                />
                <div 
                  v-if="isBarangayDisabled(formData)" 
                  class="position-absolute top-0 start-0 w-100 h-100" 
                  style="cursor: pointer; z-index: 2;" 
                  title="Please select City first"
                  @click.stop="notifyAddressStep(formData, 'barangay', 'create')"
                ></div>
                <div 
                  v-if="shouldShowAddressHint(formData, 'barangay', 'create')" 
                  class="address-step-hint mt-1 d-flex align-items-center gap-1"
                >
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ getAddressStepBlocker(formData, 'barangay')?.summary }}</span>
                </div>
              </div>

              <!-- Status Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'status_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="statusOptions" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Status" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Onsite Status Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'onsitestatus_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="onsiteStatusOptions" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Onsite Status" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Billing Status Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'billingstatus_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="billingStatusOptions" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Billing Status" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Usage Type Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'usagetype_dropdown'" 
                :id="col" 
                v-model="formData[col]" 
                :options="usageTypeOptions" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Usage Type" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Confirm Password Field -->
              <div v-else-if="getFieldType(col) === 'confirm_password'">
                <div class="position-relative w-100">
                  <input 
                    :id="col"
                    :type="showPasswordState['create_' + col] ? 'text' : 'password'"
                    v-model="formData[col]"
                    class="form-control form-control-sm pe-5"
                    :disabled="!userPermissions.canModifyPassword"
                    :class="{ 'is-invalid': passwordsMismatch('create') }"
                    :placeholder="userPermissions.canModifyPassword ? 'Confirm password' : 'Password modification disabled'"
                  />
                  <button 
                    v-if="userPermissions.canUnmaskPassword"
                    type="button" 
                    class="btn btn-link position-absolute end-0 top-50 translate-middle-y me-1 p-1 text-secondary text-decoration-none shadow-none border-0 eye-toggle-btn" 
                    @click="showPasswordState['create_' + col] = !showPasswordState['create_' + col]"
                    :title="showPasswordState['create_' + col] ? 'Hide password' : 'Show password'"
                    style="line-height: 1; z-index: 5;"
                  >
                    <i :class="['pi', showPasswordState['create_' + col] ? 'pi-eye-slash' : 'pi-eye']" style="font-size: 0.9rem;"></i>
                  </button>
                </div>
                <div v-if="!userPermissions.canModifyPassword" class="text-muted small mt-1" style="font-size: 0.75rem;">
                  <i class="pi pi-lock me-1"></i> You do not have permission to modify passwords.
                </div>
                <div v-else-if="passwordsMismatch('create')" class="text-danger small mt-1" style="font-size: 0.75rem;">
                  <i class="pi pi-exclamation-circle me-1"></i> Passwords do not match
                </div>
              </div>

              <!-- Coordinate Picker -->
              <div v-else-if="getFieldType(col) === 'coordinates'" class="d-flex flex-column gap-2 w-100">
                <CoordinatePicker v-model="formData[col]" height="260px" />
                <div class="input-group input-group-sm">
                  <span class="input-group-text"><i class="pi pi-compass" style="font-size: 0.75rem;"></i></span>
                  <input
                    :id="col"
                    v-model="formData[col]"
                    type="text"
                    class="form-control form-control-sm rounded-end-3 font-monospace"
                    :class="{ 'is-invalid': hasFieldError('create', col) }"
                    placeholder="latitude, longitude (e.g. 14.474414, 121.196214)"
                  />
                </div>
              </div>

              <!-- Image Upload (Dropzone) -->
              <div v-else-if="getFieldType(col) === 'image_upload'" class="w-100">
                <ImageDropzone
                  v-model="formData[col]"
                  :fieldId="col"
                  :label="formatLabel(col)"
                  :required="isFieldRequired(col)"
                  @exif="onPhotoExif('create', col, $event)"
                />
              </div>

              <!-- Password Field -->
              <div v-else-if="getFieldType(col) === 'password'">
                <div class="position-relative w-100">
                  <input 
                    :id="col"
                    :type="showPasswordState['create_' + col] ? 'text' : 'password'"
                    v-model="formData[col]"
                    class="form-control form-control-sm pe-5"
                    :disabled="!userPermissions.canModifyPassword"
                    :placeholder="userPermissions.canModifyPassword ? 'Enter password' : 'Password modification disabled'"
                  />
                  <button 
                    v-if="userPermissions.canUnmaskPassword"
                    type="button" 
                    class="btn btn-link position-absolute end-0 top-50 translate-middle-y me-1 p-1 text-secondary text-decoration-none shadow-none border-0 eye-toggle-btn" 
                    @click="showPasswordState['create_' + col] = !showPasswordState['create_' + col]"
                    :title="showPasswordState['create_' + col] ? 'Hide password' : 'Show password'"
                    style="line-height: 1; z-index: 5;"
                  >
                    <i :class="['pi', showPasswordState['create_' + col] ? 'pi-eye-slash' : 'pi-eye']" style="font-size: 0.9rem;"></i>
                  </button>
                </div>
                <div v-if="!userPermissions.canModifyPassword" class="text-muted small mt-1" style="font-size: 0.75rem;">
                  <i class="pi pi-lock me-1"></i> You do not have permission to modify passwords.
                </div>
              </div>

              <!-- DatePicker for Date Fields -->
              <DatePicker 
                v-else-if="getFieldType(col) === 'date'" 
                :id="col" 
                v-model="formData[col]" 
                showIcon 
                iconDisplay="input"
                fluid
                size="small"
                dateFormat="yy-mm-dd" 
                placeholder="Select date" 
                class="w-100"
              />

              <!-- Email Input for Email Fields -->
              <InputText 
                v-else-if="getFieldType(col) === 'email'" 
                :id="col" 
                type="email"
                v-model="formData[col]" 
                class="w-100 p-inputtext-sm" 
                :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
              />

              <!-- Phone / Mobile Input -->
              <InputText 
                v-else-if="getFieldType(col) === 'phone'" 
                :id="col" 
                type="tel"
                v-model="formData[col]" 
                class="w-100 p-inputtext-sm font-monospace" 
                :class="{ 'p-invalid': hasFieldError('create', col) }"
                placeholder="e.g. 09123456789 or +639123456789" 
              />

              <!-- InputNumber for Numeric Fields -->
              <InputNumber 
                v-else-if="getFieldType(col) === 'number'" 
                :id="col" 
                v-model="formData[col]" 
                fluid
                size="small"
                class="w-100" 
                :useGrouping="false"
                :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
              />

              <!-- Textarea for Multiline Fields -->
              <Textarea 
                v-else-if="getFieldType(col) === 'textarea'" 
                :id="col" 
                v-model="formData[col]" 
                :rows="(col.toLowerCase().includes('remark') || col.toLowerCase().includes('installationaddress')) && isApplicationEndpoint ? 4 : 3" 
                class="w-100 p-inputtext-sm" 
                :class="{ 'flex-grow-1': isApplicationEndpoint && (normalizeColKey(col) === 'remarks' || normalizeColKey(col) === 'installationaddress') }"
                :style="isApplicationEndpoint && (normalizeColKey(col) === 'remarks' || normalizeColKey(col) === 'installationaddress') ? 'min-height: 96px;' : ''"
                :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
              />

              <!-- InputText for Standard / Monospace Fields -->
              <InputText 
                v-else 
                :id="col" 
                v-model="formData[col]" 
                class="w-100 p-inputtext-sm" 
                :class="{ 
                  'font-monospace text-uppercase': col.toLowerCase().includes('sn') || col.toLowerCase().includes('serial'),
                  'font-monospace': col.toLowerCase() === 'ip' || col.toLowerCase().includes('address')
                }"
                :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
              />

              <div
                v-if="hasFieldError('create', col)"
                class="field-error-hint mt-1 d-flex align-items-center gap-1"
              >
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ fieldErrorText('create', col) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary p-button-sm rounded-3 px-3" @click="displayCreateDialog = false" />
          <Button :label="`Save ${formatLabel(endpoint)}`" icon="pi pi-check" class="p-button-primary p-button-sm rounded-3 px-3.5 shadow-xs" @click="saveData" :loading="saving" />
        </div>
      </template>
    </Dialog>

    <!-- View Record Dialog (Read-Only) -->
    <Dialog 
      v-model:visible="displayViewDialog" 
      modal 
      :header="viewingRecordId ? `View ${formatLabel(endpoint)} Record #${viewingRecordId}` : `View ${formatLabel(endpoint)} Record`" 
      :style="modalStyle"
      :breakpoints="modalBreakpoints"
    >
      <div class="pe-2 mt-2" style="max-height: 72vh; overflow-y: auto;">
        <div 
          v-for="sec in viewFormSections" 
          :key="sec.key" 
          class="card border rounded-3 p-3 mb-3 bg-body shadow-sm"
        >
          <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
            <h6 class="fw-bold mb-0 text-body d-flex align-items-center gap-2" :class="sec.badgeClass">
              <i :class="sec.icon"></i> {{ sec.title }}
            </h6>
            <span class="badge bg-secondary-subtle text-secondary border rounded-pill px-2 py-1 small fw-normal">
              {{ (sec.columns || []).length }} {{ (sec.columns || []).length === 1 ? 'field' : 'fields' }}
            </span>
          </div>

          <div class="row g-3">
            <div 
              v-for="col in sec.columns" 
              :key="col" 
              :class="[
                getColumnClass(col),
                {
                  'd-flex flex-column': isApplicationEndpoint && (normalizeColKey(col) === 'remarks' || normalizeColKey(col) === 'installationaddress')
                }
              ]"
            >
              <label v-if="normalizeColKey(col) !== 'barangay1' && normalizeColKey(col) !== 'visitwithother'" :for="`view-${col}`" class="form-label fw-medium text-body small mb-1">
                {{ formatLabel(col) }}
              </label>

              <!-- Combined Barangay 1 & Barangay 2 Column in View Modal (Stacked) -->
              <div v-if="normalizeColKey(col) === 'barangay1'" class="d-flex flex-column gap-2">
                <div>
                  <label :for="`view-barangay1`" class="form-label fw-medium text-body small mb-1">
                    Barangay 1
                  </label>
                  <InputText 
                    id="view-barangay1" 
                    :modelValue="viewFormData.barangay1 || '-'" 
                    readonly 
                    disabled 
                    class="w-100 p-inputtext-sm bg-light" 
                  />
                </div>
                <div>
                  <label :for="`view-barangay2`" class="form-label fw-medium text-body small mb-1">
                    Barangay 2
                  </label>
                  <InputText 
                    id="view-barangay2" 
                    :modelValue="viewFormData.barangay2 || '-'" 
                    readonly 
                    disabled 
                    class="w-100 p-inputtext-sm bg-light" 
                  />
                </div>
              </div>

              <!-- Combined Visit With (Other) & User Email Column in View Modal (Stacked) -->
              <div v-else-if="normalizeColKey(col) === 'visitwithother'" class="d-flex flex-column gap-2">
                <div>
                  <label :for="`view-visitwithother`" class="form-label fw-medium text-body small mb-1">
                    Visit With (Other)
                  </label>
                  <InputText 
                    id="view-visitwithother" 
                    :modelValue="viewFormData.visitWithOther || '-'" 
                    readonly 
                    disabled 
                    class="w-100 p-inputtext-sm bg-light" 
                  />
                </div>
                <div>
                  <label :for="`view-useremail`" class="form-label fw-medium text-body small mb-1">
                    User Email
                  </label>
                  <InputText 
                    id="view-useremail" 
                    :modelValue="viewFormData.userEmail || '-'" 
                    readonly 
                    disabled 
                    class="w-100 p-inputtext-sm bg-light" 
                  />
                </div>
              </div>

              <!-- Toggle Switch for Active / Boolean fields -->
              <div v-else-if="getFieldType(col) === 'toggle'" class="d-flex align-items-center gap-3 pt-2">
                <ToggleSwitch :id="`view-${col}`" :modelValue="!!viewFormData[col]" disabled />
                <span class="small fw-semibold" :class="viewFormData[col] ? 'text-success' : 'text-secondary'">
                  {{ viewFormData[col] ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <!-- Agreement Checkbox in View Dialog -->
              <div v-else-if="getFieldType(col) === 'agreement_checkbox'" class="d-flex align-items-center gap-2 pt-2">
                <Checkbox 
                  :inputId="`view-${col}`" 
                  :modelValue="isAgreementChecked(viewFormData[col]) ? 'Yes, I Agree' : ''" 
                  :binary="true" 
                  trueValue="Yes, I Agree" 
                  falseValue="" 
                  disabled 
                />
                <label :for="`view-${col}`" class="form-check-label small fw-medium mb-0" :class="isAgreementChecked(viewFormData[col]) ? 'text-success' : 'text-secondary'">
                  {{ isAgreementChecked(viewFormData[col]) ? 'Yes, I Agree' : 'Not Agreed' }}
                </label>
              </div>

              <!-- DatePicker for Date Fields -->
              <DatePicker 
                v-else-if="getFieldType(col) === 'date'" 
                :id="`view-${col}`" 
                :modelValue="parseDateForPicker(viewFormData[col])" 
                showIcon 
                iconDisplay="input"
                fluid
                size="small"
                dateFormat="yy-mm-dd" 
                disabled
                class="w-100"
              />

              <!-- Coordinates in View Modal -->
              <div v-else-if="getFieldType(col) === 'coordinates'" class="d-flex flex-column gap-2 w-100">
                <CoordinatePicker v-if="viewFormData[col]" :model-value="viewFormData[col]" readonly height="220px" />
                <div class="d-flex align-items-center justify-content-between gap-2">
                  <InputText
                    :id="`view-${col}`"
                    :modelValue="viewFormData[col] || '-'"
                    readonly
                    disabled
                    class="w-100 p-inputtext-sm bg-light font-monospace"
                  />
                  <a
                    v-if="viewFormData[col]"
                    :href="`https://www.google.com/maps/dir/?api=1&destination=${String(viewFormData[col]).replace(/\\s/g, '')}`"
                    target="_blank"
                    rel="noopener"
                    class="btn btn-sm btn-outline-primary rounded-3 text-nowrap d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                    style="font-size: 0.75rem;"
                    title="Open in Google Maps"
                  >
                    <i class="pi pi-directions" style="font-size: 0.75rem;"></i>
                    <span>Maps</span>
                  </a>
                </div>
              </div>

              <!-- Image Upload (Preview in View Modal) -->
              <div v-else-if="getFieldType(col) === 'image_upload'" class="w-100">
                <ImageDropzone
                  :modelValue="viewFormData[col]"
                  :fieldId="`view-${col}`"
                  :label="formatLabel(col)"
                  disabled
                />
              </div>

              <!-- Textarea for Multiline Fields -->
              <Textarea 
                v-else-if="getFieldType(col) === 'textarea'" 
                :id="`view-${col}`" 
                :modelValue="viewFormData[col]" 
                :rows="(col.toLowerCase().includes('remark') || col.toLowerCase().includes('installationaddress')) && isApplicationEndpoint ? 4 : 3" 
                readonly
                disabled
                class="w-100 p-inputtext-sm bg-light" 
                :class="{ 'flex-grow-1': isApplicationEndpoint && (normalizeColKey(col) === 'remarks' || normalizeColKey(col) === 'installationaddress') }"
                :style="isApplicationEndpoint && (normalizeColKey(col) === 'remarks' || normalizeColKey(col) === 'installationaddress') ? 'min-height: 96px;' : ''"
              />

              <!-- Password for Password Fields in View Modal -->
              <InputText 
                v-else-if="col.toLowerCase() === 'password' || col.toLowerCase() === 'pass' || col.toLowerCase() === 'pwd'" 
                :id="`view-${col}`" 
                type="password"
                modelValue="••••••••" 
                readonly
                disabled
                class="w-100 p-inputtext-sm bg-light font-monospace" 
              />

              <!-- Phone / Mobile Field in View Modal -->
              <InputText 
                v-else-if="getFieldType(col) === 'phone'" 
                :id="`view-${col}`" 
                :modelValue="viewFormData[col]" 
                readonly
                disabled
                class="w-100 p-inputtext-sm bg-light font-monospace" 
              />

              <!-- InputText for Standard / Monospace Fields -->
              <InputText 
                v-else 
                :id="`view-${col}`" 
                :modelValue="formatViewFieldValue(col, viewFormData[col])" 
                readonly
                disabled
                class="w-100 p-inputtext-sm bg-light" 
                :class="{ 
                  'font-monospace text-uppercase': col.toLowerCase().includes('sn') || col.toLowerCase().includes('serial'),
                  'font-monospace': col.toLowerCase() === 'ip' || col.toLowerCase().includes('address')
                }"
              />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-between align-items-center w-100 mt-2">
          <Button
            v-if="!readOnly"
            label="Edit Record"
            icon="pi pi-pencil"
            class="p-button-outlined p-button-primary p-button-sm rounded-3 px-3"
            @click="displayViewDialog = false; openEditDialog(viewFormData)"
          />
          <span v-else></span>
          <Button 
            label="Close" 
            icon="pi pi-times" 
            class="p-button-secondary p-button-sm rounded-3 px-3" 
            @click="displayViewDialog = false" 
          />
        </div>
      </template>
    </Dialog>

    <!-- Edit Record Dialog -->
    <Dialog 
      v-model:visible="displayEditDialog" 
      modal 
      :header="editingRecordId ? `Update ${formatLabel(endpoint)} Record #${editingRecordId}` : `Update ${formatLabel(endpoint)} Record`" 
      :style="modalStyle"
      :breakpoints="modalBreakpoints"
    >
      <div v-if="editError" id="form-error-edit" class="alert alert-danger d-flex align-items-center rounded-3 p-2 mb-3 small">
        <i class="pi pi-exclamation-triangle me-2"></i> {{ editError }}
      </div>

      <div class="pe-2 mt-2" style="max-height: 72vh; overflow-y: auto;">
        <div 
          v-for="sec in formSections" 
          :key="sec.key" 
          class="card border rounded-3 p-3 mb-3 bg-body shadow-sm"
        >
          <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
            <h6 class="fw-bold mb-0 text-body d-flex align-items-center gap-2" :class="sec.badgeClass">
              <i :class="sec.icon"></i> {{ sec.title }}
            </h6>
            <span class="badge bg-secondary-subtle text-secondary border rounded-pill px-2 py-1 small fw-normal">
              {{ (sec.columns || []).length }} {{ (sec.columns || []).length === 1 ? 'field' : 'fields' }}
            </span>
          </div>

          <div class="row g-3">
            <div
              v-for="col in sec.columns"
              :key="col"
              :id="fieldWrapId('edit', col)"
              :class="[
                getColumnClass(col),
                {
                  'd-flex flex-column': isApplicationEndpoint && (normalizeColKey(col) === 'remarks' || normalizeColKey(col) === 'installationaddress'),
                  'field-invalid': hasFieldError('edit', col) || (normalizeColKey(col) === 'barangay1' && (hasFieldError('edit', 'barangay1') || hasFieldError('edit', 'barangay2'))) || (normalizeColKey(col) === 'visitwithother' && (hasFieldError('edit', 'visitWithOther') || hasFieldError('edit', 'userEmail')))
                }
              ]"
            >
              <label v-if="normalizeColKey(col) !== 'barangay1' && normalizeColKey(col) !== 'visitwithother'" :for="`edit-${col}`" class="form-label fw-medium text-body small mb-1">
                {{ formatLabel(col) }}
                <span v-if="isFieldRequired(col)" class="text-danger ms-1" title="Required">*</span>
                <span v-else-if="eitherOrHint(col)" class="badge bg-secondary-subtle text-secondary border rounded-pill ms-1 fw-normal" style="font-size: 0.65rem;">{{ eitherOrHint(col) }}</span>
              </label>

              <!-- Combined Barangay 1 & Barangay 2 Column in Edit Modal (Stacked) -->
              <div v-if="normalizeColKey(col) === 'barangay1'" class="d-flex flex-column gap-2">
                <div>
                  <label :for="`edit-barangay1`" class="form-label fw-medium text-body small mb-1">
                    Barangay 1
                    <span v-if="isFieldRequired('barangay1')" class="text-danger ms-1" title="Required">*</span>
                  </label>
                  <InputText 
                    id="edit-barangay1" 
                    v-model="editFormData.barangay1" 
                    class="w-100 p-inputtext-sm" 
                    placeholder="Enter barangay 1" 
                  />
                </div>
                <div>
                  <label :for="`edit-barangay2`" class="form-label fw-medium text-body small mb-1">
                    Barangay 2
                    <span v-if="isFieldRequired('barangay2')" class="text-danger ms-1" title="Required">*</span>
                  </label>
                  <InputText 
                    id="edit-barangay2" 
                    v-model="editFormData.barangay2" 
                    class="w-100 p-inputtext-sm" 
                    placeholder="Enter barangay 2" 
                  />
                </div>
              </div>

              <!-- Combined Visit With (Other) & User Email Column in Edit Modal (Stacked) -->
              <div v-else-if="normalizeColKey(col) === 'visitwithother'" class="d-flex flex-column gap-2">
                <div>
                  <label :for="`edit-visitwithother`" class="form-label fw-medium text-body small mb-1">
                    Visit With (Other)
                    <span v-if="isFieldRequired('visitWithOther')" class="text-danger ms-1" title="Required">*</span>
                  </label>
                  <InputText 
                    id="edit-visitwithother" 
                    v-model="editFormData.visitWithOther" 
                    class="w-100 p-inputtext-sm" 
                    placeholder="Enter visit with (other)" 
                  />
                </div>
                <div>
                  <label :for="`edit-useremail`" class="form-label fw-medium text-body small mb-1">
                    User Email
                    <span v-if="isFieldRequired('userEmail')" class="text-danger ms-1" title="Required">*</span>
                  </label>
                  <InputText 
                    id="edit-useremail" 
                    v-model="editFormData.userEmail" 
                    class="w-100 p-inputtext-sm" 
                    placeholder="Enter user email" 
                  />
                </div>
              </div>

              <!-- Toggle Switch for Active / Boolean fields -->
              <div v-else-if="getFieldType(col) === 'toggle'" class="d-flex align-items-center gap-3 pt-2">
                <ToggleSwitch :id="`edit-${col}`" v-model="editFormData[col]" />
                <span class="small fw-semibold" :class="editFormData[col] ? 'text-success' : 'text-secondary'">
                  {{ editFormData[col] ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <!-- Agreement Checkbox in Edit Dialog -->
              <div v-else-if="getFieldType(col) === 'agreement_checkbox'" class="d-flex align-items-center gap-2 pt-2">
                <Checkbox 
                  :inputId="`edit-${col}`" 
                  v-model="editFormData[col]" 
                  :binary="true" 
                  trueValue="Yes, I Agree" 
                  falseValue="" 
                />
                <label :for="`edit-${col}`" class="form-check-label small fw-medium mb-0 cursor-pointer user-select-none">
                  Yes, I Agree
                </label>
              </div>

              <!-- Access Level Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'accesslevel_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="accessLevels" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Access Level" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Menu Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'menu_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="menusList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Menu" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- LCNAP Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'lcpnap_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="lcpnapsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select LCNAP" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- LCNAP Port Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'lcpnapport_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="lcpnapportsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select LCNAP Port" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- LCP Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'lcp_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="lcpsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select LCP" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- NAP Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'nap_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="napsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select NAP" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Port Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'port_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="portsList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Port" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- VLAN Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'vlan_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="vlansList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select VLAN" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Plan Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'plan_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="getPlanOptions(col, editFormData[col])" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Desired Plan" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Referred By Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'referredby_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="getReferrerOptions(editFormData[col])" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Referrer" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Region Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'region_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="createRegionOptions" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                @change="onRegionChanged(editFormData)"
                placeholder="Select Region" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Province Dropdown -->
              <div v-else-if="getFieldType(col) === 'province_dropdown'" class="position-relative">
                <Select 
                  :id="`edit-${col}`" 
                  v-model="editFormData[col]" 
                  :options="createProvinceOptions" 
                  optionLabel="label" 
                  optionValue="value" 
                  :filter="true"
                  :disabled="isCityDisabled(editFormData)"
                  @change="onProvinceChanged(editFormData)"
                  placeholder="Select Province"
                  class="w-100 p-inputtext-sm"
                />
                <div 
                  v-if="isCityDisabled(editFormData)" 
                  class="position-absolute top-0 start-0 w-100 h-100" 
                  style="cursor: pointer; z-index: 2;" 
                  title="Please select Region first"
                  @click.stop="notifyAddressStep(editFormData, 'province', 'edit')"
                ></div>
                <div 
                  v-if="shouldShowAddressHint(editFormData, 'province', 'edit')" 
                  class="address-step-hint mt-1 d-flex align-items-center gap-1"
                >
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ getAddressStepBlocker(editFormData, 'province')?.summary }}</span>
                </div>
              </div>

              <!-- City / Municipality Dropdown -->
              <div v-else-if="getFieldType(col) === 'city_dropdown'" class="position-relative">
                <Select
                  :id="`edit-${col}`"
                  v-model="editFormData[col]"
                  :options="createCityOptions"
                  optionLabel="label"
                  optionValue="value"
                  :filter="true"
                  :disabled="isCityDisabled(editFormData)"
                  @change="onCityChanged(editFormData)"
                  :virtualScrollerOptions="{ itemSize: 38 }"
                  :placeholder="getCityPlaceholder(editFormData)"
                  class="w-100 p-inputtext-sm"
                />
                <div 
                  v-if="isCityDisabled(editFormData)" 
                  class="position-absolute top-0 start-0 w-100 h-100" 
                  style="cursor: pointer; z-index: 2;" 
                  title="Please select Region first"
                  @click.stop="notifyAddressStep(editFormData, 'city', 'edit')"
                ></div>
                <div 
                  v-if="shouldShowAddressHint(editFormData, 'city', 'edit')" 
                  class="address-step-hint mt-1 d-flex align-items-center gap-1"
                >
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ getAddressStepBlocker(editFormData, 'city')?.summary }}</span>
                </div>
              </div>

              <!-- Barangay Dropdown -->
              <div v-else-if="getFieldType(col) === 'barangay_dropdown'" class="position-relative">
                <Select
                  :id="`edit-${col}`"
                  v-model="editFormData[col]"
                  :options="createBarangayOptions"
                  optionLabel="label"
                  optionValue="value"
                  :filter="true"
                  :disabled="isBarangayDisabled(editFormData)"
                  :virtualScrollerOptions="{ itemSize: 38 }"
                  :placeholder="getBarangayPlaceholder(editFormData)"
                  class="w-100 p-inputtext-sm"
                />
                <div 
                  v-if="isBarangayDisabled(editFormData)" 
                  class="position-absolute top-0 start-0 w-100 h-100" 
                  style="cursor: pointer; z-index: 2;" 
                  title="Please select City first"
                  @click.stop="notifyAddressStep(editFormData, 'barangay', 'edit')"
                ></div>
                <div 
                  v-if="shouldShowAddressHint(editFormData, 'barangay', 'edit')" 
                  class="address-step-hint mt-1 d-flex align-items-center gap-1"
                >
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ getAddressStepBlocker(editFormData, 'barangay')?.summary }}</span>
                </div>
              </div>

              <!-- Status Dropdown -->
              <Select
                v-else-if="getFieldType(col) === 'status_dropdown'"
                :id="`edit-${col}`"
                v-model="editFormData[col]"
                :options="statusOptions"
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Status" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Onsite Status Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'onsitestatus_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="onsiteStatusOptions" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Onsite Status" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Billing Status Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'billingstatus_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="billingStatusOptions" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Billing Status" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Usage Type Dropdown -->
              <Select 
                v-else-if="getFieldType(col) === 'usagetype_dropdown'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :options="usageTypeOptions" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Usage Type" 
                class="w-100 p-inputtext-sm" 
              />

              <!-- Confirm Password Field -->
              <div v-else-if="getFieldType(col) === 'confirm_password'">
                <div class="position-relative w-100">
                  <input 
                    :id="`edit-${col}`"
                    :type="showPasswordState['edit_' + col] ? 'text' : 'password'"
                    v-model="editFormData[col]"
                    class="form-control form-control-sm pe-5"
                    :disabled="!userPermissions.canModifyPassword"
                    :class="{ 'is-invalid': passwordsMismatch('edit') }"
                    :placeholder="userPermissions.canModifyPassword ? 'Confirm password' : 'Password modification disabled'"
                  />
                  <button 
                    v-if="userPermissions.canUnmaskPassword"
                    type="button" 
                    class="btn btn-link position-absolute end-0 top-50 translate-middle-y me-1 p-1 text-secondary text-decoration-none shadow-none border-0 eye-toggle-btn" 
                    @click="showPasswordState['edit_' + col] = !showPasswordState['edit_' + col]"
                    :title="showPasswordState['edit_' + col] ? 'Hide password' : 'Show password'"
                    style="line-height: 1; z-index: 5;"
                  >
                    <i :class="['pi', showPasswordState['edit_' + col] ? 'pi-eye-slash' : 'pi-eye']" style="font-size: 0.9rem;"></i>
                  </button>
                </div>
                <div v-if="!userPermissions.canModifyPassword" class="text-muted small mt-1" style="font-size: 0.75rem;">
                  <i class="pi pi-lock me-1"></i> You do not have permission to modify passwords.
                </div>
                <div v-else-if="passwordsMismatch('edit')" class="text-danger small mt-1" style="font-size: 0.75rem;">
                  <i class="pi pi-exclamation-circle me-1"></i> Passwords do not match
                </div>
              </div>

              <!-- Password Field -->
              <div v-else-if="getFieldType(col) === 'password'">
                <div class="position-relative w-100">
                  <input 
                    :id="`edit-${col}`"
                    :type="showPasswordState['edit_' + col] ? 'text' : 'password'"
                    v-model="editFormData[col]"
                    class="form-control form-control-sm pe-5"
                    :disabled="!userPermissions.canModifyPassword"
                    :placeholder="userPermissions.canModifyPassword ? 'Enter password' : 'Password modification disabled'"
                  />
                  <button 
                    v-if="userPermissions.canUnmaskPassword"
                    type="button" 
                    class="btn btn-link position-absolute end-0 top-50 translate-middle-y me-1 p-1 text-secondary text-decoration-none shadow-none border-0 eye-toggle-btn" 
                    @click="showPasswordState['edit_' + col] = !showPasswordState['edit_' + col]"
                    :title="showPasswordState['edit_' + col] ? 'Hide password' : 'Show password'"
                    style="line-height: 1; z-index: 5;"
                  >
                    <i :class="['pi', showPasswordState['edit_' + col] ? 'pi-eye-slash' : 'pi-eye']" style="font-size: 0.9rem;"></i>
                  </button>
                </div>
                <div v-if="!userPermissions.canModifyPassword" class="text-muted small mt-1" style="font-size: 0.75rem;">
                  <i class="pi pi-lock me-1"></i> You do not have permission to modify passwords.
                </div>
              </div>

              <!-- Coordinate Picker -->
              <div v-else-if="getFieldType(col) === 'coordinates'" class="d-flex flex-column gap-2 w-100">
                <CoordinatePicker v-model="editFormData[col]" height="260px" />
                <div class="input-group input-group-sm">
                  <span class="input-group-text"><i class="pi pi-compass" style="font-size: 0.75rem;"></i></span>
                  <input
                    :id="`edit-${col}`"
                    v-model="editFormData[col]"
                    type="text"
                    class="form-control form-control-sm rounded-end-3 font-monospace"
                    :class="{ 'is-invalid': hasFieldError('edit', col) }"
                    placeholder="latitude, longitude (e.g. 14.474414, 121.196214)"
                  />
                </div>
              </div>

              <!-- Image Upload (Dropzone) -->
              <div v-else-if="getFieldType(col) === 'image_upload'" class="w-100">
                <ImageDropzone
                  v-model="editFormData[col]"
                  :fieldId="`edit-${col}`"
                  :label="formatLabel(col)"
                  :required="isFieldRequired(col)"
                  @exif="onPhotoExif('edit', col, $event)"
                />
              </div>

              <!-- DatePicker for Date Fields -->
              <DatePicker 
                v-else-if="getFieldType(col) === 'date'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                showIcon 
                iconDisplay="input"
                fluid
                size="small"
                dateFormat="yy-mm-dd" 
                placeholder="Select date" 
                class="w-100"
              />

              <!-- Email Input for Email Fields -->
              <InputText 
                v-else-if="getFieldType(col) === 'email'" 
                :id="`edit-${col}`" 
                type="email"
                v-model="editFormData[col]" 
                class="w-100 p-inputtext-sm" 
                :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
              />

              <!-- Phone / Mobile Input -->
              <InputText 
                v-else-if="getFieldType(col) === 'phone'" 
                :id="`edit-${col}`" 
                type="tel"
                v-model="editFormData[col]" 
                class="w-100 p-inputtext-sm font-monospace" 
                :class="{ 'p-invalid': hasFieldError('edit', col) }"
                placeholder="e.g. 09123456789 or +639123456789" 
              />

              <!-- InputNumber for Numeric Fields -->
              <InputNumber 
                v-else-if="getFieldType(col) === 'number'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                fluid
                size="small"
                class="w-100" 
                :useGrouping="false"
                :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
              />

              <!-- Textarea for Multiline Fields -->
              <Textarea 
                v-else-if="getFieldType(col) === 'textarea'" 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                :rows="(col.toLowerCase().includes('remark') || col.toLowerCase().includes('installationaddress')) && isApplicationEndpoint ? 4 : 3" 
                class="w-100 p-inputtext-sm" 
                :class="{ 'flex-grow-1': isApplicationEndpoint && (normalizeColKey(col) === 'remarks' || normalizeColKey(col) === 'installationaddress') }"
                :style="isApplicationEndpoint && (normalizeColKey(col) === 'remarks' || normalizeColKey(col) === 'installationaddress') ? 'min-height: 96px;' : ''"
                :placeholder="`Enter ${formatLabel(col).toLowerCase()}`" 
              />

              <!-- InputText for Standard / Monospace Fields -->
              <InputText 
                v-else 
                :id="`edit-${col}`" 
                v-model="editFormData[col]" 
                class="w-100 p-inputtext-sm" 
                :class="{ 
                  'font-monospace text-uppercase': col.toLowerCase().includes('sn') || col.toLowerCase().includes('serial'),
                  'font-monospace': col.toLowerCase() === 'ip' || col.toLowerCase().includes('address')
                }"
                :placeholder="`Enter ${formatLabel(col).toLowerCase()}`"
              />

              <div
                v-if="hasFieldError('edit', col)"
                class="field-error-hint mt-1 d-flex align-items-center gap-1"
              >
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ fieldErrorText('edit', col) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary p-button-sm rounded-3 px-3" @click="displayEditDialog = false" />
          <Button label="Save Changes" icon="pi pi-check" class="p-button-primary p-button-sm rounded-3 px-3.5 shadow-xs" @click="saveEdit" :loading="savingEdit" />
        </div>
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="displayDeleteDialog" 
      modal 
      header="Confirm Delete" 
      :style="{ width: '90vw', maxWidth: '450px' }"
    >
      <div v-if="deleteError" class="alert alert-danger d-flex align-items-center rounded-3 p-2 mb-3 small">
        <i class="pi pi-exclamation-triangle me-2"></i> {{ deleteError }}
      </div>

      <div class="d-flex align-items-center gap-3 py-2">
        <i class="pi pi-exclamation-triangle text-danger fs-1"></i>
        <div>
          <p class="mb-1 fw-medium text-body">Are you sure you want to delete this record?</p>
          <span class="small text-secondary" v-if="recordToDelete">
            Record ID: <strong>{{ recordToDelete.id }}</strong>
            <span v-if="recordToDelete.fname || recordToDelete.username"> ({{ recordToDelete.fname || recordToDelete.username }})</span>
          </span>
        </div>
      </div>

      <template #footer>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary p-button-sm rounded-3 px-3" @click="displayDeleteDialog = false" />
          <Button label="Delete Record" icon="pi pi-trash" class="p-button-danger p-button-sm rounded-3 px-3 shadow-xs" @click="deleteRecord" :loading="deleting" />
        </div>
      </template>
    </Dialog>

    <!-- Image Preview Lightbox Dialog for Table -->
    <Dialog
      v-model:visible="tableImagePreviewVisible"
      modal
      :header="tableImagePreviewTitle || 'Image Preview'"
      :style="{ width: '90vw', maxWidth: '600px' }"
      :closable="true"
    >
      <div class="text-center p-2">
        <img
          :src="tableImagePreviewUrl"
          alt="Full Image Preview"
          class="img-fluid rounded shadow-sm"
          style="max-height: 70vh; object-fit: contain;"
        />
        <ExifPanel v-if="tableImageExifVisible" :src="tableImagePreviewUrl" />
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 flex-wrap">
          <Button
            label="EXIF Info"
            icon="pi pi-info-circle"
            class="p-button-sm rounded-3 px-3"
            :class="tableImageExifVisible ? 'p-button-secondary' : 'p-button-outlined p-button-secondary'"
            @click="tableImageExifVisible = !tableImageExifVisible"
          />
          <Button
            label="Download"
            icon="pi pi-download"
            class="p-button-sm p-button-outlined p-button-secondary rounded-3 px-3"
            @click="downloadImage(tableImagePreviewUrl, tableImagePreviewTitle)"
          />
          <Button
            label="Open in New Tab"
            icon="pi pi-external-link"
            class="p-button-sm p-button-outlined p-button-secondary rounded-3 px-3"
            @click="openImageInNewTab(tableImagePreviewUrl)"
          />
          <Button label="Close" icon="pi pi-times" class="p-button-sm p-button-secondary rounded-3 px-3" @click="tableImagePreviewVisible = false" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, isRef, unref, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '../services/api'
import { RadiusUserService } from '../services/radiusUsers'
import phAddressService from '../services/phAddressService'
import defaultRegions from '../../public/data/philippines/regions.json'
import defaultProvinces from '../../public/data/philippines/provinces.json'
import ImageDropzone from './ImageDropzone.vue'
import CoordinatePicker from './CoordinatePicker.vue'
import ExifPanel from './ExifPanel.vue'
import { parseCoordinates } from '../services/lcpNapLocations'
import { reverseGeocode } from '../services/geocoding'
import { downloadImage, openImageInNewTab } from '../utils/imageActions'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import ToggleSwitch from 'primevue/toggleswitch'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Password from 'primevue/password'
import Menu from 'primevue/menu'
import Popover from 'primevue/popover'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { EndpointColumns } from '../models/columns'
import { resolveRequiredFields, resolveEitherOrGroups } from '../models/requiredFields'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/users'
import { useTheme } from '../composables/useTheme'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const toast = useToast()
const authStore = useAuthStore()
const userStore = useUserStore()
const { activeColorTheme, THEME_PALETTES } = useTheme()

const props = defineProps({
  endpoint: {
    type: String,
    required: true
  },
  filterEndpoint: {
    type: String,
    default: null
  },
  filterParams: {
    type: Object,
    default: () => ({})
  },
  hideCreateButton: {
    type: Boolean,
    default: false
  },
  // Browse-only surface: no Create, no per-row Edit / Delete, no Edit shortcut in
  // the View dialog. For endpoints that are read-only or whose records carry no
  // usable key to write back to.
  readOnly: {
    type: Boolean,
    default: false
  },
  // Set by parents that already expose their own status filter, so the toolbar
  // does not offer a second, redundant one.
  hideStatusFilter: {
    type: Boolean,
    default: false
  },
  // Resolve `filterParams.status` in the browser instead of sending it upstream.
  // The whole set stays loaded, which is what lets `statusCounts` report every
  // status at once (a server-filtered response only ever knows about its own), and
  // switching status then costs no request at all.
  clientStatusFilter: {
    type: Boolean,
    default: false
  },
  // Send `filterParams.fromDate` / `toDate` upstream instead of resolving them in
  // the browser. Requires a /filter endpoint that honors date bounds — the
  // Applications backend does since Aug 2026. Keeping this opt-in preserves the
  // client-side date behavior for endpoints whose /filter has not caught up.
  serverDateFilter: {
    type: Boolean,
    default: false
  },
  createButtonLabel: {
    type: String,
    default: 'Create'
  },
  selectedAccessLevel: {
    type: Object,
    default: null
  },
  defaultSortField: {
    type: String,
    default: 'id'
  },
  defaultSortOrder: {
    type: Number,
    default: null // null = auto-resolve: -1 (descending) for Applications, 1 (ascending) for other endpoints
  }
})

const emit = defineEmits(['row-select', 'row-unselect', 'reset-filters'])

// Filter-param keys that are resolved client-side rather than sent to the API.
const DATE_FILTER_PARAM_KEYS = ['fromDate', 'toDate']

// Lowercased row fields a date range is matched against, most specific first, so
// a record's own event date wins over the audit columns that trail behind it.
const DATE_FILTER_ROW_FIELDS = [
  'datetime',
  'applicationdate',
  'date',
  'timestamp',
  'createddate',
  'created_date',
  'createdat',
  'modifieddate'
]

// The subset of `filterParams` that actually reaches the API: blank values are
// dropped, and date bounds are stripped unless `serverDateFilter` opts them in
// (see fetchData).
const serverFilterParams = computed(() => {
  const out = {}
  Object.entries(props.filterParams || {}).forEach(([k, v]) => {
    if (!props.serverDateFilter && DATE_FILTER_PARAM_KEYS.includes(k)) return
    if (props.clientStatusFilter && k === 'status') return
    if (v === undefined || v === null || String(v).trim() === '') return
    out[k] = v
  })
  return out
})

// Everything that decides which request is issued. With client-side dates,
// changing date bounds alone leaves this untouched, so switching a date preset
// re-filters in place instead of firing a redundant request; with
// `serverDateFilter` the bounds are part of the request and a change refetches.
const fetchSourceKey = computed(() => {
  const p = serverFilterParams.value
  const serialized = Object.keys(p).sort().map(k => `${k}=${p[k]}`).join('&')
  return `${props.endpoint}|${props.filterEndpoint || ''}|${serialized}`
})

// Determine if the endpoint is Menus (for adding row toggle switch controls)
const isMenuEndpoint = computed(() => {
  const ep = (props.endpoint || '').toLowerCase()
  return ep === 'menus' || ep === 'menu'
})

const isApplicationEndpoint = computed(() => {
  const ep = (props.endpoint || '').trim().toLowerCase()
  return ep === 'applications' || ep === 'application'
})

const isLcpNapEndpoint = computed(() => {
  const ep = (props.endpoint || '').trim().toLowerCase()
  return (
    ep === 'lcpnaplocations' ||
    ep === 'lcpnaplocation' ||
    ep === 'lcp_nap_locations' ||
    ep === 'lcp_nap_location'
  )
})

// Determine if the endpoint needs a wider 3-column modal (Applications, Job Orders,
// Billing Details & LCP NAP Locations — the field-heavy forms) or the standard 2-column modal
const isWideForm = computed(() => {
  const ep = (props.endpoint || '').toLowerCase()
  return (
    ep === 'joborders' ||
    ep === 'billingdetails' ||
    ep === 'job_order' ||
    ep === 'billing' ||
    ep === 'applications' ||
    ep === 'application' ||
    ep === 'lcpnaplocations' ||
    ep === 'lcpnaplocation' ||
    ep === 'lcp_nap_locations' ||
    ep === 'lcp_nap_location'
  )
})

const isStringAuditEndpoint = computed(() => {
  const ep = (props.endpoint || '').toLowerCase()
  return (
    ep === 'plans' ||
    ep === 'plan' ||
    ep === 'applications' ||
    ep === 'application' ||
    ep === 'billingdetails' ||
    ep === 'billingdetail' ||
    ep === 'joborders' ||
    ep === 'joborder' ||
    ep === 'invoices' ||
    ep === 'invoice' ||
    ep === 'billingstatus'
  )
})

const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')

// A read-only table offers no way in to the create form, whatever the parent asked
// for with hide-create-button.
const showCreateButton = computed(() => !props.hideCreateButton && !props.readOnly)

const modalStyle = computed(() => {
  if (isWideForm.value) {
    return { width: '95vw', maxWidth: '1200px' }
  }
  return { width: '90vw', maxWidth: '850px' }
})

const modalBreakpoints = computed(() => {
  if (isWideForm.value) {
    return { '1200px': '95vw', '960px': '98vw', '640px': '100vw' }
  }
  return { '960px': '95vw', '640px': '100vw' }
})

const getColumnClass = (col) => {
  const type = getFieldType(col)
  const lower = (col || '').toLowerCase().replace(/_/g, '')
  if (lower === 'installationaddress' || lower === 'remarks' || lower === 'remark') {
    return 'col-12 col-md-12 col-lg-8'
  }
  if (type === 'coordinates') {
    return 'col-12'
  }
  // Wide (3-column) forms keep every field on the same one-third track.
  // Image dropzones divide equally across 3 columns on tablet & desktop.
  if (isWideForm.value) {
    if (type === 'image_upload') {
      return 'col-12 col-md-4 col-lg-4'
    }
    return 'col-12 col-md-6 col-lg-4'
  }
  return (type === 'textarea' || type === 'image_upload') ? 'col-12' : 'col-12 col-md-6'
}

const data = ref([])
const selectedRow = ref(null)
const loading = ref(true)
const refreshing = ref(false)
// Stays false until a request has actually settled, so the "no records" panel can
// never be shown on the strength of an empty initial / cleared dataset alone
const hasFetched = ref(false)
// The server params of the fetch that produced `data`, so a parent can tell what
// scope the loaded rows actually cover (e.g. whether a status narrowed them)
// without racing the request that a filter change is about to trigger
const lastFetchedParams = ref(null)
const error = ref(null)
const dt = ref()

const tableImagePreviewVisible = ref(false)
const tableImagePreviewUrl = ref('')
const tableImagePreviewTitle = ref('')
const tableImageExifVisible = ref(false)

const openImagePreview = (url, title = 'Image Preview') => {
  tableImagePreviewUrl.value = url
  tableImagePreviewTitle.value = title
  tableImageExifVisible.value = false
  tableImagePreviewVisible.value = true
}

// Format camelCase and underscore properties into human-readable Title Case
function formatLabel(col) {
  if (!col) return ''

  // An application carries both `emailAddress` (the applicant's) and `userEmail`
  // (the account that recorded it). The shared override below renders userEmail as
  // "Email Address", which would print the same label twice in one form, so this
  // endpoint gets the literal field name instead.
  if (isApplicationEndpoint.value && normalizeColKey(col) === 'useremail') {
    return 'User Email'
  }

  // The RadiusUser `disabled` flag is shown as Enabled / Disabled, so the raw field
  // name as a header reads as a contradiction: "Disabled: Enabled".
  if (isRadiusUserEndpoint.value && normalizeColKey(col) === 'disabled') {
    return 'Account State'
  }

  const customOverrides = {
    fname: 'First Name',
    mname: 'Middle Name',
    lname: 'Last Name',
    contactnumber: 'Contact Number',
    accountno: 'Account No.',
    fullname: 'Full Name',
    accountbalance: 'Account Balance',
    duedate: 'Due Date',
    accesslevel_id: 'Access Level',
    accesslevelid: 'Access Level',
    menu_id: 'Menu',
    menuid: 'Menu',
    lcpnap_id: 'LCNAP',
    lcpnapid: 'LCNAP',
    port_id: 'Port',
    portid: 'Port',
    lcp_id: 'LCP',
    lcpid: 'LCP',
    nap_id: 'NAP',
    napid: 'NAP',
    vlan_id: 'VLAN',
    vlanid: 'VLAN',
    plan_id: 'Plan',
    planid: 'Plan',
    confirmpassword: 'Confirm Password',
    email: 'Email',
    useremail: 'Email Address',
    rowversion: 'Row Version',
    desiredplan: 'Desired Plan',
    referredby: 'Referred By',
    barangay1: 'Barangay 1',
    barangay2: 'Barangay 2',
    termsandconditionsagreement: 'Terms & Conditions Agreement',
    termsandconditions: 'Terms & Conditions',
    termsagreement: 'Terms Agreement',
    agreement: 'Agreement',
    firstnearestlandmark: '1st Nearest Landmark',
    secondnearestlandmark: '2nd Nearest Landmark',
    referrersaccountnumber: "Referrer's Account Number",
    secondgovernmentvalidid: '2nd Government ID',
    governmentvalidid: 'Primary Government ID',
    housefrontpicture: 'House Front Picture',
    documentpicture: 'Additional Supporting Document',
    proofofbilling: 'Proof of Billing',
    applyingfor: 'Applying For',
    visitwithother: 'Visit With (Other)',
    pictureofstatmentbillingfromotherprovider: 'Picture of Statement Billing From Other Provider',
    pictureofstatementbillingfromotherprovider: 'Picture of Statement Billing From Other Provider'
  }
  if (customOverrides[col.toLowerCase()]) {
    return customOverrides[col.toLowerCase()]
  }

  const acronyms = {
    id: 'ID',
    lcp: 'LCP',
    nap: 'NAP',
    lcnap: 'LCNAP',
    vlan: 'VLAN',
    sn: 'SN',
    ip: 'IP',
    jo: 'JO',
    splynx: 'Splynx',
    mikrotik: 'Mikrotik'
  }
  
  const words = col
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
  
  return words
    .map(word => {
      const lower = word.toLowerCase()
      if (acronyms[lower]) return acronyms[lower]
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

// Classify field types for smart form rendering
// Some columns end in "Id" without being a numeric key: governmentValidId and
// secondGovernmentValidId hold the URL of a scanned document. Treating those as
// numbers rendered an InputNumber showing NaN and wrote that over the stored
// link on save, so they are kept out of the numeric heuristic.
const NON_NUMERIC_ID_HINTS = ['valid', 'picture', 'photo', 'image', 'document', 'file', 'url', 'attachment', 'proof']

function isNonNumericIdField(lower) {
  return NON_NUMERIC_ID_HINTS.some(hint => lower.includes(hint))
}

const isAgreementChecked = (val) => {
  if (val === true || val === 'true') return true
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase()
    return trimmed === 'yes, i agree' || trimmed === 'agreed' || trimmed === 'yes' || trimmed === 'true' || trimmed === '1'
  }
  return false
}

const normalizeAgreementValue = (val) => {
  if (val === true || val === 'true') return 'Yes, I Agree'
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed && trimmed.toLowerCase() !== 'false' && trimmed.toLowerCase() !== 'no' && trimmed.toLowerCase() !== '0') {
      return 'Yes, I Agree'
    }
  }
  return ''
}

const parseDateForPicker = (val) => {
  if (!val) return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

const getRowCoordinateValue = (row, col) => {
  if (!row) return null
  if (col && row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== '') {
    return String(row[col]).trim()
  }
  const fallback = row.coordinates || row.coordinate || row.addressCoordinates || row.address_coordinates || row.gpsCoordinates || row.gps || null
  return fallback ? String(fallback).trim() : null
}

function getFieldType(col) {
  if (!col) return 'text'
  const lower = col.toLowerCase().replace(/_/g, '')

  // Image / Picture upload fields (Government Valid ID, Second Government Valid ID, House Front Picture, Document Picture, Picture of Statement Billing From Other Provider, etc.)
  if (
    lower.includes('picture') ||
    lower.includes('photo') ||
    lower.includes('validid') ||
    lower.includes('governmentvalidid') ||
    lower.includes('housefront') ||
    lower.includes('documentpicture') ||
    lower.includes('proofofbilling') ||
    lower.includes('statementbilling') ||
    lower.includes('statementofbilling') ||
    lower.includes('statementofaccount') ||
    lower.includes('billingstatement') ||
    (lower.includes('statement') && (lower.includes('provider') || lower.includes('billing') || lower.includes('picture') || lower.includes('image') || lower.includes('proof') || lower.includes('doc'))) ||
    (lower.includes('billing') && (lower.includes('provider') || lower.includes('picture') || lower.includes('photo') || lower.includes('image') || lower.includes('proof') || lower.includes('attachment') || lower.includes('statement') || lower.includes('doc'))) ||
    (lower.includes('image') && !lower.includes('duration')) ||
    lower.includes('signature') ||
    lower.startsWith('attachment')
  ) {
    return 'image_upload'
  }

  if (
    lower === 'coordinates' ||
    lower === 'coordinate' ||
    lower === 'addresscoordinates' ||
    lower === 'address_coordinates' ||
    lower === 'gps' ||
    lower === 'gpscoordinates' ||
    lower === 'gps_coordinates' ||
    lower === 'latlng' ||
    lower === 'lat_lng' ||
    lower.includes('coordinate') ||
    lower.includes('coords')
  ) {
    return 'coordinates'
  }

  if (lower.includes('email')) {
    return 'email'
  }
  if (
    lower === 'mobilenumber' ||
    lower === 'secondarymobilenumber' ||
    lower === 'contactnumber' ||
    lower === 'cellphonenumber' ||
    lower === 'phonenumber' ||
    lower === 'phone' ||
    lower === 'mobile' ||
    lower === 'cellphone' ||
    lower === 'contact_number' ||
    lower === 'mobile_number' ||
    lower === 'phone_number' ||
    (lower.includes('mobile') && lower.includes('number')) ||
    (lower.includes('contact') && lower.includes('number')) ||
    (lower.includes('phone') && lower.includes('number'))
  ) {
    return 'phone'
  }
  if (lower === 'confirmpassword' || lower === 'confirm_password') {
    return 'confirm_password'
  }
  if (lower === 'active' || lower === 'isactive' || lower === 'enabled') {
    return 'toggle'
  }
  if (
    lower === 'termsandconditionsagreement' ||
    lower === 'termsandconditions' ||
    lower === 'termsagreement' ||
    lower.includes('termsandconditions') ||
    (lower.includes('agreement') && !lower.includes('id'))
  ) {
    return 'agreement_checkbox'
  }
  if (lower === 'accesslevel_id' || lower === 'accesslevelid') {
    return 'accesslevel_dropdown'
  }
  if (lower === 'menu_id' || lower === 'menuid') {
    return 'menu_dropdown'
  }
  if (lower === 'lcpnap_id' || lower === 'lcpnapid' || lower === 'lcnap_id' || lower === 'lcnapid' || lower === 'lcpnap' || lower === 'lcnap' || lower === 'lcp_nap') {
    return 'lcpnap_dropdown'
  }
  if (lower === 'lcpnapport_id' || lower === 'lcpnapportid' || lower === 'lcnapport_id' || lower === 'lcnap_port' || lower === 'lcpnapport' || lower === 'lcnapport' || lower === 'lcp_nap_port') {
    return 'lcpnapport_dropdown'
  }
  if (lower === 'lcp_id' || lower === 'lcpid' || lower === 'lcp') {
    return 'lcp_dropdown'
  }
  if (lower === 'nap_id' || lower === 'napid' || lower === 'nap') {
    return 'nap_dropdown'
  }
  if (lower === 'port_id' || lower === 'portid' || lower === 'port') {
    return 'port_dropdown'
  }
  if (lower === 'vlan_id' || lower === 'vlanid' || lower === 'vlan') {
    return 'vlan_dropdown'
  }
  if (lower === 'plan_id' || lower === 'planid' || lower === 'choose_plan' || lower === 'chooseplan' || lower === 'plan' || lower === 'desiredplan' || lower === 'desired_plan') {
    return 'plan_dropdown'
  }
  if (lower === 'referredby' || lower === 'referred_by') {
    return 'referredby_dropdown'
  }
  if (lower === 'region' || lower === 'regionname' || lower === 'region_name') {
    return 'region_dropdown'
  }
  if (lower === 'province' || lower === 'provincename' || lower === 'province_name') {
    return 'province_dropdown'
  }
  if (lower === 'city' || lower === 'cityname' || lower === 'city_name' || lower === 'municipality') {
    return 'city_dropdown'
  }
  if (lower === 'barangay' || lower === 'barangayname' || lower === 'brgy') {
    return 'barangay_dropdown'
  }
  if (lower === 'status') {
    return 'status_dropdown'
  }
  if (lower === 'onsitestatus') {
    return 'onsitestatus_dropdown'
  }
  if (lower === 'billingstatus') {
    return 'billingstatus_dropdown'
  }
  if (lower === 'usagetype') {
    return 'usagetype_dropdown'
  }
  if (lower.includes('password') || lower === 'pass' || lower === 'pwd') {
    return 'password'
  }
  // Date / Timestamp fields
  if (
    lower.includes('date') ||
    lower.includes('timestamp')
  ) {
    return 'date'
  }
  // Numeric fields
  if (
    lower.includes('amount') ||
    lower.includes('fee') ||
    lower.includes('quantity') ||
    lower.includes('balance') ||
    lower.includes('day') ||
    (lower.includes('id') && (lower.endsWith('id') || lower.startsWith('id')) && !lower.includes('accesslevel') && !lower.includes('lcp') && !lower.includes('nap') && !lower.includes('port') && !lower.includes('vlan') && !lower.includes('plan') && !isNonNumericIdField(lower)) ||
    lower === 'splynxid' ||
    lower === 'mikrotikid' ||
    lower === 'duration'
  ) {
    return 'number'
  }
  // Multiline text fields
  if (
    lower.includes('description') ||
    lower.includes('remark') ||
    (lower.includes('address') && !lower.includes('email')) ||
    lower.includes('landmark') ||
    lower.includes('template')
  ) {
    return 'textarea'
  }
  return 'text'
}

// Filter out redundant alias duplicate keys (e.g. preferred_Day if preferredDay exists, verified_By if verifiedBy exists, EF Core navigation objects, paired ID vs string fields)
function deduplicateColumns(colList) {
  if (!Array.isArray(colList)) return []
  const normalizedSet = new Set()
  const result = []
  const aliasMap = {
    'preferred_day': 'preferredday',
    'verified_by': 'verifiedby',
    'applicationidvalue': 'applicationid'
  }

  const lowerCols = colList.map(c => c.toLowerCase())

  colList.forEach(col => {
    const lowerNoUnderscore = col.toLowerCase().replace(/_/g, '')
    const lowerRaw = col.toLowerCase()
    
    // Omit redundant duplicate string fields if their primary ID field exists in the array
    if (lowerRaw === 'lcp' && lowerCols.includes('lcpid')) return
    if (lowerRaw === 'nap' && lowerCols.includes('napid')) return
    if (lowerRaw === 'port' && lowerCols.includes('portid')) return
    if (lowerRaw === 'vlan' && lowerCols.includes('vlanid')) return
    if (lowerRaw === 'lcnap' && lowerCols.includes('lcpnapid')) return
    if (lowerRaw === 'lcpnapport' && lowerCols.includes('lcpnapportid')) return
    if (lowerRaw === 'plan' && lowerCols.includes('planid')) return
    if (lowerRaw === 'choose_plan' && lowerCols.includes('planid')) return

    if (aliasMap[lowerRaw]) {
      const primaryKeyLower = aliasMap[lowerRaw]
      if (colList.some(c => c.toLowerCase().replace(/_/g, '') === primaryKeyLower && c !== col)) {
        return // Skip redundant alias
      }
    }

    if (lowerRaw.endsWith('navigation')) {
      return // Skip redundant EF Core navigation object properties
    }

    if (!normalizedSet.has(lowerNoUnderscore)) {
      normalizedSet.add(lowerNoUnderscore)
      result.push(col)
    }
  })
  return result
}

// Dynamically generate column headers from the first object in the array,
// or fallback to the static mapping if the table is empty.
const allRawColumns = computed(() => {
  let rawCols = []
  if (data.value && data.value.length > 0) {
    rawCols = Object.keys(data.value[0])
  } else {
    rawCols = [...(EndpointColumns[props.endpoint] || [])]
  }

  // Deduplicate redundant columns & alias keys
  rawCols = deduplicateColumns(rawCols)

  // Ensure 'id' or 'ID' or 'Id' is placed as the very first column if present
  const idIndex = rawCols.findIndex(c => c.toLowerCase() === 'id')
  if (idIndex > 0) {
    const [idCol] = rawCols.splice(idIndex, 1)
    rawCols.unshift(idCol)
  }

  return rawCols
})

// Check if a field is a Created, Modified, or RowVersion audit field
function isCreatedOrModifiedField(col) {
  if (!col) return false
  const lower = col.toLowerCase().replace(/_/g, '')
  return (
    lower.includes('created') ||
    lower.includes('modified') ||
    lower.includes('updated') ||
    lower.includes('rowversion') ||
    lower.includes('version')
  )
}

const isStatusColumn = (col) => {
  if (!col) return false
  const lower = col.toLowerCase()
  return lower === 'status' || lower.includes('status') || lower === 'active' || lower === 'disabled'
}

// Concise column presets for complex endpoints with many fields (e.g. Job Orders).
// Only the listed fields become table columns; every other field is still shown in
// the View Details modal, which builds its own list from the full record.
const APPLICATION_COLUMNS = [
  'id',
  // Status sits directly after the id so it lands in the first screenful and is
  // covered by the left-pinning below, keeping it readable on narrow viewports.
  'status',
  // The API returns `dateTime`; `timestamp` is the name used by the static
  // fallback list, so match either depending on which one the payload carries.
  'dateTime',
  'timestamp',
  'firstName',
  'lastName',
  'mobileNumber',
  'emailAddress',
  'city',
  'barangay',
  'installationAddress',
  'desiredPlan',
  'applyingFor'
]

const RADIUS_USER_COLUMNS = [
  'disabled',
  'group',
  'name'
]

const BILLING_DETAILS_COLUMNS = [
  'id',
  'accountNo',
  'status',
  'fullName',
  'contactNumber',
  'plan',
  'accountBalance',
  'billingDay',
  'billingStatus',
  'city',
  'username',
  'dateInstalled'
]

const CONCISE_ENDPOINT_COLUMNS = {
  Applications: APPLICATION_COLUMNS,
  applications: APPLICATION_COLUMNS,
  RadiusUser: RADIUS_USER_COLUMNS,
  radiususer: RADIUS_USER_COLUMNS,
  RadiusUsers: RADIUS_USER_COLUMNS,
  BillingDetails: BILLING_DETAILS_COLUMNS,
  billingdetails: BILLING_DETAILS_COLUMNS,
  Billing: BILLING_DETAILS_COLUMNS,
  billing: BILLING_DETAILS_COLUMNS,
  JobOrders: [
    'id',
    'accountNo',
    'firstName',
    'lastName',
    'contactNumber',
    'address',
    'city',
    'planId',
    'status',
    'onsiteStatus',
    'billingStatus',
    'dateInstalled'
  ],
  job_order: [
    'id',
    'accountNo',
    'firstName',
    'lastName',
    'contactNumber',
    'address',
    'city',
    'planId',
    'status',
    'onsiteStatus',
    'billingStatus',
    'dateInstalled'
  ],
  joborders: [
    'id',
    'accountNo',
    'firstName',
    'lastName',
    'contactNumber',
    'address',
    'city',
    'planId',
    'status',
    'onsiteStatus',
    'billingStatus',
    'dateInstalled'
  ],
  LCPNapLocations: [
    'id',
    'lcpnap',
    'lcp',
    'nap',
    'portTotal',
    'coordinates',
    'street',
    'barangay',
    'city',
    'region'
  ],
  LcpNapLocations: [
    'id',
    'lcpnap',
    'lcp',
    'nap',
    'portTotal',
    'coordinates',
    'street',
    'barangay',
    'city',
    'region'
  ],
  lcpnaplocations: [
    'id',
    'lcpnap',
    'lcp',
    'nap',
    'portTotal',
    'coordinates',
    'street',
    'barangay',
    'city',
    'region'
  ]
}

// Columns for the main DataTable (filters out Created, Modified & sensitive Password fields)
const columns = computed(() => {
  const epKey = (props.endpoint || '').trim()
  const conciseCols = CONCISE_ENDPOINT_COLUMNS[epKey] || CONCISE_ENDPOINT_COLUMNS[epKey.toLowerCase()]
  
  let colList = allRawColumns.value
  if (conciseCols && Array.isArray(conciseCols)) {
    const rawMap = new Map()
    allRawColumns.value.forEach(c => {
      rawMap.set(c.toLowerCase().replace(/_/g, ''), c)
    })

    const matchedList = []
    conciseCols.forEach(col => {
      const normKey = col.toLowerCase().replace(/_/g, '')
      if (rawMap.has(normKey)) {
        matchedList.push(rawMap.get(normKey))
      } else if (normKey === 'coordinates' && rawMap.has('addresscoordinates')) {
        matchedList.push(rawMap.get('addresscoordinates'))
      } else if (normKey === 'addresscoordinates' && rawMap.has('coordinates')) {
        matchedList.push(rawMap.get('coordinates'))
      } else if (normKey === 'coordinates' && rawMap.has('coordinate')) {
        matchedList.push(rawMap.get('coordinate'))
      }
    })
    if (matchedList.length > 0) colList = matchedList
  }

  return colList.filter(col => {
    if (isCreatedOrModifiedField(col)) return false
    const lower = col.toLowerCase()
    if (lower === 'password' || lower === 'pass' || lower === 'pwd') return false

    // Omit address column specifically for Users table list
    const epLower = epKey.toLowerCase()
    if ((epLower === 'users' || epLower === 'user') && lower === 'address') return false

    return true
  })
})

function isAuditField(col) {
  if (!col) return false
  const lower = col.toLowerCase()
  return (
    lower === 'id' ||
    isCreatedOrModifiedField(col) ||
    lower.includes('rowversion') || lower === 'rowversion'
  )
}

const exportMenu = ref(null)
const columnPopover = ref(null)
const density = ref('default') // 'compact' | 'default' | 'comfortable'
const visibleColumns = ref([])
const selectedStatusFilter = ref('')
const firstRowIndex = ref(0)

const rowsPerPage = ref(50)
const rowOptions = ref([5, 10, 20, 50, 100])

const route = useRoute()
const initialQuerySearch = route?.query?.search || route?.query?.q || null

const filters = ref({
  global: { value: initialQuerySearch ? String(initialQuerySearch).trim() : null, matchMode: 'contains' }
})

watch(() => route?.query?.search || route?.query?.q, (newSearch) => {
  if (newSearch !== undefined) {
    filters.value.global.value = String(newSearch || '').trim() || null
  }
})

const densityClass = computed(() => `density-${density.value}`)
const densityLabel = computed(() => {
  if (density.value === 'compact') return 'Compact (Dense)'
  if (density.value === 'comfortable') return 'Comfortable (Spacious)'
  return 'Default'
})
const densityIcon = computed(() => {
  if (density.value === 'compact') return 'pi pi-align-justify'
  if (density.value === 'comfortable') return 'pi pi-bars'
  return 'pi pi-list'
})
const tableSize = computed(() => {
  if (density.value === 'compact') return 'small'
  if (density.value === 'comfortable') return 'large'
  return 'small'
})

const toggleDensity = () => {
  if (density.value === 'default') density.value = 'compact'
  else if (density.value === 'compact') density.value = 'comfortable'
  else density.value = 'default'
}

const toggleExportMenu = (event) => {
  if (exportMenu.value) {
    exportMenu.value.toggle(event)
  }
}

const toggleColumnPicker = (event) => {
  if (columnPopover.value) {
    columnPopover.value.toggle(event)
  }
}

const resetColumns = () => {
  visibleColumns.value = [...columns.value]
}

const toggleColumnVisibility = (col) => {
  const idx = visibleColumns.value.indexOf(col)
  if (idx > -1) {
    if (visibleColumns.value.length > 1) {
      visibleColumns.value.splice(idx, 1)
    }
  } else {
    visibleColumns.value.push(col)
  }
}

// Watch columns and maintain visibleColumns
watch(columns, (newCols) => {
  if (Array.isArray(newCols) && newCols.length > 0) {
    if (visibleColumns.value.length === 0) {
      visibleColumns.value = [...newCols]
    } else {
      const valid = visibleColumns.value.filter(c => newCols.includes(c))
      visibleColumns.value = valid.length > 0 ? valid : [...newCols]
    }
  }
}, { immediate: true })

const displayedColumns = computed(() => {
  if (!Array.isArray(columns.value)) return []
  if (visibleColumns.value.length === 0) return columns.value
  return columns.value.filter(col => visibleColumns.value.includes(col))
})

// Columns pinned to the left edge so they survive horizontal scrolling on a narrow
// viewport. Only the leading run of pinnable columns qualifies: PrimeVue offsets a
// frozen column by the width of the frozen columns before it, so a gap in the run
// would leave the later column overlapping whatever scrolls beneath it. The run is
// pinned only when it actually reaches the status column, since pinning the id on
// its own just costs horizontal space.
const PINNABLE_LEADING_COLUMNS = ['id', 'status']

const leftFrozenColumns = computed(() => {
  const run = []
  for (const col of displayedColumns.value) {
    if (!PINNABLE_LEADING_COLUMNS.includes(col.toLowerCase())) break
    run.push(col)
  }
  return run.some(c => c.toLowerCase() === 'status') ? run : []
})

const isLeftFrozenColumn = (col) => leftFrozenColumns.value.includes(col)

const hasActiveColumn = computed(() => {
  return (columns.value || []).some(c => {
    const l = c.toLowerCase()
    return l === 'active' || l === 'isactive' || l === 'enabled'
  })
})

const hasStatusColumn = computed(() => {
  return (columns.value || []).some(c => c.toLowerCase().includes('status'))
})

const hasStatusFilter = computed(() => {
  if (props.hideStatusFilter) return false
  return hasActiveColumn.value || hasStatusColumn.value
})

const statusFilterOptions = computed(() => {
  if (hasActiveColumn.value) {
    return [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]
  }
  if (hasStatusColumn.value) {
    const rawStatuses = new Set()
    ;(data.value || []).forEach(row => {
      const col = columns.value.find(c => c.toLowerCase().includes('status'))
      if (col && row[col] !== null && row[col] !== undefined && row[col] !== '') {
        rawStatuses.add(String(row[col]))
      }
    })
    if (rawStatuses.size > 0) {
      return Array.from(rawStatuses).map(s => ({ label: s, value: s }))
    }
    return statusOptions.value
  }
  return []
})

const rowStatusOf = (row) => String(row?.status ?? row?.Status ?? '').trim()

// Rows with no recognisable date field are kept: an unknown date is not evidence
// that the row falls outside the range.
const isRowInDateRange = (row, from, to) => {
  if (!from && !to) return true
  const dateKey = DATE_FILTER_ROW_FIELDS
    .map(pref => Object.keys(row).find(k => k.toLowerCase() === pref))
    .find(k => k && row[k])
  if (!dateKey || !row[dateKey]) return true
  const rowTime = new Date(row[dateKey]).getTime()
  if (isNaN(rowTime)) return true
  if (from && rowTime < from) return false
  if (to && rowTime > to) return false
  return true
}

const filteredData = computed(() => {
  if (!Array.isArray(data.value)) return []
  let list = data.value

  // Status Filter
  if (selectedStatusFilter.value) {
    const filterVal = selectedStatusFilter.value.toLowerCase()
    list = list.filter(row => {
      if (hasActiveColumn.value) {
        const activeCol = columns.value.find(c => {
          const l = c.toLowerCase()
          return l === 'active' || l === 'isactive' || l === 'enabled'
        })
        if (activeCol) {
          const rowVal = row[activeCol]
          if (filterVal === 'active') return rowVal === true || rowVal === 'true' || rowVal === 1
          if (filterVal === 'inactive') return rowVal === false || rowVal === 'false' || rowVal === 0 || rowVal === null
        }
      }
      if (hasStatusColumn.value) {
        const statusCol = columns.value.find(c => c.toLowerCase().includes('status'))
        if (statusCol) {
          return String(row[statusCol] || '').toLowerCase() === filterVal
        }
      }
      return true
    })
  }

  // Connection Filter (RadiusUser) — resolved from the row group, same as the toggle
  if (isRadiusUserEndpoint.value && connectionFilter.value) {
    const wantConnected = connectionFilter.value === 'connected'
    list = list.filter(row => isRowConnected(row) === wantConnected)
  }

  // Client-side FilterParams Status & Date/Timestamp Filtering
  if (props.filterParams && typeof props.filterParams === 'object') {
    const pStatus = props.filterParams.status ? String(props.filterParams.status).trim().toLowerCase() : ''
    const pFrom = props.filterParams.fromDate ? new Date(props.filterParams.fromDate).getTime() : null
    const pTo = props.filterParams.toDate ? new Date(props.filterParams.toDate).getTime() : null

    if (pStatus) {
      list = list.filter(row => {
        const rowStatus = rowStatusOf(row).toLowerCase()
        // When the status never went to the server this filter is the only thing
        // narrowing the set, so it has to be exact — letting blank-status rows
        // through would show them under every status and make the tab counts
        // sum past the total. Server-filtered responses keep the older leniency.
        if (props.clientStatusFilter) return rowStatus === pStatus
        return !rowStatus || rowStatus === pStatus
      })
    }

    // With `serverDateFilter` the response is already date-bounded, and the
    // server's timezone handling is authoritative — re-filtering here could
    // drop edge-of-day rows the backend intentionally included.
    if ((pFrom || pTo) && !props.serverDateFilter) {
      list = list.filter(row => isRowInDateRange(row, pFrom, pTo))
    }
  }

  // Global Search Filter
  const q = (filters.value.global?.value || '').trim().toLowerCase()
  if (q) {
    list = list.filter(row => {
      return columns.value.some(col => {
        const val = row[col]
        if (val === null || val === undefined) return false
        if (typeof val === 'object') {
          return Object.values(val).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
        }
        return String(val).toLowerCase().includes(q)
      })
    })
  }

  return list
})

const filteredRecordsCount = computed(() => (filteredData.value || []).length)

// Row counts per status for a parent that renders its own status tabs. Every other
// active scope is applied (the date range in particular) but the status filter
// itself is not, so each number answers "how many rows would that tab show". Only
// meaningful while the loaded set spans every status — i.e. `clientStatusFilter`,
// or a server fetch made without a status param; a status-filtered response only
// ever contains one status, so parents cache the counts from their "all" fetch.
const statusCounts = computed(() => {
  const rows = Array.isArray(data.value) ? data.value : []
  const from = props.filterParams?.fromDate ? new Date(props.filterParams.fromDate).getTime() : null
  const to = props.filterParams?.toDate ? new Date(props.filterParams.toDate).getTime() : null

  // Server-bounded responses are already inside the date range
  const inScope = props.serverDateFilter ? rows : rows.filter(row => isRowInDateRange(row, from, to))
  const byStatus = {}
  inScope.forEach(row => {
    const key = rowStatusOf(row).toLowerCase()
    if (!key) return
    byStatus[key] = (byStatus[key] || 0) + 1
  })

  return {
    total: inScope.length,
    byStatus,
    // Case-insensitive lookup for a label like 'In Progress'
    countFor: (status) => {
      const key = String(status || '').trim().toLowerCase()
      if (!key) return inScope.length
      return byStatus[key] || 0
    }
  }
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.global?.value && String(filters.value.global.value).trim().length > 0) count++
  if (selectedStatusFilter.value && String(selectedStatusFilter.value).trim().length > 0) count++
  if (isRadiusUserEndpoint.value && connectionFilter.value) count++
  if (props.filterParams && typeof props.filterParams === 'object') {
    Object.values(props.filterParams).forEach(val => {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        count++
      }
    })
  }
  return count
})

const resolveDefaultSortOrder = () => {
  if (props.defaultSortOrder !== null && props.defaultSortOrder !== undefined) {
    return props.defaultSortOrder
  }
  return isApplicationEndpoint.value ? -1 : 1
}

const sortField = ref(props.defaultSortField || 'id')
const sortOrder = ref(resolveDefaultSortOrder())

watch([() => props.endpoint, () => props.defaultSortOrder], () => {
  sortOrder.value = resolveDefaultSortOrder()
})

// Synchronize sortField with the matching casing of the column in displayedColumns
watch(displayedColumns, (newCols) => {
  if (!newCols || !newCols.length) return
  if (sortField.value) {
    const match = newCols.find(c => c.toLowerCase() === sortField.value.toLowerCase())
    if (match) {
      sortField.value = match
    } else if (newCols.some(c => c.toLowerCase() === 'id')) {
      sortField.value = newCols.find(c => c.toLowerCase() === 'id')
    } else if (!props.defaultSortField) {
      sortField.value = null
    }
  }
}, { immediate: true })

const clearAllFilters = () => {
  filters.value.global.value = null
  selectedStatusFilter.value = ''
  connectionFilter.value = ''
  if (props.defaultSortField) {
    const match = displayedColumns.value.find(c => c.toLowerCase() === props.defaultSortField.toLowerCase())
    sortField.value = match || props.defaultSortField
  } else {
    const matchId = displayedColumns.value.find(c => c.toLowerCase() === 'id')
    sortField.value = matchId || 'id'
  }
  sortOrder.value = resolveDefaultSortOrder()
  firstRowIndex.value = 0
  emit('reset-filters')
}

// Columns that can stand in for a primary key, in order of preference. The list is
// deliberately closed: keying off whatever column happens to be unique would let
// the key drift to an ordinary attribute (a group, a status) and silently change
// what "the same row" means the moment that attribute is edited.
const IDENTITY_KEY_CANDIDATES = [
  'id',
  'name',
  'username',
  'accountno',
  'accountnumber',
  'code',
  'email',
  'useremail'
]

// PrimeVue matches the selected row against the rest by `dataKey`, so a key that
// repeats highlights every row that shares it. Not every endpoint hands back a
// populated id — RadiusUser returns `id: ""` on every record — so fall through the
// candidates above, and to plain object identity when none of them qualify.
const tableDataKey = computed(() => {
  const rows = Array.isArray(data.value) ? data.value : []
  if (rows.length === 0) return 'id'

  const isUsableKey = (field) => {
    const seen = new Set()
    for (const row of rows) {
      const val = row?.[field]
      if (val === null || val === undefined || String(val).trim() === '') return false
      if (seen.has(String(val))) return false
      seen.add(String(val))
    }
    return true
  }

  for (const candidate of IDENTITY_KEY_CANDIDATES) {
    const col = allRawColumns.value.find(c => normalizeColKey(c) === candidate)
    if (col && isUsableKey(col)) return col
  }
  return undefined
})

const rowKeyOf = (row) => {
  const field = tableDataKey.value
  if (!field || !row) return undefined
  const val = row[field]
  return val === null || val === undefined || String(val).trim() === '' ? undefined : val
}

const isRadiusUserEndpoint = computed(() => {
  const ep = (props.endpoint || '').trim().toLowerCase()
  return ep === 'radiususer' || ep === 'radiususers'
})

// A RADIUS account reports its session state through its Group: the backend puts
// the word "Disconnected" in that column when the session is cut, and there is no
// dedicated status field to read. Matching is substring-based, so it holds however
// the group is spelled around it ("Disconnected", "SwitchLite-Disconnected", …).
const isGroupDisconnected = (group) => /disconnected/i.test(String(group || ''))

const nonEmptyString = (val) => (
  val === null || val === undefined || String(val).trim() === '' ? '' : String(val)
)

// The connect / disconnect calls are still keyed by account name.
const radiusNameOf = (row) => nonEmptyString(row?.name ?? row?.Name)

const radiusGroupOf = (row) => nonEmptyString(row?.group ?? row?.Group)

// Set to true to bring back the "Connected" / "Disconnected" caption beside each
// connection switch. Hidden for now: the switch position and the column header
// already carry the state, and the tooltip says what a click will do.
const SHOW_CONNECTION_STATE_LABEL = false

const CONNECTION_FILTER_OPTIONS = [
  { value: '', label: 'All', icon: 'pi-list', countKey: 'all' },
  { value: 'connected', label: 'Connected', icon: 'pi-check-circle', countKey: 'connected' },
  { value: 'disconnected', label: 'Disconnected', icon: 'pi-ban', countKey: 'disconnected' }
]

// Defaults to All (no filter)
const connectionFilter = ref('')

const setConnectionFilter = (value) => {
  connectionFilter.value = value
}

// Counts over the whole fetched set, so the chips answer "how many are cut off?"
// without having to switch filters to find out.
const connectionCounts = computed(() => {
  const rows = Array.isArray(data.value) ? data.value : []
  const connected = rows.reduce((acc, row) => acc + (isRowConnected(row) ? 1 : 0), 0)
  return { all: rows.length, connected, disconnected: rows.length - connected }
})

// Desired state per row while its connect / disconnect POST is in flight. The
// switch is driven off the row's group, which only changes once the server has
// moved the account, so without this the control would sit still after a click.
const pendingConnection = ref({})

const connectionPendingKey = (row) => {
  const key = rowKeyOf(row) ?? radiusNameOf(row)
  return key === undefined || key === '' ? undefined : String(key)
}

const isConnectionPending = (row) => {
  const key = connectionPendingKey(row)
  return key !== undefined && key in pendingConnection.value
}

const isRowConnected = (row) => {
  const key = connectionPendingKey(row)
  if (key !== undefined && key in pendingConnection.value) {
    return pendingConnection.value[key]
  }
  return !isGroupDisconnected(radiusGroupOf(row))
}

// `connect` / `disconnect` are keyed by the account name, not by id — RadiusUser
// records come back with an empty id.
const toggleConnection = async (row, desiredConnected) => {
  const name = radiusNameOf(row)
  if (!name) {
    toast.add({
      severity: 'warn',
      summary: 'Cannot change connection',
      detail: 'This record has no account name to send to the RADIUS API.',
      life: 4000
    })
    return
  }

  const pendingKey = connectionPendingKey(row)
  if (pendingKey === undefined || pendingKey in pendingConnection.value) return

  pendingConnection.value = { ...pendingConnection.value, [pendingKey]: desiredConnected }
  try {
    if (desiredConnected) {
      await RadiusUserService.connectRadiusUser(encodeURIComponent(name))
    } else {
      await RadiusUserService.disconnectRadiusUser(encodeURIComponent(name))
    }

    toast.add({
      severity: 'success',
      summary: desiredConnected ? 'Account Connected' : 'Account Disconnected',
      detail: `${name} was ${desiredConnected ? 'connected' : 'disconnected'}.`,
      life: 3000
    })

    // The group is the source of truth for the new state, so re-read the list
    // rather than trusting the optimistic value.
    await fetchData({ silent: true })
  } catch (err) {
    console.error(`Error toggling RADIUS connection for ${name}:`, err)
    toast.add({
      severity: 'error',
      summary: desiredConnected ? 'Connect Failed' : 'Disconnect Failed',
      detail: err.message || 'The RADIUS API rejected the request.',
      life: 5000
    })
  } finally {
    // Dropping the optimistic value hands the switch back to the fetched group —
    // which also means it snaps back if the server did not apply the change.
    const next = { ...pendingConnection.value }
    delete next[pendingKey]
    pendingConnection.value = next
  }
}

const recordRangeStart = computed(() => {
  if (filteredRecordsCount.value === 0) return 0
  return firstRowIndex.value + 1
})

const recordRangeEnd = computed(() => {
  if (filteredRecordsCount.value === 0) return 0
  return Math.min(firstRowIndex.value + rowsPerPage.value, filteredRecordsCount.value)
})

watch([() => filters.value.global?.value, selectedStatusFilter, connectionFilter, rowsPerPage], () => {
  firstRowIndex.value = 0
})

const exportMenuItems = computed(() => [
  {
    label: 'Export CSV',
    icon: 'pi pi-download',
    command: () => exportCSV()
  },
  {
    label: 'Export Excel (.xlsx)',
    icon: 'pi pi-file-excel',
    command: () => exportExcel()
  },
  {
    label: 'Export PDF Document',
    icon: 'pi pi-file-pdf',
    command: () => exportPDF()
  },
  {
    separator: true
  },
  {
    label: 'Print Table',
    icon: 'pi pi-print',
    command: () => printTable()
  }
])

const totalRecordsCount = computed(() => {
  return Array.isArray(data.value) ? data.value.length : 0
})

// View State
const displayViewDialog = ref(false)
const viewFormData = ref({})
const viewingRecordId = ref(null)

// Dialog State
const displayCreateDialog = ref(false)
const formData = ref({})
const saving = ref(false)
const saveError = ref(null)

// Edit State
const displayEditDialog = ref(false)
const editFormData = ref({})
const editingRecordId = ref(null)
const savingEdit = ref(false)
const editError = ref(null)

// Delete State
const displayDeleteDialog = ref(false)
const recordToDelete = ref(null)
const deleting = ref(false)
const deleteError = ref(null)

// Filter out system-generated fields (id, created/modified dates & times, createdBy/modifiedBy, rowVersion) from forms
const formColumns = computed(() => {
  const list = allRawColumns.value.filter(col => !isAuditField(col))

  // If username field exists, inject email immediately after username for 2-column alignment
  const usernameIndex = list.findIndex(c => c.toLowerCase() === 'username')
  if (usernameIndex !== -1 && !list.some(c => c.toLowerCase() === 'email' || c.toLowerCase() === 'useremail')) {
    list.splice(usernameIndex + 1, 0, 'email')
  }

  // If password field exists, inject confirmPassword immediately after password
  const pwdIndex = list.findIndex(c => c.toLowerCase() === 'password')
  if (pwdIndex !== -1 && !list.includes('confirmPassword')) {
    list.splice(pwdIndex + 1, 0, 'confirmPassword')
  }

  // Strictly order address fields: Region -> Province -> City / Municipality -> Barangay
  const regionIndex = list.findIndex(c => getFieldType(c) === 'region_dropdown')
  const provinceIndex = list.findIndex(c => getFieldType(c) === 'province_dropdown')
  const cityIndex = list.findIndex(c => getFieldType(c) === 'city_dropdown')
  const barangayIndex = list.findIndex(c => getFieldType(c) === 'barangay_dropdown')

  const addressIndices = [regionIndex, provinceIndex, cityIndex, barangayIndex].filter(i => i !== -1)
  if (addressIndices.length > 1) {
    const addressCols = []
    if (regionIndex !== -1) addressCols.push(list[regionIndex])
    if (provinceIndex !== -1) addressCols.push(list[provinceIndex])
    if (cityIndex !== -1) addressCols.push(list[cityIndex])
    if (barangayIndex !== -1) addressCols.push(list[barangayIndex])

    const remaining = list.filter(c => !addressCols.includes(c))
    const firstPos = Math.min(...addressIndices)
    remaining.splice(firstPos, 0, ...addressCols)
    return remaining
  }

  return list
})

const SECTION_META = {
  profile: { icon: 'pi pi-user', badgeClass: 'text-primary' },
  plan: { icon: 'pi pi-credit-card', badgeClass: 'text-info' },
  infra: { icon: 'pi pi-sitemap', badgeClass: 'text-warning' },
  network: { icon: 'pi pi-wifi', badgeClass: 'text-success' },
  ops: { icon: 'pi pi-check-square', badgeClass: 'text-secondary' },
  audit: { icon: 'pi pi-history', badgeClass: 'text-purple-500 text-dark' }
}

const getSectionTitle = (key) => {
  const ep = (props.endpoint || '').toLowerCase()
  const formattedEp = formatLabel(props.endpoint)

  if (key === 'audit') {
    return 'System Metadata & Audit Trail'
  }

  if (key === 'profile') {
    if (ep.includes('application') || ep.includes('joborder') || ep.includes('billingdetail') || ep.includes('customer')) {
      return 'Subscriber & Personal Profile'
    }
    if (ep.includes('user')) {
      return 'User Account & Personal Info'
    }
    return `${formattedEp} Details`
  }

  if (key === 'plan') {
    if (ep.includes('plan')) return 'Plan Specifications & Pricing'
    return 'Service Plan & Billing Details'
  }

  if (key === 'infra') {
    if (ep.includes('router')) return 'Router Hardware & Brand Specs'
    if (ep.includes('port')) return 'Port Allocation Details'
    if (ep.includes('vlan')) return 'VLAN Network Assignment'
    if (ep.includes('lcp') || ep.includes('nap')) return 'Fiber Terminal Configuration'
    return 'Fiber Infrastructure & Provisioning'
  }

  if (key === 'network') {
    if (ep.includes('accesslevel')) return 'Access Level & Permission Policy'
    if (ep.includes('menu')) return 'Menu Navigation Config'
    return 'Network & Security Credentials'
  }

  if (key === 'ops') {
    return 'Operational Status & Sign-off'
  }

  return `${formattedEp} Information`
}

const getColumnSection = (col) => {
  if (isAuditField(col)) {
    return 'audit'
  }
  const c = col.toLowerCase()
  if (c.includes('plan') || c.includes('amount') || c.includes('balance') || c.includes('billing') || c.includes('discount') || c.includes('installfee') || c.includes('contract')) {
    return 'plan'
  }
  if (c.includes('lcp') || c.includes('nap') || c.includes('port') || c.includes('vlan') || c === 'brand' || c === 'model' || c.includes('routermodel')) {
    return 'infra'
  }
  if (c.includes('connectiontype') || c.includes('username') || c.includes('password') || c === 'ip' || c.includes('sn') || c.includes('modemsn') || c.includes('provider') || c.includes('splynx') || c.includes('mikrotik') || c === 'active' || c.includes('accesslevel') || c.includes('menu')) {
    return 'network'
  }
  if (c.includes('status') || c.includes('visit') || c.includes('verified') || c.includes('remark') || c.includes('timestamp') || c.includes('duration') || c.includes('image') || c.includes('signature') || c.includes('itemname') || c.includes('itemquantity') || c.includes('externalid') || c.includes('assignedemail')) {
    return 'ops'
  }
  return 'profile'
}

// Explicit field arrangement for the Applications form. The keyword-based grouping
// above drops 20-odd of these columns into one "profile" section in raw schema
// order, which reads as a wall of inputs with the ID uploads scattered through it.
// These five groups follow how the form is actually filled in — who, where, what
// they signed up for, what they attached, how it was processed — and each group's
// field count is chosen to tile evenly across the 3-column grid.
const APPLICATION_FORM_LAYOUT = [
  {
    key: 'identity',
    title: 'Applicant Identity',
    icon: 'pi pi-user',
    badgeClass: 'text-primary',
    columns: [
      'firstName',
      'middleName',
      'lastName',
      'emailAddress',
      'mobileNumber',
      'secondaryMobileNumber'
    ]
  },
  {
    key: 'address',
    title: 'Installation Address & Landmarks',
    icon: 'pi pi-map-marker',
    badgeClass: 'text-info',
    columns: [
      'region',
      'city',
      'barangay',
      'barangay1',
      'installationAddress',
      'landmark',
      'firstNearestLandmark',
      'secondNearestLandmark',
      'province'
    ]
  },
  {
    key: 'plan',
    title: 'Service Plan, Promo & Referral',
    icon: 'pi pi-credit-card',
    badgeClass: 'text-success',
    columns: [
      'desiredPlan',
      'applyingFor',
      'applicablePromo',
      'termsAndConditionsAgreement',
      'referredBy',
      'referrersAccountNumber'
    ]
  },
  {
    key: 'documents',
    title: 'Uploaded Documents',
    icon: 'pi pi-images',
    badgeClass: 'text-warning',
    columns: [
      'governmentValidId',
      'secondGovernmentValidId',
      'houseFrontPicture',
      'documentPicture',
      'proofOfBilling',
      'pictureofstatmentbillingfromotherprovider',
      'pictureofstatementbillingfromotherprovider'
    ]
  },
  {
    key: 'ops',
    title: 'Operational Status & Sign-off',
    icon: 'pi pi-check-square',
    badgeClass: 'text-secondary',
    columns: [
      'status',
      'visitBy',
      'visitWith',
      'visitWithOther',
      'remarks',
      'timestamp'
    ]
  }
]

const LCPNAP_FORM_LAYOUT = [
  {
    key: 'infra',
    title: 'LCP & NAP Site Details',
    icon: 'pi pi-server',
    badgeClass: 'text-primary',
    columns: [
      'id',
      'lcpnap',
      'lcp',
      'nap',
      'portTotal',
      'userEmail'
    ]
  },
  {
    key: 'location',
    title: 'Site Location & Coordinates',
    icon: 'pi pi-map-marker',
    badgeClass: 'text-success',
    columns: [
      'coordinates',
      'region',
      'city',
      'barangay',
      'street'
    ]
  },
  {
    key: 'photos',
    title: 'Site Photos',
    icon: 'pi pi-images',
    badgeClass: 'text-info',
    columns: [
      'image',
      'image2',
      'readingImage'
    ]
  }
]

// Arrange `cols` per APPLICATION_FORM_LAYOUT. Matching ignores case and
// underscores, and any column the layout does not name still renders — under
// "Additional Details", or in the audit group for the View dialog — so a new
// backend field is never silently dropped from the form.
const buildApplicationSections = (cols, { includeAudit = false } = {}) => {
  const pool = new Map()
  ;(cols || []).forEach(col => {
    const key = normalizeColKey(col)
    if (!pool.has(key)) pool.set(key, col)
  })

  const sections = []
  APPLICATION_FORM_LAYOUT.forEach(sec => {
    const picked = []
    sec.columns.forEach(wanted => {
      const key = normalizeColKey(wanted)
      if (pool.has(key)) {
        picked.push(pool.get(key))
        pool.delete(key)
        if (key === 'barangay1') {
          pool.delete('barangay2')
        }
        if (key === 'visitwithother') {
          pool.delete('useremail')
        }
      }
    })
    if (picked.length > 0) {
      sections.push({ ...sec, columns: picked })
    }
  })

  const leftovers = [...pool.values()]
  const extras = leftovers.filter(col => !isAuditField(col))
  const auditCols = leftovers.filter(col => isAuditField(col))

  if (extras.length > 0) {
    sections.push({
      key: 'extra',
      title: 'Additional Details',
      icon: 'pi pi-file',
      badgeClass: 'text-secondary',
      columns: extras
    })
  }
  if (includeAudit && auditCols.length > 0) {
    sections.push({
      key: 'audit',
      title: getSectionTitle('audit'),
      icon: SECTION_META.audit.icon,
      badgeClass: SECTION_META.audit.badgeClass,
      columns: auditCols
    })
  }

  return sections
}

const buildLcpNapSections = (cols, { includeAudit = false } = {}) => {
  const pool = new Map()
  ;(cols || []).forEach(col => {
    const key = normalizeColKey(col)
    if (!pool.has(key)) pool.set(key, col)
  })

  const sections = []
  LCPNAP_FORM_LAYOUT.forEach(sec => {
    const picked = []
    sec.columns.forEach(wanted => {
      const key = normalizeColKey(wanted)
      if (pool.has(key)) {
        picked.push(pool.get(key))
        pool.delete(key)
      }
    })
    if (picked.length > 0) {
      sections.push({ ...sec, columns: picked })
    }
  })

  const leftovers = [...pool.values()]
  const extras = leftovers.filter(col => !isAuditField(col))
  const auditCols = leftovers.filter(col => isAuditField(col))

  if (extras.length > 0) {
    sections.push({
      key: 'extra',
      title: 'Additional Details',
      icon: 'pi pi-file',
      badgeClass: 'text-secondary',
      columns: extras
    })
  }
  if (includeAudit && auditCols.length > 0) {
    sections.push({
      key: 'audit',
      title: getSectionTitle('audit'),
      icon: SECTION_META.audit.icon,
      badgeClass: SECTION_META.audit.badgeClass,
      columns: auditCols
    })
  }

  return sections
}

// Columns for Create & Edit forms (excludes system audit fields completely)
const formSections = computed(() => {
  if (isApplicationEndpoint.value) {
    return buildApplicationSections(formColumns.value)
  }
  if (isLcpNapEndpoint.value) {
    return buildLcpNapSections(formColumns.value)
  }

  const groups = {
    profile: [],
    plan: [],
    infra: [],
    network: [],
    ops: []
  }

  formColumns.value.forEach(col => {
    const sec = getColumnSection(col)
    if (sec !== 'audit' && groups[sec]) {
      groups[sec].push(col)
    }
  })

  return Object.keys(groups)
    .filter(key => groups[key].length > 0)
    .map(key => ({
      key,
      title: getSectionTitle(key),
      icon: SECTION_META[key]?.icon || 'pi pi-file',
      badgeClass: SECTION_META[key]?.badgeClass || 'text-secondary',
      columns: groups[key]
    }))
})

// Columns for View Details Modal ONLY (excludes system audit fields)
const viewFormColumns = computed(() => {
  let keys = []
  if (viewFormData.value && typeof viewFormData.value === 'object') {
    keys = Object.keys(viewFormData.value)
  }
  if (!keys.length) {
    keys = [...allRawColumns.value]
  }

  // Deduplicate redundant/paired fields and EF Core navigation objects for View Modal
  keys = deduplicateColumns(keys)

  // Filter out createdBy, modifiedBy, and all system audit fields for UI view
  keys = keys.filter(k => !isAuditField(k))

  const idIndex = keys.findIndex(k => k.toLowerCase() === 'id')
  if (idIndex > 0) {
    const [idCol] = keys.splice(idIndex, 1)
    keys.unshift(idCol)
  }
  return keys
})

const viewFormSections = computed(() => {
  if (isApplicationEndpoint.value) {
    return buildApplicationSections(viewFormColumns.value, { includeAudit: false })
  }
  if (isLcpNapEndpoint.value) {
    return buildLcpNapSections(viewFormColumns.value, { includeAudit: false })
  }

  const groups = {
    profile: [],
    plan: [],
    infra: [],
    network: [],
    ops: []
  }

  viewFormColumns.value.forEach(col => {
    const sec = getColumnSection(col)
    if (sec !== 'audit' && groups[sec]) {
      groups[sec].push(col)
    }
  })

  return Object.keys(groups)
    .filter(key => groups[key].length > 0)
    .map(key => ({
      key,
      title: getSectionTitle(key),
      icon: SECTION_META[key]?.icon || 'pi pi-file',
      badgeClass: SECTION_META[key]?.badgeClass || 'text-secondary',
      columns: groups[key]
    }))
})

const exportCSV = () => {
  if (dt.value) {
    dt.value.exportCSV()
  }
}

const exportExcel = () => {
  try {
    const targetData = filteredData.value && filteredData.value.length > 0 ? filteredData.value : data.value
    const targetCols = displayedColumns.value && displayedColumns.value.length > 0 ? displayedColumns.value : columns.value

    const exportData = (targetData || []).map(row => {
      const rowObj = {}
      targetCols.forEach(col => {
        const header = formatLabel(col)
        const val = row[col]
        if (col.toLowerCase() === 'password') {
          rowObj[header] = '••••••••'
        } else if (isUserRefField(col)) {
          rowObj[header] = getUserDisplayName(val)
        } else if (getFieldType(col) === 'agreement_checkbox') {
          rowObj[header] = isAgreementChecked(val) ? 'Yes, I Agree' : ''
        } else {
          rowObj[header] = val !== null && val !== undefined ? String(val) : '-'
        }
      })
      return rowObj
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Enable auto-wrap and top vertical alignment on all worksheet cells
    for (const cellAddress in worksheet) {
      if (cellAddress.startsWith('!')) continue
      const cell = worksheet[cellAddress]
      if (cell && typeof cell === 'object') {
        if (!cell.s) cell.s = {}
        cell.s.alignment = {
          wrapText: true,
          vertical: 'top'
        }
      }
    }

    const workbook = XLSX.utils.book_new()
    const sheetName = (formatLabel(props.endpoint) || 'ExportData').substring(0, 31)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Calculate smart column widths (Description & multiline text fields get a wide 45ch width for clean multi-line wrapping)
    const maxCols = targetCols.map(col => {
      const colLower = col.toLowerCase()
      const isMultilineField = colLower.includes('description') || 
                               colLower.includes('remark') || 
                               (colLower.includes('address') && !colLower.includes('email')) ||
                               colLower.includes('landmark') || 
                               colLower.includes('template') || 
                               colLower.includes('note')

      if (isMultilineField) {
        return { wch: 45 } // Generous width specifically for Description & multiline text
      }

      const headerLabel = formatLabel(col)
      let maxLen = headerLabel.length
      ;(targetData || []).forEach(row => {
        const val = row[col]
        if (val !== null && val !== undefined) {
          const str = String(val)
          if (str.length > maxLen) maxLen = str.length
        }
      })
      return { wch: Math.min(Math.max(maxLen + 3, 14), 35) }
    })
    worksheet['!cols'] = maxCols

    XLSX.writeFile(workbook, `${props.endpoint}_export.xlsx`)
  } catch (err) {
    console.error('Error generating Excel file:', err)
    alert('Failed to generate Excel file. Please try again.')
  }
}

const exportPDF = () => {
  try {
    const targetData = filteredData.value && filteredData.value.length > 0 ? filteredData.value : data.value
    const targetCols = displayedColumns.value && displayedColumns.value.length > 0 ? displayedColumns.value : columns.value

    const doc = new jsPDF('landscape')
    const currentPalette = THEME_PALETTES[activeColorTheme.value] || THEME_PALETTES.green
    const pdfHeaderColor = currentPalette.pdfRgb || [16, 185, 129]

    const head = [targetCols.map(col => formatLabel(col))]
    
    const body = (targetData || []).map(row => {
      return targetCols.map(col => {
        const val = row[col]
        if (col.toLowerCase() === 'password') {
          return '••••••••'
        }
        if (isUserRefField(col)) {
          return getUserDisplayName(val)
        }
        if (getFieldType(col) === 'agreement_checkbox') {
          return isAgreementChecked(val) ? 'Yes, I Agree' : '-'
        }
        return val !== null && val !== undefined ? String(val) : '-'
      })
    })

    doc.setFontSize(14)
    doc.text(`${formatLabel(props.endpoint)} Records`, 14, 15)

    autoTable(doc, {
      startY: 20,
      head: head,
      body: body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: pdfHeaderColor },
      margin: { top: 20 },
    })

    doc.save(`${props.endpoint}_export.pdf`)
  } catch (err) {
    console.error('Error generating PDF:', err)
    alert('Failed to generate PDF. Please try again.')
  }
}

const printTable = () => {
  window.print()
}

const showPasswordState = ref({})
const accessLevels = ref([])
const menusList = ref([])
const lcpnapsList = ref([])
const lcpnapportsList = ref([])
const lcpsList = ref([])
const napsList = ref([])
const portsList = ref([])
const vlansList = ref([])
const plansList = ref([])
const usersList = ref([])
const defaultFormattedRegions = (defaultRegions || []).map(r => ({
  label: `${r.name} (${r.regionName})`,
  value: r.name,
  code: r.code,
  name: r.name,
  regionName: r.regionName
}))

const defaultFormattedProvinces = (defaultProvinces || []).map(p => ({
  label: p.name,
  value: p.name,
  code: p.code,
  regionCode: p.regionCode
}))

const regionsList = ref(defaultFormattedRegions)
const provincesList = ref(defaultFormattedProvinces)
const citiesList = ref([])
const barangaysList = ref([])

const APPLICATION_STATUS_LIST = [
  'In Progress',
  'Done',
  'Approved'
]

const DEFAULT_STATUS_LIST = [
  'In Progress',
  'Done',
  'Approved'
]

const getStableOptionsWithCurrent = (optionsList, currentVal) => {
  const list = Array.isArray(optionsList) ? [...optionsList] : []
  if (currentVal !== null && currentVal !== undefined && String(currentVal).trim() !== '') {
    const str = String(currentVal).trim()
    const exists = list.some(opt => 
      String(opt.value) === str || 
      String(opt.value).toLowerCase() === str.toLowerCase() ||
      String(opt.label) === str ||
      String(opt.label).toLowerCase() === str.toLowerCase()
    )
    if (!exists) {
      list.unshift({ label: str, value: currentVal })
    }
  }
  return list
}

const APPLICATION_REFERRER_LIST = [
  'None',
  'SWITCH GAISANO',
  'PRECIOUS GAISANO',
  'Norwina A. Armas',
  'Mariane Talento Puyot',
  'Nicolas Marinay Occidental Jr.',
  'Paula Marie T. Fermanis',
  'Emylinda B. Biasca',
  'Precious Ann Vergonio',
  'Maria Nympha Vergonio',
  'Jonalyn Perez Agsalon',
  'Menandro B. Albao',
  'Vilma S. Divinagracia',
  'Anthony Francis N. Samar',
  'Keanu C. Nido',
  'Severino L. Cervo',
  'Bernadette  Delos Santos',
  'Gladiola Veron Lico',
  'Shania Manalo',
  'Ria Gielen Paclibare',
  'Cheryll Briones',
  'Vea Vianca Delos Reyes',
  'John Rainier Cernero',
  'Mark Paner',
  'Heatherlynn Hernandez',
  'Gibson Lizardo',
  'Elmer Tuyor Jr.',
  'Jordan Cerrero',
  'Carina Añonuevo',
  'Lealyn Bayos',
  'Lhen Ambao',
  'Jennylyn Calle',
  'Dan Onia',
  'Christopher George Cajes',
  'Baltazar Masucol',
  'Jennelyn Rufino',
  'Ofelia Ceñidoza',
  'Rainier Ubana',
  'Jonalyn Delima',
  'Arvin Mateo',
  'Manuel Pangilinan Jr.',
  'Regina Casano',
  'Peter Dominic Ojeda',
  'Reina Jane Ferido',
  'Sygel Landicho',
  'Jennyzell Ceñidoza'
]

const referrerOptions = computed(() => {
  return APPLICATION_REFERRER_LIST.map(v => ({ label: v, value: v }))
})

const getReferrerOptions = (currentVal) => {
  return getStableOptionsWithCurrent(referrerOptions.value, currentVal)
}

const getPlanOptions = (col, currentVal) => {
  const isIdField = col && (col.toLowerCase() === 'planid' || col.toLowerCase() === 'plan_id')
  const baseOptions = plansList.value.map(p => ({
    label: p.label || p.name || `Plan #${p.id}`,
    value: isIdField ? p.id : (p.name || p.value || p.id)
  }))
  return getStableOptionsWithCurrent(baseOptions, currentVal)
}

const statusOptions = computed(() => {
  if (isApplicationEndpoint.value) {
    return APPLICATION_STATUS_LIST.map(v => ({ label: v, value: v }))
  }
  return DEFAULT_STATUS_LIST.map(v => ({ label: v, value: v }))
})

const editStatusOptions = computed(() => {
  if (isApplicationEndpoint.value) {
    return APPLICATION_STATUS_LIST.map(v => ({ label: v, value: v }))
  }
  const record = editFormData.value || {}
  const statusKey = Object.keys(record).find(k => k.toLowerCase() === 'status') || (statusColName.value || 'status')
  const current = record[statusKey]
  return getStableOptionsWithCurrent(statusOptions.value, current)
})

const onsiteStatusOptions = ref([
  { label: 'Done', value: 'Done' },
  { label: 'Failed', value: 'Failed' }
])

const billingStatusOptions = ref([
  { label: 'Done', value: 'Done' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' }
])

const usageTypeOptions = ref([
  { label: 'Regular Browsing', value: 'Regular Browsing' },
  { label: 'Business', value: 'Business' },
  { label: 'Gaming', value: 'Gaming' },
  { label: 'Streaming', value: 'Streaming' }
])

const fetchRelatedData = async () => {
  try {
    const unwrap = (val) => {
      if (!val) return []
      if (Array.isArray(val)) return val
      if (typeof val === 'object') {
        const key = Object.keys(val).find(k => Array.isArray(val[k]))
        if (key) return val[key]
      }
      return []
    }

    const [accRes, menuRes, lcnapRes, lcpRes, napRes, portRes, vlanRes, planRes, userRes, lcnapPortRes] = await Promise.allSettled([
      apiClient.get('/AccessLevel'),
      apiClient.get('/Menus'),
      apiClient.get('/Lcpnaps'),
      apiClient.get('/Lcps'),
      apiClient.get('/Naps'),
      apiClient.get('/Ports'),
      apiClient.get('/Vlans'),
      apiClient.get('/Plans'),
      apiClient.get('/Users'),
      apiClient.get('/Lcpnapports')
    ])

    if (accRes.status === 'fulfilled') {
      accessLevels.value = unwrap(accRes.value).map(item => ({ 
        label: item.name || `ID: ${item.id}`, 
        nameOnly: item.name || `ID: ${item.id}`,
        value: item.id 
      }))
    }
    if (menuRes.status === 'fulfilled') {
      menusList.value = unwrap(menuRes.value).map(item => ({ label: `${item.name} (${item.route || 'ID: ' + item.id})`, value: item.id }))
    }
    if (lcnapRes.status === 'fulfilled') {
      lcpnapsList.value = unwrap(lcnapRes.value).map(item => ({ label: `${item.name || 'LCNAP #' + item.id}`, value: item.name || item.id, id: item.id }))
    }
    if (lcpRes.status === 'fulfilled') {
      lcpsList.value = unwrap(lcpRes.value).map(item => ({ label: `${item.name || 'LCP #' + item.id}`, value: item.name || item.id, id: item.id }))
    }
    if (napRes.status === 'fulfilled') {
      napsList.value = unwrap(napRes.value).map(item => ({ label: `${item.name || 'NAP #' + item.id}`, value: item.name || item.id, id: item.id }))
    }
    if (portRes.status === 'fulfilled') {
      portsList.value = unwrap(portRes.value).map(item => ({ label: `${item.name || 'Port #' + item.id}`, value: item.name || item.id, id: item.id }))
    }
    if (vlanRes.status === 'fulfilled') {
      vlansList.value = unwrap(vlanRes.value).map(item => ({ label: `${item.name || 'VLAN #' + item.id}`, value: item.name || item.id, id: item.id }))
    }
    if (lcnapPortRes && lcnapPortRes.status === 'fulfilled') {
      lcpnapportsList.value = unwrap(lcnapPortRes.value).map(item => ({ label: `${item.name || 'LCNAP Port #' + item.id}`, value: item.name || item.id, id: item.id }))
    }
    if (planRes.status === 'fulfilled') {
      plansList.value = unwrap(planRes.value).map(item => ({ 
        label: item.name ? `${item.name}${item.amount ? ' (₱' + Number(item.amount).toLocaleString() + ')' : ''}` : `Plan #${item.id}`, 
        name: item.name || `Plan #${item.id}`,
        id: item.id,
        amount: item.amount,
        value: item.name || item.id 
      }))
    }
    if (userRes.status === 'fulfilled') {
      const unwrappedUsers = unwrap(userRes.value)
      usersList.value = unwrappedUsers
      if (Array.isArray(unwrappedUsers) && unwrappedUsers.length > 0) {
        userStore.users = unwrappedUsers
      }
    }

    // Trigger address data loading in parallel
    fetchAddressData()
  } catch (err) {
    console.error('Error fetching related data:', err)
  }
}

let allBarangaysFallbackCache = null
let allCitiesFallbackCache = null
let allProvincesFallbackCache = null

const fetchAddressData = async () => {
  try {
    const [regionsData, provincesData, citiesData] = await Promise.all([
      phAddressService.getRegions(),
      phAddressService.getProvinces(),
      phAddressService.getCities()
    ])
    if (regionsData && regionsData.length > 0) {
      regionsList.value = regionsData.map(r => ({
        label: `${r.name} (${r.regionName})`,
        value: r.name,
        code: r.code,
        name: r.name,
        regionName: r.regionName
      }))
    }
    if (provincesData && provincesData.length > 0) {
      provincesList.value = provincesData.map(p => ({
        label: p.name,
        value: p.name,
        code: p.code,
        regionCode: p.regionCode
      }))
      allProvincesFallbackCache = provincesList.value
    }
    if (citiesData && citiesData.length > 0) {
      citiesList.value = citiesData.map(c => ({
        label: `${c.name} ${c.isCity ? '(City)' : ''}`,
        value: c.name,
        code: c.code,
        regionCode: c.regionCode,
        provinceCode: c.provinceCode
      }))
      allCitiesFallbackCache = citiesList.value
    }
  } catch (e) {
    console.warn('Failed to load local PSGC region/city/province data:', e)
  }

  try {
    const res = await fetch('/data/philippines/barangays.json')
    if (res.ok) {
      const groupedData = await res.json()
      const allBrgys = []
      Object.values(groupedData).forEach(brgys => {
        brgys.forEach(b => {
          allBrgys.push(b.name)
        })
      })
      const uniqueBrgyNames = Array.from(new Set(allBrgys)).sort((a, b) => a.localeCompare(b))
      const formattedList = uniqueBrgyNames.map(name => ({ label: name, value: name }))
      allBarangaysFallbackCache = formattedList
      if (barangaysList.value.length === 0) {
        barangaysList.value = formattedList
      }
    }
  } catch (e) {
    const distinct = Array.from(new Set((tableData.value || []).map(row => row.barangay).filter(Boolean)))
    if (distinct.length > 0) {
      barangaysList.value = distinct.map(b => ({ label: b, value: b }))
    }
  }
}

// Call immediately on setup
fetchAddressData()

const updateCitiesForSelectedRegion = async (regionVal) => {
  if (!regionVal) {
    if (allCitiesFallbackCache) citiesList.value = allCitiesFallbackCache
    if (allProvincesFallbackCache) provincesList.value = allProvincesFallbackCache
    return
  }

  const str = String(typeof regionVal === 'string' ? regionVal : (regionVal?.value || regionVal?.name || '')).trim().toLowerCase()

  const matchedRegion = regionsList.value.find(r => 
    (r.code && String(r.code).toLowerCase() === str) ||
    (r.value && String(r.value).toLowerCase() === str) ||
    (r.name && String(r.name).toLowerCase() === str) ||
    (r.label && String(r.label).toLowerCase().includes(str)) ||
    (r.regionName && String(r.regionName).toLowerCase() === str)
  )

  if (matchedRegion && matchedRegion.code) {
    try {
      const [cList, pList] = await Promise.all([
        phAddressService.getCities(matchedRegion.code),
        phAddressService.getProvinces(matchedRegion.code)
      ])
      citiesList.value = (cList || []).map(c => ({ label: `${c.name} ${c.isCity ? '(City)' : ''}`, value: c.name, code: c.code, regionCode: c.regionCode, provinceCode: c.provinceCode }))
      provincesList.value = (pList || []).map(p => ({ label: p.name, value: p.name, code: p.code, regionCode: p.regionCode }))
      return
    } catch (err) {
      console.error('Error filtering cities for region:', err)
    }
  }

  if (allCitiesFallbackCache) {
    citiesList.value = allCitiesFallbackCache
  }
}

// Narrows the city list to a single province. Region already filtered it down
// once; picking a province is the second, finer step.
const updateCitiesForSelectedProvince = async (provinceVal, regionVal) => {
  if (!provinceVal) {
    // Province cleared: fall back to the whole region.
    await updateCitiesForSelectedRegion(regionVal)
    return
  }

  const str = String(typeof provinceVal === 'string' ? provinceVal : (provinceVal?.value || provinceVal?.name || '')).trim().toLowerCase()

  const matchedProvince = (provincesList.value || []).find(p =>
    (p.code && String(p.code).toLowerCase() === str) ||
    (p.value && String(p.value).toLowerCase() === str) ||
    (p.name && String(p.name).toLowerCase() === str) ||
    (p.label && String(p.label).toLowerCase() === str)
  )

  if (matchedProvince && matchedProvince.code) {
    try {
      const cList = await phAddressService.getCities(matchedProvince.regionCode || null, matchedProvince.code)
      if (cList && cList.length > 0) {
        citiesList.value = cList.map(c => ({ label: `${c.name} ${c.isCity ? '(City)' : ''}`, value: c.name, code: c.code, regionCode: c.regionCode, provinceCode: c.provinceCode }))
        return
      }
    } catch (err) {
      console.error('Error filtering cities for province:', err)
    }
  }

  // Unknown province, or a province with no cities of its own — keep the
  // region-wide list rather than stranding the user with an empty dropdown.
  await updateCitiesForSelectedRegion(regionVal)
}

const updateBarangaysForSelectedCity = async (cityName) => {
  if (!cityName) {
    if (allBarangaysFallbackCache) {
      barangaysList.value = allBarangaysFallbackCache
    }
    return
  }

  const str = String(typeof cityName === 'string' ? cityName : (cityName?.value || cityName?.name || '')).trim().toLowerCase()

  // First try finding in currently displayed citiesList, then in allCitiesFallbackCache
  const sourceList = (citiesList.value && citiesList.value.length > 0) ? citiesList.value : (allCitiesFallbackCache || [])
  const matchedCity = sourceList.find(c => 
    (c.code && String(c.code).toLowerCase() === str) ||
    (c.value && String(c.value).toLowerCase() === str) ||
    (c.name && String(c.name).toLowerCase() === str) ||
    (c.label && String(c.label).toLowerCase().includes(str))
  )

  if (matchedCity && matchedCity.code) {
    try {
      const brgys = await phAddressService.getBarangays(matchedCity.code)
      if (brgys && brgys.length > 0) {
        barangaysList.value = brgys.map(b => ({ label: b.name, value: b.name }))
        return
      }
    } catch (err) {
      console.error('Error fetching barangays for city:', err)
    }
  }

  if (allBarangaysFallbackCache) {
    barangaysList.value = allBarangaysFallbackCache
  }
}

const regionColName = computed(() => formColumns.value.find(c => getFieldType(c) === 'region_dropdown'))
const provinceColName = computed(() => formColumns.value.find(c => getFieldType(c) === 'province_dropdown'))
const cityColName = computed(() => formColumns.value.find(c => getFieldType(c) === 'city_dropdown'))
const barangayColName = computed(() => formColumns.value.find(c => getFieldType(c) === 'barangay_dropdown'))
const statusColName = computed(() => formColumns.value.find(c => getFieldType(c) === 'status_dropdown'))

const createRegionOptions = computed(() => regionsList.value || [])
const createProvinceOptions = computed(() => provincesList.value || [])
const createCityOptions = computed(() => citiesList.value || [])
const createBarangayOptions = computed(() => barangaysList.value || [])

const unwrapForm = (targetForm) => {
  if (!targetForm) return {}
  const unwrapped = unref(targetForm)
  if (unwrapped && typeof unwrapped === 'object' && unwrapped.value && typeof unwrapped.value === 'object') {
    return unwrapped.value
  }
  return unwrapped || {}
}

const isCityDisabled = (targetForm) => {
  const form = unwrapForm(targetForm)
  if (regionColName.value) {
    const val = form[regionColName.value]
    return val === null || val === undefined || String(val).trim() === ''
  }
  return false
}

const isBarangayDisabled = (targetForm) => {
  const form = unwrapForm(targetForm)
  if (cityColName.value) {
    const val = form[cityColName.value]
    return val === null || val === undefined || String(val).trim() === ''
  }
  return false
}

const getCityPlaceholder = (targetForm) => {
  if (isCityDisabled(targetForm)) {
    return 'Select Region First'
  }
  return 'Select City / Town'
}

const getBarangayPlaceholder = (targetForm) => {
  if (isBarangayDisabled(targetForm)) {
    return 'Select City / Town First'
  }
  return 'Select or Type Barangay'
}

/* ------------------------------------------------------------------ *
 * Required-field validation
 *
 * Which fields are mandatory comes from the API's OpenAPI document via
 * src/models/requiredFields.js — see that file for why the schema's own
 * `required` array cannot be used directly.
 * ------------------------------------------------------------------ */

// { create: { colName: 'message' }, edit: { ... } }
const fieldErrors = ref({ create: {}, edit: {} })

const requiredColumns = computed(() =>
  new Set(resolveRequiredFields(props.endpoint, formColumns.value, 'create'))
)

const isFieldRequired = (col) => {
  if (!requiredColumns.value.has(col)) return false
  // A toggle always holds a boolean, so it can never be "missing".
  if (getFieldType(col) === 'toggle') return false
  return true
}

// Either-or groups: at least one member of each group must be filled, but no
// member is individually required (Applications: proofOfBilling OR
// documentPicture, matching the user website's registration wizard).
const eitherOrGroups = computed(() => resolveEitherOrGroups(props.endpoint, formColumns.value))

const eitherOrGroupFor = (col) => eitherOrGroups.value.find(group => group.includes(col)) || null

/** "Either this or <the other field>" hint shown beside the label. */
const eitherOrHint = (col) => {
  const group = eitherOrGroupFor(col)
  if (!group) return ''
  const others = group.filter(c => c !== col).map(formatLabel)
  return `Either this or ${others.join(' / ')}`
}

const hasFieldError = (scope, col) => Boolean(fieldErrors.value[scope]?.[col])
const fieldErrorText = (scope, col) => fieldErrors.value[scope]?.[col] || ''

/* ------------------------------------------------------------------
 * Photo EXIF, per form scope and column. ImageDropzone reads it off the
 * original file before compression strips it; on save the GPS is folded
 * into the Application's remarks column (there is no dedicated field),
 * in the same format the user website's registration wizard writes.
 * ------------------------------------------------------------------ */
const photoExifByCol = ref({ create: {}, edit: {} })

const onPhotoExif = (scope, col, meta) => {
  photoExifByCol.value[scope][normalizeColKey(col)] = meta || null
  if (meta && typeof meta.lat === 'number' && typeof meta.lng === 'number') {
    const targetForm = formForScope(scope).value
    const coordCol = formColumns.value.find(c => getFieldType(c) === 'coordinates')
    if (coordCol && (!targetForm[coordCol] || !parseCoordinates(targetForm[coordCol]))) {
      targetForm[coordCol] = `${meta.lat.toFixed(6)}, ${meta.lng.toFixed(6)}`
    }
  }
}

// The house front photo wins — it is taken at the installation site.
const PHOTO_GPS_PREFERENCE = ['houseFrontPicture', 'governmentValidId', 'secondGovernmentValidId', 'proofOfBilling', 'documentPicture']

const photoGpsNote = (scope) => {
  const exif = photoExifByCol.value[scope] || {}
  for (const key of PHOTO_GPS_PREFERENCE) {
    const meta = exif[normalizeColKey(key)]
    if (meta && typeof meta.lat === 'number' && typeof meta.lng === 'number') {
      const label = key === 'houseFrontPicture' ? 'house photo' : 'photo'
      return `GPS(${label}) ${meta.lat.toFixed(6)},${meta.lng.toFixed(6)}`
    }
  }
  return ''
}

/** Remarks with the photo GPS note appended (once — an existing note stays). */
const withPhotoGps = (scope, remarks) => {
  const base = remarks ? String(remarks) : ''
  const note = photoGpsNote(scope)
  if (!note || base.includes('GPS(')) return base
  return base ? `${base} | ${note}` : note
}

const formForScope = (scope) => (scope === 'edit' ? editFormData : formData)

/** The password column, resolved the same way saveData resolves it. */
const passwordColumn = () => formColumns.value.find(col => getFieldType(col) === 'password')

const passwordsMismatch = (scope) => {
  const pwdCol = passwordColumn()
  if (!pwdCol) return false
  const form = formForScope(scope).value
  const pwd = form[pwdCol] || ''
  const confirmPwd = form.confirmPassword || ''
  return Boolean(pwd && confirmPwd && pwd !== confirmPwd)
}

const isBlank = (val) => {
  if (val === null || val === undefined) return true
  if (typeof val === 'string') return val.trim() === ''
  if (val instanceof Date) return isNaN(val.getTime())
  if (Array.isArray(val)) return val.length === 0
  return false
}

const isValidPhoneNumber = (val) => {
  if (val === null || val === undefined || String(val).trim() === '') return true
  const str = String(val).trim()
  const raw = str.replace(/[\s\-()]/g, '')
  
  // Format 1: 09XXXXXXXXX or 0XXXXXXXXXX (exactly 11 digits, starts with 0)
  if (/^0\d{10}$/.test(raw)) {
    return true
  }
  // Format 2: +62XXXXXXXXXX, +63XXXXXXXXXX, or + followed by 12 digits (exactly 13 chars with '+')
  if (/^\+\d{12}$/.test(raw)) {
    return true
  }
  // Format 3: 62XXXXXXXXXX or 63XXXXXXXXXX (exactly 12 digits)
  if (/^(62|63)\d{10}$/.test(raw)) {
    return true
  }
  return false
}

const fieldWrapId = (scope, col) => `field-${scope}-${col}`

/**
 * Fills fieldErrors[scope] and returns the columns that failed, in form order
 * so the first entry is the one highest up the dialog.
 */
const validateRequired = (scope) => {
  const form = formForScope(scope).value
  const errors = {}
  const missing = []

  formColumns.value.forEach(col => {
    const type = getFieldType(col)
    const val = form[col]

    // 1. Required check
    if (isFieldRequired(col)) {
      // An existing record's password is not echoed back by the API, so demanding
      // it on edit would lock the user out of saving any other change.
      if (scope === 'edit' && ['password', 'confirm_password'].includes(type)) return
      if (isBlank(val)) {
        errors[col] = `${formatLabel(col)} is required`
        missing.push(col)
        return
      }
    }

    // 2. Phone validation (for required phone fields or optional phone fields if populated)
    if (type === 'phone' && !isBlank(val)) {
      if (!isValidPhoneNumber(val)) {
        errors[col] = `${formatLabel(col)} must be exactly 11 digits (e.g. 09123456789) or 13 characters (e.g. +639123456789 / +629123456789)`
        missing.push(col)
        return
      }
    }
  })

  // Either-or groups: flag every member when the whole group is blank, so the
  // user sees the requirement on both fields and can satisfy either one.
  eitherOrGroups.value.forEach(group => {
    if (group.every(col => isBlank(form[col]))) {
      const groupLabel = group.map(formatLabel).join(' or ')
      group.forEach(col => {
        if (!errors[col]) {
          errors[col] = `Either ${groupLabel} is required`
          missing.push(col)
        }
      })
    }
  })

  // confirmPassword is a client-only field, so it never appears in formColumns
  // required lists — mirror whatever the password field itself demands.
  const pwdCol = passwordColumn()
  if (scope === 'create' && pwdCol && isFieldRequired(pwdCol) && isBlank(form.confirmPassword)) {
    errors.confirmPassword = 'Confirm Password is required'
    missing.push('confirmPassword')
  }

  fieldErrors.value[scope] = errors
  return missing
}

/** Brings an element inside the dialog's own scroll container into view. */
const scrollIntoDialog = (el) => {
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const focusFirstInvalid = async (scope, col) => {
  await nextTick()
  const wrapper = document.getElementById(fieldWrapId(scope, col))
  if (!wrapper) return
  scrollIntoDialog(wrapper)
  const focusable = wrapper.querySelector('input, textarea, [tabindex]:not([tabindex="-1"])')
  if (focusable) focusable.focus({ preventScroll: true })
}

/** Surfaces the dialog's error banner, which sits above a tall scroll pane. */
const scrollErrorBannerIntoView = async (scope) => {
  await nextTick()
  scrollIntoDialog(document.getElementById(`form-error-${scope}`))
}

/**
 * Runs before submit. Returns true when the form is good to send; otherwise
 * marks the offending fields and points the user at the first one.
 */
const runPreSubmitChecks = async (scope) => {
  const missing = validateRequired(scope)
  const setError = (msg) => {
    if (scope === 'edit') editError.value = msg
    else saveError.value = msg
  }

  if (missing.length) {
    const firstCol = missing[0]
    const errText = fieldErrors.value[scope][firstCol] || `${missing.length} field(s) require attention. Please fix highlighted fields.`
    setError(errText)
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: errText,
      life: 5000
    })
    await focusFirstInvalid(scope, firstCol)
    return false
  }

  if (passwordsMismatch(scope)) {
    setError('Passwords do not match. Please ensure both password fields are identical.')
    await scrollErrorBannerIntoView(scope)
    return false
  }

  return true
}

// Clear a field's error as soon as it is filled in, without wiring an input
// handler onto each of the 26 field-type branches.
const watchScopeForFixes = (scope) => {
  watch(
    () => formForScope(scope).value,
    (form) => {
      const errors = fieldErrors.value[scope]
      if (!form || !errors || !Object.keys(errors).length) return
      const remaining = { ...errors }
      let changed = false
      Object.keys(errors).forEach(col => {
        const type = getFieldType(col)
        const val = form[col]
        if (type === 'phone') {
          if (isBlank(val)) {
            if (!isFieldRequired(col)) {
              delete remaining[col]
              changed = true
            }
          } else if (isValidPhoneNumber(val)) {
            delete remaining[col]
            changed = true
          }
        } else if (!isBlank(val)) {
          delete remaining[col]
          changed = true
        }
      })
      // An either-or group's errors dissolve as soon as ANY member is filled —
      // the still-blank partner is no longer missing anything.
      eitherOrGroups.value.forEach(group => {
        if (group.some(col => !isBlank(form[col]))) {
          group.forEach(col => {
            if (remaining[col] && !isFieldRequired(col)) {
              delete remaining[col]
              changed = true
            }
          })
        }
      })
      if (changed) fieldErrors.value[scope] = remaining
    },
    { deep: true }
  )
}
watchScopeForFixes('create')
watchScopeForFixes('edit')

const touchedAddressBlockers = ref({
  create_city: false,
  create_barangay: false,
  create_province: false,
  edit_city: false,
  edit_barangay: false,
  edit_province: false
})

const resetTouchedAddressBlockers = (scope) => {
  if (!scope || scope === 'create') {
    touchedAddressBlockers.value.create_city = false
    touchedAddressBlockers.value.create_barangay = false
    touchedAddressBlockers.value.create_province = false
  }
  if (!scope || scope === 'edit') {
    touchedAddressBlockers.value.edit_city = false
    touchedAddressBlockers.value.edit_barangay = false
    touchedAddressBlockers.value.edit_province = false
  }
}

/**
 * Explains why a locked address step is not responding.
 *
 * City and Barangay stay disabled until their parent is chosen.
 * An overlay on the locked dropdown catches clicks to explain the prerequisite step.
 */
const getAddressStepBlocker = (targetForm, field) => {
  const form = unwrapForm(targetForm)
  if (!form) return null
  if ((field === 'city' || field === 'province') && isCityDisabled(form)) {
    return { summary: 'Select Region first', detail: 'Please select a Region before selecting City / Municipality.' }
  }
  if (field === 'barangay' && isBarangayDisabled(form)) {
    return { summary: 'Select City first', detail: 'Please select a City / Municipality before selecting Barangay.' }
  }
  return null
}

const shouldShowAddressHint = (targetForm, field, scope = 'create') => {
  const key = `${scope}_${field}`
  if (!touchedAddressBlockers.value[key]) return false
  return !!getAddressStepBlocker(targetForm, field)
}

const notifyAddressStep = (targetForm, field, scope = 'create') => {
  const blocker = getAddressStepBlocker(targetForm, field)
  if (!blocker) return
  const key = `${scope}_${field}`
  touchedAddressBlockers.value[key] = true
  toast.add({ severity: 'warn', summary: blocker.summary, detail: blocker.detail, life: 3500 })
}

const onRegionChanged = (targetForm) => {
  const form = unwrapForm(targetForm)
  if (provinceColName.value) form[provinceColName.value] = ''
  if (cityColName.value) form[cityColName.value] = ''
  if (barangayColName.value) form[barangayColName.value] = ''
  updateCitiesForSelectedRegion(regionColName.value ? form[regionColName.value] : null)
}

const onProvinceChanged = (targetForm) => {
  const form = unwrapForm(targetForm)
  if (cityColName.value) form[cityColName.value] = ''
  if (barangayColName.value) form[barangayColName.value] = ''
  updateCitiesForSelectedProvince(
    provinceColName.value ? form[provinceColName.value] : null,
    regionColName.value ? form[regionColName.value] : null
  )
}

const onCityChanged = (targetForm) => {
  const form = unwrapForm(targetForm)
  if (barangayColName.value) form[barangayColName.value] = ''
  updateBarangaysForSelectedCity(cityColName.value ? form[cityColName.value] : null)
}

watch(
  () => formData.value.region || formData.value.regionName || formData.value.region_name,
  (newRegion) => {
    updateCitiesForSelectedRegion(newRegion)
  }
)

watch(
  () => editFormData.value.region || editFormData.value.regionName || editFormData.value.region_name,
  (newRegion) => {
    updateCitiesForSelectedRegion(newRegion)
  }
)

watch(
  () => formData.value.city || formData.value.cityName || formData.value.city_name || formData.value.municipality,
  (newCity) => {
    updateBarangaysForSelectedCity(newCity)
  }
)

watch(
  () => editFormData.value.city || editFormData.value.cityName || editFormData.value.city_name || editFormData.value.municipality,
  (newCity) => {
    updateBarangaysForSelectedCity(newCity)
  }
)

let geocodeTimer = null
let lastGeocodedCoords = ''

const onCoordinatesChanged = (scope, coords) => {
  if (!isLcpNapEndpoint.value || !coords) return
  const parsed = parseCoordinates(coords)
  if (!parsed || coords === lastGeocodedCoords) return
  if (geocodeTimer) clearTimeout(geocodeTimer)
  geocodeTimer = setTimeout(async () => {
    lastGeocodedCoords = coords
    try {
      const addr = await reverseGeocode(parsed.lat, parsed.lng)
      if (!addr) return
      const targetForm = formForScope(scope).value
      if (addr.street && !targetForm.street) {
        targetForm.street = addr.street
      }
      if (addr.barangay && !targetForm.barangay) {
        targetForm.barangay = addr.barangay
      }
      if (addr.city && !targetForm.city) {
        targetForm.city = addr.city
      }
      if (addr.provinceLike?.length && !targetForm.region) {
        const matchReg = regionOptions.value.find(r => 
          addr.provinceLike.some(p => String(p).toLowerCase().includes(String(r.label || r.value || '').toLowerCase()))
        )
        if (matchReg) targetForm.region = matchReg.value
      }
    } catch {
      // Offline or aborted
    }
  }, 500)
}

watch(
  () => formData.value.coordinates || formData.value.coordinate,
  (newCoords) => {
    onCoordinatesChanged('create', newCoords)
  }
)

watch(
  () => editFormData.value.coordinates || editFormData.value.coordinate,
  (newCoords) => {
    onCoordinatesChanged('edit', newCoords)
  }
)

watch(
  () => formData.value.barangay || formData.value.barangayName,
  (newBrgy) => {
    if (isApplicationEndpoint.value && newBrgy && !formData.value.barangay1) {
      formData.value.barangay1 = newBrgy
    }
  }
)

watch(displayCreateDialog, (isOpen) => {
  if (!isOpen) {
    resetTouchedAddressBlockers('create')
    fieldErrors.value.create = {}
  }
})

watch(displayEditDialog, (isOpen) => {
  if (!isOpen) {
    resetTouchedAddressBlockers('edit')
    fieldErrors.value.edit = {}
  }
})

const getAccessLevelLabel = (id) => {
  if (id === null || id === undefined) return '-'
  const found = accessLevels.value.find(opt => opt.value === Number(id) || opt.value === id)
  return found ? (found.nameOnly || found.label) : `ID: ${id}`
}

const getStatusBadgeConfig = (val) => {
  if (val === null || val === undefined || val === '') return { class: 'bg-secondary bg-opacity-10 text-secondary border-secondary border-opacity-25', label: '-' }
  const str = String(val).trim()
  const lower = str.toLowerCase()
  
  if (lower === 'done' || lower === 'completed' || lower === 'paid' || lower === 'approved' || lower === 'active') {
    return { class: 'bg-success bg-opacity-10 text-success border-success border-opacity-25', label: str }
  }
  if (lower === 'pending' || lower === 'in progress' || lower === 'waiting' || lower === 'onsite pending') {
    return { class: 'bg-warning bg-opacity-15 text-warning-emphasis border-warning border-opacity-25', label: str }
  }
  if (lower === 'unbilled' || lower === 'draft' || lower === 'inactive' || lower === 'unassigned') {
    return { class: 'bg-secondary bg-opacity-10 text-secondary border-secondary border-opacity-25', label: str }
  }
  if (lower === 'failed' || lower === 'rejected' || lower === 'cancelled' || lower === 'denied') {
    return { class: 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25', label: str }
  }
  return { class: 'bg-info bg-opacity-10 text-info border-info border-opacity-25', label: str }
}

const isUserRefField = (col) => {
  if (!col) return false
  const lower = col.toLowerCase().replace(/_/g, '')
  return (
    lower.includes('createdby') ||
    lower.includes('modifiedby') ||
    lower.includes('updatedby') ||
    lower.includes('processedby') ||
    lower.includes('verifiedby') ||
    lower.includes('lastmodifiedby') ||
    lower === 'createdbyuserid' ||
    lower === 'modifiedbyuserid' ||
    lower === 'userid'
  )
}

const usersMap = computed(() => {
  const map = new Map()

  // 1. Current logged-in user from authStore
  const cur = authStore.user
  if (cur) {
    const curNameParts = [cur.fname || cur.firstName || cur.first_name, cur.lname || cur.lastName || cur.last_name].filter(Boolean)
    const curName = curNameParts.join(' ').trim() || cur.username || cur.name || cur.email || (cur.id !== undefined ? `User #${cur.id}` : 'Current User')
    if (cur.id !== undefined && cur.id !== null) {
      map.set(Number(cur.id), curName)
      map.set(String(cur.id).trim(), curName)
    }
    if (cur.username) {
      map.set(cur.username.toLowerCase(), curName)
      map.set(String(cur.username).trim(), curName)
    }
    if (cur.email) {
      map.set(cur.email.toLowerCase(), curName)
      map.set(String(cur.email).trim(), curName)
    }
  }

  // 2. Combine userStore.users and local usersList
  const combinedList = [...(userStore.users || []), ...(usersList.value || [])]
  combinedList.forEach(u => {
    if (!u) return
    const nameParts = [
      u.fname || u.firstName || u.first_name,
      u.mname || u.middleName || u.middle_name,
      u.lname || u.lastName || u.last_name
    ].filter(Boolean)
    const fullName = nameParts.join(' ').trim()
    const name = fullName || u.username || u.name || u.email || (u.id !== undefined ? `User #${u.id}` : 'Unknown User')
    if (u.id !== undefined && u.id !== null) {
      map.set(Number(u.id), name)
      map.set(String(u.id).trim(), name)
    }
    if (u.username) {
      map.set(u.username.toLowerCase(), name)
      map.set(String(u.username).trim(), name)
    }
    if (u.email) {
      map.set(u.email.toLowerCase(), name)
      map.set(String(u.email).trim(), name)
    }
  })
  return map
})

const getUserDisplayName = (val) => {
  if (val === null || val === undefined || val === '') return '-'
  const strVal = String(val).trim()
  if (usersMap.value.has(strVal)) return usersMap.value.get(strVal)
  if (!isNaN(val) && usersMap.value.has(Number(val))) return usersMap.value.get(Number(val))
  if (usersMap.value.has(strVal.toLowerCase())) return usersMap.value.get(strVal.toLowerCase())

  // If the value stored in createdBy / modifiedBy is an ISO date string (from legacy data or seed scripts)
  const isIsoDate = /^\d{4}-\d{2}-\d{2}/.test(strVal) || (!isNaN(Date.parse(strVal)) && strVal.includes('T') && strVal.includes(':'))
  if (isIsoDate) {
    const adminUser = usersMap.value.get(1) || usersMap.value.get(authStore.user?.id) || (authStore.user?.fname ? `${authStore.user.fname} ${authStore.user.lname || ''}`.trim() : null) || authStore.user?.username || 'Administrator'
    return adminUser
  }

  // Fallback for numeric IDs not yet loaded
  if (!isNaN(val) && Number(val) > 0) {
    return `User #${strVal}`
  }
  return strVal
}

const formatViewFieldValue = (col, val) => {
  if (val === null || val === undefined || val === '') return '-'
  if (col.toLowerCase() === 'password' || col.toLowerCase() === 'pass' || col.toLowerCase() === 'pwd') {
    return '••••••••'
  }
  if (isUserRefField(col)) {
    return getUserDisplayName(val)
  }
  if (col.toLowerCase() === 'accesslevel_id' || col.toLowerCase() === 'accesslevelid') {
    return getAccessLevelLabel(val)
  }

  // Lookup human-readable labels for infrastructure & dropdown fields
  const type = getFieldType(col)
  let targetList = null
  if (type === 'vlan_dropdown') targetList = vlansList.value
  else if (type === 'lcp_dropdown') targetList = lcpsList.value
  else if (type === 'nap_dropdown') targetList = napsList.value
  else if (type === 'port_dropdown') targetList = portsList.value
  else if (type === 'lcpnap_dropdown') targetList = lcpnapsList.value
  else if (type === 'lcpnapport_dropdown') targetList = lcpnapportsList.value
  else if (type === 'plan_dropdown') targetList = plansList.value

  if (targetList && targetList.length > 0) {
    const found = targetList.find(opt => 
      opt.value === val || 
      opt.id === val || 
      opt.id === Number(val) ||
      String(opt.value).toLowerCase() === String(val).toLowerCase()
    )
    if (found) return found.label
  }

  return String(val)
}

const openCreateDialog = () => {
  fetchAddressData()
  resetTouchedAddressBlockers('create')
  fieldErrors.value.create = {}
  photoExifByCol.value.create = {}
  saveError.value = null
  showPasswordState.value = {}
  formData.value = {}
  const currentUser = authStore.user?.fname ? `${authStore.user.fname} ${authStore.user.lname || ''}`.trim() : (authStore.user?.name || authStore.user?.username || authStore.user?.email || '')
  const currentUserIdOrName = authStore.user?.id || currentUser

  formColumns.value.forEach(col => {
    const type = getFieldType(col)
    const lowerCol = col.toLowerCase()

    if ((lowerCol.includes('modifiedby') || lowerCol.includes('createdby')) && currentUser) {
      formData.value[col] = currentUserIdOrName
    } else if (lowerCol === 'preferredday' && currentUser) {
      formData.value[col] = currentUser
    } else if (type === 'toggle') {
      formData.value[col] = true
    } else if (type === 'agreement_checkbox') {
      formData.value[col] = ''
    } else if (type === 'status_dropdown' && statusOptions.value.length > 0) {
      formData.value[col] = statusOptions.value[0].value
    } else if (type === 'onsitestatus_dropdown' && onsiteStatusOptions.value.length > 0) {
      formData.value[col] = onsiteStatusOptions.value[0].value
    } else if (type === 'billingstatus_dropdown' && billingStatusOptions.value.length > 0) {
      formData.value[col] = billingStatusOptions.value[0].value
    } else if (type === 'usagetype_dropdown' && usageTypeOptions.value.length > 0) {
      formData.value[col] = usageTypeOptions.value[0].value
    } else if (type === 'accesslevel_dropdown' && accessLevels.value.length > 0) {
      const guestOption = accessLevels.value.find(opt => (opt.nameOnly || opt.label || '').toLowerCase().includes('guest'))
      formData.value[col] = guestOption ? guestOption.value : accessLevels.value[0].value
    } else if (type === 'referredby_dropdown') {
      formData.value[col] = 'None'
    } else if (type === 'menu_dropdown' || type === 'lcpnap_dropdown' || type === 'lcpnapport_dropdown' || type === 'lcp_dropdown' || type === 'nap_dropdown' || type === 'port_dropdown' || type === 'vlan_dropdown' || type === 'plan_dropdown') {
      formData.value[col] = null
    } else {
      formData.value[col] = ''
    }
  })

  if (isApplicationEndpoint.value) {
    const statusCol = formColumns.value.find(c => c.toLowerCase() === 'status')
    if (statusCol) {
      formData.value[statusCol] = 'In Progress'
    }
    const nowIso = new Date().toISOString()
    const tsCol = formColumns.value.find(c => c.toLowerCase() === 'timestamp')
    if (tsCol) {
      formData.value[tsCol] = nowIso
    }
  }
  // Default region for Create modal if empty
  const createRegCol = formColumns.value.find(c => getFieldType(c) === 'region_dropdown')
  if (createRegCol && !formData.value[createRegCol]) {
    const defaultRegion = (regionsList.value || []).find(r => 
      (r.name && r.name.toLowerCase().includes('calabarzon')) ||
      (r.regionName && r.regionName.toLowerCase().includes('region iv-a')) ||
      (r.value && r.value.toLowerCase().includes('calabarzon'))
    ) || (regionsList.value && regionsList.value.length > 0 ? regionsList.value[0] : null)
    if (defaultRegion) {
      formData.value[createRegCol] = defaultRegion.value
      updateCitiesForSelectedRegion(defaultRegion.value)
    }
  }

  formData.value.confirmPassword = ''
  displayCreateDialog.value = true
}

const syncPairedFields = (payload) => {
  if (!payload) return
  if (payload.planId) {
    payload.choose_Plan = String(payload.planId)
    payload.plan = String(payload.planId)
  }
  if (payload.lcpId) {
    const found = lcpsList.value.find(opt => opt.value === payload.lcpId || opt.id === payload.lcpId)
    if (found) payload.lcp = found.label
  }
  if (payload.napId) {
    const found = napsList.value.find(opt => opt.value === payload.napId || opt.id === payload.napId)
    if (found) payload.nap = found.label
  }
  if (payload.portId) {
    const found = portsList.value.find(opt => opt.value === payload.portId || opt.id === payload.portId)
    if (found) payload.port = found.label
  }
  if (payload.vlanId) {
    const found = vlansList.value.find(opt => opt.value === payload.vlanId || opt.id === payload.vlanId)
    if (found) payload.vlan = found.label
  }
  if (payload.lcpnapId) {
    const found = lcpnapsList.value.find(opt => opt.value === payload.lcpnapId || opt.id === payload.lcpnapId)
    if (found) payload.lcnap = found.label
  }
  if (payload.lcpnapportId) {
    const found = lcpnapportsList.value.find(opt => opt.value === payload.lcpnapportId || opt.id === payload.lcpnapportId)
    if (found) payload.lcpnapport = found.label
  }
  if (payload.lcp && payload.nap && !payload.lcpnap) {
    payload.lcpnap = `${payload.lcp} ${payload.nap}`
  }

  // Ensure picture of statement billing from other provider is synced to backend
  // key. proofOfBilling is deliberately NOT a fallback here: since the backend
  // change it is its own document field, distinct from the legacy provider
  // statement picture.
  const statementBillingVal = payload.pictureofstatmentbillingfromotherprovider ||
                              payload.pictureOfStatementBillingFromOtherProvider ||
                              payload.picture_of_statement_billing_from_other_provider ||
                              payload.pictureofstatementbillingfromotherprovider ||
                              payload.statementBilling || ''
  if (statementBillingVal) {
    payload.pictureofstatmentbillingfromotherprovider = statementBillingVal
  }
}

const saveData = async () => {
  saveError.value = null

  // Required fields and password confirmation, before anything is sent.
  if (!await runPreSubmitChecks('create')) return

  saving.value = true
  try {
    const payload = { ...formData.value }
    syncPairedFields(payload)
    delete payload.confirmPassword
    if (!allRawColumns.value.includes('email')) {
      delete payload.email
    }

    const numericUserId = Number(authStore.user?.id) || 1
    const loggedInUserId = String(authStore.user?.id || 1)
    const currentUserEmail = authStore.user?.email || 'admin@switchfiber.com'
    const nowIso = new Date().toISOString()
    
    // Clean legacy alias audit columns
    delete payload.lastModified
    delete payload.last_modified
    delete payload.lastModifiedBy
    delete payload.last_modified_by

    let finalPayload
    if (isApplicationEndpoint.value) {
      finalPayload = {
        timestamp: payload.timestamp ? (payload.timestamp instanceof Date ? payload.timestamp.toISOString() : String(payload.timestamp)) : nowIso,
        emailAddress: payload.emailAddress ? String(payload.emailAddress) : '',
        region: payload.region ? String(payload.region) : '',
        city: payload.city ? String(payload.city) : '',
        barangay: payload.barangay ? String(payload.barangay) : '',
        referredBy: payload.referredBy ? String(payload.referredBy) : '',
        firstName: payload.firstName ? String(payload.firstName) : '',
        middleName: payload.middleName ? String(payload.middleName) : '',
        lastName: payload.lastName ? String(payload.lastName) : '',
        mobileNumber: payload.mobileNumber ? String(payload.mobileNumber) : '',
        secondaryMobileNumber: payload.secondaryMobileNumber ? String(payload.secondaryMobileNumber) : '',
        installationAddress: payload.installationAddress ? String(payload.installationAddress) : '',
        landmark: payload.landmark ? String(payload.landmark) : '',
        desiredPlan: payload.desiredPlan ? String(payload.desiredPlan) : '',
        proofOfBilling: payload.proofOfBilling ? String(payload.proofOfBilling) : '',
        governmentValidId: payload.governmentValidId ? String(payload.governmentValidId) : '',
        secondGovernmentValidId: payload.secondGovernmentValidId ? String(payload.secondGovernmentValidId) : '',
        houseFrontPicture: payload.houseFrontPicture ? String(payload.houseFrontPicture) : '',
        termsAndConditionsAgreement: normalizeAgreementValue(payload.termsAndConditionsAgreement),
        firstNearestLandmark: payload.firstNearestLandmark ? String(payload.firstNearestLandmark) : '',
        secondNearestLandmark: payload.secondNearestLandmark ? String(payload.secondNearestLandmark) : '',
        applicablePromo: payload.applicablePromo ? String(payload.applicablePromo) : '',
        documentPicture: payload.documentPicture ? String(payload.documentPicture) : '',
        barangay1: payload.barangay1 ? String(payload.barangay1) : (payload.barangay ? String(payload.barangay) : ''),
        barangay2: payload.barangay2 ? String(payload.barangay2) : '',
        pictureofstatmentbillingfromotherprovider: payload.pictureofstatmentbillingfromotherprovider || payload.pictureofstatementbillingfromotherprovider ? String(payload.pictureofstatmentbillingfromotherprovider || payload.pictureofstatementbillingfromotherprovider) : '',
        referrersAccountNumber: payload.referrersAccountNumber ? String(payload.referrersAccountNumber) : '',
        applyingFor: payload.applyingFor ? String(payload.applyingFor) : '',
        status: payload.status ? String(payload.status) : 'In Progress',
        visitBy: payload.visitBy ? String(payload.visitBy) : '',
        visitWith: payload.visitWith ? String(payload.visitWith) : '',
        visitWithOther: payload.visitWithOther ? String(payload.visitWithOther) : '',
        remarks: withPhotoGps('create', payload.remarks),
        // modifiedBy: loggedInUserId, // Excluded for backend migration
        // modifiedDate: '', // Excluded for backend migration
        userEmail: currentUserEmail
      }
    } else {
      // Exclude all audit fields (createdBy, modifiedBy, createdDate, modifiedDate, etc.) for backend migration
      Object.keys(payload).forEach(key => {
        if (isAuditField(key) && key.toLowerCase() !== 'id') {
          delete payload[key]
        }
      })

      if (columns.value.includes('userEmail') && !payload.userEmail) {
        payload.userEmail = currentUserEmail
      } else if (!columns.value.includes('userEmail')) {
        delete payload.userEmail
      }

      // Clean null / empty string fields and format numeric / date fields properly
      finalPayload = { ...payload }
      Object.keys(finalPayload).forEach(key => {
        if (finalPayload[key] === '' || finalPayload[key] === null || finalPayload[key] === undefined) {
          delete finalPayload[key]
        } else if (finalPayload[key] instanceof Date) {
          const d = finalPayload[key]
          finalPayload[key] = d.toISOString()
        } else if (typeof finalPayload[key] === 'string' && finalPayload[key].trim() !== '' && !isNaN(finalPayload[key]) && getFieldType(key) === 'number' && key !== 'id') {
          finalPayload[key] = Number(finalPayload[key])
        }
      })
    }
    
    console.log(`[DynamicApiTable] Submitting CREATE to endpoint: /api/${props.endpoint}`, finalPayload)
    await apiClient.post(`/${props.endpoint}`, finalPayload)

    // Refresh table
    await fetchData()
    displayCreateDialog.value = false
    toast.add({
      severity: 'success',
      summary: 'Record created',
      detail: `New ${formatLabel(props.endpoint)} record saved successfully.`,
      life: 3000
    })
  } catch (err) {
    console.error(`Error creating record for ${props.endpoint}:`, err)
    saveError.value = err.message || 'Failed to create record. Please check input values.'
    await scrollErrorBannerIntoView('create')
  } finally {
    saving.value = false
  }
}

const getRecordId = (record) => {
  if (!record || typeof record !== 'object') return null
  if ('id' in record && record.id !== undefined && record.id !== null) return record.id
  if ('Id' in record && record.Id !== undefined && record.Id !== null) return record.Id
  if ('ID' in record && record.ID !== undefined && record.ID !== null) return record.ID
  const key = Object.keys(record).find(k => k.toLowerCase().endsWith('id'))
  if (key && record[key] !== undefined && record[key] !== null) return record[key]
  const firstVal = Object.values(record)[0]
  return firstVal !== undefined && firstVal !== null ? firstVal : null
}

const openViewDialog = (record) => {
  viewingRecordId.value = getRecordId(record) || ''
  viewFormData.value = { ...record }
  displayViewDialog.value = true
  if ((!usersList.value || usersList.value.length === 0) && (!userStore.users || userStore.users.length === 0)) {
    userStore.fetchUsers().catch(() => {})
  }
}

const openEditDialog = async (record) => {
  resetTouchedAddressBlockers('edit')
  fieldErrors.value.edit = {}
  photoExifByCol.value.edit = {}
  editError.value = null
  showPasswordState.value = {}
  editingRecordId.value = getRecordId(record)
  editFormData.value = { ...record }
  const currentUser = authStore.user?.fname ? `${authStore.user.fname} ${authStore.user.lname || ''}`.trim() : (authStore.user?.name || authStore.user?.username || authStore.user?.email || '')
  const currentUserIdOrName = authStore.user?.id || currentUser

  // 1. Normalize and match Region
  const regCol = formColumns.value.find(c => getFieldType(c) === 'region_dropdown')
  const rawRegion = regCol ? editFormData.value[regCol] : (record.region || record.regionName || record.region_name || '')
  let matchedRegionVal = rawRegion
  if (rawRegion) {
    const str = String(rawRegion).trim().toLowerCase()
    const match = (regionsList.value || []).find(r => 
      (r.name && r.name.toLowerCase() === str) ||
      (r.value && r.value.toLowerCase() === str) ||
      (r.code && String(r.code).toLowerCase() === str) ||
      (r.regionName && r.regionName.toLowerCase() === str) ||
      (r.name && str.includes(r.name.toLowerCase())) ||
      (r.regionName && str.includes(r.regionName.toLowerCase())) ||
      (r.label && r.label.toLowerCase().includes(str))
    )
    if (match) {
      matchedRegionVal = match.value
      if (regCol) editFormData.value[regCol] = match.value
    }
  }

  // If region is still empty/unmatched, default to Region IV-A (CALABARZON) for LCP NAP & Application records
  if (!matchedRegionVal || (regCol && !editFormData.value[regCol])) {
    const defaultRegion = (regionsList.value || []).find(r => 
      (r.name && r.name.toLowerCase().includes('calabarzon')) ||
      (r.regionName && r.regionName.toLowerCase().includes('region iv-a')) ||
      (r.value && r.value.toLowerCase().includes('calabarzon'))
    ) || (regionsList.value && regionsList.value.length > 0 ? regionsList.value[0] : null)
    if (defaultRegion) {
      matchedRegionVal = defaultRegion.value
      if (regCol) editFormData.value[regCol] = defaultRegion.value
    }
  }

  // 2. Pre-load cities for the region
  await updateCitiesForSelectedRegion(matchedRegionVal)

  // 3. Normalize and match City
  const cCol = formColumns.value.find(c => getFieldType(c) === 'city_dropdown')
  const rawCity = cCol ? editFormData.value[cCol] : (record.city || record.cityName || record.city_name || record.municipality || '')
  let matchedCityVal = rawCity
  if (rawCity) {
    const str = String(rawCity).trim().toLowerCase()
    const match = (citiesList.value || []).find(c => 
      (c.name && c.name.toLowerCase() === str) ||
      (c.value && c.value.toLowerCase() === str) ||
      (c.code && String(c.code).toLowerCase() === str)
    )
    if (match) {
      matchedCityVal = match.value
      if (cCol) editFormData.value[cCol] = match.value
    }
  }

  // 4. Pre-load barangays for the city
  await updateBarangaysForSelectedCity(matchedCityVal)

  // 5. Normalize and match Barangay
  const bCol = formColumns.value.find(c => getFieldType(c) === 'barangay_dropdown')
  const rawBrgy = bCol ? editFormData.value[bCol] : (record.barangay || record.barangayName || record.barangay_name || '')
  if (rawBrgy) {
    const str = String(rawBrgy).trim().toLowerCase()
    const match = (barangaysList.value || []).find(b => 
      (b.name && b.name.toLowerCase() === str) ||
      (b.value && b.value.toLowerCase() === str) ||
      (b.name && b.name.toLowerCase().startsWith(str)) ||
      (b.value && b.value.toLowerCase().startsWith(str))
    )
    if (match) {
      if (bCol) editFormData.value[bCol] = match.value
    }
  }

  // 6. Normalize and match Status
  const statusCol = formColumns.value.find(c => getFieldType(c) === 'status_dropdown') || 'status'
  const curStatus = record[statusCol]
  if (isApplicationEndpoint.value) {
    if (curStatus) {
      const match = APPLICATION_STATUS_LIST.find(
        s => s.toLowerCase() === String(curStatus).trim().toLowerCase()
      )
      editFormData.value[statusCol] = match || 'In Progress'
    } else {
      editFormData.value[statusCol] = 'In Progress'
    }
  }

  formColumns.value.forEach(col => {
    const type = getFieldType(col)
    const lowerCol = col.toLowerCase()

    if ((lowerCol.includes('modifiedby') || lowerCol.includes('updatedby')) && currentUser) {
      editFormData.value[col] = currentUserIdOrName
    } else if (type === 'toggle') {
      editFormData.value[col] = record[col] === true || record[col] === 'true'
    } else if (type === 'agreement_checkbox') {
      editFormData.value[col] = isAgreementChecked(record[col]) ? 'Yes, I Agree' : ''
    } else if (type === 'date' && record[col]) {
      const d = new Date(record[col])
      editFormData.value[col] = isNaN(d.getTime()) ? record[col] : d
    } else if (record[col] === null || record[col] === undefined) {
      editFormData.value[col] = ''
    }

    // Handle mapping of fiber infrastructure & provisioning fields (resolution by Name or ID)
    const val = record[col]
    if (val !== null && val !== undefined && val !== '') {
      let targetList = null
      if (type === 'lcpnap_dropdown') targetList = lcpnapsList.value
      else if (type === 'lcpnapport_dropdown') targetList = lcpnapportsList.value
      else if (type === 'lcp_dropdown') targetList = lcpsList.value
      else if (type === 'nap_dropdown') targetList = napsList.value
      else if (type === 'port_dropdown') targetList = portsList.value
      else if (type === 'vlan_dropdown') targetList = vlansList.value
      else if (type === 'plan_dropdown') targetList = getPlanOptions(col, val)
      else if (type === 'referredby_dropdown') targetList = getReferrerOptions(val)

      if (targetList && targetList.length > 0) {
        const match = targetList.find(opt => opt.value === val || opt.value === String(val) || opt.id === val || opt.id === Number(val))
        if (match) {
          editFormData.value[col] = match.value
        }
      }
    }
  })
  const pwdCol = formColumns.value.find(col => getFieldType(col) === 'password')
  if (pwdCol) {
    editFormData.value.confirmPassword = record[pwdCol] || editFormData.value[pwdCol] || ''
  }

  displayEditDialog.value = true
}

const saveEdit = async () => {
  editError.value = null

  if (!editingRecordId.value) {
    editError.value = 'This record has no identifier, so it cannot be updated. Close the dialog and refresh the table.'
    return
  }

  // Required fields and password confirmation, before anything is sent.
  if (!await runPreSubmitChecks('edit')) return

  savingEdit.value = true
  try {
    const payload = { ...editFormData.value }
    syncPairedFields(payload)
    delete payload.confirmPassword
    if (!allRawColumns.value.includes('email')) {
      delete payload.email
    }

    const numericUserId = Number(authStore.user?.id) || 1
    const loggedInUserId = String(authStore.user?.id || 1)
    const currentUserEmail = authStore.user?.email || 'admin@switchfiber.com'
    const nowIso = new Date().toISOString()
    
    // Clean legacy / alias audit columns and read-only creation audit fields
    delete payload.lastModified
    delete payload.last_modified
    delete payload.lastModifiedBy
    delete payload.last_modified_by

    let finalPayload
    if (isApplicationEndpoint.value) {
      finalPayload = {
        emailAddress: payload.emailAddress ? String(payload.emailAddress) : '',
        region: payload.region ? String(payload.region) : '',
        city: payload.city ? String(payload.city) : '',
        barangay: payload.barangay ? String(payload.barangay) : '',
        referredBy: payload.referredBy ? String(payload.referredBy) : '',
        firstName: payload.firstName ? String(payload.firstName) : '',
        middleName: payload.middleName ? String(payload.middleName) : '',
        lastName: payload.lastName ? String(payload.lastName) : '',
        mobileNumber: payload.mobileNumber ? String(payload.mobileNumber) : '',
        secondaryMobileNumber: payload.secondaryMobileNumber ? String(payload.secondaryMobileNumber) : '',
        installationAddress: payload.installationAddress ? String(payload.installationAddress) : '',
        landmark: payload.landmark ? String(payload.landmark) : '',
        desiredPlan: payload.desiredPlan ? String(payload.desiredPlan) : '',
        proofOfBilling: payload.proofOfBilling ? String(payload.proofOfBilling) : '',
        governmentValidId: payload.governmentValidId ? String(payload.governmentValidId) : '',
        secondGovernmentValidId: payload.secondGovernmentValidId ? String(payload.secondGovernmentValidId) : '',
        houseFrontPicture: payload.houseFrontPicture ? String(payload.houseFrontPicture) : '',
        termsAndConditionsAgreement: normalizeAgreementValue(payload.termsAndConditionsAgreement),
        firstNearestLandmark: payload.firstNearestLandmark ? String(payload.firstNearestLandmark) : '',
        secondNearestLandmark: payload.secondNearestLandmark ? String(payload.secondNearestLandmark) : '',
        applicablePromo: payload.applicablePromo ? String(payload.applicablePromo) : '',
        documentPicture: payload.documentPicture ? String(payload.documentPicture) : '',
        barangay1: payload.barangay1 ? String(payload.barangay1) : (payload.barangay ? String(payload.barangay) : ''),
        barangay2: payload.barangay2 ? String(payload.barangay2) : '',
        pictureofstatmentbillingfromotherprovider: payload.pictureofstatmentbillingfromotherprovider || payload.pictureofstatementbillingfromotherprovider ? String(payload.pictureofstatmentbillingfromotherprovider || payload.pictureofstatementbillingfromotherprovider) : '',
        referrersAccountNumber: payload.referrersAccountNumber ? String(payload.referrersAccountNumber) : '',
        applyingFor: payload.applyingFor ? String(payload.applyingFor) : '',
        status: payload.status ? String(payload.status) : 'In Progress',
        visitBy: payload.visitBy ? String(payload.visitBy) : '',
        visitWith: payload.visitWith ? String(payload.visitWith) : '',
        visitWithOther: payload.visitWithOther ? String(payload.visitWithOther) : '',
        remarks: withPhotoGps('edit', payload.remarks),
        // modifiedBy: loggedInUserId, // Excluded for backend migration
        // modifiedDate: '', // Excluded for backend migration
        userEmail: payload.userEmail || currentUserEmail
      }
    } else {
      // Exclude all audit fields (createdBy, modifiedBy, createdDate, modifiedDate, etc.) for backend migration
      Object.keys(payload).forEach(key => {
        if (isAuditField(key) && key.toLowerCase() !== 'id') {
          delete payload[key]
        }
      })

      finalPayload = { ...payload }
      Object.keys(finalPayload).forEach(key => {
        if (finalPayload[key] === '' || finalPayload[key] === null || finalPayload[key] === undefined) {
          delete finalPayload[key]
        } else if (finalPayload[key] instanceof Date) {
          finalPayload[key] = finalPayload[key].toISOString()
        } else if (typeof finalPayload[key] === 'string' && finalPayload[key].trim() !== '' && !isNaN(finalPayload[key]) && getFieldType(key) === 'number' && key !== 'id') {
          finalPayload[key] = Number(finalPayload[key])
        }
      })
    }

    console.log(`[DynamicApiTable] Submitting PUT to endpoint: /api/${props.endpoint}/${editingRecordId.value}`, finalPayload)
    const updatedId = editingRecordId.value
    await apiClient.put(`/${props.endpoint}/${updatedId}`, finalPayload)
    await fetchData()
    displayEditDialog.value = false
    toast.add({
      severity: 'success',
      summary: 'Record updated',
      detail: `${formatLabel(props.endpoint)} record #${updatedId} saved successfully.`,
      life: 3000
    })
  } catch (err) {
    console.error(`Error updating record for ${props.endpoint}:`, err)
    editError.value = err.message || 'Failed to update record. Please check input values.'
    await scrollErrorBannerIntoView('edit')
  } finally {
    savingEdit.value = false
  }
}

const confirmDelete = (record) => {
  deleteError.value = null
  recordToDelete.value = record
  displayDeleteDialog.value = true
}

const deleteRecord = async () => {
  const targetId = getRecordId(recordToDelete.value)
  if (targetId === null || targetId === undefined) {
    console.error('[deleteRecord] Could not resolve record ID:', recordToDelete.value)
    deleteError.value = 'Failed to identify record ID for deletion.'
    return
  }

  deleting.value = true
  deleteError.value = null
  try {
    console.log(`[DynamicApiTable] Submitting DELETE to endpoint: /api/${props.endpoint}/${targetId}`)
    await apiClient.delete(`/${props.endpoint}/${targetId}`)
    await fetchData()
    displayDeleteDialog.value = false
    toast.add({
      severity: 'success',
      summary: 'Record deleted',
      detail: `${formatLabel(props.endpoint)} record #${targetId} was removed.`,
      life: 3000
    })
  } catch (err) {
    console.error(`Error deleting record for ${props.endpoint}:`, err)
    deleteError.value = err.message || 'Failed to delete record.'
  } finally {
    deleting.value = false
  }
}

// Monotonic request token: only the newest fetch is allowed to write to `data`,
// so a slow response for a filter the user has already moved off cannot land.
let fetchToken = 0

// `silent` skips the full-page skeleton so the toolbar stays visible during a manual refresh
const fetchData = async ({ silent = false } = {}) => {
  const token = ++fetchToken
  if (!silent) {
    loading.value = true
    // Mark the dataset unconfirmed for the duration of the request. The skeleton
    // replaces the table while `loading` is true, so the previous filter's rows
    // stay in `data` (dropping them would collapse `allRawColumns` onto the
    // static fallback and prune the user's visible-column selection) but nothing
    // derived from them can be asserted as the current result.
    hasFetched.value = false
    firstRowIndex.value = 0
  }
  error.value = null
  try {
    let url = `/${props.endpoint}`
    let params = undefined

    // Date bounds only go upstream for endpoints that opted in via
    // `serverDateFilter` (older /filter backends returned an empty array as soon
    // as fromDate or toDate was supplied); otherwise `serverFilterParams` has
    // already stripped them and they are applied client-side in `filteredData`.
    const serverParams = { ...serverFilterParams.value }

    if (Object.keys(serverParams).length > 0) {
      if (props.filterEndpoint) {
        url = props.filterEndpoint.startsWith('/') ? props.filterEndpoint : `/${props.filterEndpoint}`
      } else {
        url = `/${props.endpoint}/filter`
      }
      params = serverParams
    } else {
      url = `/${props.endpoint}`
      params = undefined
    }

    const response = await apiClient.get(url, { params })

    // A newer fetch was started while this one was in flight — discard this result
    if (token !== fetchToken) return

    let unwrappedData = response
    if (response && !Array.isArray(response) && typeof response === 'object') {
      const arrayKey = Object.keys(response).find(key => Array.isArray(response[key]))
      if (arrayKey) {
        unwrappedData = response[arrayKey]
      } else {
        unwrappedData = []
      }
    }
    
    if (props.endpoint && props.endpoint.toLowerCase() === 'menus') {
      const menuList = unwrappedData || []
      
      const appItem = menuList.find(m => Number(m.id) === 14)
      if (appItem) {
        appItem.name = 'All Application'
        appItem.route = '/application'
      } else {
        menuList.push({ id: 14, name: 'All Application', route: '/application', icon: 'pi pi-list', description: 'View all customer fiber connection applications' })
      }

      const hasInProgress = menuList.some(m => Number(m.id) === 26 || (m.name && m.name.toLowerCase().includes('in progress')))
      const hasDone = menuList.some(m => Number(m.id) === 27 || (m.name && m.name.toLowerCase() === 'done'))
      const hasApproved = menuList.some(m => Number(m.id) === 28 || (m.name && m.name.toLowerCase() === 'approved'))

      if (!hasInProgress) {
        menuList.push({ id: 26, name: 'In Progress', route: '/application/in-progress', icon: 'pi pi-clock', description: 'View and process in-progress customer applications' })
      }
      if (!hasDone) {
        menuList.push({ id: 27, name: 'Done', route: '/application/done', icon: 'pi pi-check-circle', description: 'View completed customer applications' })
      }
      if (!hasApproved) {
        menuList.push({ id: 28, name: 'Approved', route: '/application/approved', icon: 'pi pi-verified', description: 'View verified and approved customer applications' })
      }

      const hasAllJobOrders = menuList.some(m => Number(m.id) === 32 || (m.name && m.name.toLowerCase() === 'all job orders'))
      const hasJobOrdersInProgress = menuList.some(m => Number(m.id) === 33)
      const hasJobOrdersCompleted = menuList.some(m => Number(m.id) === 34)
      const hasJobOrdersActivated = menuList.some(m => Number(m.id) === 35)

      if (!hasAllJobOrders) {
        menuList.push({ id: 32, name: 'All Job Orders', route: '/job-orders', icon: 'pi pi-list', description: 'View all technical dispatch job orders' })
      }
      if (!hasJobOrdersInProgress) {
        menuList.push({ id: 33, name: 'Job Orders In Progress', route: '/job-orders/inprogress', icon: 'pi pi-clock', description: 'View and process in-progress job orders' })
      }
      if (!hasJobOrdersCompleted) {
        menuList.push({ id: 34, name: 'Job Orders Completed', route: '/job-orders/completed', icon: 'pi pi-check-circle', description: 'View completed job orders' })
      }
      if (!hasJobOrdersActivated) {
        menuList.push({ id: 35, name: 'Job Orders Activated', route: '/job-orders/activated', icon: 'pi pi-verified', description: 'View activated job orders' })
      }

      const hasDisconnection = menuList.some(m => Number(m.id) === 30 || (m.name && m.name.toLowerCase() === 'disconnection'))
      if (!hasDisconnection) {
        menuList.push({ id: 30, name: 'Disconnection', route: '/disconnection', icon: 'pi pi-ban', description: 'Review RADIUS subscriber accounts and their enabled / disabled state' })
      }

      const hasLcpNapLocations = menuList.some(m => Number(m.id) === 36 || (m.name && m.name.toLowerCase() === 'lcp nap locations'))
      if (!hasLcpNapLocations) {
        menuList.push({ id: 36, name: 'LCP NAP Locations', route: '/lcp-nap-locations', icon: 'pi pi-map', description: 'LCP cabinet and NAP box locations — map view and record maintenance' })
      }
      const hasLcpNapMap = menuList.some(m => Number(m.id) === 37 || (m.name && m.name.toLowerCase() === 'lcp nap map'))
      if (!hasLcpNapMap) {
        menuList.push({ id: 37, name: 'LCP NAP Map', route: '/lcp-nap-locations/map', icon: 'pi pi-map-marker', description: 'Map of LCP cabinets and NAP boxes plotted from their field coordinates' })
      }
      const hasLcpNapRecords = menuList.some(m => Number(m.id) === 38 || (m.name && m.name.toLowerCase() === 'lcp nap records'))
      if (!hasLcpNapRecords) {
        menuList.push({ id: 38, name: 'LCP NAP Records', route: '/lcp-nap-locations/records', icon: 'pi pi-table', description: 'Create, edit, and delete LCP NAP location records with a map pin picker' })
      }

      const hasApiViewer = menuList.some(m => Number(m.id) === 24 || (m.name && m.name.toLowerCase().includes('api viewer')))
      const hasModels = menuList.some(m => Number(m.id) === 29 || (m.name && m.name.toLowerCase() === 'models'))
      const hasSettings = menuList.some(m => Number(m.id) === 20 || (m.name && m.name.toLowerCase().includes('settings')))
      const hasTheme = menuList.some(m => Number(m.id) === 103 || (m.name && m.name.toLowerCase().includes('theme')))
      const hasModifyPwd = menuList.some(m => Number(m.id) === 101 || (m.name && m.name.toLowerCase().includes('modify password')))
      const hasUnmaskPwd = menuList.some(m => Number(m.id) === 102 || (m.name && m.name.toLowerCase().includes('unmask password')))
      
      if (!hasApiViewer) {
        menuList.push({ id: 24, name: 'API Viewer', route: '/data-viewer', icon: 'pi pi-database', description: 'Inspect live GET endpoints across all backend services' })
      }
      if (!hasModels) {
        menuList.push({ id: 29, name: 'Models', route: '/models', icon: 'pi pi-table', description: 'Browse every table\'s columns, data types, and required fields' })
      }
      if (!hasSettings) {
        menuList.push({ id: 20, name: 'Settings', route: '/settings', icon: 'pi pi-cog', description: 'System appearance, profile preferences, and security configurations' })
      }
      if (!hasTheme) {
        menuList.push({ id: 103, name: 'Theme & Appearance', route: '/settings#theme', icon: 'pi pi-palette', description: 'Permission to view design palette and toggle Light/Dark theme mode' })
      }
      if (!hasModifyPwd) {
        menuList.push({ id: 101, name: 'Modify Password', route: '/modify_password', icon: 'pi pi-key', description: 'Permission to modify password fields across forms' })
      }
      if (!hasUnmaskPwd) {
        menuList.push({ id: 102, name: 'Unmask Password', route: '/unmask_password', icon: 'pi pi-eye', description: 'Permission to unmask/view saved passwords' })
      }
      unwrappedData = menuList
    }

    data.value = unwrappedData || []
    // The dataset is now confirmed: an empty table from here on really is empty
    hasFetched.value = true
    lastFetchedParams.value = { ...serverParams }

    // Auto-park on the first row when nothing is selected, or when the selected
    // row belongs to a filter the fetch has just replaced
    const selectedKey = rowKeyOf(selectedRow.value)
    const selectionSurvives = selectedKey !== undefined
      ? data.value.some(row => rowKeyOf(row) === selectedKey)
      : data.value.includes(selectedRow.value)
    if (!selectionSurvives) {
      if (data.value.length > 0) {
        selectedRow.value = data.value[0]
        emit('row-select', data.value[0])
      } else if (selectedRow.value) {
        selectedRow.value = null
        emit('row-unselect', null)
      }
    }
  } catch (err) {
    if (token !== fetchToken) return
    console.error(`Error for ${props.endpoint}:`, err)
    error.value = err.message || 'Failed to fetch data'
  } finally {
    if (!silent && token === fetchToken) loading.value = false
  }
}

const refreshData = async () => {
  if (refreshing.value) return
  refreshing.value = true

  const previousKey = rowKeyOf(selectedRow.value)
  try {
    await fetchData({ silent: true })
    await fetchRelatedData()

    // Re-point the selection at the freshly fetched row object (same key), so the
    // highlighted row and any parent detail panel stay in sync after the reload.
    if (previousKey !== undefined) {
      const match = data.value.find(row => rowKeyOf(row) === previousKey)
      if (match) {
        selectedRow.value = match
        emit('row-select', match)
      }
    }

    if (!error.value) {
      toast.add({
        severity: 'success',
        summary: 'Refreshed',
        detail: `${formatLabel(props.endpoint)} data reloaded.`,
        life: 2000
      })
    }
  } finally {
    refreshing.value = false
  }
}

// AccessLevelMenu relation linking state
const accessLevelMenus = ref([])
const togglingMenuId = ref(null)

const getRelAccessLevelId = (rel) => {
  if (!rel || typeof rel !== 'object') return ''
  for (const key of Object.keys(rel)) {
    const lowerKey = key.toLowerCase().replace(/_/g, '')
    if (lowerKey === 'accesslevelid' || lowerKey === 'accesslevel') {
      const val = rel[key]
      if (typeof val === 'object' && val !== null) return String(val.id ?? val.ID ?? '').trim()
      if (val !== null && val !== undefined) return String(val).trim()
    }
  }
  return ''
}

const getRelMenuId = (rel) => {
  if (!rel || typeof rel !== 'object') return ''
  for (const key of Object.keys(rel)) {
    const lowerKey = key.toLowerCase().replace(/_/g, '')
    if (lowerKey === 'menuid' || lowerKey === 'menu') {
      const val = rel[key]
      if (typeof val === 'object' && val !== null) return String(val.id ?? val.ID ?? '').trim()
      if (val !== null && val !== undefined) return String(val).trim()
    }
  }
  return ''
}

const unwrapRel = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'object' && val !== null) {
    const key = Object.keys(val).find(k => Array.isArray(val[k]))
    if (key) return val[key]
    return [val]
  }
  return []
}

const fetchAccessLevelMenus = async () => {
  if (!isMenuEndpoint.value) return
  try {
    const targetAccId = props.selectedAccessLevel ? String(
      props.selectedAccessLevel.id ?? 
      props.selectedAccessLevel.ID ?? 
      props.selectedAccessLevel.accessLevelId ?? 
      props.selectedAccessLevel.accesslevel_id ?? ''
    ).trim() : null

    console.log('[DynamicApiTable] fetchAccessLevelMenus triggered for targetAccId:', targetAccId)

    const requests = []
    if (targetAccId) {
      requests.push(apiClient.get(`/AccesslevelMenu/${targetAccId}`).catch(err => { console.warn(`GET /AccesslevelMenu/${targetAccId} warning:`, err); return [] }))
      requests.push(apiClient.get(`/AccessLevelMenu/${targetAccId}`).catch(() => []))
      requests.push(apiClient.get(`/AccesslevelMenu?accessLevelId=${targetAccId}`).catch(() => []))
      requests.push(apiClient.get(`/AccesslevelMenu?accesslevel_id=${targetAccId}`).catch(() => []))
    }
    requests.push(apiClient.get('/AccesslevelMenu').catch(() => []))

    const responses = await Promise.allSettled(requests)
    const combined = []
    responses.forEach(r => {
      if (r.status === 'fulfilled') {
        const unwrapped = unwrapRel(r.value)
        if (Array.isArray(unwrapped)) {
          combined.push(...unwrapped)
        }
      }
    })

    const seen = new Set()
    const uniqueRelations = []
    combined.forEach(rel => {
      if (!rel || typeof rel !== 'object') return
      const accId = getRelAccessLevelId(rel)
      const mId = getRelMenuId(rel)
      const key = rel.id ? `id-${rel.id}` : `${accId || 'target'}-${mId}`
      if (mId && !seen.has(key)) {
        seen.add(key)
        uniqueRelations.push(rel)
      }
    })

    accessLevelMenus.value = uniqueRelations
    console.log(`[DynamicApiTable] Loaded ${accessLevelMenus.value.length} AccesslevelMenu relations for targetAccId ${targetAccId}:`, accessLevelMenus.value)
  } catch (err) {
    console.error('[DynamicApiTable] Error fetching AccesslevelMenu relations:', err)
  }
}

const activeLinkedMenuIds = computed(() => {
  const set = new Set()
  if (!props.selectedAccessLevel || !accessLevelMenus.value || !accessLevelMenus.value.length) return set
  
  const targetAccId = String(
    props.selectedAccessLevel.id ?? 
    props.selectedAccessLevel.ID ?? 
    props.selectedAccessLevel.accessLevelId ?? 
    props.selectedAccessLevel.accesslevel_id ??
    ''
  ).trim()

  if (!targetAccId) return set

  accessLevelMenus.value.forEach(rel => {
    const accId = getRelAccessLevelId(rel)
    const mId = getRelMenuId(rel)
    if ((!accId || accId === targetAccId) && mId) {
      set.add(mId)
      if (!isNaN(Number(mId))) {
        set.add(Number(mId))
      }
    }
  })

  return set
})

const isSuperAdminAccessLevelProtected = (menuRow) => {
  if (!props.selectedAccessLevel || !menuRow) return false
  const targetAccId = Number(
    props.selectedAccessLevel.id ?? 
    props.selectedAccessLevel.ID ?? 
    props.selectedAccessLevel.accessLevelId ?? 
    props.selectedAccessLevel.accesslevel_id
  )
  const isSuperAdminRole = targetAccId === 1 || String(props.selectedAccessLevel.name || '').toLowerCase().includes('super')
  
  const menuId = Number(menuRow.id ?? menuRow.ID ?? menuRow.menuId)
  const menuName = String(menuRow.name || menuRow.Name || '').toLowerCase()
  const isAccessLevelMenu = menuId === 16 || menuName === 'access level' || (menuRow.route || menuRow.path || '').toLowerCase() === '/access_level'
  
  return isSuperAdminRole && isAccessLevelMenu
}

const isToggleSwitchDisabled = (menuRow) => {
  if (!props.selectedAccessLevel) return true
  if (togglingMenuId.value === (menuRow.id ?? menuRow.ID ?? menuRow.menuId)) return true
  if (isSuperAdminAccessLevelProtected(menuRow)) return true
  return false
}

const getToggleSwitchTitle = (menuRow) => {
  if (!props.selectedAccessLevel) return 'Select an Access Level on the left table first'
  if (isSuperAdminAccessLevelProtected(menuRow)) return 'Access Level permission is locked and protected for Super Admin'
  return isMenuLinked(menuRow) ? 'Click to Unlink Menu' : 'Click to Link Menu'
}

const isMenuLinked = (menuRow) => {
  if (!menuRow || !props.selectedAccessLevel) return false
  if (isSuperAdminAccessLevelProtected(menuRow)) return true
  const targetMenuId = String(menuRow.id ?? menuRow.ID ?? menuRow.menuId ?? '').trim()
  if (!targetMenuId) return false
  return activeLinkedMenuIds.value.has(targetMenuId) || activeLinkedMenuIds.value.has(Number(targetMenuId))
}

const toggleMenuLink = async (menuRow) => {
  if (!props.selectedAccessLevel || !menuRow) return
  
  if (isSuperAdminAccessLevelProtected(menuRow)) {
    toast.add({
      severity: 'warn',
      summary: 'Protected Permission',
      detail: 'Access Level menu permission cannot be disabled for Super Admin.',
      life: 4000
    })
    return
  }
  
  const targetAccId = Number(props.selectedAccessLevel.id ?? props.selectedAccessLevel.ID ?? props.selectedAccessLevel.accessLevelId)
  const targetMenuId = Number(menuRow.id ?? menuRow.ID ?? menuRow.menuId)
  const menuName = menuRow.name || menuRow.Name || `Menu #${targetMenuId}`
  const roleName = props.selectedAccessLevel.name || props.selectedAccessLevel.Name || `Access Level #${targetAccId}`

  togglingMenuId.value = targetMenuId
  
  try {
    const currentlyLinked = isMenuLinked(menuRow)
    
    if (!currentlyLinked) {
      // Create Link: POST to /api/AccesslevelMenu
      const numericUserId = Number(authStore.user?.id) || 1
      const payload = {
        accessLevelId: targetAccId,
        menuId: targetMenuId,
        accesslevel_id: targetAccId,
        menu_id: targetMenuId,
        AccessLevelId: targetAccId,
        MenuId: targetMenuId
        // createdBy: numericUserId, // Excluded for backend migration
        // modifiedBy: numericUserId // Excluded for backend migration
      }
      
      console.log(`[DynamicApiTable] Creating link POST /api/AccesslevelMenu:`, payload)
      
      // Optimistically add relation to state so UI flips immediately
      accessLevelMenus.value = [...accessLevelMenus.value, payload]

      const res = await apiClient.post('/AccesslevelMenu', payload).catch(async () => {
        return await apiClient.post('/AccessLevelMenu', payload)
      })
      
      // Refetch from server to sync true ID
      await fetchAccessLevelMenus()
      
      toast.add({
        severity: 'success',
        summary: 'Permission Linked',
        detail: `Linked "${menuName}" to "${roleName}"`,
        life: 3000
      })
      window.dispatchEvent(new CustomEvent('accesslevelmenu-updated', {
        detail: { accessLevelId: targetAccId, menuId: targetMenuId, linked: true }
      }))
    } else {
      // Remove Link: DELETE from /api/AccesslevelMenu
      const targetAccStr = String(targetAccId).trim()
      const targetMenuStr = String(targetMenuId).trim()

      const existingRel = accessLevelMenus.value.find(rel => {
        const accId = getRelAccessLevelId(rel)
        const mId = getRelMenuId(rel)
        return (!accId || accId === targetAccStr) && mId === targetMenuStr
      })
      
      // Optimistically remove from local state so UI flips immediately
      accessLevelMenus.value = accessLevelMenus.value.filter(rel => {
        const mId = getRelMenuId(rel)
        return mId !== targetMenuStr
      })

      const relId = existingRel ? (existingRel.id ?? existingRel.ID) : null
      if (relId) {
        console.log(`[DynamicApiTable] Removing link DELETE /api/AccesslevelMenu/${relId}`)
        await apiClient.delete(`/AccesslevelMenu/${relId}`).catch(async () => {
          await apiClient.delete(`/AccessLevelMenu/${relId}`)
        })
      } else {
        await apiClient.delete(`/AccesslevelMenu/${targetAccId}/${targetMenuId}`).catch(() => null)
      }

      // Refetch from server to sync state
      await fetchAccessLevelMenus()
      
      toast.add({
        severity: 'info',
        summary: 'Permission Unlinked',
        detail: `Unlinked "${menuName}" from "${roleName}"`,
        life: 3000
      })
      window.dispatchEvent(new CustomEvent('accesslevelmenu-updated', {
        detail: { accessLevelId: targetAccId, menuId: targetMenuId, linked: false }
      }))
    }
  } catch (err) {
    console.error('Error toggling menu link:', err)
    toast.add({
      severity: 'error',
      summary: 'Permission Link Error',
      detail: err.message || 'Failed to update AccesslevelMenu link',
      life: 4000
    })
    await fetchAccessLevelMenus()
  } finally {
    togglingMenuId.value = null
  }
}

watch(selectedRow, (newVal) => {
  if (newVal) {
    emit('row-select', newVal)
  }
})

watch(() => props.selectedAccessLevel, async (newVal) => {
  if (isMenuEndpoint.value) {
    console.log('[DynamicApiTable] selectedAccessLevel updated:', newVal)
    await fetchAccessLevelMenus()
  }
}, { immediate: true, deep: true })

// One watcher for endpoint + filter-endpoint + server-bound filter params. Routes
// like /application/in-progress, /done and /approved share this component
// instance, so a status switch never remounts it — this is what re-requests the
// data, and it does so non-silently so the skeleton (not the previous status's
// rows or its empty-state panel) is what's on screen while the request runs.
watch(fetchSourceKey, () => {
  fetchData({ silent: false })
})

const handleRowClick = (event) => {
  if (event && event.data) {
    selectedRow.value = event.data
    emit('row-select', event.data)
  }
}

const handleRowSelect = (event) => {
  if (event && event.data) {
    selectedRow.value = event.data
    emit('row-select', event.data)
  }
}

const handleRowUnselect = (event) => {
  emit('row-unselect', event ? event.data : null)
}

const handleSelectionChange = (val) => {
  if (val) {
    selectedRow.value = val
    emit('row-select', val)
  }
}

const userPermissions = ref({
  canModifyPassword: true,
  canUnmaskPassword: true
})

const fetchCurrentUserPermissions = async () => {
  try {
    const userAccessLevel = Number(authStore.user?.accesslevel_id || authStore.user?.accessLevelId || 1)

    const res = await apiClient.get('/AccesslevelMenu').catch(() => [])
    let records = res
    if (res && !Array.isArray(res) && typeof res === 'object') {
      const key = Object.keys(res).find(k => Array.isArray(res[k]))
      if (key) records = res[key]
    }

    if (Array.isArray(records)) {
      const userRecords = records.filter(r => Number(r.accessLevelId || r.accesslevel_id) === userAccessLevel)
      
      // If no permission relations exist for this role yet, default to granted
      if (userRecords.length === 0) {
        userPermissions.value = {
          canModifyPassword: true,
          canUnmaskPassword: true
        }
      } else {
        const userMenuIds = new Set(userRecords.map(r => Number(r.menuId || r.menu_id)))
        
        userPermissions.value = {
          canModifyPassword: userMenuIds.has(101),
          canUnmaskPassword: userMenuIds.has(102)
        }
      }
    }
  } catch (err) {
    console.error('Error fetching current user permissions:', err)
    userPermissions.value = {
      canModifyPassword: true,
      canUnmaskPassword: true
    }
  }
}

onMounted(() => {
  fetchAddressData()
  fetchData()
  fetchRelatedData()
  fetchAccessLevelMenus()
  fetchCurrentUserPermissions()
  window.addEventListener('accesslevelmenu-updated', fetchCurrentUserPermissions)
})

onUnmounted(() => {
  window.removeEventListener('accesslevelmenu-updated', fetchCurrentUserPermissions)
})

defineExpose({
  openCreateDialog,
  openEditDialog,
  confirmDelete,
  fetchData,
  refreshData,
  statusCounts,
  hasFetched,
  lastFetchedParams
})
</script>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th.text-center .p-column-header-content) {
  justify-content: center !important;
}

:deep(.p-datatable .p-datatable-tbody > tr > td.text-center) {
  text-align: center !important;
}

:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--theme-row-hover, rgba(var(--bs-primary-rgb, 231, 76, 90), 0.06)) !important;
}
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"]),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight td),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] td) {
  background-color: var(--theme-row-highlight, #e74c5a) !important;
  color: #ffffff !important;
}

:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight *),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] *),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .text-body),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .text-body),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .text-secondary),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .text-secondary),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .text-muted),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .text-muted),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight a),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] a),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight i),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] i),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight span),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] span) {
  color: #ffffff !important;
}

/* Status pills are the one thing the blanket white override above must not touch:
   a pill is pale-tinted by design, so white-on-pale-green left "Enabled" invisible
   on the selected row. Give them a solid white chip and put the semantic colour
   back on the text, so the status still reads — and still reads green/red. */
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .badge),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .badge) {
  background-color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .badge.text-success),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .badge.text-success) {
  color: var(--bs-success-text-emphasis, #0a6b45) !important;
}

:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .badge.text-danger),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .badge.text-danger) {
  color: var(--bs-danger-text-emphasis, #b02a37) !important;
}

:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .badge.text-secondary),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .badge.text-secondary),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .badge.text-warning-emphasis),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .badge.text-warning-emphasis),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .badge.text-info),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .badge.text-info) {
  color: #343a40 !important;
}

/* Ensure action buttons on highlighted rows are crisp white with soft white glass hover */
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .p-button-text),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .p-button-text),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .btn-link),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .btn-link),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .p-button-icon) {
  color: #ffffff !important;
}

:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .p-button-text:hover),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .p-button-text:hover),
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .btn-link:hover),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .btn-link:hover) {
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.22) !important;
}

/* Trashcan Icon on normal unselected rows (Red) */
:deep(.delete-btn),
:deep(.delete-btn .pi),
:deep(.delete-btn .pi-trash),
:deep(.delete-btn span) {
  color: var(--bs-danger, #ef4444) !important;
}

:deep(.delete-btn:hover) {
  color: var(--bs-danger-hover, #dc2626) !important;
  background-color: rgba(var(--bs-danger-rgb, 239, 68, 68), 0.15) !important;
}

/* Trashcan Icon on HIGHLIGHTED / SELECTED rows (Pure White for high contrast on red background) */
:deep(.p-datatable-tbody > tr.p-highlight .delete-btn),
:deep(.p-datatable-tbody > tr.p-highlight .delete-btn .pi),
:deep(.p-datatable-tbody > tr.p-highlight .delete-btn .pi-trash),
:deep(.p-datatable-tbody > tr.p-highlight .delete-btn span),
:deep(.p-datatable-tbody > tr[aria-selected="true"] .delete-btn),
:deep(.p-datatable-tbody > tr[aria-selected="true"] .delete-btn .pi),
:deep(.p-datatable-tbody > tr[aria-selected="true"] .delete-btn .pi-trash),
:deep(.p-datatable-tbody > tr[aria-selected="true"] .delete-btn span) {
  color: #ffffff !important;
}

:deep(.p-datatable-tbody > tr.p-highlight .delete-btn:hover),
:deep(.p-datatable-tbody > tr[aria-selected="true"] .delete-btn:hover) {
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.25) !important;
}

/* High-Contrast ToggleSwitch on HIGHLIGHTED / SELECTED rows (Inverted Styling) */
:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider) {
  background-color: #ffffff !important;
  border: 2px solid #ffffff !important;
}

:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-handle),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-handle) {
  background-color: var(--theme-row-highlight, #e74c5a) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25) !important;
}

:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .p-toggleswitch:not(.p-toggleswitch-checked) .p-toggleswitch-slider),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .p-toggleswitch:not(.p-toggleswitch-checked) .p-toggleswitch-slider) {
  background-color: rgba(255, 255, 255, 0.35) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.75) !important;
}

:deep(.highlight-selected-row .p-datatable-tbody > tr.p-highlight .p-toggleswitch:not(.p-toggleswitch-checked) .p-toggleswitch-handle),
:deep(.highlight-selected-row .p-datatable-tbody > tr[aria-selected="true"] .p-toggleswitch:not(.p-toggleswitch-checked) .p-toggleswitch-handle) {
  background-color: #ffffff !important;
}

/* Precise Alignment for PrimeVue Form Components (DatePicker, InputNumber, Select) */
:deep(.p-datepicker),
:deep(.p-inputnumber),
:deep(.p-select) {
  display: flex !important;
  width: 100% !important;
  vertical-align: middle !important;
  margin: 0 !important;
}

:deep(.p-datepicker .p-inputtext),
:deep(.p-inputnumber .p-inputtext),
:deep(.p-inputnumber input),
:deep(.p-select .p-select-label) {
  width: 100% !important;
}

/* Frozen Actions Column Styling */
:deep(.p-datatable .p-datatable-frozen-column),
:deep(.p-datatable th.frozen-actions-col),
:deep(.p-datatable td.frozen-actions-col) {
  position: sticky !important;
  right: 0 !important;
  z-index: 2 !important;
  background-color: var(--bs-body-bg, #ffffff);
  box-shadow: -3px 0 6px rgba(0, 0, 0, 0.06);
}

:deep(.p-datatable-tbody > tr:hover td.frozen-actions-col) {
  background-color: var(--theme-row-hover, rgba(var(--bs-primary-rgb, 231, 76, 90), 0.06)) !important;
}

:deep(.p-datatable-tbody > tr.p-highlight td.frozen-actions-col),
:deep(.p-datatable-tbody > tr[aria-selected="true"] td.frozen-actions-col) {
  background-color: var(--theme-row-highlight, #e74c5a) !important;
}

/* Compact Table Row Height & Padding */
:deep(.p-datatable-tbody > tr > td) {
  padding: 0.25rem 0.65rem !important;
  font-size: 0.8125rem !important;
  line-height: 1.25 !important;
  vertical-align: middle !important;
}

:deep(.p-datatable-tbody > tr > td.frozen-actions-col .p-button) {
  width: 26px !important;
  height: 26px !important;
  padding: 0 !important;
  min-width: 26px !important;
}

.connection-cell {
  min-width: 136px;
}

/* Reserves the widest state word so the switch never moves between rows */
.connection-state {
  min-width: 86px;
  text-align: left;
  white-space: nowrap;
}

.connection-filter-btn {
  font-size: 0.8125rem;
  transition: all 0.2s ease-in-out;
}

.connection-filter-count {
  font-size: 0.6875rem;
  line-height: 1;
  padding: 0.2rem 0.35rem;
  min-width: 1.4rem;
}

.connection-filter-btn:not(.btn-primary):hover {
  background-color: var(--bs-primary-bg-subtle, #fef2f3) !important;
  border-color: var(--bs-primary-border-subtle, #fdcfd3) !important;
  color: var(--bs-primary, #e74c5a) !important;
}

.skeleton-box {
  background: linear-gradient(90deg, var(--bs-tertiary-bg, rgba(108, 117, 125, 0.12)) 25%, var(--bs-secondary-bg, rgba(108, 117, 125, 0.28)) 50%, var(--bs-tertiary-bg, rgba(108, 117, 125, 0.12)) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
.eye-toggle-btn {
  color: #6c757d;
  transition: color 0.15s ease-in-out;
}
.eye-toggle-btn:hover {
  color: var(--bs-primary, #e74c5a) !important;
}

/* Datatable Header Styling (Enlarged & Standout Column Headers) */
:deep(.p-datatable-header) {
  padding: 0.85rem 1rem !important;
  background-color: var(--bs-body-bg, #ffffff) !important;
  border-bottom: 1px solid var(--bs-border-color, #e9ecef) !important;
}

:deep(.p-datatable-thead > tr > th) {
  padding: 0.75rem 0.85rem !important;
  font-size: 0.88rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.025em;
  color: var(--bs-body-color, #212529) !important;
  background-color: var(--bs-tertiary-bg, rgba(108, 117, 125, 0.06)) !important;
  border-bottom: 2px solid var(--bs-border-color, #dee2e6) !important;
}

:deep(.p-datatable-thead > tr > th .p-column-title) {
  font-weight: 700 !important;
  font-size: 0.88rem !important;
}

:deep(.p-datatable-thead > tr > th .p-sort-icon) {
  font-size: 0.8rem !important;
  margin-left: 0.4rem !important;
  opacity: 0.75;
}

/* Paginator Flex Styling: Show entries on left, pagination controls on right */
:deep(.p-paginator) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-wrap: wrap !important;
  gap: 0.5rem !important;
  padding: 0.6rem 0.75rem !important;
}

/* Sticky / Frozen Actions Column Non-Transparent Solid Background & Elevation Shadow */
:deep(.p-datatable-tbody > tr > td.p-frozen-column),
:deep(.p-datatable-tbody > tr > td.frozen-actions-col),
:deep(td.frozen-actions-col) {
  background-color: var(--bs-body-bg, #ffffff) !important;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.06) !important;
  z-index: 2 !important;
}

:deep(.p-datatable-thead > tr > th.p-frozen-column),
:deep(.p-datatable-thead > tr > th.frozen-actions-col),
:deep(th.frozen-actions-col) {
  background-color: var(--bs-tertiary-bg, #f8f9fa) !important;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.06) !important;
  z-index: 3 !important;
}

/* Left-pinned columns (id / status).
   These need their own opaque background: a sticky cell keeps its place while the
   rest of the row slides beneath it, so without one the scrolling text shows
   straight through. The shared frozen rule also casts its shadow leftward for the
   right-pinned Actions column, so flip it to trail rightward here. */
:deep(.p-datatable-tbody > tr > td.frozen-left-col),
:deep(td.frozen-left-col) {
  background-color: var(--bs-body-bg, #ffffff) !important;
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.06) !important;
  z-index: 2 !important;
}

:deep(.p-datatable-thead > tr > th.frozen-left-col),
:deep(th.frozen-left-col) {
  background-color: var(--bs-tertiary-bg, #f8f9fa) !important;
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.06) !important;
  z-index: 3 !important;
}

/* The pinned cells must repaint the row's own hover / selected fill, otherwise
   they stay body-coloured and cut a gap through the highlighted row. */
:deep(.p-datatable-tbody > tr:hover > td.frozen-left-col) {
  background-color: var(--theme-row-hover-solid, var(--bs-secondary-bg, #f4f5f7)) !important;
}

:deep(.p-datatable-tbody > tr.p-highlight > td.frozen-left-col),
:deep(.p-datatable-tbody > tr[aria-selected="true"] > td.frozen-left-col) {
  background-color: var(--theme-row-highlight, #e74c5a) !important;
}

:deep(.p-datatable-tbody > tr:hover > td.p-frozen-column),
:deep(.p-datatable-tbody > tr:hover > td.frozen-actions-col) {
  background-color: var(--theme-row-hover-solid, var(--bs-secondary-bg, #f4f5f7)) !important;
  opacity: 1 !important;
}

:deep(.p-datatable-tbody > tr.p-highlight > td.p-frozen-column),
:deep(.p-datatable-tbody > tr.p-highlight > td.frozen-actions-col),
:deep(.p-datatable-tbody > tr[aria-selected="true"] > td.p-frozen-column),
:deep(.p-datatable-tbody > tr[aria-selected="true"] > td.frozen-actions-col) {
  background-color: var(--theme-row-highlight, #e74c5a) !important;
}

:deep(.p-datatable-tbody > tr.p-highlight td.frozen-actions-col .p-button),
:deep(.p-datatable-tbody > tr.p-highlight td.frozen-actions-col .p-button .pi),
:deep(.p-datatable-tbody > tr.p-highlight td.frozen-actions-col .delete-btn),
:deep(.p-datatable-tbody > tr[aria-selected="true"] td.frozen-actions-col .p-button),
:deep(.p-datatable-tbody > tr[aria-selected="true"] td.frozen-actions-col .p-button .pi),
:deep(.p-datatable-tbody > tr[aria-selected="true"] td.frozen-actions-col .delete-btn) {
  color: #ffffff !important;
}

:deep(.p-datatable-tbody > tr.p-highlight td.frozen-actions-col .p-button:hover),
:deep(.p-datatable-tbody > tr.p-highlight td.frozen-actions-col .delete-btn:hover),
:deep(.p-datatable-tbody > tr[aria-selected="true"] td.frozen-actions-col .p-button:hover),
:deep(.p-datatable-tbody > tr[aria-selected="true"] td.frozen-actions-col .delete-btn:hover) {
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.25) !important;
}

/* Density Variants */
:deep(.density-compact .p-datatable-tbody > tr > td) {
  padding: 0.15rem 0.5rem !important;
  font-size: 0.78rem !important;
}

:deep(.density-default .p-datatable-tbody > tr > td) {
  padding: 0.3rem 0.65rem !important;
  font-size: 0.8125rem !important;
}

:deep(.density-comfortable .p-datatable-tbody > tr > td) {
  padding: 0.65rem 0.95rem !important;
  font-size: 0.875rem !important;
}

:deep(.p-paginator-start) {
  order: 0;
  margin-right: auto !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.p-paginator-end) {
  order: 1;
  display: flex !important;
  align-items: center !important;
  margin-left: auto !important;
}

:deep(.p-paginator-content),
:deep(.p-paginator-pages),
:deep(.p-paginator-current) {
  order: 2;
  display: flex !important;
  align-items: center !important;
  margin-left: 0.5rem !important;
}

/* ---- Toolbar (responsive) ---- */
.toolbar-search-wrapper {
  position: relative;
  width: 240px;
  max-width: 100%;
  display: flex;
  align-items: center;
}

.toolbar-search-wrapper .search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: #6c757d;
  pointer-events: none;
  z-index: 2;
}

.toolbar-search-input {
  padding-left: 2.2rem !important;
  padding-right: 2rem !important;
  font-size: 0.84rem;
  height: 33px !important;
  min-height: 33px !important;
}

.toolbar-filter-select {
  min-width: 145px;
  width: auto;
}

.toolbar-filter-select select {
  height: 33px !important;
  min-height: 33px !important;
  font-size: 0.82rem;
  cursor: pointer;
  padding-left: 0.75rem !important;
  padding-right: 2rem !important;
}

.paginator-rows-select {
  width: 80px !important;
  height: 30px !important;
  min-height: 30px !important;
  max-height: 30px !important;
  padding-top: 0.15rem !important;
  padding-bottom: 0.15rem !important;
  padding-left: 0.75rem !important;
  padding-right: 1.8rem !important;
  font-size: 0.8125rem !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  border-radius: 6px !important;
  background-size: 10px 8px !important;
  background-position: right 0.5rem center !important;
  text-align: left !important;
  line-height: 24px !important;
}

.clear-search-btn {
  color: #6c757d;
  transition: color 0.15s ease-in-out;
}
.clear-search-btn:hover {
  color: var(--bs-danger, #ef4444) !important;
}

.action-row-btn {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  padding: 0 !important;
  font-size: 0.82rem !important;
}

.toolbar-icon-btn {
  width: 33px;
  min-width: 33px;
  height: 33px;
  padding: 0 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.column-picker-panel .hover-bg:hover {
  background-color: var(--bs-secondary-bg, rgba(108, 117, 125, 0.1));
}

.reset-columns-btn {
  color: var(--bs-primary, #e74c5a) !important;
}
.reset-columns-btn:hover {
  color: var(--bs-primary-hover, #d63a48) !important;
  text-decoration: underline !important;
}

/* Ensure PrimeVue Export Menu has clean dark/neutral text and theme styling */
:deep(.p-menu .p-menu-item-link),
:deep(.p-menu .p-menuitem-link),
:deep(.p-menu-item-link),
:deep(.p-menuitem-link) {
  color: var(--bs-body-color, #212529) !important;
  text-decoration: none !important;
}

:deep(.p-menu .p-menu-item-icon),
:deep(.p-menu .p-menuitem-icon) {
  color: var(--bs-secondary-color, #6c757d) !important;
}

:deep(.p-menu .p-menu-item-link:hover),
:deep(.p-menu .p-menuitem-link:hover) {
  background-color: rgba(var(--bs-primary-rgb, 231, 76, 90), 0.08) !important;
  color: var(--bs-primary, #e74c5a) !important;
}

:deep(.p-menu .p-menu-item-link:hover .p-menu-item-icon),
:deep(.p-menu .p-menuitem-link:hover .p-menuitem-icon),
:deep(.p-menu .p-menu-item-link:hover .p-menu-item-label),
:deep(.p-menu .p-menuitem-link:hover .p-menuitem-text) {
  color: var(--bs-primary, #e74c5a) !important;
}

.address-step-hint {
  font-size: 0.775rem;
  font-weight: 500;
  color: var(--bs-primary, #e74c5a) !important;
  line-height: 1.25;
}
.address-step-hint i {
  font-size: 0.8rem;
  color: var(--bs-primary, #e74c5a) !important;
}

/* Required-field validation. One rule per control family keeps the 26
   field-type branches in both dialogs free of validation markup. */
.field-error-hint {
  font-size: 0.775rem;
  font-weight: 500;
  color: var(--bs-danger, #dc3545) !important;
  line-height: 1.25;
}
.field-error-hint i {
  font-size: 0.8rem;
  color: var(--bs-danger, #dc3545) !important;
}

.field-invalid :deep(.p-select),
.field-invalid :deep(.p-inputtext),
.field-invalid :deep(.p-textarea),
.field-invalid :deep(.p-datepicker-input),
.field-invalid :deep(.form-control),
.field-invalid :deep(.dropzone) {
  border-color: var(--bs-danger, #dc3545) !important;
}

.field-invalid :deep(.p-select:focus),
.field-invalid :deep(.p-inputtext:focus),
.field-invalid :deep(.form-control:focus) {
  box-shadow: 0 0 0 0.15rem rgba(var(--bs-danger-rgb, 220, 53, 69), 0.2) !important;
}

@media (max-width: 767.98px) {
  .toolbar-search-wrapper {
    width: 100%;
    flex: 1 1 100%;
  }

  .toolbar-filter-select {
    flex: 1 1 auto;
    width: auto;
  }

  .table-toolbar .p-button {
    min-height: 36px;
  }

  .toolbar-icon-btn {
    width: 36px;
    min-width: 36px;
    height: 36px;
  }
}
</style>
