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
          <div v-if="!hideCreateButton" class="skeleton-box rounded-3" style="width: 120px; height: 32px;"></div>
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
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      v-model:selection="selectedRow"
      selectionMode="single"
      @row-select="handleRowSelect"
      @row-unselect="handleRowUnselect"
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
      dataKey="id"
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
              v-if="!hideCreateButton" 
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
      >
        <template #body="slotProps">
          <span v-if="col.toLowerCase() === 'active'">
            <span v-if="slotProps.data[col] === true || slotProps.data[col] === 'true'" class="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1">Active</span>
            <span v-else class="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-2.5 py-1">Inactive</span>
          </span>
          <span v-else-if="col.toLowerCase().includes('status')">
            <span 
              v-if="slotProps.data[col] !== null && slotProps.data[col] !== undefined && slotProps.data[col] !== ''"
              class="badge rounded-pill px-2.5 py-1 fw-semibold border"
              :class="getStatusBadgeConfig(slotProps.data[col]).class"
            >
              {{ getStatusBadgeConfig(slotProps.data[col]).label }}
            </span>
            <span v-else class="text-muted">-</span>
          </span>
          <span v-else-if="getFieldType(col) === 'image_upload'">
            <span v-if="slotProps.data[col]" class="d-inline-flex align-items-center gap-1.5 cursor-pointer" @click.stop="openImagePreview(slotProps.data[col], formatLabel(col))">
              <img :src="slotProps.data[col]" alt="Thumbnail" class="rounded border" style="width: 28px; height: 28px; object-fit: cover;" />
              <span class="small text-primary text-decoration-underline" style="font-size: 0.78rem;">View</span>
            </span>
            <span v-else class="text-muted">-</span>
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
              icon="pi pi-pencil" 
              class="p-button-text p-button-sm p-button-rounded p-button-secondary p-0 action-row-btn" 
              v-tooltip.top="'Edit Record'" 
              aria-label="Edit Record"
              @click="openEditDialog(slotProps.data)" 
            />
            <Button 
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
        <div class="p-5 text-center text-secondary d-flex flex-column align-items-center justify-content-center">
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
              v-if="!hideCreateButton" 
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
      <div v-if="saveError" class="alert alert-danger d-flex align-items-center rounded-3 p-2 mb-3 small">
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
              :class="getColumnClass(col)"
            >
              <label :for="col" class="form-label fw-medium text-body small mb-1">
                {{ formatLabel(col) }}
              </label>

              <!-- Toggle Switch for Active / Boolean fields -->
              <div v-if="getFieldType(col) === 'toggle'" class="d-flex align-items-center gap-3 pt-2">
                <ToggleSwitch :id="col" v-model="formData[col]" />
                <span class="small fw-semibold" :class="formData[col] ? 'text-success' : 'text-secondary'">
                  {{ formData[col] ? 'Active' : 'Inactive' }}
                </span>
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
                :options="plansList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Plan" 
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
                    :class="{ 'is-invalid': formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword }"
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
                <div v-else-if="formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword" class="text-danger small mt-1" style="font-size: 0.75rem;">
                  <i class="pi pi-exclamation-circle me-1"></i> Passwords do not match
                </div>
              </div>

              <!-- Image Upload (Dropzone) -->
              <div v-else-if="getFieldType(col) === 'image_upload'" class="w-100">
                <ImageDropzone
                  v-model="formData[col]"
                  :fieldId="col"
                  :label="formatLabel(col)"
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
                rows="3" 
                class="w-100 p-inputtext-sm" 
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
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary p-button-sm" @click="displayCreateDialog = false" />
          <Button label="Save Record" icon="pi pi-check" class="p-button-primary p-button-sm" @click="saveData" :loading="saving" />
        </div>
      </template>
    </Dialog>

    <!-- View Record Dialog (Read-Only) -->
    <Dialog 
      v-model:visible="displayViewDialog" 
      modal 
      :header="`View ${formatLabel(endpoint)} Record #${viewingRecordId || ''}`" 
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
              :class="getColumnClass(col)"
            >
              <label :for="`view-${col}`" class="form-label fw-medium text-body small mb-1">
                {{ formatLabel(col) }}
              </label>

              <!-- Toggle Switch for Active / Boolean fields -->
              <div v-if="getFieldType(col) === 'toggle'" class="d-flex align-items-center gap-3 pt-2">
                <ToggleSwitch :id="`view-${col}`" :modelValue="!!viewFormData[col]" disabled />
                <span class="small fw-semibold" :class="viewFormData[col] ? 'text-success' : 'text-secondary'">
                  {{ viewFormData[col] ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <!-- DatePicker for Date Fields -->
              <DatePicker 
                v-else-if="getFieldType(col) === 'date'" 
                :id="`view-${col}`" 
                :modelValue="viewFormData[col]" 
                showIcon 
                iconDisplay="input"
                fluid
                size="small"
                dateFormat="yy-mm-dd" 
                disabled
                class="w-100"
              />

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
                rows="3" 
                readonly
                disabled
                class="w-100 p-inputtext-sm bg-light" 
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
            label="Edit Record" 
            icon="pi pi-pencil" 
            class="p-button-outlined p-button-primary p-button-sm" 
            @click="displayViewDialog = false; openEditDialog(viewFormData)" 
          />
          <Button 
            label="Close" 
            icon="pi pi-times" 
            class="p-button-secondary p-button-sm" 
            @click="displayViewDialog = false" 
          />
        </div>
      </template>
    </Dialog>

    <!-- Edit Record Dialog -->
    <Dialog 
      v-model:visible="displayEditDialog" 
      modal 
      :header="`Update ${formatLabel(endpoint)} Record #${editingRecordId || ''}`" 
      :style="modalStyle"
      :breakpoints="modalBreakpoints"
    >
      <div v-if="editError" class="alert alert-danger d-flex align-items-center rounded-3 p-2 mb-3 small">
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
              :class="getColumnClass(col)"
            >
              <label :for="`edit-${col}`" class="form-label fw-medium text-body small mb-1">
                {{ formatLabel(col) }}
              </label>

              <!-- Toggle Switch for Active / Boolean fields -->
              <div v-if="getFieldType(col) === 'toggle'" class="d-flex align-items-center gap-3 pt-2">
                <ToggleSwitch :id="`edit-${col}`" v-model="editFormData[col]" />
                <span class="small fw-semibold" :class="editFormData[col] ? 'text-success' : 'text-secondary'">
                  {{ editFormData[col] ? 'Active' : 'Inactive' }}
                </span>
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
                :options="plansList" 
                optionLabel="label" 
                optionValue="value" 
                :filter="true"
                placeholder="Select Plan" 
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
                    :class="{ 'is-invalid': editFormData.password && editFormData.confirmPassword && editFormData.password !== editFormData.confirmPassword }"
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
                <div v-else-if="editFormData.password && editFormData.confirmPassword && editFormData.password !== editFormData.confirmPassword" class="text-danger small mt-1" style="font-size: 0.75rem;">
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

              <!-- Image Upload (Dropzone) -->
              <div v-else-if="getFieldType(col) === 'image_upload'" class="w-100">
                <ImageDropzone
                  v-model="editFormData[col]"
                  :fieldId="`edit-${col}`"
                  :label="formatLabel(col)"
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
                rows="3" 
                class="w-100 p-inputtext-sm" 
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
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary p-button-sm" @click="displayEditDialog = false" />
          <Button label="Update Record" icon="pi pi-check" class="p-button-primary p-button-sm" @click="saveEdit" :loading="savingEdit" />
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
          <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary p-button-sm" @click="displayDeleteDialog = false" />
          <Button label="Delete Record" icon="pi pi-trash" class="p-button-danger p-button-sm" @click="deleteRecord" :loading="deleting" />
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
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2">
          <Button label="Close" class="p-button-sm p-button-secondary" @click="tableImagePreviewVisible = false" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, isRef, unref } from 'vue'
import apiClient from '../services/api'
import phAddressService from '../services/phAddressService'
import defaultRegions from '../../public/data/philippines/regions.json'
import defaultProvinces from '../../public/data/philippines/provinces.json'
import ImageDropzone from './ImageDropzone.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Password from 'primevue/password'
import Menu from 'primevue/menu'
import Popover from 'primevue/popover'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { EndpointColumns } from '../models/columns'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const toast = useToast()
const authStore = useAuthStore()
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
  // Set by parents that already expose their own status filter, so the toolbar
  // does not offer a second, redundant one.
  hideStatusFilter: {
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
  }
})

const emit = defineEmits(['row-select', 'row-unselect'])

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

// Determine if the endpoint is Menus (for adding row toggle switch controls)
const isMenuEndpoint = computed(() => {
  const ep = (props.endpoint || '').toLowerCase()
  return ep === 'menus' || ep === 'menu'
})

// Determine if the endpoint needs a wider 3-column modal (Job Orders & Billing Details) or standard 2-column modal
const isWideForm = computed(() => {
  const ep = (props.endpoint || '').toLowerCase()
  return ep === 'joborders' || ep === 'billingdetails' || ep === 'job_order' || ep === 'billing'
})

const modalStyle = computed(() => {
  if (isWideForm.value) {
    return { width: '95vw', maxWidth: '1200px' }
  }
  return { width: '90vw', maxWidth: '850px' }
})

const modalBreakpoints = computed(() => {
  if (isWideForm.value) {
    return { '1200px': '95vw', '960px': '98vw' }
  }
  return { '960px': '95vw' }
})

const getColumnClass = (col) => {
  const type = getFieldType(col)
  if (type === 'textarea' || type === 'image_upload') {
    return isWideForm.value ? 'col-12 col-md-6' : 'col-12'
  }
  return isWideForm.value ? 'col-12 col-md-6 col-lg-4' : 'col-12 col-md-6'
}

const data = ref([])
const selectedRow = ref(null)
const loading = ref(false)
const refreshing = ref(false)
const error = ref(null)
const dt = ref()

const tableImagePreviewVisible = ref(false)
const tableImagePreviewUrl = ref('')
const tableImagePreviewTitle = ref('')

const openImagePreview = (url, title = 'Image Preview') => {
  tableImagePreviewUrl.value = url
  tableImagePreviewTitle.value = title
  tableImagePreviewVisible.value = true
}

// Format camelCase and underscore properties into human-readable Title Case
function formatLabel(col) {
  if (!col) return ''
  
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
    rowversion: 'Row Version'
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

  if (lower.includes('email')) {
    return 'email'
  }
  if (lower === 'confirmpassword' || lower === 'confirm_password') {
    return 'confirm_password'
  }
  if (lower === 'active' || lower === 'isactive' || lower === 'enabled') {
    return 'toggle'
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
  if (lower === 'plan_id' || lower === 'planid' || lower === 'choose_plan' || lower === 'chooseplan' || lower === 'plan') {
    return 'plan_dropdown'
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

const CONCISE_ENDPOINT_COLUMNS = {
  Applications: APPLICATION_COLUMNS,
  applications: APPLICATION_COLUMNS,
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

const filters = ref({
  global: { value: null, matchMode: 'contains' }
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

  // Client-side FilterParams Status & Date/Timestamp Filtering
  if (props.filterParams && typeof props.filterParams === 'object') {
    const pStatus = props.filterParams.status ? String(props.filterParams.status).trim().toLowerCase() : ''
    const pFrom = props.filterParams.fromDate ? new Date(props.filterParams.fromDate).getTime() : null
    const pTo = props.filterParams.toDate ? new Date(props.filterParams.toDate).getTime() : null

    if (pStatus) {
      list = list.filter(row => {
        const rowStatus = String(row.status || row.Status || '').trim().toLowerCase()
        return !rowStatus || rowStatus === pStatus
      })
    }

    if (pFrom || pTo) {
      list = list.filter(row => {
        const dateKey = DATE_FILTER_ROW_FIELDS
          .map(pref => Object.keys(row).find(k => k.toLowerCase() === pref))
          .find(k => k && row[k])
        if (!dateKey || !row[dateKey]) return true
        const rowTime = new Date(row[dateKey]).getTime()
        if (isNaN(rowTime)) return true
        if (pFrom && rowTime < pFrom) return false
        if (pTo && rowTime > pTo) return false
        return true
      })
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

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.global?.value && String(filters.value.global.value).trim().length > 0) count++
  if (selectedStatusFilter.value && String(selectedStatusFilter.value).trim().length > 0) count++
  return count
})

const clearAllFilters = () => {
  filters.value.global.value = null
  selectedStatusFilter.value = ''
  firstRowIndex.value = 0
}

const recordRangeStart = computed(() => {
  if (filteredRecordsCount.value === 0) return 0
  return firstRowIndex.value + 1
})

const recordRangeEnd = computed(() => {
  if (filteredRecordsCount.value === 0) return 0
  return Math.min(firstRowIndex.value + rowsPerPage.value, filteredRecordsCount.value)
})

watch([() => filters.value.global?.value, selectedStatusFilter, rowsPerPage], () => {
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

// Columns for Create & Edit forms (excludes system audit fields completely)
const formSections = computed(() => {
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

// Columns for View Details Modal ONLY (includes ALL fields including ID, CreatedBy/Date, ModifiedBy/Date, but deduplicated)
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

  const idIndex = keys.findIndex(k => k.toLowerCase() === 'id')
  if (idIndex > 0) {
    const [idCol] = keys.splice(idIndex, 1)
    keys.unshift(idCol)
  }
  return keys
})

const viewFormSections = computed(() => {
  const groups = {
    profile: [],
    plan: [],
    infra: [],
    network: [],
    ops: [],
    audit: []
  }

  viewFormColumns.value.forEach(col => {
    const sec = getColumnSection(col)
    if (groups[sec]) {
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
        if (col.toLowerCase() === 'password') {
          rowObj[header] = '••••••••'
        } else {
          const val = row[col]
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
        if (col.toLowerCase() === 'password') {
          return '••••••••'
        }
        const val = row[col]
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

const isApplicationEndpoint = computed(() => {
  const ep = (props.endpoint || '').trim().toLowerCase()
  return ep === 'applications' || ep === 'application'
})

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
      plansList.value = unwrap(planRes.value).map(item => ({ label: `${item.name || 'Plan #' + item.id}`, value: item.id }))
    }
    if (userRes.status === 'fulfilled') {
      usersList.value = unwrap(userRes.value)
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
  if (cityColName.value) form[cityColName.value] = ''
  if (barangayColName.value) form[barangayColName.value] = ''
  updateCitiesForSelectedRegion(regionColName.value ? form[regionColName.value] : null)
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

watch(displayCreateDialog, (isOpen) => {
  if (!isOpen) {
    resetTouchedAddressBlockers('create')
  }
})

watch(displayEditDialog, (isOpen) => {
  if (!isOpen) {
    resetTouchedAddressBlockers('edit')
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
    lower.includes('verifiedby')
  )
}

const usersMap = computed(() => {
  const map = new Map()
  ;(usersList.value || []).forEach(u => {
    if (!u) return
    const name = (u.fname || u.lname) ? `${u.fname || ''} ${u.lname || ''}`.trim() : (u.username || u.email || String(u.id))
    if (u.id !== undefined && u.id !== null) {
      map.set(Number(u.id), name)
      map.set(String(u.id).trim(), name)
    }
    if (u.username) map.set(u.username.toLowerCase(), name)
    if (u.email) map.set(u.email.toLowerCase(), name)
  })
  return map
})

const getUserDisplayName = (val) => {
  if (val === null || val === undefined || val === '') return '-'
  const strVal = String(val).trim()
  if (usersMap.value.has(strVal)) return usersMap.value.get(strVal)
  if (usersMap.value.has(Number(val))) return usersMap.value.get(Number(val))
  if (usersMap.value.has(strVal.toLowerCase())) return usersMap.value.get(strVal.toLowerCase())
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
}

const saveData = async () => {
  saveError.value = null

  // Password confirmation validation
  const hasPassword = formColumns.value.some(col => getFieldType(col) === 'password')
  if (hasPassword) {
    const pwdCol = formColumns.value.find(col => getFieldType(col) === 'password')
    const pwd = formData.value[pwdCol] || ''
    const confirmPwd = formData.value.confirmPassword || ''
    if (pwd !== confirmPwd) {
      saveError.value = 'Passwords do not match. Please ensure both password fields are identical.'
      return
    }
  }

  saving.value = true
  try {
    const payload = { ...formData.value }
    syncPairedFields(payload)
    delete payload.confirmPassword
    if (!allRawColumns.value.includes('email')) {
      delete payload.email
    }

    const loggedInUserId = String(authStore.user?.id || 2)
    const currentUserEmail = authStore.user?.email || 'admin@switchfiber.com'
    
    // Clean legacy alias audit columns
    delete payload.lastModified
    delete payload.last_modified
    delete payload.lastModifiedBy
    delete payload.last_modified_by

    // Auto-populate createdBy and modifiedBy for backend API if present in table schema
    const createdByCol = allRawColumns.value.find(c => c.toLowerCase().includes('createdby'))
    const modifiedByCol = allRawColumns.value.find(c => c.toLowerCase().includes('modifiedby') || c.toLowerCase().includes('updatedby'))

    if (createdByCol) {
      payload[createdByCol] = loggedInUserId
    }
    if (modifiedByCol) {
      payload[modifiedByCol] = loggedInUserId
    }

    if (columns.value.includes('userEmail') && !payload.userEmail) {
      payload.userEmail = currentUserEmail
    } else if (!columns.value.includes('userEmail')) {
      delete payload.userEmail
    }

    // Clean null / empty string fields and format numeric / date fields properly
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key]
      } else if (payload[key] instanceof Date) {
        const d = payload[key]
        payload[key] = d.toISOString()
      } else if (typeof payload[key] === 'string' && payload[key].trim() !== '' && !isNaN(payload[key]) && getFieldType(key) === 'number') {
        payload[key] = Number(payload[key])
      }
    })
    
    console.log(`[DynamicApiTable] Submitting CREATE to endpoint: /api/${props.endpoint}`, payload)
    await apiClient.post(`/${props.endpoint}`, payload)
    
    // Refresh table
    await fetchData()
    displayCreateDialog.value = false
  } catch (err) {
    console.error(`Error creating record for ${props.endpoint}:`, err)
    saveError.value = err.message || 'Failed to create record. Please check input values.'
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
}

const openEditDialog = async (record) => {
  resetTouchedAddressBlockers('edit')
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
      (r.regionName && r.regionName.toLowerCase() === str)
    )
    if (match) {
      matchedRegionVal = match.value
      if (regCol) editFormData.value[regCol] = match.value
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
  if (!editingRecordId.value) return
  editError.value = null

  // Password confirmation validation
  const hasPassword = formColumns.value.some(col => getFieldType(col) === 'password')
  if (hasPassword) {
    const pwdCol = formColumns.value.find(col => getFieldType(col) === 'password')
    const pwd = editFormData.value[pwdCol] || ''
    const confirmPwd = editFormData.value.confirmPassword || ''
    if (pwd !== confirmPwd) {
      editError.value = 'Passwords do not match. Please ensure both password fields are identical.'
      return
    }
  }

  savingEdit.value = true
  try {
    const payload = { ...editFormData.value }
    syncPairedFields(payload)
    delete payload.confirmPassword
    if (!allRawColumns.value.includes('email')) {
      delete payload.email
    }

    const loggedInUserId = String(authStore.user?.id || 2)
    
    // Clean legacy / alias audit columns and read-only creation audit fields
    delete payload.lastModified
    delete payload.last_modified
    delete payload.lastModifiedBy
    delete payload.last_modified_by

    Object.keys(payload).forEach(key => {
      const lower = key.toLowerCase()
      if (lower.includes('createdby') || lower.includes('createddate') || lower.includes('created_at')) {
        delete payload[key]
      } else if (lower.includes('modifiedby') || lower.includes('updatedby')) {
        payload[key] = loggedInUserId
      } else if (lower.includes('modifieddate') || lower.includes('updateddate') || lower.includes('modified_at')) {
        // Strip or format modifiedDate so invalid date strings don't fail ASP.NET DateTime validation
        if (!payload[key] || typeof payload[key] !== 'string' || isNaN(Date.parse(payload[key]))) {
          delete payload[key]
        } else {
          payload[key] = new Date(payload[key]).toISOString()
        }
      }
    })

    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key]
      } else if (payload[key] instanceof Date) {
        payload[key] = payload[key].toISOString()
      } else if (typeof payload[key] === 'string' && payload[key].trim() !== '' && !isNaN(payload[key]) && getFieldType(key) === 'number') {
        payload[key] = Number(payload[key])
      }
    })

    console.log(`[DynamicApiTable] Submitting PUT to endpoint: /api/${props.endpoint}/${editingRecordId.value}`, payload)
    await apiClient.put(`/${props.endpoint}/${editingRecordId.value}`, payload)
    await fetchData()
    displayEditDialog.value = false
  } catch (err) {
    console.error(`Error updating record for ${props.endpoint}:`, err)
    editError.value = err.message || 'Failed to update record. Please check input values.'
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
  } catch (err) {
    console.error(`Error deleting record for ${props.endpoint}:`, err)
    deleteError.value = err.message || 'Failed to delete record.'
  } finally {
    deleting.value = false
  }
}

// `silent` skips the full-page skeleton so the toolbar stays visible during a manual refresh
const fetchData = async ({ silent = false } = {}) => {
  if (!silent) loading.value = true
  error.value = null
  try {
    let url = `/${props.endpoint}`
    let params = undefined

    // The backend /filter endpoints return an empty array as soon as fromDate or
    // toDate is supplied, even for a range spanning every record, so date bounds
    // are never sent upstream. They are applied client-side in `filteredData`.
    const serverParams = {}
    Object.entries(props.filterParams || {}).forEach(([k, v]) => {
      if (DATE_FILTER_PARAM_KEYS.includes(k)) return
      if (v === undefined || v === null || String(v).trim() === '') return
      serverParams[k] = v
    })

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

      const hasApiViewer = menuList.some(m => Number(m.id) === 24 || (m.name && m.name.toLowerCase().includes('api viewer')))
      const hasSettings = menuList.some(m => Number(m.id) === 20 || (m.name && m.name.toLowerCase().includes('settings')))
      const hasTheme = menuList.some(m => Number(m.id) === 103 || (m.name && m.name.toLowerCase().includes('theme')))
      const hasModifyPwd = menuList.some(m => Number(m.id) === 101 || (m.name && m.name.toLowerCase().includes('modify password')))
      const hasUnmaskPwd = menuList.some(m => Number(m.id) === 102 || (m.name && m.name.toLowerCase().includes('unmask password')))
      
      if (!hasApiViewer) {
        menuList.push({ id: 24, name: 'API Viewer', route: '/data-viewer', icon: 'pi pi-database', description: 'Inspect live GET endpoints across all backend services' })
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

    // Auto-park / auto-select the first row on load if no row is selected
    if (data.value.length > 0 && !selectedRow.value) {
      selectedRow.value = data.value[0]
      emit('row-select', data.value[0])
    }
  } catch (err) {
    console.error(`Error for ${props.endpoint}:`, err)
    error.value = err.message || 'Failed to fetch data'
  } finally {
    if (!silent) loading.value = false
  }
}

const refreshData = async () => {
  if (refreshing.value) return
  refreshing.value = true

  const previousId = selectedRow.value?.id ?? null
  try {
    await fetchData({ silent: true })
    await fetchRelatedData()

    // Re-point the selection at the freshly fetched row object (same id), so the
    // highlighted row and any parent detail panel stay in sync after the reload.
    if (previousId !== null) {
      const match = data.value.find(row => row.id === previousId)
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
      const payload = {
        accessLevelId: targetAccId,
        menuId: targetMenuId,
        accesslevel_id: targetAccId,
        menu_id: targetMenuId,
        AccessLevelId: targetAccId,
        MenuId: targetMenuId
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

watch(() => props.filterParams, () => {
  fetchData({ silent: true })
}, { deep: true })

watch(() => props.filterEndpoint, () => {
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
  refreshData
})
</script>

<style scoped>
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
