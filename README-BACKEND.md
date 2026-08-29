# SkyLine v7 backend roadmap

This update includes a frontend API client, an OpenAPI contract, and a minimal Express security shell. They are intentionally **not** connected to real money movement yet.

## Planned API domains
- Identity: registration, email verification, login, sessions, password reset, MFA/passkeys
- Profile: profile, avatar, username/account number
- Social: timeline, posts, media, likes, comments, follows
- Notifications: notification feed and read state
- Wallet: ledger-backed balances, accounts, transaction history
- Transfers: quote, beneficiary, transfer initiation, status and idempotency
- Compliance: KYC/KYB, AML/sanctions checks, limits and case management

## Production security baseline
Use HTTPS everywhere, secure HttpOnly SameSite cookies, server-side authorization, rate limiting, CSRF protection, audit logging, encrypted secrets, idempotency keys for financial writes, and step-up authentication for sensitive actions. OWASP specifically recommends server-managed secure sessions and warns against storing authentication tokens in localStorage. See the project's security notes and the OWASP references used in the planning discussion.

## Banking / licensing
A web app cannot manufacture a "banking license" in code. Before enabling real worldwide transfers, SkyLine will need a lawful operating model, licensed/regulated payment or banking partners in the relevant jurisdictions, KYC/AML/sanctions controls, safeguarding/ledger architecture, and provider agreements. The backend should be built so these regulated provider adapters can be added without exposing provider secrets to the frontend.

## v8 API modules
The frontend now expects separate service contracts for Trends, Mutuals, Explore, Marketplace, Wallet actions, Crypto market data and Crypto orders. These routes are intentionally stubs until the production backend is deployed. No real funds or trades are processed by the static site.
