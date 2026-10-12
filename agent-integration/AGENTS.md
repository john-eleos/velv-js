# Agent instructions: VelvPay API documentation kit

- This directory is source-verified against the authoritative backend `production` branch at commit `b81302575918fcd91fcdb48627dd4506c6dea161` (commit date 2026-10-08; remote head verified 2026-10-09 UTC). It is an offline evaluation, not live-deployment or sandbox certification.
- Treat `capabilities/velvpay-api-capabilities-v0.2.0.json` as discovery metadata, not permission to execute every source route.
- Generate calls only for operations marked `contract_verified` and present in a versioned OpenAPI file. Other classifications require a new review.
- The two-endpoint NGN flow remains defined in `openapi/velvpay-ngn-collection-v0.1.0.json`. Conservative storefront/headless reads are in `openapi/velvpay-agent-read-api-v0.2.0.json`.
- Treat backend `production` commit `b81302575918fcd91fcdb48627dd4506c6dea161` as the source snapshot for this version; re-audit before publishing against another commit.
- Generate v1 authentication only on a trusted server. Never expose or log the secret key, encryption key, generated `api-key`, webhook token or full authorization header.
- For v2, use an independently revocable `vch_` bearer credential with the smallest required scope. Never substitute a v1 key or end-user session.
- Tolerate unknown persistence fields in read responses, but expose only an application allowlist to downstream clients.
- Send integer kobo with `isNaira: false`. Do not add a currency field to this endpoint.
- Treat account initialisation as pending. Only a verified transaction record in a final paid state can drive fulfilment.
- Status lookup must include only `transaction_id`; do not send `send_webhook`, including as `false` or `undefined` text. Omitting webhook delivery does not eliminate backend activity logs or analytics.
- Match transaction ID, merchant reference and expected amount before a final state change. Make notification handling idempotent.
- Use synthetic data in offline tests. Do not call a live provider, create credentials, change security settings, deploy, release or move funds.
- “Subscribe” means poll the static documentation feeds. It never authorizes API, webhook or payment execution.
- Run `npm test` in this directory after changes and update `EVIDENCE.md` with the exact result and remaining live gates.
