# SwitchFiber Developer Guide & Architecture Reference (GENE_GUIDE)

Welcome to **SwitchFiber** — an enterprise-grade Fiber Internet Service Provider (ISP) management, geospatial mapping, and operations web platform.

This guide provides a comprehensive breakdown of our **software architecture**, **tech stack & tools**, **developer workflows/flows**, and **core engineering conventions**.

---

## 📑 Table of Contents

1. [System Architecture](#-system-architecture)
   - [Frontend Architecture: MVVM Pattern](#1-frontend-architecture-mvvm-pattern)
   - [Layered / Clean Architecture Structure](#2-layered--clean-architecture-structure)
   - [Backend Architecture & API Integration](#3-backend-architecture--api-integration)
2. [Tools & Technology Stack](#%EF%B8%8F-tools--technology-stack)
   - [Core Framework & Runtime](#core-framework--runtime)
   - [UI, Theming & Styling](#ui-theming--styling)
   - [State Management & Routing](#state-management--routing)
   - [Networking & Data Layer](#networking--data-layer)
   - [Geospatial & Mapping](#geospatial--mapping)
   - [Charts & Visualization](#charts--visualization)
   - [Export & Document Generation](#export--document-generation)
   - [Media & Metadata Processing](#media--metadata-processing)
   - [Developer Scripts & Schema Tools](#developer-scripts--schema-tools)
3. [Developer Decision Guide](#-developer-decision-guide)
4. [Flow 1: Standard File Maintenance / CRUD Page](#-flow-1-standard-file-maintenance--crud-page-recommended)
5. [Flow 2: Custom Screen / Specialized View](#-flow-2-custom-screen--specialized-view)
6. [DynamicApiTable Engine & Smart Form Controls](#-dynamicapitable-engine--smart-form-controls)
7. [Core Project Rules & Conventions](#-core-project-rules--conventions)
8. [CLI Commands & Scripts Reference](#-cli-commands--scripts-reference)
9. [Developer Implementation Checklist](#-developer-implementation-checklist)

---

## 🏛 System Architecture

SwitchFiber is built using modern **Clean Architecture** principles on top of the **MVVM (Model-View-ViewModel)** architectural pattern on the frontend, integrating seamlessly with an **ASP.NET Core RESTful Web API** backend.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER (VIEW)                          │
│   Vue 3 SFCs (.vue)  •  PrimeVue UI Components  •  Bootstrap Grid System     │
│   Leaflet Maps  •  ECharts Visualizations  •  Custom Modals & Layouts       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Directives & Two-Way Bindings
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STATE & LOGIC LAYER (VIEWMODEL)                         │
│   Pinia Stores (Auth, Applications, JobOrders, LCP/NAP, etc.)               │
│   Vue Composables (useTheme, usePermissions, useSearch)                     │
│   Reactive State, Computed Properties, Lookup Caching                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Async Service Calls
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   SERVICE & INFRASTRUCTURE LAYER (API)                      │
│   Axios Client (api.js)  •  Bearer Interceptors  •  Timeout Guards (60s)     │
│   Standardized Error Handlers  •  Feature Services (applications.js, etc.)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST / JSON (HTTP GET/POST/PUT/DELETE)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DOMAIN MODELS & SCHEMA LAYER                          │
│   OpenAPI 3.1 Metadata (schemaMeta.js)  •  Required Fields Engine           │
│   Column Fallbacks (columns.js)  •  PSGC Philippines Address Dataset        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Frontend Architecture: MVVM Pattern

The frontend is structured around the **Model-View-ViewModel (MVVM)** pattern powered by the **Vue 3 Composition API**:

| MVVM Role | Implementation in SwitchFiber | Location |
| :--- | :--- | :--- |
| **Model** | Represents entity data structures, OpenAPI schema definitions, fallback columns, and validation metadata. | `src/models/` (`schemaMeta.js`, `columns.js`, `requiredFields.js`, `types.js`) |
| **View** | User Interface elements, layouts, and data templates. Declarative and stateless where possible; binds reactively to the ViewModel. | `src/views/`, `src/components/`, `src/layouts/` |
| **ViewModel** | Encapsulates UI state, business logic, authorization guards, form validation, and reactive transformations. Intermediary between the View and Model/Services. | `src/stores/` (Pinia stores), `src/composables/` (`usePermissions.js`, `useTheme.js`, `useSearch.js`) |

---

### 2. Layered / Clean Architecture Structure

To ensure high maintainability, loose coupling, and clear separation of concerns, the project is organized into distinct layers:

```
src/
├── assets/          # Static images, brand logos, and SVGs
├── components/      # Reusable UI widgets (DynamicApiTable, Navbar, Sidebar, Map, Charts)
├── composables/     # Shared presentation logic (permissions, theme, search)
├── layouts/         # Page scaffolding (AppLayout for dashboard, AuthLayout for login)
├── models/          # Schemas, fallback column definitions, required fields overrides
├── router/          # Vue Router configuration, route guards, and title mappings
├── services/        # Low-level Axios API service layer per domain entity
├── stores/          # Pinia global reactive state stores
├── utils/           # Utility functions (EXIF data parser, image actions)
├── views/           # Top-level route pages (Dashboard, Applications, FileMaintenance)
├── App.vue          # Root Vue component with global Toast & layout wrappers
├── main.js          # Application entry point, plugin registrations, and theme init
└── style.css        # Global CSS design tokens, master theme colors, and layout overrides
```

1. **Presentation Layer (`src/views/`, `src/components/`, `src/layouts/`)**:
   - Responsible strictly for rendering data and capturing user interactions.
   - Leverages `PrimeVue 4` design tokens and `Bootstrap 5` responsive grid.
   - Uses `DynamicApiTable.vue` to achieve a zero-boilerplate generic CRUD engine across 20+ entities.

2. **State & Logic Layer (`src/stores/`, `src/composables/`)**:
   - `Pinia` stores manage domain state (`applications.js`, `jobOrders.js`, `lcps.js`, etc.).
   - Stores handle data caching (e.g., lookups for Plans, Routers, Barangays, LCPs) to eliminate redundant network roundtrips.
   - Composables encapsulate cross-cutting concerns (`usePermissions` for RBAC, `useTheme` for dark/light mode).

3. **Service & Infrastructure Layer (`src/services/`)**:
   - Centralized Axios client (`src/services/api.js`) handles base URLs, auth token injection, JSON parsing, timeout guards, and standardized error messaging.
   - Domain services (`applications.js`, `jobOrders.js`, etc.) expose clean, typed async methods.

4. **Domain & Metadata Layer (`src/models/`, `src/utils/`)**:
   - Stores OpenAPI 3.1 schema mappings generated from the backend (`schemaMeta.js`).
   - Defines validation rules (`requiredFields.js`) and UI column fallbacks (`columns.js`).
   - Parses EXIF metadata (`exif.js`) for geolocation extraction from field photos.

---

### 3. Backend Architecture & API Integration

The backend is built with **ASP.NET Core Web API** using REST architecture and Clean Architecture principles (Controllers, Application Services, Repositories, Entity Framework Core).

- **Standard REST Method Mapping**:
  - `GET /api/[Endpoint]` ➔ List all records
  - `GET /api/[Endpoint]/{id}` ➔ Retrieve single entity
  - `POST /api/[Endpoint]` ➔ Create a record
  - `PUT /api/[Endpoint]/{id}` ➔ Update an existing record
  - `DELETE /api/[Endpoint]/{id}` ➔ Delete a record
- **OpenAPI 3.1 Spec**: The API exposes live Swagger/OpenAPI documentation at `/openapi/v1.json`, which drives our automated schema generation tool.

---

## 🛠️ Tools & Technology Stack

The following table summarizes all core technologies, libraries, and developer tools used across SwitchFiber:

| Category | Tool / Package | Version | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **Core Framework** | [Vue.js](https://vuejs.org/) | `^3.5.34` | Progressive JavaScript framework using Composition API and `<script setup>` SFCs. |
| **Build & Dev Server** | [Vite](https://vitejs.dev/) | `^8.0.12` | Ultra-fast build tool, local dev server with HMR, proxying, and Rollup chunk optimization. |
| **UI Component Suite** | [PrimeVue](https://primevue.org/) | `^4.5.5` | Enterprise UI components (DataTable, Dialog, DatePicker, Select, InputNumber, Toast, Tooltip). |
| **UI Theme Presets** | [@primevue/themes](https://primevue.org/) | `^4.5.4` | Aura theme preset with custom CSS layer configuration (`bootstrap, primevue`) and `.dark` mode. |
| **Icons** | [PrimeIcons](https://primevue.org/icons/) | `^7.0.0` | Comprehensive vector icon set integrated across menus, buttons, and status indicators. |
| **Grid & Utilities** | [Bootstrap](https://getbootstrap.com/) | `^5.3.8` | Responsive 12-column grid layout, flexbox utilities, and spacing helpers. |
| **State Management** | [Pinia](https://pinia.vuejs.org/) | `^3.0.4` | Intuitive, type-safe reactive global store for Vue 3. |
| **Routing & RBAC** | [Vue Router](https://router.vuejs.org/) | `^5.1.0` | SPA client-side routing with navigation guards, metadata, and Access Level permissions. |
| **HTTP Client** | [Axios](https://axios-http.com/) | `^1.18.0` | Promise-based HTTP library with request/response interceptors, 60s timeout, and Bearer auth. |
| **Geospatial Maps** | [Leaflet](https://leafletjs.com/) | `^1.9.4` | Mobile-friendly interactive maps for LCP/NAP distribution hubs and subscriber geolocation. |
| **Map Clustering** | [leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) | `^1.5.3` | High-performance marker clustering for thousands of fiber distribution points. |
| **Data Visualization** | [Apache ECharts](https://echarts.apache.org/) | `^6.1.0` | High-performance charting engine for operational analytics and dashboard metrics. |
| **Vue ECharts Bridge** | [vue-echarts](https://github.com/ecomfe/vue-echarts) | `^8.0.1` | Vue 3 wrapper component for declarative ECharts rendering. |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) | `^4.2.1` | Client-side dynamic PDF generation for reports, subscriber forms, and job orders. |
| **PDF Tables** | [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) | `^5.0.8` | Automated table layout plugin for formatted PDF report exports. |
| **Spreadsheet Export** | [XLSX (SheetJS)](https://sheetjs.com/) | `^0.18.5` | Client-side Excel (.xlsx) and CSV workbook parsing and export. |
| **EXIF Metadata** | [exifr](https://github.com/MikeKovarik/exifr) | `^7.1.3` | Fast EXIF, GPS coordinates, and timestamp extractor for field installation photos. |
| **File Uploads** | [Dropzone](https://www.dropzone.dev/) | `^6.0.0-beta.2` | Drag-and-drop file and image uploader with preview and base64 encoding. |
| **Schema Generation** | Node.js Script | Native | Custom generator (`scripts/generate_schema_meta.js`) translating OpenAPI schemas to form metadata. |
| **PSGC Address Data** | Node.js Script | Native | Ingests official Philippine Standard Geographic Code (Regions, Provinces, Cities, Barangays). |

---

## ⚡ Developer Decision Guide

When adding new functionality to SwitchFiber, select the implementation flow that matches your requirements:

```
                                  Do you need a new feature?
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
       Standard Table / CRUD Management                  Custom Specialized Screen / Dashboard
       (e.g., Plans, Routers, LCP, NAP, Logs)            (e.g., LCP Map, Interactive Graphs, Onboarding)
                    │                                                   │
                    ▼                                                   ▼
             USE FLOW 1 (Fast)                                   USE FLOW 2 (Custom)
       FileMaintenance.vue + DynamicApiTable                Custom View + Service + Pinia Store
       ⏱ Estimated time: ~2 minutes                         ⏱ Estimated time: ~10 minutes
```

---

## 🚀 Flow 1: Standard File Maintenance / CRUD Page (Recommended)

If your feature is a standard management page with table listing, search, export, create, and edit capabilities:

### Step 1: Add Route Mapping
**File:** [src/views/FileMaintenance.vue](file:///Users/bluegene37/WebstormProjects/switchfiber/src/views/FileMaintenance.vue)  
Add your route path, page title, API endpoint name, and optional description to `routeMap`:

```javascript
const routeMap = {
  // ... existing routes
  '/your_route': { 
    title: 'Your Feature Title', 
    endpoint: 'YourEndpointName',
    icon: 'pi-tag',
    description: 'Manage your feature entities and configuration.'
  }
}
```

### Step 2: Register Route in Vue Router
**File:** [src/router/index.js](file:///Users/bluegene37/WebstormProjects/switchfiber/src/router/index.js)  
1. Add the route title to `ROUTE_TITLES`:
```javascript
export const ROUTE_TITLES = {
  // ...
  your_route: 'Your Feature Title'
}
```
2. Add the route object inside the `routes` array:
```javascript
{
  path: '/your_route',
  name: 'your_route',
  component: () => import('../views/FileMaintenance.vue'),
  meta: { requiresAuth: true }
}
```

### Step 3: Add to Sidebar Menu
**File:** [src/components/Sidebar.vue](file:///Users/bluegene37/WebstormProjects/switchfiber/src/components/Sidebar.vue)  
Add a clickable menu item under the appropriate menu category in `rawMenuItems`:

```javascript
{ 
  name: 'File Maintenance', 
  icon: 'pi-folder',
  expanded: false,
  children: [
    // ... existing items
    { id: 25, name: 'Your Feature Title', path: '/your_route', icon: 'pi-tag' }
  ]
}
```

### Step 4: Register in Access Level Permissions
**File:** [src/components/DynamicApiTable.vue](file:///Users/bluegene37/WebstormProjects/switchfiber/src/components/DynamicApiTable.vue)  
Ensure the menu item and ID are registered in `fetchMenus` so users with assigned Access Levels are not blocked by permission checks.

### Step 5 (Optional): Configure Fallback Columns & Required Fields
- **Fallback Columns** ([src/models/columns.js](file:///Users/bluegene37/WebstormProjects/switchfiber/src/models/columns.js)):
  If the API might return an empty array on first load, define fallback column keys under `EndpointColumns`:
  ```javascript
  export const EndpointColumns = {
    "YourEndpointName": ["id", "name", "description", "status"]
  }
  ```
- **Required Fields** ([src/models/requiredFields.js](file:///Users/bluegene37/WebstormProjects/switchfiber/src/models/requiredFields.js)):
  If custom validation overrides are needed beyond OpenAPI schemas, add them to `ENDPOINT_OVERRIDES`.

🎉 **Result**: Your table is automatically equipped with server/client search, multi-column sorting, pagination, CSV/PDF/Excel/Print exports, and smart dynamic Create/Edit modals!

---

## 🎨 Flow 2: Custom Screen / Specialized View

If your feature requires a bespoke layout, interactive mapping, or unique analytical charts:

### Step 1: Create API Service
**Folder:** `src/services/`  
Create `src/services/yourFeatureService.js`:

```javascript
import api from './api'

export const YourFeatureService = {
  getAll() {
    return api.get('/YourEndpoint')
  },
  getById(id) {
    return api.get(`/YourEndpoint/${id}`)
  },
  create(data) {
    return api.post('/YourEndpoint', data)
  },
  update(id, data) {
    return api.put(`/YourEndpoint/${id}`, data)
  },
  delete(id) {
    return api.delete(`/YourEndpoint/${id}`)
  }
}
```

### Step 2: Create Pinia Store
**Folder:** `src/stores/`  
Create `src/stores/yourFeatureStore.js`:

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { YourFeatureService } from '../services/yourFeatureService'

export const useYourFeatureStore = defineStore('yourFeature', () => {
  const items = ref([])
  const isLoading = ref(false)
  const errorMessage = ref(null)

  const activeItems = computed(() => items.value.filter(i => i.active || i.isActive))

  const fetchItems = async () => {
    isLoading.value = true
    errorMessage.value = null
    try {
      // apiClient response interceptor automatically unwraps response.data
      const response = await YourFeatureService.getAll()
      items.value = Array.isArray(response) ? response : []
    } catch (error) {
      errorMessage.value = error.message || 'Failed to fetch items.'
      console.error('[YourFeatureStore Error]:', error)
    } finally {
      isLoading.value = false
    }
  }

  return { items, activeItems, isLoading, errorMessage, fetchItems }
})
```

### Step 3: Create UI View Component
**Folder:** `src/views/`  
Create `src/views/YourFeature.vue`:

```vue
<template>
  <div class="card shadow-sm border-0 rounded-4 bg-body p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-1">Your Custom Feature</h4>
        <p class="text-muted small mb-0">Manage specialized operations and dashboards.</p>
      </div>
      <button class="btn btn-primary rounded-pill px-4" @click="handleRefresh">
        <i class="pi pi-refresh me-2"></i> Refresh
      </button>
    </div>

    <div v-if="store.isLoading" class="text-center py-5">
      <i class="pi pi-spin pi-spinner text-primary" style="font-size: 2rem;"></i>
      <p class="text-muted mt-2">Loading data...</p>
    </div>

    <div v-else-if="store.errorMessage" class="alert alert-danger rounded-3">
      {{ store.errorMessage }}
    </div>

    <div v-else class="row g-3">
      <div v-for="item in store.items" :key="item.id" class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 border rounded-3 p-3 shadow-none">
          <h6 class="fw-bold text-primary">{{ item.name || `Item #${item.id}` }}</h6>
          <p class="text-muted small mb-2">{{ item.description || 'No description available' }}</p>
          <span class="badge bg-success-subtle text-success w-auto align-self-start">
            Active
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useYourFeatureStore } from '../stores/yourFeatureStore'

const store = useYourFeatureStore()

const handleRefresh = () => {
  store.fetchItems()
}

onMounted(() => {
  store.fetchItems()
})
</script>
```

### Step 4: Register Route & Sidebar
1. Add the component to [src/router/index.js](file:///Users/bluegene37/WebstormProjects/switchfiber/src/router/index.js).
2. Register the path in [src/components/Sidebar.vue](file:///Users/bluegene37/WebstormProjects/switchfiber/src/components/Sidebar.vue).
3. Add to Access Level permissions configuration so authorized roles can access it.

---

## 🧩 DynamicApiTable Engine & Smart Form Controls

The `DynamicApiTable.vue` component dynamically generates modal input fields based on column names and schema metadata:

| Column Pattern / Keyword | Rendered PrimeVue Control | Usage & Example Columns |
| :--- | :--- | :--- |
| `*date*`, `*timestamp*` | 📅 `DatePicker` | `dateInstalled`, `dueDate`, `installationDate` |
| Relational ID (`*_id`, `*Id`) | 🔽 `Select (Dropdown)` | `planId`, `routerId`, `lcp_id`, `accesslevel_id` |
| `amount*`, `*fee*`, `*price*`, `*balance*` | 🔢 `InputNumber` (Currency/Decimal) | `amount`, `installationFee`, `monthlyRate` |
| `active`, `isActive`, `disabled` | 🔘 `ToggleSwitch` | `active`, `isActive` |
| `*remarks*`, multiline descriptions | 📝 `Textarea` (1-Column Compact) | `remarks`, `onsiteRemarks`, `joRemarks` |
| `applyingFor` | 🔽 `Select (Dropdown)` | `New Installation`, `Plan Upgrade`, `Transfer`, etc. |
| `contractTemplate` | 🔽 `Select (Dropdown)` | `Standard 24-Month`, `Standard 12-Month`, `No Lock-in`, etc. |
| `invoiceStatus` / `status` (Invoices) | 🔽 `Select (Dropdown)` | `Unpaid`, `Paid`, `Overdue`, `Cancelled`, `Partially Paid` |
| `renter` | 🔽 `Select (Dropdown)` | `No (Owner)`, `Yes (Renter)` |
| `deliveryStatus` | 🔽 `Select (Dropdown)` | `Delivered`, `Pending`, `Sent via Email`, `Sent via SMS`, etc. |
| `region`, `city`, `barangay` | 🇵🇭 `PhAddressSelect` | Cascading Philippine PSGC address selectors |
| `*picture*`, `*proof*`, `*image*`, `houseFront` | 🖼️ `ImageDropzone` | Base64 file uploader with EXIF metadata parsing |
| `latitude`, `longitude`, `coordinates` | 📍 `CoordinatePicker` | Map coordinate selector placed **above address fields** |
| `email*`, `applicantEmailAddress` | ✉️ `InputText` (`type="email"`) | Email input with regex validation |
| Default Strings | 🔤 `InputText` | Standard text fields |

### Modal Layout & Grid System
- **3-Column Symmetrical Tiling (`isWideForm`)**: Applied automatically to field-heavy entities (`Applications`, `JobOrders`, `BillingDetails`, `ServiceOrders`, `LCPNAPLocations`). Every single field and textarea takes 1 column (`col-12 col-md-6 col-lg-4`), allowing rows to tile cleanly in multiples of 3 (`4 + 4 + 4 = 12 cols`) without empty holes or jagged wraps. Modal width: `95vw`, max-width: `1200px`.
- **2-Column Standard Modal**: Applied to standard entities (`Plans`, `Routers`, `VLANs`, `LCPs`, `Users`, `Menus`). Modal width: `90vw`, max-width: `850px`.
- **Map & Coordinates Placement**: Placed at the top of location sections so that picking a pin or entering lat/long auto-fills the cascading Region, Province, City, Barangay, and Address fields below it.
- **100% Free Tile Providers**: Utilizes standard OpenStreetMap and Esri World Imagery with zero watermark or API key requirements.
- **Frozen Actions Column**: Action buttons (`Edit`, `Delete`, `View`) are pinned to the right (`alignFrozen="right" :frozen="true"`), eliminating unnecessary horizontal scrolling.

---

## 🔒 Core Project Rules & Conventions

### 1. REST API Standards
All backend calls must adhere to strict REST conventions:
- **`GET /api/[Endpoint]`**: Query / list records.
- **`GET /api/[Endpoint]/{id}`**: Query a single record.
- **`POST /api/[Endpoint]`**: Create a new record.
- **`PUT /api/[Endpoint]/{id}`**: Update an existing record.
- **`DELETE /api/[Endpoint]/{id}`**: Delete a record.

### 2. Form Audit Trail & Logged-in User ID Standards
- **Hidden in Create & Edit Forms**: Audit fields (`createdBy`, `modifiedBy`, `createdDate`, `modifiedDate`, `lastModified`, `lastModifiedBy`, `timestamp`, `rowVersion`) are completely filtered out of Create and Update forms.
- **Exclusively Visible in View Details**: Audit information is displayed under the read-only **🛡️ System Audit & Timestamp Details** section in the View Details modal with formatted local timestamps and resolved user display names.
- **Create (`POST`)**:
  - `createdBy` is stamped with the logged-in user ID (`authStore.user.id`).
  - `modifiedBy` is stamped with the logged-in user ID (`authStore.user.id`).
  - `createdDate` and `modifiedDate` are stamped with the current local timestamp.
- **Update (`PUT`)**:
  - `modifiedBy` is updated with the logged-in user ID (`authStore.user.id`).
  - `modifiedDate` is updated with the current local timestamp.
  - **`createdBy` and `createdDate` are preserved and never overwritten**, protecting the original creator record.

### 3. Default Sorting Order
- **Applications (`Applications` / `ApplicationList`)**: Default to **Descending order** (`sortOrder = -1`) based on `id` (newest applications first).
- **All Other Tables**: Default to **Ascending order** (`sortOrder = 1`) based on `id`.

### 4. Theming & Design System
- **Master Theme Color**: `#E74C5A` (SwitchFiber Crimson/Coral), configured dynamically via CSS custom properties.
- **Dark Mode**: Managed via `.dark` class on `document.documentElement` and synchronized with PrimeVue Aura preset and `localStorage`.

### 5. Access Level & RBAC Standards
- Whenever adding a new route or menu item, register it in the **Sidebar menu** and include it in the **Access Level permissions configuration**.

### 6. Development & Testing Credentials
- **SuperAdmin Account**:
  - **Username / Email**: `bluegene37`
  - **Password**: `1234`

---

## 💻 CLI Commands & Scripts Reference

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start the local Vite development server with hot module replacement (HMR). |
| `npm run build` | Build optimized production bundles with chunk splitting. |
| `npm run preview` | Locally preview the production build artifacts. |
| `npm run gen:schema` | Generate `src/models/schemaMeta.js` from the local `openapi.json` spec. |
| `npm run gen:schema -- --live` | Fetch the live OpenAPI schema from `https://103.249.198.50:8090/openapi/v1.json` and regenerate `schemaMeta.js`. |
| `node scripts/download_ph_data.js` | Download and refresh Philippine PSGC geographic address data (regions, provinces, cities, barangays). |
| `node scripts/seed_applications.js` | Seed mock subscriber applications for testing and development. |

---

## ✅ Developer Implementation Checklist

Before completing any new feature or pull request, verify the following checklist:

- [ ] **Architecture Check**: Follows MVVM (Model in `models/`, View in `views/components/`, ViewModel in `stores/composables/`).
- [ ] **Route Registered**: Added to `src/router/index.js` with auth guard and title in `ROUTE_TITLES`.
- [ ] **Menu Navigation**: Added to `src/components/Sidebar.vue` under the proper category.
- [ ] **Access Level Config**: Registered in `DynamicApiTable.vue` menu seed to ensure authorized access.
- [ ] **REST Methods**: Strictly adheres to `GET`, `POST`, `PUT`, `DELETE` standards.
- [ ] **Audit Trail Protected**: Audit fields excluded from `PUT` and formatted correctly on `POST`.
- [ ] **Sorting Verified**: Applications sorted descending (`-1`); other tables sorted ascending (`1`).
- [ ] **Dark & Light Mode**: Verified UI renders cleanly in both light and dark themes.
- [ ] **No Console Noise**: Checked that unnecessary `console.log` statements are cleaned up.
