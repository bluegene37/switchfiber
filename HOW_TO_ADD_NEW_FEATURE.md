# How to Add a New Feature (API to Screen Flow)

Whenever you want to add a new screen that fetches data from an API, you should follow this 5-step flow. This keeps the code clean and easy to maintain.

---

### Step 1: Add the API Service
**Folder:** `src/services/`  
**Purpose:** Define all the backend URL endpoints for your feature in one place.

Create a file like `src/services/planService.js`:
```javascript
import api from './api' // Assuming api.js is your configured axios client

export const PlanService = {
  getAll() {
    return api.get('/Plans')
  },
  create(data) {
    return api.post('/Plans', data)
  }
}
```

---

### Step 2: Add the State Store (Pinia)
**Folder:** `src/stores/`  
**Purpose:** Fetch the data from the service, handle loading/error states, and store the data so any component can use it.

Create a file like `src/stores/planStore.js`:
```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PlanService } from '../services/planService'

export const usePlanStore = defineStore('plans', () => {
  const plans = ref([])
  const isLoading = ref(false)

  const fetchPlans = async () => {
    isLoading.value = true
    try {
      const response = await PlanService.getAll()
      plans.value = response.data
    } catch (error) {
      console.error('Error fetching plans', error)
    } finally {
      isLoading.value = false
    }
  }

  return { plans, isLoading, fetchPlans }
})
```

---

### Step 3: Create the UI View (Vue Component)
**Folder:** `src/views/`  
**Purpose:** Display the data to the user using HTML and Bootstrap classes.

Create a file like `src/views/Plans.vue`:
```vue
<template>
  <div class="card p-4">
    <h2>Internet Plans</h2>
    <div v-if="planStore.isLoading">Loading...</div>
    <ul v-else>
      <li v-for="plan in planStore.plans" :key="plan.id">
        {{ plan.name }} - ₱{{ plan.amount }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePlanStore } from '../stores/planStore'

const planStore = usePlanStore()

onMounted(() => {
  planStore.fetchPlans()
})
</script>
```

---

### Step 4: Register the Route (Vue Router)
**File to modify:** `src/router/index.js`  
**Purpose:** Tell Vue what URL should load your new Vue component. If you skip this, the browser won't know how to reach your new page!

Open `src/router/index.js` and add a new block inside the `routes` array:
```javascript
    {
      path: '/plans',                     // The URL in the browser
      name: 'plans',                      // A unique name
      component: () => import('../views/Plans.vue'), // Points to your new file!
      meta: { requiresAuth: true }        // Protects the route (optional)
    },
```

---

### Step 5: Add it to the Sidebar (Optional)
**File to modify:** `src/components/Sidebar.vue`  
**Purpose:** Give the user a clickable button to reach your new route.

Open `src/components/Sidebar.vue` and add your new route to the `menuItems` array:
```javascript
const menuItems = ref([
  { name: 'Dashboard', path: '/dashboard', icon: 'pi-objects-column' },
  // ADD YOUR NEW LINK HERE:
  { name: 'Internet Plans', path: '/plans', icon: 'pi-wifi' },
  // ...
])
```

---

### Step 6: Using DynamicApiTable for File Maintenance / CRUD Features
**Components involved:** `src/components/DynamicApiTable.vue`, `src/views/FileMaintenance.vue`, `src/models/columns.js`  
**Purpose:** Automatically generate datatables with sorting, searching, pagination, export actions (CSV, PDF, Print), and a wide 3-column Create/Edit modal with smart field input types.

1. **Add Fallback Schema Columns (if needed):**
   Open `src/models/columns.js` and register the endpoint's column names under `EndpointColumns`:
   ```javascript
   export const EndpointColumns = {
     "YourEndpointName": [
       "id",
       "name",
       "emailAddress",
       "dateInstalled",
       "status"
     ]
   }
   ```

2. **Map Route in File Maintenance:**
   Open `src/views/FileMaintenance.vue` and add your route mapping:
   ```javascript
   '/your_route': { title: 'Your Feature Title', endpoint: 'YourEndpointName' },
   ```

3. **Smart Form Field Recognition in `DynamicApiTable.vue`:**
   `DynamicApiTable` automatically selects the best input field type for Create and Edit modals based on column naming conventions:
   - **Date Pop-up (`DatePicker`):** Any column containing `date` or `timestamp` (e.g. `dateInstalled`, `balanceUpdateDate`).
   - **Email Input (`InputText type="email"`):** Any column containing `email` (e.g. `emailAddress`, `applicantEmailAddress`). System audit emails (`email`, `useremail`) remain disabled.
   - **Dropdown (`Select`):** Relational ID columns (e.g. `lcp_id`, `nap_id`, `plan_id`, `accesslevel_id`).
   - **Numeric Input (`InputNumber`):** Amounts, fees, quantities, balances, and numerical IDs.
   - **Toggle Switch (`ToggleSwitch`):** Boolean fields (`active`, `isActive`, `enabled`).
   - **Multiline Text (`Textarea`):** Descriptions, remarks, landmarks, and physical addresses.
   - **Modal Layout:** Create and Edit modals use a wide **3-column responsive grid** (`maxWidth: 1200px`, `col-12 col-md-6 col-lg-4`) to fit extensive forms comfortably.

