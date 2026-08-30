---
name: switchfiber-crud-workflow
description: Step-by-step workflow for implementing, maintaining, and reviewing CRUD pages, models, and file maintenance endpoints in SwitchFiber. Use whenever creating new feature tables, adding endpoints, or updating entity management screens.
---

# SwitchFiber CRUD & File Maintenance Workflow

This skill outlines the complete standard procedure for adding, updating, and auditing CRUD entities in the SwitchFiber application.

---

## ⚡ 5-Step Implementation Checklist

Whenever introducing or updating a feature table or file maintenance entity:

### 1. Route Mapping (`src/views/FileMaintenance.vue`)
For standard CRUD tables, register the path, display title, API endpoint name, and icon:
```javascript
'/lcp': { 
  title: 'LCP', 
  endpoint: 'Lcps', 
  icon: 'pi-server', 
  description: 'Manage Local Convergence Point (LCP) cabinets and distribution hubs.' 
}
```

### 2. Router Registration (`src/router/index.js`)
Register the route with `requiresAuth: true` and add its title to `ROUTE_TITLES`:
```javascript
// In ROUTE_TITLES:
lcp: 'LCP'

// In routes array:
{
  path: '/lcp',
  name: 'lcp',
  component: () => import('../views/FileMaintenance.vue'),
  meta: { requiresAuth: true }
}
```

### 3. Sidebar Navigation (`src/components/Sidebar.vue`)
Add the item to the appropriate category in `rawMenuItems`:
```javascript
{ id: 6, name: 'LCP', path: '/lcp', icon: 'pi-server' }
```

### 4. Access Level Menu Registration (`src/components/DynamicApiTable.vue`)
Ensure the route and ID are present in the `fetchMenus` seed block so users with appropriate Access Levels aren't blocked by permission guards.

### 5. Fallback Schema & Required Fields (`src/models/`)
- Add fallback column array to `src/models/columns.js` under `EndpointColumns` (used if API returns empty array on initial fetch).
- Add required columns list to `src/models/requiredFields.js` for form validation.

---

## 🔒 Mandatory Project Rules

### 1. Form Audit Trail Standards
- **CREATE (`POST`)**: Always populate `createdBy` and `modifiedBy` with the **ID of the currently logged-in user** (`authStore.user.id`).
- **UPDATE (`PUT`)**: Only update `modifiedBy` with `authStore.user.id`. **NEVER** overwrite `createdBy` or `createdDate` during updates.
- **UI Form Visibility**: Audit fields are excluded from Create/Edit modals and displayed exclusively in the View Details modal under **System Audit & Timestamp Details**.

### 2. Form Layout & Grid Standards
- **3-Column Symmetrical Tiling**: Wide modals (`Applications`, `JobOrders`, `BillingDetails`, `ServiceOrders`, `LCPNAPLocations`) tile in clean multiples of 3 (`col-12 col-md-6 col-lg-4`) for all standard inputs and compact textareas to prevent awkward holes and uneven line wraps.
- **GPS Coordinates & Auto-Geocoding**: Place coordinates/map picker above address fields so selecting a location cascades and auto-fills Region, Province, City/Municipality, Barangay, and Address.

### 3. Default Sorting Rules
- **Applications (`Applications` / `ApplicationList`)**: Always default to **Descending order** (`sortOrder = -1`) based on `id` (newest first).
- **All Other Tables (File Maintenance, Access Level, Transactions, etc.)**: Default to **Ascending order** (`sortOrder = 1`) based on `id`.

### 4. API Response Consumption
- In custom services and stores, `apiClient` already unwraps `response.data`. Assign results directly:
  ```javascript
  const response = await YourService.getAll()
  items.value = response || []
  ```
