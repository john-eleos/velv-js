# VelvPay merchant API inventory

Version: **0.2.0-draft**

Source: `velv-backend` `production` commit `b81302575918fcd91fcdb48627dd4506c6dea161`

This is a source inventory, not a deployed-service catalog. Route presence does not prove that a feature is enabled for a merchant, a provider is available, credentials can be issued, or the running host uses this commit. The machine-readable inventory is [`capabilities/velvpay-api-capabilities-v0.2.0.json`](capabilities/velvpay-api-capabilities-v0.2.0.json).

## Public-documentation comparison

The official landing page at `https://velvpay.com/apidocumentation` was readable during this review. It describes merchant workspace setup, Developer Center credentials and logs, payment collection, customer checkout and transaction records, and links to the technical Postman reference.

The linked reference at `https://documenter.getpostman.com/view/36526309/2sA3XY7J6K` timed out during this review. Its endpoint-level contents were not observed, so this inventory does not claim parity with, additions to, or removals from that reference.

## Classification

- `contract_verified`: route, authentication and the published boundary were traced in source and included in a versioned OpenAPI file.
- `source_routed`: source contains the route and middleware, but detailed agent-generation semantics remain incomplete.
- `feature_gated`: source-routed and additionally dependent on a feature decision or credential scope.
- `high_risk_unverified`: provider-backed or money-moving; no generated execution example is provided.
- `restricted_session`: end-user session route, not a merchant API-key route.
- `withheld`: excluded pending additional safety, authorization or side-effect review.
- `explicitly_unsupported`: the handler deliberately rejects this operation.

## Service groups

| Group | Routes | Auth | Publication boundary |
|---|---:|---|---|
| Payments and payment notices | 16 | v1 merchant AES | Two NGN collection/status operations verified; money movement and operational helpers withheld or unverified. |
| Webhook test | 1 | v1 merchant AES | Withheld because it requests an outbound side effect. |
| Remittance | 3 | v1 merchant AES | Source-routed; initiation is high-risk and provider-backed. |
| Cross-border | 9 | v1 merchant AES | Feature-gated; exchange creation/cancellation remain outside generated execution contracts. |
| Fund requests | 4 | mixed | Two merchant routes source-routed; process/reject require an end-user session. |
| Wallets | 6 | v1 merchant AES | Reads/source routes inventoried; withdrawals and internal transfers are high-risk. |
| General banking lookup | 2 | v1 merchant AES | Source-routed; provider response and deployment availability are not certified. |
| Bills | 5 | v1 merchant AES | Source-routed; payment is high-risk and provider-backed. |
| Cards | 2 | v1 merchant AES | Source-routed; test adapter explicitly reports unsupported behavior for provider operations. |
| Invoices | 5 | v1 merchant AES | Source-routed; unexpected failures use generic HTTP 501 responses in several handlers. |
| Storefront v1 | 25 | v1 merchant AES | Six GET operations have conservative OpenAPI contracts; writes remain inventory-only. The locations GET is withheld because it may initialize a default record. Direct stock overwrite is explicitly unsupported. |
| Headless commerce v2 | 13 | scoped bearer | Six read operations have conservative OpenAPI contracts; all require feature enablement and the documented scope. |

Total: **91 routes** in `controller/api.routes.js`.

## Agent-safe task map

### Collect NGN by temporary account

Use the existing [`REFERENCE.md`](REFERENCE.md) and `openapi/velvpay-ngn-collection-v0.1.0.json`. Amount is integer kobo with `isNaira: false`; creation is pending, never payment proof. Status lookup must omit `send_webhook`.

### Read storefront data with v1 merchant credentials

The v0.2 retrieval OpenAPI covers profile, product list/item, inventory list and order list/item. Generate the AES headers on a trusted backend. The v1 locations GET is not included because its handler may initialize a default location. Responses can contain additional model fields; tolerate unknown fields and expose only an application allowlist.

### Read commerce data with a headless credential

Use the v0.2 read OpenAPI and the smallest required scope:

| Task | Scope |
|---|---|
| List catalog | `catalog:read` |
| List/read orders | `orders:read` |
| List customers | `customers:read` |
| List locations | `locations:read` |
| List inventory | `inventory:read` |

Headless credentials are independently revocable bearer secrets beginning with `vch_`. Source enforces credential status/expiry, merchant activity, feature policy and a per-credential minute counter. Exact issuance workflow, merchant enablement and deployed limits were not verified.

These are GET contracts, not a promise of zero writes: authentication usage/rate counters, API logs, analytics and latency alerts can still change. Every operation returning full persistence records has machine-readable `x-data-classification` and `x-downstream-field-policy: explicit-allowlist-required` metadata and must not be forwarded unfiltered.

In particular, the v1 product handler returns full `PaymentLink` records that may contain customer contact name, email, phone/address and merchant tracking fields. The headless catalog returns full item and variant records that may contain tenant identifiers, SKUs and barcodes. Those fields are source-visible response possibilities, not an approved downstream schema.

Observed headless authentication failures use the structured error envelope and include:

| HTTP | Source-verified boundary |
|---:|---|
| 401 | credential missing, malformed, invalid or expired |
| 403 | merchant inactive, required scope missing or headless feature unavailable |
| 429 | either the global per-IP `/api` limiter (`{"error":"..."}`) or the structured per-credential minute limiter |
| 500 | structured handler failure or the global plain-string unhandled-error fallback |
| 502 | global connection-reset response (`{"error":"..."}`) |
| 503 | structured authentication dependency failure |

The v1 merchant middleware instead uses legacy response shapes: 422 for missing authentication headers; 403 for an unknown/inactive merchant, IP-allowlist mismatch or invalid ciphertext; 400 for a blacklisted account; and 503 when authentication dependencies fail. The server-level `/api` limiter can return the global JSON 429 envelope, connection reset can return global JSON 502, and an unhandled error can reach the plain-string 500 fallback. The storefront wrapper ordinarily returns a structured 500 handler error. The limiter also attempts a JSON 503 after detecting an already-destroyed request socket; because that socket cannot carry a client-observable response, it is an implementation limitation rather than a wire contract. Consumers must preserve the HTTP status and tolerate the documented legacy, structured and observable global envelopes.

## Amount and status boundaries

- NGN collection is the only payment amount contract certified here: integer kobo, minimum 100, with `isNaira: false`.
- The storefront product write handler validates a positive integer in the smallest currency unit and accepts source values `ngn` or `usd`, but that write route is inventory-only and has no generated execution contract.
- Refund and payment-evidence handlers also use smallest-unit integers in source, but remain withheld/high-risk; agents must not generalize these semantics to remittance, bills, cards, payouts or cross-border routes.
- Collection status uses the conservative table in `REFERENCE.md`. Commerce reads expose separate financial and operational status fields in source. Their full state machines and transition guarantees are not certified here, so the read OpenAPI leaves filters as strings and publishes no write transition.

### Discover but do not execute other capabilities

Use the capability manifest to answer whether a route exists in the source snapshot and why it was excluded from generated execution contracts. Do not turn `source_routed`, `feature_gated`, `high_risk_unverified`, `withheld` or `restricted_session` into executable tools without a new source review and separately approved live certification.

## Known gaps

- Deployed SHA, live route availability, reverse-proxy behavior and merchant entitlements are not independently verified.
- The Postman technical reference could not be read, so documentation drift against it remains unknown.
- Provider request/response contracts and live status vocabularies are not proven by route/controller inspection.
- Several persistence-backed read responses intentionally use open records in OpenAPI. Stable per-field schemas require model and consumer compatibility review.
- No payment-execution MCP, webhook subscription, credential provisioning or automatic agent adoption is included.
