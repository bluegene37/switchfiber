# SwitchFiber — CRUD QA Report

| | |
|---|---|
| **Date** | 2026-08-30 |
| **Build** | `main` @ `c1c5794` (+ uncommitted XSS fix) |
| **Front end** | Vite dev server, `http://localhost:5183` |
| **Backend API** | `https://103.249.198.50:8090` (live production data) |
| **Session** | Super Admin (`accesslevel_id: 1`) |
| **Mode** | Report-only (`/qa-only`) — no fixes applied |
| **Run marker** | `QA072428` |
| **Screenshots** | 17, `crud-01-*` … `crud-17-*` in `./screenshots/` |
| **CRUD health score** | **88 / 100** |

> Older `crud-plan-*`, `crud-nap-*`, `crud-router-*` … screenshots in the same
> folder are from a **previous** session and are not evidence for this run.

---

## 0. Data safety — nothing but our own records was touched

The constraint was: delete only what we create. Protocol used on every destructive step:

1. **Baseline captured first** — full ID set per endpoint, before any write.
2. **Unique marker** `QA072428` in the name/description of every created record.
3. **Table filtered to the marker** so exactly one row was actionable.
4. **Gate 1** — assert exactly one row is visible *and* it contains the marker.
5. **Gate 2** — read the confirm dialog and assert it names the marker *and* the expected record ID. Abort otherwise.
6. **Baseline re-verified** at the end by set comparison.

### Final verification

| Endpoint | Baseline | After | Result |
|---|---:|---:|---|
| Vlans | 0 | 0 | IDENTICAL |
| Lcps | 0 | 0 | IDENTICAL |
| Naps | 10 | 10 | IDENTICAL |
| Ports | 16 | 16 | IDENTICAL |
| Routers | 6 | 6 | IDENTICAL |
| Plans | 5 | 5 | IDENTICAL |
| Lcpnaps | 0 | 0 | IDENTICAL |
| Lcpnapports | 0 | 0 | IDENTICAL |
| AccessLevel | 9 | 9 | IDENTICAL |
| Applications | 5000 | 5000 | unchanged |
| ServiceOrders | 872 | 872 | unchanged |
| JobOrders | 3939 | 3939 | unchanged |
| Invoices | 0 | 0 | unchanged |

**Records created and removed by this run:** Plan #8, LCP #4, ServiceOrder #875, Invoice #1. All four verified gone. No pre-existing record was modified or deleted.

---

## 1. CRUD results

| Entity | Create | Read | Update | Delete | Verdict |
|---|---|---|---|---|---|
| **Plan** | PASS (201, id 8) | PASS | PASS | PASS (204) | **Full cycle PASS** |
| **LCP** | PASS (201, id 4) | PASS | PASS | PASS (200) | **Full cycle PASS** |
| **VLAN** | **FAIL (500)** | PASS | — | — | **Blocked at create** |
| **Application** | **BLOCKED** | PASS | — | — | See C-03 |
| **BillingDetails** | **BLOCKED** | PASS | — | — | See C-03 |
| **ServiceOrder** | **PASS — but see C-01** | PASS | — | PASS (200) | Validation missing |
| **Invoice** | **PASS — but see C-01** | PASS | — | PASS (204) | Validation missing |

Evidence: `crud-01` … `crud-09` (Plan), `crud-11` … `crud-13` (LCP), `crud-10` (VLAN),
`crud-14` … `crud-17` (Application).

**What works well.** The delete confirmation names the record (`Record ID: 8`,
`Name: QA072428 Plan EDITED`) with a "This cannot be undone" warning — that gate
is what made this run safe, and it is a genuine improvement over `Record ID: 2`.
Client-side validation is accurate and blocks the request rather than letting the
backend reject it. Server error text is surfaced verbatim instead of
"Request failed with status code 500". Create/update/delete round-trips are fast
(88–213 ms).

---

## 2. Findings

### C-01 — ServiceOrders and Invoices accept a completely empty body · **CRITICAL** · backend

`POST /api/ServiceOrders` with body `{}` returns **201** and creates a real row
(id 875, every field null). `POST /api/Invoices` with `{}` returns **201** (id 1,
every field blank). No field is validated.

Every other endpoint tested rejects `{}` with a 400 and a field list — these two
do not. Combined with the unauthenticated API (see the security report), anyone
who can reach the host can flood the service-order and invoice tables with junk
rows that look like real records.

- **Repro:** `curl -k -X POST https://103.249.198.50:8090/api/ServiceOrders -H 'Content-Type: application/json' -d '{}'`
- **Fix:** add `[Required]` model validation on both controllers, matching Naps/Routers/Plans.
- Both records created by this test were deleted; counts verified back at 872 / 0.

### C-02 — `POST /api/Vlans` returns 500 · **HIGH** · backend

Unchanged since the 2026-08-29 report (F-14). Reproducible with plain curl, no
frontend involved. `POST /api/Lcps` with an identical shape returns 201, so it is
specific to the VLAN controller. VLAN records cannot be created at all, and the
VLAN reference table is empty.

- **Repro:** `curl -k -X POST .../api/Vlans -d '{"name":"x","description":"y"}'` → `500 An error occurred while creating VLAN`
- **Frontend behaviour is correct:** dialog stays open, entered data preserved, real server message shown (`crud-10`).

### C-03 — Applications and BillingDetails require audit columns the client cannot supply · **HIGH** · backend

`POST /api/Applications` requires **36** fields including `ModifiedBy` and
`ModifiedDate`. `POST /api/BillingDetails` requires **36** including `ModifiedBy`.
These are server-owned audit columns; a create request has no meaningful value for
them. Unchanged since the last report (F-02, F-05).

- **Fix:** drop `ModifiedBy`/`ModifiedDate`/`Timestamp` from the create contract and stamp them server-side.
- **Note:** the UI never reaches this wall because client validation stops first (`crud-15`, `crud-17`), so the failure is invisible until the form is fully completed.

### C-04 — No user attribution on any write · **MEDIUM** · backend

Every record created this run came back with `createdBy: ""` / `null`, and every
update left `modifiedBy: null`. The audit trail cannot answer "who changed this".
Matches F-08.

| Record | createdBy | modifiedBy |
|---|---|---|
| Plan #8 | `""` | `""` |
| LCP #4 | `null` | `null` |

### C-05 — `modifiedDate` stamping is inconsistent between endpoints · **MEDIUM** · backend

- **Lcps** — update stamped `modifiedDate: 2026-08-30T07:32:54`. Correct.
- **Plans** — update left `modifiedDate: 0001-01-01T00:00:00`, **even via a direct API PUT** that bypassed the frontend entirely.

Same operation, two behaviours. On Plans there is no record of when a row last changed.

---

## 3. Not a bug — two harness artifacts worth recording

Both looked like defects and were disproved before filing:

1. **"Currency field does not save."** Setting a PrimeVue `InputNumber` through a
   JS native-setter or `browse fill` updates the DOM but not PrimeVue's internal
   model, so the payload carried `amount: 0`. When the dialog loaded a real value,
   the UI sent `amount: 1499` and it persisted. **The field works.**
2. **"Delete button does nothing."** A JS `.click()` on the PrimeVue confirm button
   fires no request. A real ref click fired `DELETE /api/Plans/8 → 204`. **Delete works.**

Rule for future runs on this app: drive PrimeVue components with real clicks and
real typing only; never assert a defect from a JS-set value.

---

## 4. Coverage gap — deliberately not tested

**Application create was not completed end to end.** After filling 20 text fields,
7 required inputs remained: 3 dropdowns (City, Barangay, Desired Plan) and **3
document uploads** (Government ID, House Front Picture, Proof of Billing).
Completing it would have pushed real image files into the production backend, so I
stopped. Whether the frontend supplies `ModifiedBy`/`ModifiedDate` on submit is
therefore **UNVERIFIED** — it needs one manual create with real documents.

---

## 5. Score

| Category | Weight | Score | Basis |
|---|---:|---:|---|
| Console | 15% | 100 | zero errors across the whole run |
| Links | 10% | 100 | none broken |
| Visual | 10% | 100 | no visual defects in CRUD surfaces |
| Functional | 20% | 45 | C-01 critical, C-02 + C-03 high |
| UX | 15% | 92 | Application create dead-ends late |
| Performance | 10% | 100 | 88–213 ms round-trips |
| Content | 5% | 100 | — |
| Accessibility | 15% | 100 | not audited this run; carried |
| **Weighted** | | **88** | |

Accessibility was not tested and carries its prior value at 15% weight — treat 88
as a CRUD-scoped score, not a whole-app grade.

---

## 6. What to fix, in order

1. **C-01** — add validation to ServiceOrders and Invoices. An empty POST creating a row is the most damaging defect here, and it is one attribute per field.
2. **C-03** — remove audit columns from the Applications and BillingDetails create contract. This is what blocks the revenue path.
3. **C-02** — fix the VLAN controller 500.
4. **C-04 / C-05** — stamp `createdBy`/`modifiedBy` from the authenticated user, and stamp `modifiedDate` on Plans.

Every item is backend. **No frontend CRUD defect was found this run** — the UI
created, read, updated and deleted correctly wherever the API allowed it, and
handled every server failure with an accurate, readable message.

---

## 7. Cross-reference

The unauthenticated-API finding from the same-day security audit
(`.gstack/security-reports/2026-08-30-audit.json`, finding 1) makes C-01
materially worse: no auth plus no validation means anonymous junk-record
injection into billing and service-order tables.
