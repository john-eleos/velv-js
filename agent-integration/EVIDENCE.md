# Evidence and release gates

Prepared: 2026-10-09 UTC

> **Production-source verified; live deployment not independently verified.** This evidence is pinned to the authoritative backend `production` branch at commit `b81302575918fcd91fcdb48627dd4506c6dea161` (commit date 2026-10-08T13:47:03+01:00; remote head verified 2026-10-09 UTC). It does not identify the code currently running on a host or certify a connected sandbox lifecycle.

## Source snapshots

Canonical backend repository: `velv-backend`

- Repository instructions identify `velv-backend` as authoritative. The user identified `production` as the most accurate branch; remote `HEAD` also resolves to `refs/heads/production`.
- A fresh read-only `git ls-remote` on 2026-10-09 returned `b81302575918fcd91fcdb48627dd4506c6dea161` for both remote `HEAD` and `refs/heads/production`.
- The source commit is `feat(kyc): verification-first Youverify adapter with fail-closed biometrics, PEP & business screening (#1229)`, committed 2026-10-08T13:47:03+01:00.
- It was inspected in an isolated local source checkout; no backend source was changed.
- An unrelated user checkout with pre-existing changes was preserved without modification and was not used as contract evidence.
- The eight bounded contract files at `b81302575918fcd91fcdb48627dd4506c6dea161` are byte-for-byte identical to the earlier independently reviewed source snapshot: route, collection controller, request validator/module, API-key middleware, transaction model, webhook helper, server rate limiter and API logger.

Public SDK repository: `john-eleos/velv-js`

- Base branch `master` observed at `7a08fe9c005378e9e896e8bcff94598de379e636`.
- Pending draft PR #4 head `docs/integration-resources` observed at `df654f6db48b3c8cfdf408f921af10e840247584`.
- The v0.1 draft PR starts from PR #4's head, leaves the pending `Readme.md` change intact and adds only `agent-integration/`. This unpublished v0.2 review branch continues from the exact v0.1 draft head.

## Backend source trace

All backend paths below refer to `production` commit `b81302575918fcd91fcdb48627dd4506c6dea161`.

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
- omitting `send_webhook` prevents requested webhook delivery but does not make lookup read-only: the details controller writes an activity log and tracks an analytics event.

## Expanded source-route inventory

The v0.2 draft inventories every route registered in `controller/api.routes.js` at the pinned production source: 91 method/path pairs across 12 service groups. An exact method/path parity check between that source file and `capabilities/velvpay-api-capabilities-v0.2.0.json` passed with no missing or extra entries.

The inventory separates route presence from a publishable execution contract. Provider-backed money movement, feature-gated capabilities, end-user-session routes, outbound side-effect helpers and routes needing further safety or authorization review remain typed as unverified, restricted or withheld. They are not promoted into generated execution examples.

The v0.2 OpenAPI expansion is GET-only, not side-effect-free: authentication usage/rate counters, request logs, analytics and latency alerts may still be written. It covers six v1 storefront retrievals and six scoped v2 headless-commerce retrievals. The v1 locations GET is excluded because its handler may initialize a default location. Source anchors are `controller/api.routes.js`, `controller/apiServices/storefront/`, `middlewares/apiService.js` and `middlewares/headlessCommerce.js`. Response records allow unknown model properties rather than inventing a stable persistence-field guarantee, and every full-record response carries machine-readable data-classification and explicit-downstream-allowlist metadata.

The official landing page `https://velvpay.com/apidocumentation` was readable and linked the expected Postman technical reference. The linked reference `https://documenter.getpostman.com/view/36526309/2sA3XY7J6K` timed out, so endpoint-level parity with that reference remains unverified and is stated as a gap in both inventory formats.

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
  18 tests, 18 passed, 0 failed, 0 skipped, 0 todo
  Node test-runner duration: 63.357541 ms

../node_modules/.bin/tsc --noEmit --target ES2022 --module Node16 --moduleResolution Node16 --esModuleInterop --skipLibCheck examples/collection.ts examples/catalog.ts
  PASS (exit 0)

sh -n examples/collection.curl.sh && sh -n examples/catalog.curl.sh
  PASS (exit 0)

node -e "JSON.parse(...); assert production-source commit exists"
  OpenAPI production-source boundary: PASS

source route-to-capability manifest parity
  91 routes, no missing or extra method/path pairs: PASS

git diff --cached --check
  PASS (exit 0 over the complete staged kit)

trailing-whitespace and final-newline scans over every kit file
  PASS
```

The first nine tests comprise the six accessible starter behaviours plus failed initialisation, duplicate final notification and bounded collection OpenAPI coverage. The expanded tests verify the 91-route inventory, OpenAPI declarations for every `contract_verified` capability, the GET-only v0.2 operation set, data-classification/allowlist metadata, the evidence-backed public draft revision in JSON Feed/Atom, inert curl defaults and `llms.txt` navigation. The evaluator injects its fetch function; it did not contact VelvPay or any provider.

No OpenAPI validator was installed in the isolated SDK clone, and installing new tooling was outside scope. The contract passed JSON parsing plus focused structural assertions, not a third-party full-spec lint.

## Adversarial self-review

The repository governance skill asks for `independent-reviewer`, but no such local skill or reviewer tool was available in the original execution environment. The available `adversarial-reviewer` skill's primary preserved source was also missing, so its documented prompt-only fallback was used against the v0.1 files. A separate independent review subsequently ran the original nine offline tests and accepted the source-pinned/mock scope. Later source selection confirmed current `production` commit `b81302575918fcd91fcdb48627dd4506c6dea161`; its bounded collection contract files are unchanged from the independently reviewed snapshot. The v0.2 inventory/read-contract expansion has not yet received that independent review and must not be published until it does.

- Saboteur finding, resolved: keying idempotency by transaction plus raw status could apply both `confirmed` and `successful` as separate paid transitions. The evaluator now guards the single terminal transition by transaction ID and collapses both aliases to semantic `paid`; conflicting later terminal states are not applied.
- New-hire finding, retained as a note: the publication example and offline evaluator intentionally duplicate a small amount of request construction. Their shared paths and invariants are contract-tested, but maintainers must keep both aligned when the source contract changes.
- Security-auditor finding, mitigated and retained as a note: shell-expanded headers can be visible to local process inspection. The curl file now forbids live-secret use and directs production integrations to a backend client with secret-manager integration.

The prompt-only adversarial review was repeated for the v0.2 expansion:

- Saboteur finding, resolved: the first draft called every GET contract read-only, but the v1 locations GET may initialize a default location. That route is now withheld from OpenAPI, and the remaining specification is labeled GET-only rather than side-effect-free because authentication counters, logs and analytics may still be written.
- New-hire finding, resolved: route classifications inherit a group default, but the resolution rule was implicit. The manifest now states the override rule and tests every route's effective classification against the declared type set.
- Security-auditor finding, resolved: open persistence records could hide customer or merchant-sensitive fields. Relevant OpenAPI operations now carry data-classification extensions, and agent instructions require an explicit downstream allowlist.

The independent review of local commit `0c59ad92e351aed65c1b18db8e6c0e7aeda351a1` then identified five publication blockers, all corrected in the following local review commit: live-host defaults were removed from the curl example; v1 legacy and v2 structured error schemas were separated; every full-record response received machine-readable classification and allowlist requirements; residual GET/read-only wording was corrected with counter/log/analytics/latency side effects; and unsubstantiated feed/source timestamps were replaced with evidence-backed provenance.

Re-review of that correction found one remaining shared-middleware gap: v2 429 responses can come from either the structured headless credential limiter or the earlier global per-IP `/api` limiter. The OpenAPI now models both branches with `oneOf` on every v2 retrieval. The same cross-contract pass records the client-observable global JSON 502 connection envelope and plain-string 500 fallback alongside the route-local structured or legacy responses. A source branch attempts JSON 503 only after detecting an already-destroyed socket; this is documented as an implementation limitation, not a wire response.

## Revision timestamp provenance

- Backend source commit time: `2026-10-08T13:47:03+01:00`, from Git commit `b81302575918fcd91fcdb48627dd4506c6dea161`.
- Backend remote-head verification: date `2026-10-09`; the exact time was not retained, so the capability manifest deliberately uses `remoteHeadVerifiedOn` rather than fabricating a timestamp.
- Public v0.1 documentation commit time: `2026-10-09T20:51:01+01:00`, from Git commit `e20d1cf0ef1efbcc07db8b542389b7800cb8c926`.
- Public draft PR #5 creation: `2026-10-09T19:55:08Z`; last observed update: `2026-10-09T19:55:27Z`, from GitHub's PR metadata. These are the JSON Feed/Atom publication timestamps.
- The v0.2 expansion is local and unpublished, so it has no feed entry. A future feed item must use publication-system evidence rather than the local file or commit creation time.

Verdict for v0.1: **CLEAN for local documentation review, with notes**. The v0.2 expansion is **review required**. A verified deployed SHA is not required for truthful source-scoped publication because no live-state claim is made, but it remains required before making a live-state claim.

## Deployment boundary

Deployment was not independently verified. Repository branch and ref inspection establish `b81302575918fcd91fcdb48627dd4506c6dea161` as the authoritative public `production` source snapshot, not as the code running on any host. No host release manifest, build-SHA health response or immutable deployed artifact was used. This does not block source-scoped publication because no live-state claim is made.

## Live-use checks outside source-scoped publication

These do not block publishing the source-scoped contract and offline evaluator. They are required before any live-use, sandbox-certification, provider-availability or payment-safety claim:

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
