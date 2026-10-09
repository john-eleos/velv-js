# VelvPay NGN collection agent kit

Version: **0.1.0**

> **Historical source reference and offline evaluation only.** This kit is pinned to `velv-backend` commit `94289a4d9cc5f1bab5f3b714c77496c81cc25cf3`. It is not evidence of the currently deployed backend, a connected sandbox lifecycle, provider availability or production certification.

This bounded kit helps a server-side coding agent implement one VelvPay flow:

1. initialise a fixed-amount temporary NGN collection account;
2. store the merchant reference, VelvPay transaction ID and expected kobo amount;
3. look up transaction status without requesting webhook delivery (the backend still records activity logs and analytics); and
4. consume final notifications idempotently.

It is documentation and an offline evaluation harness. It is not a live API certification, SDK release, provider-connectivity test or proof that money moved.

## Contents

- `openapi/velvpay-ngn-collection-v0.1.0.json` — minimal versioned OpenAPI 3.1 contract.
- `REFERENCE.md` — readable request, response, state and error reference.
- `AGENTS.md` — concise rules for coding agents working in this directory.
- `examples/collection.curl.sh` — curl examples with credential placeholders.
- `examples/collection.ts` — matching server-side TypeScript example.
- `mock/collection-evaluator.cjs` — dependency-light, serialized in-process implementation used only by offline tests; it is not concurrency- or crash-safe.
- `test/collection-evaluator.test.cjs` — synthetic tests for authentication, initialisation, failure, lookup and duplicate notifications.
- `EVIDENCE.md` — source traceability, SDK review notes and unresolved production gates.
- `llms.txt` — optional index; it makes no quality or ranking claims.

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

The suite uses only synthetic credentials and injected mock responses. It makes no network calls and requires no VelvPay account.

The dependency declaration matches the existing public starter and SDK. In this review branch, `crypto-js` is already present at the repository root; no package installation was performed for the recorded evaluation.

## Safe adoption sequence

1. Review `EVIDENCE.md` and confirm the backend commit intended for deployment.
2. Run the offline evaluation.
3. Adapt the TypeScript example in a backend-only service; keep all secret material out of client code and logs.
4. Obtain issued test credentials and confirm the deployed route, capability and provider configuration with VelvPay.
5. Exercise test-account initialisation, failed requests, delayed status, invalid notifications, duplicate notifications and amount/reference mismatches.
6. Complete a separately approved live certification before presenting an account to a customer or treating a response as payment proof.

Do not use the public SDK's current `paymentDetails()` helper for this bounded flow until its optional query parameters are omitted rather than serialized. See `EVIDENCE.md`.
