# Dynamic Access Level & Role Name Resolution

## Problem Analysis
In earlier versions of the backend, "Super Admin" was created with `accesslevel_id: 1`. However, database re-seedings, deletions, and migration cycles cause the numeric IDs in `/api/AccessLevel` to change (e.g. in the active database, "Super Admin" is **ID 3**, "Developer" is **ID 4**, "Billing Manager" is **ID 5**, etc.).

Hardcoding numeric checks like `accesslevel_id === 1` or `targetAccId === 1` caused:
1. Super Admin users with `accesslevel_id: 3` or `4` to fall back to restricted permission sets.
2. The Access Level management table to treat Super Admin as unassigned or editable rather than full-access locked.
3. Top navigation bar & Settings profile cards to show generic labels (e.g. "Access Level 3") instead of "Super Admin" / "Developer".

---

## Architecture & Implementation

### 1. Dynamic Role Resolver (`isSuperAdminRole`)
In [`src/constants/menuCatalog.js`](file:///Users/bluegene37/WebstormProjects/switchfiber/src/constants/menuCatalog.js):
```js
export const isSuperAdminRole = (roleOrLevelName) => {
  if (!roleOrLevelName) return false
  const norm = String(roleOrLevelName).toLowerCase().replace(/[^a-z0-9]/g, '')
  return (
    norm.includes('super') ||
    norm.includes('developer') ||
    norm === 'admin' ||
    norm === 'superadmin' ||
    norm === 'sysadmin' ||
    norm === 'systemadministrator'
  )
}
```

### 2. Live Access Level Name Resolution (`usePermissions.js`)
In [`src/composables/usePermissions.js`](file:///Users/bluegene37/WebstormProjects/switchfiber/src/composables/usePermissions.js):
- `resolveLevelName` fetches the live access level name from `/api/AccessLevel/${levelId}` or by matching against the `/api/AccessLevel` collection.
- `isSuperAdmin` evaluates `isSuperAdminRole(resolvedLevelName.value)` along with login session roles (`user.role`, `user.accessLevelName`), supporting current ID 3 and historical ID 1 without breaking across database changes.

### 3. Access Level Management Grid (`DynamicApiTable.vue`)
In [`src/components/DynamicApiTable.vue`](file:///Users/bluegene37/WebstormProjects/switchfiber/src/components/DynamicApiTable.vue):
- `isSuperAdminAccessLevelProtected` inspects `props.selectedAccessLevel.name` using `isSuperAdminRole`.
- Automatically grants and locks full permissions for "Super Admin" (ID 3), "Developer" (ID 4), and any administrator role, preventing accidental lockout.

### 4. Navbar & Settings Displays
In [`src/components/Navbar.vue`](file:///Users/bluegene37/WebstormProjects/switchfiber/src/components/Navbar.vue) and [`src/views/Settings.vue`](file:///Users/bluegene37/WebstormProjects/switchfiber/src/views/Settings.vue):
- `userRole` dynamically displays the resolved name (e.g. "Super Admin", "Developer", "Billing Manager") fetched from `/api/AccessLevel` or `isSuperAdmin.value`.

---

## Verification

- **Live Database Inspection**:
  - `GET /api/AccessLevel` returns:
    - ID 3: `Super Admin`
    - ID 4: `Developer`
    - ID 5: `Billing Manager`
    - ID 6: `Technical Support`
    - ID 7: `Customer Support`
    - ID 8: `Data Input Team`
    - ID 9: `Field Installation Team`
    - ID 10: `Network Operations Center`
    - ID 11: `Guest`
- **Unit & Regression Testing**:
  - Ran `npm test` — **all 100 tests passed across 19 suites** (including the new `isSuperAdminRole` dynamic name parsing test).
- **Production Build**:
  - `npm run build` compiled cleanly in 472ms.
