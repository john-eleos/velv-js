# Subscribe to documentation revisions

“Subscribe” means poll a static release feed for documentation changes. It does not create a VelvPay account, credential, payment, webhook registration or paid subscription.

Available indexes:

- JSON Feed: `feeds/releases.json`
- Atom: `feeds/releases.atom`
- compact navigation: `llms.txt`

An agent may fetch one feed periodically, retain the latest item ID or `updated` value, and review a new item before adopting changed contracts. Feed entries describe documentation revisions only. They do not claim the referenced API is deployed or available.

Recommended policy:

1. Poll no more often than needed by your release process.
2. Treat draft entries as review inputs, not production contracts.
3. Re-run local schema/example tests before adoption.
4. Require human review for authentication, money movement, status semantics or newly supported routes.
5. Never interpret a feed update as authority to call a live payment endpoint.

No server, push channel or persistent access is provided by this repository; host these static files through an approved documentation publication process if remote polling is desired.
