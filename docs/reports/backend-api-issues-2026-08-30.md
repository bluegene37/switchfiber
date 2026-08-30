# SwitchFiber API — Issues for the Backend Team

**Date:** 2026-08-30
**API under test:** `https://103.249.198.50:8090`
**Reported by:** frontend team, after a full CRUD sweep of the admin console
**Frontend build:** `main` @ `54c33fa`

Every item below was reproduced with plain `curl`, no frontend involved, so each
one can be verified independently. Commands are copy-pasteable.

We have already fixed everything that turned out to be our side (see §4). What
remains here needs a server change.

---

## 1. CRITICAL — Endpoints create records from an empty request body

`POST /api/ServiceOrders` and `POST /api/Invoices` accept `{}` and return **201**,
creating a real row with every field null or blank.

```bash
curl -k -X POST https://103.249.198.50:8090/api/ServiceOrders \
  -H 'Content-Type: application/json' -d '{}'
# -> 201 {"id":875}   ... a service order with no customer, no account, no address

curl -k -X POST https://103.249.198.50:8090/api/Invoices \
  -H 'Content-Type: application/json' -d '{}'
# -> 201 {"id":1,"accountNo":"","invoiceNo":"","fullName":"", ...}
```

Every other endpoint we tested (`Naps`, `Routers`, `Plans`, `Users`, `JobOrders`,
`Applications`, `BillingDetails`) correctly returns 400 with a field list. These
two have no validation at all.

**Why it matters.** These are the billing and dispatch tables. Blank rows here are
indistinguishable from real work orders in any report or count.

**Ask:** add the same `[Required]` model validation these two controllers are
missing, matching what `Naps`/`Routers`/`Plans` already do.

*(Both test records were deleted immediately; ServiceOrders is back at 872 rows,
Invoices at 0.)*

---

## 2. CRITICAL — The API requires no authentication at all

Not strictly a CRUD bug, but it is what makes item 1 dangerous. No token, no
cookie, no credential of any kind is needed to read or write customer data:

```bash
curl -k https://103.249.198.50:8090/api/ServiceOrders
# -> 200, 1.6 MB of subscriber records:
#    fullName, contactNumber, emailAddress, address, accountNumber
```

Writes are equally open — the `POST` in item 1 was unauthenticated.

The API already ships a token system (`/api/Token`, `/api/Token/validate`,
`/api/Token/{id}/revoke`) that nothing currently enforces.

**Ask:** require and verify a token on every `/api/*` route. The frontend is ready
to send one as soon as `/Users/login` returns it — today that endpoint returns a
user object with no token, so there is nothing for us to attach.

**Related:** the host serves HTTPS with a certificate that does not validate
(`curl` needs `-k`; plain `curl` fails with *unable to get local issuer
certificate*). A bare IP cannot carry a valid public CA certificate. Please put
the API behind a hostname with a real certificate so traffic can be verified
end to end.

---

## 3. HIGH — `POST /api/Vlans` returns 500

```bash
curl -k -X POST https://103.249.198.50:8090/api/Vlans \
  -H 'Content-Type: application/json' \
  -d '{"name":"test","description":"test"}'
# -> 500  An error occurred while creating VLAN
```

`POST /api/Lcps` with an identical body shape returns **201**, so this is specific
to the VLAN controller, not the request. VLAN records cannot be created through
any client, and the VLAN reference table is currently empty as a result.

This has been failing since 2026-08-29. It returned 201 earlier that same day, so
something changed server-side between those runs.

**Ask:** check the VLAN controller's create path and the server log for that
request. The 500 body is a generic catch-all with no detail for us to work from.

---

## 4. MEDIUM — "Required" validation does not actually validate

On `Applications`, all 36 required fields are satisfied by empty strings:

```bash
# every required field present but empty -> 201, record created entirely blank
curl -k -X POST https://103.249.198.50:8090/api/Applications \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"","lastName":"","city":"","emailAddress":"", ... }'
# -> 201  {"id":15440, "firstName":null, "city":null, "status":null}
```

So the contract enforces *"the key must be present in the JSON"*, not *"the field
must have a value"*. That is the worst of both worlds: it rejects well-formed
partial requests while accepting completely empty ones.

**Ask:** either enforce non-empty values (`[Required(AllowEmptyStrings = false)]`)
or drop the requirement from fields that are genuinely optional. Several currently
marked required look optional to us: `MiddleName`, `SecondaryMobileNumber`,
`SecondGovernmentValidId`, `ReferrersAccountNumber`, `ApplicablePromo`, `Remarks`,
`VisitBy`, `VisitWith`, `VisitWithOther`, `barangay2`.

*(Test record 15440 was deleted; Applications is back at 5000 rows.)*

---

## 5. MEDIUM — The server does not stamp its own audit columns

`createdBy`, `createdDate`, `modifiedBy` and `modifiedDate` are stored exactly as
the client sends them, and left blank when the client omits them:

```bash
# create without audit fields
curl -k -X POST https://103.249.198.50:8090/api/Plans \
  -H 'Content-Type: application/json' \
  -d '{"name":"probe","description":"probe","amount":1,"discountId":0}'
# -> createdBy:"", modifiedBy:"", modifiedDate:"0001-01-01T00:00:00"

# update WITH audit fields -> stored verbatim, including a client-invented value
curl -k -X PUT https://103.249.198.50:8090/api/Plans/9 \
  -H 'Content-Type: application/json' \
  -d '{"id":9,"name":"probe","amount":1,"discountId":0,"modifiedBy":"qa-alpha","modifiedDate":"2026-08-30T09:00:00"}'
# -> modifiedBy:"qa-alpha", modifiedDate:"2026-08-30T09:00:00"
```

Two consequences:

1. **The audit trail is unverifiable.** A client can claim to be any user and set
   any timestamp. Only the server knows who is actually calling.
2. **Behaviour is inconsistent between controllers.** `Lcps` stamps `modifiedDate`
   on update; `Plans` never does, even when the request omits it entirely.

**Ask:** stamp all four columns server-side from the authenticated user and the
server clock, and ignore client-supplied values.

**Note for coordination:** we have stamped these from the frontend as a stopgap so
the audit trail is not empty in the meantime (see §6). The moment you take this
over, tell us and we will remove our stamping in the same release — otherwise our
values will overwrite yours.

---

## 6. What we fixed on our side (no backend action needed)

For completeness, so nobody chases these:

| Symptom | Real cause | Status |
|---|---|---|
| `POST /api/Applications` always 400 on `ModifiedBy`/`ModifiedDate` | The frontend was stripping audit fields from every payload (`// Excluded for backend migration`). Sending them satisfies the contract. | **Fixed in frontend** |
| `createdBy` / `modifiedBy` always blank | Same cause | **Fixed in frontend** |
| `modifiedDate` stuck at `0001-01-01` on Plans | Same cause | **Fixed in frontend**, though §5 still applies |

We had previously reported the Applications create failure as a backend blocker.
That was wrong, and we are correcting it here: it was our payload. Apologies for
the misdirection.

---

## 7. Priority

1. **§2** — authentication. Everything else is less urgent than an open database.
2. **§1** — empty-body creates on ServiceOrders and Invoices. One attribute per field.
3. **§3** — the VLAN 500.
4. **§4** and **§5** — validation semantics and server-side audit stamping.

Happy to pair on any of these or supply more repro detail. Every command above was
run against the live host on 2026-08-30, and every record created during testing
was deleted afterwards with row counts verified back to baseline.
