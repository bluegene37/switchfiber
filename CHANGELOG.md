# Changelog

All notable changes to the **SwitchFiber Admin Console** web platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-27

### Added
- **Browser Tab Admin Branding**: Branded document tab titles as `<Page Name> | SwitchFiber Admin` across all client-side routes and static index HTML metadata.
- **Automated CI/CD Workflows**: Added multi-platform GitHub Actions CI pipeline (`ci.yml`) and automated release pipeline (`release.yml`) for production packaging.
- **Quality Gates & Automated Test Suite**: Built-in tests for router definitions, RBAC permissions, OpenAPI schema metadata, and PSGC address dataset integrity (`npm test`, `npm run lint`).
- **DynamicApiTable Engine**: Advanced reactive data table with automatic schema-driven form generation, multi-column search, column reordering, frozen action bars, and export helpers.
- **Geospatial LCP & NAP Infrastructure**: Interactive Leaflet & OpenStreetMap network infrastructure mapping with marker clustering, GPS coordinate picker, and reverse geocoding.
- **Analytics & Operations Dashboard**: Real-time KPI summary cards, Apache ECharts interactive charts (Monthly Trends, Distribution, Status Breakdown), and backend API health indicators.
- **Role-Based Access Control (RBAC)**: Fine-grained access level and menu permissions system with SuperAdmin bypass and reactive runtime synchronization.
- **Data Export & Document Generation**: Client-side Excel `.xlsx` spreadsheet exports via SheetJS and formatted tabular PDF document generator using `jspdf` and `jspdf-autotable`.
- **Media & EXIF Processing**: Drag-and-drop image dropzone with base64 data conversion, EXIF metadata inspector, and image attachment preview.
- **Philippine Geographic Data Engine**: Cascading PSGC address selection for Regions, Provinces, Cities/Municipalities, and Barangays.
- **Docker & Container Support**: Production-ready multi-stage `Dockerfile` with Nginx Alpine, security headers, gzip compression, and SPA client-side routing.
- **Community Health Suite**: Standardized issue templates for bug reports and feature requests, pull request template, contributing guidelines, and security policy.

### Changed
- Standardized RESTful API integration adhering to HTTP `GET`, `POST`, `PUT`, `DELETE` conventions across all entity services.
- Excluded backend audit trail fields (`createdBy`, `createdDate`, `modifiedBy`, `modifiedDate`) from UI forms and update payloads to align with the backend schema.
- Hardened `.gitignore` and build scripts for release readiness.

### Security
- Added automated session token invalidation on 401 Unauthorized responses.
- Enforced Content Security headers, nosniff, framing protection, and HSTS in production web server configurations (`vercel.json`, `nginx.conf`).
- Added comprehensive `SECURITY.md` vulnerability reporting guidelines.
