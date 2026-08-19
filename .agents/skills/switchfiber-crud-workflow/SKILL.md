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
- **CREATE (`POST`)**: Always populate `createdBy` and `modifiedBy` with the **numeric ID of the currently logged-in user** (`authStore.user.id`).
- **UPDATE (`PUT`)**: Only update `modifiedBy` with `authStore.user.id`. **NEVER** overwrite `createdBy` or `createdDate` during updates.

### 2. Default Sorting Rules
- **Applications (`Applications` / `ApplicationList`)**: Always default to **Descending order** (`sortOrder = -1`) based on `id` (newest first).
- **All Other Tables (File Maintenance, Access Level, Transactions, etc.)**: Default to **Ascending order** (`sortOrder = 1`) based on `id`.

### 3. API Response Consumption
- In custom services and stores, `apiClient` already unwraps `response.data`. Assign results directly:
  ```javascript
  const response = await YourService.getAll()
  items.value = response || []
  ```
