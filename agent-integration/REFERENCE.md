# NGN collection reference

> **Historical source reference and offline evaluation only.** This reference describes the contract in `openapi/velvpay-ngn-collection-v0.1.0.json` as checked against `velv-backend` commit `94289a4d9cc5f1bab5f3b714c77496c81cc25cf3`. It does not certify the currently deployed backend, a connected sandbox lifecycle or provider behaviour.

## Authentication

Every request requires `api-key`, `public-key` and `reference-id` headers. The server decrypts `api-key` with the merchant encryption key and compares the plaintext to the exact concatenation:

```text
secretKey + publicKey + referenceId
```

The current implementation and SDK use CryptoJS password-based AES. Generate the ciphertext on a trusted backend. Do not use the outbound webhook Bearer token as API authentication.

Test public keys beginning `PK_TEST_` select test credentials in the audited middleware and cause collection initialisation to return a synthetic account. That response is a mock, not proof of provider connectivity or a bank transfer. The audited test-mode branch returns before persisting a transaction, so a later details lookup for that synthetic transaction is not supported by the inspected source and may return 404. The offline tests exercise create and lookup as separate mocked behaviours; they do not prove a connected sandbox lifecycle.

An optional merchant IP allowlist may cause a correctly signed request from a different IP to return 403.

## Initialise collection

```text
POST /api/v1/service/payment/collection/transaction
```

Request fields:

| Field | Required | Contract |
|---|---:|---|
| `amount` | yes | Integer kobo, minimum 100. |
| `isNaira` | yes in this bounded contract | Always `false`; removes unit ambiguity. |
| `validityTime` | no | 20–60 minutes; defaults to 20 in the controller. |
| `email` | no | Valid email if supplied. |

The backend validator also accepts `redirectUrl` and `webhook_url`, but this bounded flow omits them. The collection controller does not use `redirectUrl`, and outbound delivery uses the merchant-global webhook configuration rather than the request's `webhook_url`.

Do not add `currency`. This endpoint's audited provider path converts kobo to naira and creates an NGN virtual account. The controller's analytics fallback says NGN, but the Joi request schema does not accept a `currency` field.

A successful response has this stable envelope:

```json
{
  "status": "success",
  "msg": "Payment instantiated successfully",
  "data": {
    "accountNumber": "<provider value>",
    "accountName": "<provider value if present>",
    "amount": 125000,
    "amountInNaira": 1250,
    "transactionId": "FR-...",
    "bank": "VFD Microfinance Bank",
    "validityTime": 20
  }
}
```

Provider response fields are spread into `data`, so additional keys may appear. Persist at least your merchant reference, `transactionId`, expected `amount` in kobo, account number, bank, validity and the pending state before displaying the account.

The audited controller writes a pending transaction before calling the virtual-account provider. A provider rejection or exception can therefore leave a pending record even though the create HTTP call returns 400 or 500. Treat this as an unresolved attempt and reconcile the merchant reference with VelvPay support/operations before retrying; the details record alone is not proof that an account was successfully issued.

## Read status

```text
GET /api/v1/service/payment/collection/transaction/details?transaction_id=<value>
```

`transaction_id` may be the returned VelvPay transaction ID or the merchant reference that was used as `reference-id` for creation and stored by the audited controller. Use a fresh `reference-id` header for the lookup authentication ciphertext.

The bounded contract requires `transaction_id`, even though the backend also exposes an unpaginated list/filter mode when it is omitted. That list mode is outside this kit.

Do not send `send_webhook`. In the audited controller, any present query-string value is truthy, including the strings `false` and `undefined`, and can enqueue a webhook. This produces a lookup without webhook delivery, not a side-effect-free or read-only request: the audited controller still writes an activity log and emits an analytics event.

Successful lookup:

```json
{
  "status": "success",
  "msg": "Transaction Found",
  "data": {
    "txId": "FR-...",
    "referenceId": "ORDER-2026-1001",
    "amount": 125000,
    "amountInNaira": 1250,
    "status": "pending",
    "channel": "API",
    "method": "Payment Link"
  }
}
```

The transaction document has additional fields. Consumers should ignore unknown keys and must not expose internal/provider payloads to clients by default.

## States and notifications

Creation is always treated as pending. The offline evaluator uses a deliberately conservative classification:

| Observed state | Final | Paid |
|---|---:|---:|
| `pending`, `processing`, empty or unknown | no | no |
| `confirmed`, `successful` | yes | yes, after reference/amount checks |
| `failed` | yes | no |

This table reflects states observed in source and the prior starter; it is not a complete provider state machine. Reconfirm production terminal states with VelvPay before live fulfilment.

Outbound business notifications use the merchant-global webhook URL. In static-header mode the audited helper sends `Authorization: Bearer <configured webhook token>`. A dynamic encrypted-header mode also exists, but it is outside this kit and must not be assumed to use the static-token validation example.

Process final notifications using a durable terminal-transition guard keyed by `txId`, and verify all of:

- the notification's transaction ID belongs to the stored attempt;
- `referenceId` matches the stored merchant reference;
- `amount` matches the expected integer kobo amount; and
- the transition has not already been applied.

The mock evaluator uses an in-memory map only to demonstrate serialized, single-process behaviour. It maps both `confirmed` and `successful` to one semantic `paid` terminal state, absorbs equivalent repeats and refuses to apply a conflicting later terminal state. It does not model concurrent handlers, process crashes, restarts or atomic persistence. Production needs a unique database constraint or atomic compare-and-set in the same durable workflow as the order transition.

## Error behaviour

Observed source responses include:

| HTTP | Meaning/examples |
|---:|---|
| 400 | Provider account initialisation unavailable; blacklist check; generic bad request on status. |
| 403 | Invalid credentials, inactive account, IP mismatch or access denial. |
| 404 | Business or transaction not found. |
| 422 | Missing auth headers or body validation failure. |
| 429 | Server-level per-IP rate limit; audited envelope is `{"error":"Too many requests, slow down."}`. Thresholds are environment-configurable and were not verified in production. |
| 500 | Unexpected initialisation exception. |
| 503 | Authentication dependency unavailable. |

Client code should preserve HTTP status plus the response envelope and retry only when the operation is known to be safe. For an uncertain create request, reconcile the merchant reference before creating another account.
