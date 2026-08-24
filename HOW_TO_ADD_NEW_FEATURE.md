# How to Add a New Feature in SwitchFiber

This guide walks you through adding new features and pages to SwitchFiber in simple, developer-friendly steps.

---

## ⚡ Quick Decision Guide

Choose the flow that matches your feature type:

| Feature Type | What to build | Estimated Time |
| :--- | :--- | :--- |
| **Standard File Maintenance / Table CRUD** | Use `FileMaintenance.vue` + `DynamicApiTable` | ~2 minutes |
| **Custom Screen / Specialized View** | Custom `.vue` View + Service + Store | ~10 minutes |

---

## 🚀 Flow 1: Standard File Maintenance / CRUD Page (Recommended)

If your feature is a standard management page with table listing, search, export, create, and edit capabilities (e.g., Plans, Routers, VLANs, Job Orders):

### Step 1: Add Route Mapping
**File:** [FileMaintenance.vue](file:///Users/bluegene37/WebstormProjects/switchfiber/src/views/FileMaintenance.vue)  
Add your route path, page title, and backend API endpoint name to `routeMap`:

```javascript
const routeMap = {
  // ... existing routes
  '/your_route': { title: 'Your Feature Title', endpoint: 'YourEndpointName' }
}
```

### Step 2: Register Route
**File:** [index.js](file:///Users/bluegene37/WebstormProjects/switchfiber/src/router/index.js)  
Add the route object inside the `routes` array:

```javascript
{
  path: '/your_route',
  name: 'your_route',
  component: () => import('../views/FileMaintenance.vue'),
  meta: { requiresAuth: true }
}
```

### Step 3: Add to Sidebar Menu
**File:** [Sidebar.vue](file:///Users/bluegene37/WebstormProjects/switchfiber/src/components/Sidebar.vue)  
Add a clickable menu item under the appropriate menu group (e.g., `File Maintenance` or `Transaction`):

```javascript
{ 
  name: 'File Maintenance', 
  icon: 'pi-folder',
  expanded: false,
  children: [
    // ... existing items
    { name: 'Your Feature Title', path: '/your_route', icon: 'pi-tag' }
  ]
}
```

### Step 4 (Optional): Add Fallback Columns
**File:** [columns.js](file:///Users/bluegene37/WebstormProjects/switchfiber/src/models/columns.js)  
If your backend API might return an empty array on first load, add fallback column names under `EndpointColumns`:

```javascript
export const EndpointColumns = {
  "YourEndpointName": [
    "id",
    "name",
    "description",
    "status",
    "created"
  ]
}
```

🎉 **That's it!** Your CRUD screen is fully functional with sorting, searching, pagination, export (CSV/PDF/Print), and smart Create/Edit modal forms.

---

## 🎨 Flow 2: Custom Screen / Specialized View

If your feature requires a completely custom layout or unique dashboard:

### Step 1: Add API Service
**Folder:** `src/services/`  
Create `src/services/yourFeatureService.js`:

```javascript
import api from './api'

export const YourFeatureService = {
  getAll() {
    return api.get('/YourEndpoint')
  },
  create(data) {
    return api.post('/YourEndpoint', data)
  }
}
```

### Step 2: Add Pinia Store
**Folder:** `src/stores/`  
Create `src/stores/yourFeatureStore.js`:

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { YourFeatureService } from '../services/yourFeatureService'

export const useYourFeatureStore = defineStore('yourFeature', () => {
  const items = ref([])
  const isLoading = ref(false)

  const fetchItems = async () => {
    isLoading.value = true
    try {
      // apiClient already unwraps response data directly
      const response = await YourFeatureService.getAll()
      items.value = response || []
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      isLoading.value = false
    }
  }

  return { items, isLoading, fetchItems }
})
```

### Step 3: Create UI View Component
**Folder:** `src/views/`  
Create `src/views/YourFeature.vue`:

```vue
<template>
  <div class="card p-4">
    <h2>Your Custom Feature</h2>
    <div v-if="store.isLoading">Loading...</div>
    <ul v-else>
      <li v-for="item in store.items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useYourFeatureStore } from '../stores/yourFeatureStore'

const store = useYourFeatureStore()

onMounted(() => {
  store.fetchItems()
})
</script>
```

### Step 4: Register Route & Sidebar
1. Add your new view component to [index.js](file:///Users/bluegene37/WebstormProjects/switchfiber/src/router/index.js).
2. Add the navigation item to [Sidebar.vue](file:///Users/bluegene37/WebstormProjects/switchfiber/src/components/Sidebar.vue).
3. Ensure the new route is included in the Access Level permissions configuration so users can access it without permission blocks.

---

## 📋 Core Architectural Conventions

### 1. Default Sorting Order
- **Applications (`Applications` / `ApplicationList`)**: Default to **Descending order** (`sortOrder = -1`) based on `id` (newest records first).
- **All Other Tables (File Maintenance, Access Level, Transactions, etc.)**: Default to **Ascending order** (`sortOrder = 1`) based on `id`.

### 2. Form Audit Trail
`DynamicApiTable` strips every audit column (`createdBy`, `createdDate`,
`modifiedBy`, `modifiedDate`, `rowVersion`) from the payload before it is sent —
the backend fills them in. Endpoints whose DTO still declares them are handled
by name:

- **Job Orders (`POST` and `PUT`)**: send `createdBy` as the numeric ID of the
  logged-in user (`authStore.user.id`) and `createdDate` as `null`. The API
  stamps the timestamp itself and keeps the original creator on an update. See
  `applyJobOrderCreationAudit` in `DynamicApiTable.vue`.
- **Every other endpoint**: send nothing. Do not reintroduce audit fields
  without confirming the DTO asks for them — check `src/models/schemaMeta.js`
  after running `npm run gen:schema -- --live`.

### 3. Smart Form Controls in DynamicApiTable
When using `DynamicApiTable`, modal input fields are automatically rendered based on column names:

| Naming Keyword | Generated Input Component | Example Columns |
| :--- | :--- | :--- |
| Contains `date`, `timestamp` | 📅 `DatePicker` | `dateInstalled`, `modifiedDate` |
| Contains `email` (non-audit) | ✉️ `InputText (type="email")` | `emailAddress`, `applicantEmailAddress` |
| Relational ID (`*_id`, `*Id`) | 🔽 `Select (Dropdown)` | `lcp_id`, `planId`, `accesslevel_id` |
| Numeric / Amounts / Fees | 🔢 `InputNumber` | `amount`, `installationFee`, `accountBalance` |
| Boolean flags | 🔘 `ToggleSwitch` | `active`, `isActive` |
| Descriptions / Remarks / Address | 📝 `Textarea` | `description`, `remarks`, `address` |

---

## Summary Checklist

- [ ] Route mapped in `FileMaintenance.vue` (or custom view created)
- [ ] Route added to `src/router/index.js`
- [ ] Navigation link added to `src/components/Sidebar.vue`
- [ ] Registered in Access Level menu list for permission authorization
- [ ] Fallback schema added in `src/models/columns.js` (optional)
- [ ] Verified audit trail (`createdBy` / `modifiedBy`) and sorting rules
