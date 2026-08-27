<div align="center">

# 🌐 SwitchFiber Admin Console

### *Enterprise-Grade Fiber ISP Management, Geospatial Network Mapping & Operations Platform*

[![CI Build](https://github.com/switchfiber/switchfiber/actions/workflows/ci.yml/badge.svg)](https://github.com/switchfiber/switchfiber/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Vue 3](https://img.shields.io/badge/Vue-3.5.34-42b883.svg?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0.12-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![PrimeVue](https://img.shields.io/badge/PrimeVue-4.5.5-06B6D4.svg?logo=primevue)](https://primevue.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-7952B3.svg?logo=bootstrap)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA%20%7C%20Docker-orange.svg)](#-deployment--containerization)

<p align="center">
  <a href="#-features--highlights">Features</a> •
  <a href="#-quick-start--local-development">Quick Start</a> •
  <a href="#%EF%B8%8F-technology-stack">Tech Stack</a> •
  <a href="#-cli-commands--npm-scripts">CLI Reference</a> •
  <a href="#-deployment--containerization">Deployment</a> •
  <a href="#-documentation-links">Architecture Guide</a>
</p>

</div>

---

## 📖 Overview

**SwitchFiber Admin** is a modern, high-performance web administration console designed for Fiber Internet Service Providers (ISPs), Network Operations Centers (NOCs), and field engineering teams. 

Built upon the **Model-View-ViewModel (MVVM)** pattern with Vue 3, PrimeVue, and Pinia, SwitchFiber provides unified subscriber lifecycle management, interactive fiber infrastructure mapping (LCP/NAP/Ports), real-time RADIUS analytics, automated billing workflows, and granular role-based access control.

---

## ✨ Features & Highlights

### 📊 Real-Time Operations Dashboard & Analytics
- **Live Health & Status**: Interactive KPI metric cards with automatic backend endpoint health detection and latency monitoring.
- **Apache ECharts Visualizations**: Dynamic charts for subscriber growth, monthly bandwidth trends, application funnel analysis, and job order completion rates.
- **Dark & Light Mode**: Seamless theme switching with persistent user preference storage.

### 🗺️ Geospatial Fiber Infrastructure & GPS Mapping
- **Interactive Leaflet Maps**: Visual mapping of Local Convergence Points (LCP) and Network Access Points (NAP) with marker clustering.
- **Coordinate Picker & Reverse Geocoding**: Visual point-and-click coordinate selector with OpenStreetMap Nominatim place search.
- **Port Allocation Tracking**: Live port status, capacity meters, and fiber feeder strand tracing.

### ⚡ DynamicApiTable Engine
- **Schema-Driven Form Generation**: Automatic OpenAPI schema parsing and field type detection for rapid CRUD generation.
- **Cascading Philippine PSGC Address Selector**: Native Region $\rightarrow$ Province $\rightarrow$ City/Municipality $\rightarrow$ Barangay selector.
- **Frozen Action Bar & Reorderable Columns**: Accessible data tables with sticky actions, multi-column search, and sortable headers.

### 📋 Complete Subscriber & Field Service Lifecycle
- **Application Management**: Filter by status (*In Progress*, *Done*, *Approved*), batch operations, and document verification.
- **Field Job Orders & Service Orders**: Technician dispatch tracking, installation verification, and activation workflows.
- **Billing & Invoicing**: Automated monthly billing schedules, payment status reconciliation, and invoice generation.

### 🔒 Enterprise RBAC & Security
- **Access Level Management**: Matrix-based menu permission manager with runtime reactive authorization updates.
- **SuperAdmin Override**: Built-in authorization bypass for SuperAdmin roles.
- **EXIF Image Metadata Inspector**: Automatic extraction and verification of GPS coordinates, timestamp, and device metadata from field photo submissions.
- **Comprehensive Audit Trail & Error Logs**: Searchable transaction logs filtered by date range, entity type, and user ID.

### 📤 Multi-Format Document Generation & Data Export
- **Spreadsheet Exports**: Instant client-side Excel (`.xlsx`) generation via SheetJS.
- **Formatted PDF Reports**: Clean, printable PDF tabular documents via `jspdf` and `jspdf-autotable`.

---

## 🏛️ System Architecture

SwitchFiber follows a strict **Clean / Layered MVVM Architecture**:

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

For full architectural details, consult the [**Developer Architecture Guide (GENE_GUIDE.md)**](GENE_GUIDE.md).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework & Build** | [Vue.js 3.5](https://vuejs.org/) (Composition API), [Vite 8](https://vitejs.dev/) |
| **UI Components & Theme** | [PrimeVue 4](https://primevue.org/), [PrimeIcons](https://primefaces.org/primeicons/), [Bootstrap 5 Grid](https://getbootstrap.com/) |
| **State & Navigation** | [Pinia 3](https://pinia.vuejs.org/), [Vue Router 5](https://router.vuejs.org/) |
| **Data Layer & HTTP** | [Axios](https://axios-http.com/), OpenAPI 3.1 Schemas |
| **Geospatial & Maps** | [Leaflet](https://leafletjs.com/), [Leaflet MarkerCluster](https://github.com/Leaflet/Leaflet.markercluster) |
| **Data Visualization** | [Apache ECharts 6](https://echarts.apache.org/), [vue-echarts](https://github.com/ecomfe/vue-echarts) |
| **Exports & Media** | [SheetJS (xlsx)](https://sheetjs.com/), [jsPDF](https://github.com/parallax/jsPDF), [exifr](https://github.com/MikeKovarik/exifr) |

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher

### 2. Clone & Install
```bash
# Clone the repository
git clone https://github.com/switchfiber/switchfiber.git
cd switchfiber

# Install dependencies
npm install
```

### 3. Configure Environment Variables
Create a local `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST API server endpoint (Vite dev proxy target) | `https://your-api-host:8090` |
| `VITE_API_BASE_URL` | Direct API base URL (optional, bypasses proxy) | `/api` |
| `VITE_API_TIMEOUT` | Axios request timeout duration in milliseconds | `60000` |

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⌨️ CLI Commands & NPM Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with HMR and API proxy. |
| `npm run build` | Compiles optimized production bundle in `dist/`. |
| `npm run preview` | Runs a local web server to preview production build. |
| `npm test` | Runs the automated Node.js test suite across router, models, and data layers. |
| `npm run lint` | Performs static analysis and syntax quality checks. |
| `npm run release:pack` | Compiles build and packages release archive (`.tar.gz`) with SHA256 checksum. |
| `npm run gen:schema` | Generates schema metadata and required fields from `openapi.json`. |

---

## 📦 Deployment & Containerization

### Option 1: Docker (Multi-Stage Production Container)
A production-ready multi-stage `Dockerfile` and `nginx.conf` are included:

```bash
# Build Docker image
docker build -t switchfiber-admin:1.0.0 .

# Run container
docker run -d -p 80:80 --name switchfiber-admin switchfiber-admin:1.0.0
```

### Option 2: Vercel / Cloudflare Pages / Netlify
The repository contains [`vercel.json`](vercel.json) pre-configured with proxy rewrites, SPA fallback routing, and security response headers:
```bash
vercel --prod
```

### Option 3: Traditional Nginx Server
Serve the `dist/` directory with client-side fallback:
```nginx
server {
    listen 80;
    server_name admin.switchfiber.ph;
    root /var/www/switchfiber/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🛡️ Security & Access Control

- **Role-Based Permissions**: Granular access control per user role, configured via the Access Level Management view.
- **Secure Authentication**: JWT session handling with automatic invalidation and redirection on 401 Unauthorized responses.
- **Audit Trails**: Built-in monitoring of data creation, modification, and user activities.

For vulnerability reporting procedures, see [**SECURITY.md**](SECURITY.md).

---

## 📚 Documentation Links

- 🏛️ [**GENE_GUIDE.md**](GENE_GUIDE.md) — Comprehensive Software Architecture & Engineering Reference
- 🚀 [**RELEASING.md**](RELEASING.md) — Release Engineering & Deployment Pipeline Manual
- 🤝 [**CONTRIBUTING.md**](CONTRIBUTING.md) — Contributor Guidelines & Git Standards
- 📜 [**CHANGELOG.md**](CHANGELOG.md) — Version History & Release Notes
- 🛡️ [**SECURITY.md**](SECURITY.md) — Security Policy & Disclosure Procedures
- 📄 [**LICENSE**](LICENSE) — MIT License

---

## 📄 License & Credits

SwitchFiber Admin is licensed under the [MIT License](LICENSE).  
Copyright © 2026 SwitchFiber Contributors. All rights reserved.
