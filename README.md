<div align="center">

<img src="public/logo.png" alt="SwitchFiber logo" width="120" height="120">

# SwitchFiber Admin Console

**Fiber ISP management, geospatial network mapping, and operations platform**

[![CI](https://github.com/bluegene37/switchfiber/actions/workflows/ci.yml/badge.svg)](https://github.com/bluegene37/switchfiber/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883.svg?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PrimeVue](https://img.shields.io/badge/PrimeVue-4-06B6D4.svg)](https://primevue.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[Features](#features) •
[Quick start](#quick-start) •
[Configuration](#configuration) •
[Scripts](#scripts) •
[Architecture](#architecture) •
[Deployment](#deployment)

</div>

---

## Overview

SwitchFiber Admin is the web console for a fiber Internet Service Provider. It gives NOC staff, accounting, and field teams one place to manage subscribers from application through activation and billing, and to map the physical fiber plant (LCPs, NAPs, ports, VLANs, routers) on an interactive map.

The app is a Vue 3 single-page application backed by a REST API described by an OpenAPI 3.1 document. Most CRUD screens are generated from that schema at build time, so adding a new entity is mostly configuration rather than new code.

## Features

**Subscriber lifecycle**
- Applications with status views for In Progress, Done, and Approved
- Job Orders with In Progress, Completed, and Activated queues
- Service Orders, Invoices, Billing, Payments, and Disconnection tracking
- Plans, Discounts, and Discount Types

**Fiber infrastructure**
- LCP, NAP, and LCP/NAP port records with capacity tracking
- VLAN and Router inventory
- Leaflet map of LCP/NAP locations with marker clustering
- Click-to-pick coordinates with OpenStreetMap Nominatim place search
- EXIF inspector that pulls GPS, timestamp, and device data from field photos

**Operations**
- Main and Accounting dashboards with Apache ECharts visualisations
- Backend health and latency indicators
- Audit trail and error logs, filterable by date, entity, and user
- Excel and PDF export from any table

**Administration**
- Users, Menus, and Access Levels with a per-menu permission matrix
- Role-based navigation that updates reactively when permissions change
- Light and dark themes with persisted preference
- Installable as a Progressive Web App

## Quick start

Requires Node.js 20 or 22 and npm 10 or newer.

```bash
git clone https://github.com/bluegene37/switchfiber.git
cd switchfiber
npm install
cp .env.example .env   # then set VITE_API_URL to your backend
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`, and sign in with an account from your backend.

## Configuration

All settings are `VITE_*` variables read from `.env`. They are inlined into the client bundle at build time, so never put secrets in them.

| Variable | Purpose | Default |
| :-- | :-- | :-- |
| `VITE_API_URL` | Backend origin used by the Vite dev proxy for `/api` | none, set this |
| `VITE_API_BASE_URL` | Point axios straight at an API origin and bypass the proxy | unset, uses `/api` |
| `VITE_API_TIMEOUT` | Request timeout in milliseconds | `60000` |

In production the `/api` path is rewritten by `vercel.json` or `nginx.conf` instead of the dev proxy.

## Scripts

| Command | What it does |
| :-- | :-- |
| `npm run dev` | Start the Vite dev server with hot reload and the API proxy |
| `npm run build` | Produce an optimised bundle in `dist/` |
| `npm run preview` | Serve the production bundle locally |
| `npm test` | Run the Node test suite (`tests/**/*.test.js`) |
| `npm run lint` | Static syntax and quality checks |
| `npm run gen:schema` | Regenerate schema metadata and required-field maps from `openapi.json` |
| `npm run release:pack` | Build and package a release archive with a SHA-256 checksum |

## Architecture

The code follows a layered MVVM split:

```
src/
├── views/        Route-level screens (Dashboard, ApplicationList, LcpNapMap, ...)
├── components/   Reusable UI, including the schema-driven DynamicApiTable
├── stores/       Pinia stores, one per domain entity
├── services/     Axios clients, one file per API resource
├── composables/  Shared reactive logic (theme, permissions, search)
├── models/       Generated schema metadata, required fields, column fallbacks
├── router/       Vue Router routes and auth guards
├── layouts/      App shell (sidebar, header, toast outlet)
└── constants/    Menu catalog
```

- **Views and components** render with PrimeVue and the Bootstrap grid.
- **Stores** hold state, caching, and lookups; components never call axios directly.
- **Services** wrap the REST API with a shared client that attaches the bearer token, enforces timeouts, and normalises errors.
- **Schema metadata** is generated from `openapi.json` and drives table columns, form fields, and validation.

## Deployment

**Docker.** A multi-stage `Dockerfile` builds the bundle and serves it with nginx using the included `nginx.conf`.

```bash
docker build -t switchfiber-admin:1.0.0 .
docker run -d -p 80:80 --name switchfiber-admin switchfiber-admin:1.0.0
```

**Vercel.** `vercel.json` ships with the `/api` rewrite, SPA fallback, and security headers.

```bash
vercel --prod
```

**Any static host.** Serve `dist/` and fall back to `index.html` for unknown paths, then proxy `/api` to the backend.

## Tech stack

| Layer | Libraries |
| :-- | :-- |
| Framework and build | Vue 3.5 (Composition API), Vite 8 |
| UI | PrimeVue 4, PrimeIcons, Bootstrap 5 grid |
| State and routing | Pinia 3, Vue Router 5 |
| HTTP | Axios |
| Maps | Leaflet, Leaflet.markercluster |
| Charts | Apache ECharts 6, vue-echarts |
| Export and media | SheetJS (xlsx), jsPDF with autotable, exifr, Dropzone |

## License

Released under the [MIT License](LICENSE).
