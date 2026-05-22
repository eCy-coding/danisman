# EcyPro API Versioning Policy

**Status:** ACTIVE
**Owner:** Platform
**Last update:** 2026-05-16

---

## 1) Strategy

EcyPro uses **URI-based versioning** for its REST API.

```
https://api.ecypro.com/api/v1/<resource>
```

`v1` is the only major version currently in production. The version
segment is mandatory for new integrations.

### Why URI, not header

| Aspect                           | URI (`/api/v1/...`)      | Header (`Accept: …+v1`)            |
| -------------------------------- | ------------------------ | ---------------------------------- |
| Cache key (CDN / Cloudflare)     | Built in                 | Requires `Vary: Accept` discipline |
| Browser tooling (DevTools, curl) | Trivially copy-pasteable | Needs custom header                |
| Server routing complexity        | Simple Express mount     | Custom content negotiation         |
| API consumer onboarding cost     | Effectively zero         | Documentation overhead             |

The trade-off accepts that URI versioning is slightly less RESTful for
the sake of operational simplicity. ADR-A1 (this document) records the
decision so future maintainers know it was deliberate, not accidental.

---

## 2) Compatibility commitments

Within a major version (`v1`), the platform commits to:

- **Additive changes only.** New fields on responses, new optional
  request fields, new endpoints, new optional query parameters.
- **No breaking changes.** Removing a field, narrowing a type, making
  an optional field required, changing an HTTP status code for an
  existing scenario — all are breaking and must wait for `v2`.
- **Stable error codes.** The `code` field inside error responses is
  part of the contract. We may add new codes; we will not rename
  existing ones.
- **Stable URL shape.** Path segments and parameter names do not
  change inside a major version.

Out-of-band: response **timing** and **rate-limit thresholds** are not
part of the contract.

---

## 3) Legacy `/api/*` alias and sunset

For the duration of the **2026-05-16 → 2026-12-01** window, requests
to `/api/<path>` (without the `v1` segment) continue to work and are
served by the same router as `/api/v1/<path>`.

Every legacy response carries deprecation headers per
[RFC 8594](https://www.rfc-editor.org/rfc/rfc8594):

```
Deprecation: true
Sunset: Tue, 01 Dec 2026 00:00:00 GMT
Link: </api/v1>; rel="successor-version", </docs/API_VERSIONING.md>; rel="deprecation"
```

Clients should monitor for these headers and migrate before the sunset
date. After sunset the legacy alias returns HTTP 410 Gone.

The Vite-served frontend will be migrated to `/api/v1` in a follow-up
sprint coordinated with the FE track; the alias exists specifically to
keep both tracks moving in parallel.

---

## 4) Introducing `v2`

When a breaking change is required:

1. Stand up `/api/v2/*` mount alongside `/api/v1/*`. Both serve until
   the v1 sunset date.
2. Announce the change in `CHANGELOG.md` with the rationale and the
   migration guide.
3. Update `server/config/openapi.ts` with `servers` entries for both
   versions; tag affected operations with `x-deprecated-in: v2`.
4. Set a sunset window of **at least 6 months** for v1.
5. Ship deprecation headers (`Deprecation`, `Sunset`, `Link`) on every
   v1 response during the window.
6. After sunset, v1 routes return HTTP 410 with a JSON body pointing
   at the v2 successor.

### Breaking change checklist

A change is breaking if any of the following are true. Use this list
when in doubt:

- Removes or renames an existing field on responses.
- Removes, renames, or makes-required an existing request field.
- Changes the type of an existing field (e.g. `string` → `enum`,
  nullable → non-nullable).
- Changes the URL shape (path segment renames, parameter order in
  multi-param paths, `:id` → `:slug`, etc.).
- Changes the HTTP method for an existing operation.
- Changes the HTTP status code for an existing success scenario.
- Renames or repurposes an existing error code in the
  `{ status: 'error', code: '…' }` envelope.
- Changes pagination semantics (page size default, cursor format,
  response wrapper).
- Tightens validation (max length, regex, range) in a way that rejects
  payloads previously accepted.

Adding a new optional field, a new endpoint, a new error code, or a
new response field is **not** breaking and lands inside the current
major version.

---

## 5) Operational contract

- **Header `X-API-Version`** — every response carries the major version
  it was served from (`v1`). Useful for log correlation.
- **Header `X-Request-Id`** — already emitted by the request-id
  middleware (P14-BE Aşama 5); pair with `X-API-Version` for incident
  triage.
- **OpenAPI** — `server/config/openapi.ts` `servers` array lists both
  the canonical `/api/v1` URL and the legacy `/api` alias with its
  sunset note. SDK generators should target `v1`.
- **Drift detector** — `scripts/api-contract-test.mjs` already pins
  `undocumented=0, phantom=0` against the live spec. Any v2 work must
  keep that gate green or fail CI.

---

## 6) Quick reference

| Question                                             | Answer                                              |
| ---------------------------------------------------- | --------------------------------------------------- |
| What URL do I call today?                            | `https://api.ecypro.com/api/v1/<path>`              |
| Will `/api/<path>` still work?                       | Yes, until **2026-12-01** with deprecation headers. |
| What if I depend on a v1 field that needs to change? | File a `v2` proposal; v1 keeps the old behaviour.   |
| Where is the contract?                               | `GET /api/v1/docs.json` (OpenAPI 3.0).              |
| Where is this policy?                                | `docs/API_VERSIONING.md`.                           |
