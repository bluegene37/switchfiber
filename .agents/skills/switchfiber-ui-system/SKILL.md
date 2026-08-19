---
name: switchfiber-ui-system
description: UI design conventions, PrimeVue theme styling, layout guidelines, and component patterns for SwitchFiber. Use when building or modifying views, styling tables, modals, form inputs, and dark/light mode themes.
---

# SwitchFiber UI System & Styling Guidelines

This skill documents UI components, design tokens, and layout patterns across the SwitchFiber application.

---

## 🎨 Theme & Color Tokens

- **Master Palette**: Core brand colors are defined in CSS custom properties and derived dynamically from `MASTER_THEME_COLOR` (`#E74C5A` - SwitchFiber Crimson/Coral).
- **Theme Modes**: Supports Light and Dark modes seamlessly via `data-bs-theme="light"` / `data-bs-theme="dark"` on `document.documentElement`, synchronized with PrimeVue theme presets and persisted via `useTheme` in `localStorage`.
- **Card & Container Styling**:
  - Cards use `card shadow-sm border-0 rounded-4 bg-body`.
  - Buttons use rounded corners (`rounded-3` or `rounded-pill`) with subtle elevation.

---

## 📋 Modal Form Layouts (`DynamicApiTable.vue`)

- **3-Column Wide Modal (`isWideForm`)**:
  - Automatically applied to field-dense tables: `Applications`, `JobOrders`, `BillingDetails`.
  - Modal width: `95vw`, `maxWidth: 1200px`.
  - Column grid: `col-12 col-md-6 col-lg-4` per field, with full-width rows for addresses and multi-line remarks (`col-12 col-lg-8` or `col-12`).
- **2-Column Standard Modal**:
  - Applied to standard tables (LCP, NAP, VLAN, Router, Plan, User, etc.).
  - Modal width: `90vw`, `maxWidth: 850px`.

---

## 🧩 Form Input Components Mapping

`DynamicApiTable` automatically maps columns to smart PrimeVue controls:

| Column Pattern | Component | Notes |
| :--- | :--- | :--- |
| `*date*`, `*timestamp*` | `DatePicker` | Formatted to ISO string on submit |
| `*_id`, `*Id` | `Select` (Dropdown) | Populated from entity options |
| `amount*`, `*fee*`, `*balance*`, `*price*` | `InputNumber` | Strict numeric validation |
| `active`, `isActive`, `disabled` | `ToggleSwitch` | Boolean toggles |
| `*address*`, `*remarks*`, `description` | `Textarea` | Multi-line text input |
| `region`, `city`, `barangay` | `PhAddressSelect` | Cascading Philippine PSGC address select |
| `*picture*`, `*proof*`, `*id` (image) | `ImageDropzone` | Base64 file upload with preview |

---

## 📊 Data Tables & Action Column

- **Frozen Actions**: The `Actions` column is frozen on the right (`alignFrozen="right" :frozen="true"`), ensuring action buttons are always accessible on wide tables without excessive horizontal scrolling.
- **Sorting Default**:
  - `Applications`: Descending (`sortOrder = -1`) on `id`.
  - All other tables: Ascending (`sortOrder = 1`) on `id`.
