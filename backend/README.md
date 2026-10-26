# SkyLine backend starter

This is an API skeleton, not a banking processor. Before production, connect a managed identity provider, PostgreSQL/managed database, email provider, KYC/AML provider, payment/transfer providers and an audited ledger.

Security baseline: HTTPS only, secure HttpOnly SameSite cookies, CSRF protection, rate limiting, audit logs, server-side authorization, encrypted secrets, idempotency keys for money movement, transaction limits and step-up authentication for sensitive actions.

Do not place provider secret keys, service-role database keys or banking credentials in frontend files.
