# VelvPay agent API documentation kit

Version: **0.2.0-draft**

> **Production-source verified; live deployment not independently verified.** This kit was checked against the authoritative `velv-backend` `production` branch at commit `b81302575918fcd91fcdb48627dd4506c6dea161` (commit date 2026-10-08T13:47:03+01:00; remote head verified 2026-10-09 UTC). It is an offline evaluation, not evidence of the code currently running on a host, a connected sandbox lifecycle, provider availability or production certification.

This kit gives coding agents two deliberately different levels of information:

1. a complete source inventory of the 91 merchant/headless routes registered in `controller/api.routes.js`, with typed support and risk classifications; and
2. conservative, versioned machine-execution contracts only for routes whose public boundary was traced far enough to document safely.

The original bounded collection flow remains supported and helps a server-side coding agent:

1. initialise a fixed-amount temporary NGN collection account;
2. store the merchant reference, VelvPay transaction ID and expected kobo amount;
3. look up transaction status without requesting webhook delivery (the backend still records activity logs and analytics); and
4. consume final notifications idempotently.

It is documentation and an offline evaluation harness. It is not a live API certification, SDK release, provider-connectivity test or proof that money moved.

## Contents

- `openapi/velvpay-ngn-collection-v0.1.0.json` — minimal versioned OpenAPI 3.1 contract.
- `openapi/velvpay-agent-read-api-v0.2.0.json` — conservative storefront and scoped headless read contracts.
- `capabilities/velvpay-api-capabilities-v0.2.0.json` — all 91 source-routed endpoints and typed publication status.
- `API_INVENTORY.md` — task/service map, public-doc comparison and unsupported boundaries.
- `REFERENCE.md` — readable request, response, state and error reference.
- `AGENTS.md` — concise rules for coding agents working in this directory.
- `examples/collection.curl.sh` — curl examples with credential placeholders.
- `examples/collection.ts` — matching server-side TypeScript example.
- `examples/catalog.curl.sh` and `examples/catalog.ts` — read-only headless catalog examples.
- `mock/collection-evaluator.cjs` — dependency-light, serialized in-process implementation used only by offline tests; it is not concurrency- or crash-safe.
- `test/collection-evaluator.test.cjs` — synthetic tests for authentication, initialisation, failure, lookup and duplicate notifications.
- `test/documentation-index.test.cjs` — offline inventory, OpenAPI, feed and navigation checks.
- `EVIDENCE.md` — source traceability, SDK review notes and unresolved production gates.
- `llms.txt` — optional index; it makes no quality or ranking claims.
- `SUBSCRIBE.md`, `feeds/releases.json` and `feeds/releases.atom` — static revision polling; no account or webhook subscription.

## Choose a task

- Collect NGN through a temporary account: start with `REFERENCE.md` and the v0.1 OpenAPI.
- Read storefront data with v1 credentials: use the v0.2 read OpenAPI and v1 authentication rules.
- Read catalog/orders/customers/locations/inventory with a least-privilege headless credential: use the v0.2 read OpenAPI and catalog examples.
- Discover whether another route exists: query the capability manifest, but do not execute a route unless its classification is `contract_verified` and your environment is separately approved.
- Poll documentation revisions: read `SUBSCRIBE.md`; a feed item is not deployment or execution authority.

## Contract summary

Create a collection:

```text
POST /api/v1/service/payment/collection/transaction
```

Read one collection status:

```text
GET /api/v1/service/payment/collection/transaction/details?transaction_id=<transaction-id-or-merchant-reference>
```

Both calls use three v1 headers generated on a trusted server:

```text
api-key: CryptoJS AES(secretKey + publicKey + referenceId, encryptionKey)
public-key: <merchant public key>
reference-id: <reference for this HTTP request>
```

The bounded request uses integer kobo, `isNaira: false`, and no `currency` field. This endpoint is treated as NGN-only. Account creation means **pending**, never paid.

## Run the offline evaluation

From this directory, with Node.js 24 or later:

```bash
npm test
```

The suite uses only synthetic credentials, local files and injected mock responses. It makes no network calls and requires no VelvPay account.

The dependency declaration matches the existing public starter and SDK. In this review branch, `crypto-js` is already present at the repository root; no package installation was performed for the recorded evaluation.

## Safe adoption sequence

1. Review `EVIDENCE.md` and confirm the backend commit intended for deployment.
2. Run the offline evaluation.
3. Adapt the TypeScript example in a backend-only service; keep all secret material out of client code and logs.
4. Obtain issued test credentials and confirm the deployed route, capability and provider configuration with VelvPay.
5. Exercise test-account initialisation, failed requests, delayed status, invalid notifications, duplicate notifications and amount/reference mismatches.
6. Complete a separately approved live certification before presenting an account to a customer or treating a response as payment proof.

Do not use the public SDK's current `paymentDetails()` helper for this bounded flow until its optional query parameters are omitted rather than serialized. See `EVIDENCE.md`.
