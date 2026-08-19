---
name: switchfiber-api-patterns
description: Guidelines and patterns for integrating, debugging, and testing ASP.NET REST API endpoints in SwitchFiber. Use when creating API services, investigating timeout issues, adding query filters, or working with OpenAPI schemas.
---

# SwitchFiber API Patterns & Best Practices

This skill provides guidelines for consuming, filtering, and debugging backend APIs in SwitchFiber.

---

## 📡 REST API Structure & Method Mapping

All API calls must strictly follow REST standards:

| Method | Endpoint Pattern | Description |
| :--- | :--- | :--- |
| `GET` | `/api/[Endpoint]` | List / query all records |
| `GET` | `/api/[Endpoint]/{id}` | Retrieve single record by ID |
| `POST` | `/api/[Endpoint]` | Create a new record |
| `PUT` | `/api/[Endpoint]/{id}` | Update existing record by ID |
| `DELETE` | `/api/[Endpoint]/{id}` | Delete record by ID |

---

## ⏱️ Timeout & Large Dataset Handling

- **Axios Timeout**: Configured to `60,000ms` (60s) in `src/services/api.js` to allow backend queries on large unpaginated collections to settle without premature client aborts.
- **Server Filtering**: For high-volume endpoints (e.g., `/Applications/filter`), always leverage available query params (`status`, `fromDate`, `toDate`) to limit payload size over the wire.
- **Lookup Caching**: Reusable lookup data (e.g., Plans, Routers, Barangays, LCPs) should be fetched once and reused in Pinia stores to avoid duplicate concurrent API requests.

---

## 🔄 Payload Normalization Rules

When sending payloads to ASP.NET backends:
1. **Numbers**: Parse numeric input strings into actual JavaScript numbers (`Number(val)`) before dispatching `POST` or `PUT`.
2. **Booleans**: Ensure boolean flags are strictly `true`/`false` rather than string equivalents (`"true"`/`"false"`).
3. **Empty Fields**: Strip empty string `""` or `null` values for optional audit fields so the server generates defaults cleanly.
4. **Dates**: Format dates as ISO-8601 strings (`date.toISOString()`).
