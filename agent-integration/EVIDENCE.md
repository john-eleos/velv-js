# Evidence and release gates

Prepared: 2026-10-09 UTC

## Source snapshots

Canonical backend repository: `velv-backend`

- Prior audited source commit: `94289a4d9cc5f1bab5f3b714c77496c81cc25cf3` (`chore(deps): certify backend runtime updates (#1227)`, committed 2026-10-08T13:36:33+01:00).
- Backend checkout observed during this work: `593e18d48dfbb5713caa7d7298b8a7c5aba5f375` on local branch `Figo-Staging`, whose upstream is gone.
- The audited commit is **not** an ancestor of the observed checkout. The observed checkout also had pre-existing modified and untracked files. It was read only and was not changed.
- This kit is therefore pinned to the prior audited commit, not asserted to describe the observed checkout or a deployed environment.

Public SDK repository: `john-eleos/velv-js`

- Base branch `master` observed at `7a08fe9c005378e9e896e8bcff94598de379e636`.
- Pending draft PR #4 head `docs/integration-resources` observed at `df654f6db48b3c8cfdf408f921af10e840247584`.
- This local branch `docs/agent-integration-kit` starts from PR #4's head. It leaves the pending `Readme.md` change intact and adds only `agent-integration/`.

## Backend source trace

All paths below refer to backend commit `94289a4d9cc5f1bab5f3b714c77496c81cc25cf3`.

| Claim | Source |
|---|---|
| POST create and GET details routes | `controller/api.routes.js` |
| Three v1 headers, AES plaintext concatenation, test-key selection, IP/account checks, 422/403/503 auth responses | `middlewares/apiService.js` |
| Request validation, kobo/naira conversion, synthetic test response, provider call, known 200/400/500 envelopes | `controller/apiServices/payments/payment.collection.js`; `controller/apiServices/payments/module.dev.js` |
| Merchant reference stored on initialisation; lookup by transaction/reference/provider identifiers; 404/400 details responses | `controller/apiServices/payments/payment.collection.js` |
| Transaction fields and NGN default | `model/business/transactions/business.transaction.new.js` |
| Merchant-global static/dynamic webhook headers and envelope | `helpers/utils/helper.js` |
| API base URL and SDK helper behaviour | public SDK `src/controllers/velv.ts` at `7a08fe9c005378e9e896e8bcff94598de379e636` |

## Reused offline starter

The starter linked by PR #4 was reachable at:

```text
https://velvpay-api-collections.orange-smile-1161.chatgpt.site/downloads/velvpay-ngn-collection-starter-v0.1.0.zip
```

Observed SHA-256:

```text
2ff4f4a461857ddd8491440660664f4a5437714fdf8a8f8d1be7e0551732a6c7
```

That exactly matched the checksum published on the linked starter page. The archive contained six Node tests. This kit reuses their amount conversion, v1 ciphertext, initialisation request/mapping, lookup request, state classification and static Bearer checks. It adds explicit failed-initialisation, duplicate-final-notification and OpenAPI structure cases. Mocks are evidence of sample behaviour only.

## SDK compatibility review

The public SDK's `payVirtualAccount()` route and v1 auth generation match the audited create route at a high level. Two limitations prevent presenting the SDK helper as the recommended status example:

1. `paymentDetails()` always serializes every optional field, producing query values such as `send_webhook=undefined`. The audited backend checks query-string presence by truthiness, so lookup can enqueue an outbound webhook unexpectedly.
2. The SDK types/documentation use `transactionId` in the TypeScript body while older README examples show a different generic shape; neither protects callers from the side-effecting optional query serialization.

The kit therefore uses direct, typed `fetch` for both calls and deliberately sends only `transaction_id` on lookup. No SDK runtime code, package version or release was changed.

Backend limitations surfaced by source review:

- the test-mode create branch returns a synthetic account before persisting a transaction, so an end-to-end create-then-status sandbox lifecycle is not established by source or the offline mocks;
- the controller persists a pending transaction before its provider call and does not mark it failed on provider rejection/exception, so a 400/500 create response can coexist with a pending record;
- the details controller can enqueue a webhook for any present `send_webhook` query-string value, including textual `false` or `undefined`.

## Offline verification

Recorded in the isolated local branch on 2026-10-09 UTC. No dependency installation or network access was used by these checks.

Runtime:

```text
Node.js v26.9.0
npm 11.19.1
```

Commands and results:

```text
npm test
  9 tests, 9 passed, 0 failed, 0 skipped, 0 todo
  Node test-runner duration: 55.580416 ms

../node_modules/.bin/tsc --noEmit --target ES2022 --module Node16 --moduleResolution Node16 --esModuleInterop --skipLibCheck examples/collection.ts
  PASS (exit 0)

sh -n examples/collection.curl.sh
  PASS (exit 0)

node -e "JSON.parse(...); assert RateLimited response exists"
  OpenAPI JSON parse/429 structure: PASS

git diff --cached --check
  PASS (exit 0 over the complete staged kit)

trailing-whitespace and final-newline scans over every kit file
  PASS
```

The nine tests comprise the six accessible starter behaviours plus failed initialisation, duplicate final notification and bounded OpenAPI structure coverage. The evaluator injects its fetch function; it did not contact VelvPay or any provider.

No OpenAPI validator was installed in the isolated SDK clone, and installing new tooling was outside scope. The contract passed JSON parsing plus focused structural assertions, not a third-party full-spec lint.

## Adversarial self-review

The repository governance skill asks for `independent-reviewer`, but no such local skill or reviewer tool was available in this execution environment. The available `adversarial-reviewer` skill's primary preserved source was also missing, so its documented prompt-only fallback was used against every file in this directory. This is a structured self-review, not independent approval.

- Saboteur finding, resolved: keying idempotency by transaction plus raw status could apply both `confirmed` and `successful` as separate paid transitions. The evaluator now guards the single terminal transition by transaction ID and collapses both aliases to semantic `paid`; conflicting later terminal states are not applied.
- New-hire finding, retained as a note: the publication example and offline evaluator intentionally duplicate a small amount of request construction. Their shared paths and invariants are contract-tested, but maintainers must keep both aligned when the source contract changes.
- Security-auditor finding, mitigated and retained as a note: shell-expanded headers can be visible to local process inspection. The curl file now forbids live-secret use and directs production integrations to a backend client with secret-manager integration.

Verdict: **CLEAN for local documentation review, with notes**. Publication remains blocked on exact-deployment re-audit and independent review.

## Unresolved production checks

These are required before any live-use claim:

- identify the backend commit actually deployed for the intended environment and re-audit the same files;
- confirm `https://api.velvpay.com` exposes both routes in that environment;
- confirm the merchant account, NGN collection capability, test/live key mode, IP allowlist and provider configuration;
- confirm current provider request/response fields, account validity semantics and all terminal/reversal states;
- verify test-key behaviour against an issued test merchant without treating the synthetic response as provider proof;
- validate static versus dynamic webhook mode and the production retry/order guarantees;
- test duplicate, delayed, out-of-order, amount-mismatch, reference-mismatch and uncertain-create cases against an approved non-production environment;
- agree reconciliation, fees, support escalation and production certification gates with VelvPay;
- fix or explicitly deprecate the SDK `paymentDetails()` optional-query behaviour before recommending it;
- obtain independent review on the exact publication commit.

No live API/provider call, credential creation, secret handling, payment, deployment, package release, PR merge or security-setting change was performed.
