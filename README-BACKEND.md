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


## v18 deployed authentication
The frontend is configured to call the HTTPS SkyLine API at `https://skyline-gmut.onrender.com`.

### Render environment variables
Set these in the Render service before testing accounts:
- `SKYLINE_JWT_SECRET` = a long random secret (at least 32 characters).
- `WEB_ORIGIN` = your GitHub Pages origin, for example `https://don-bliss.github.io`.

Do not put `SKYLINE_JWT_SECRET` in any frontend file.

### Cross-device test
1. Deploy this v18 project to GitHub Pages.
2. Create an account on Device A.
3. On Device B, open the same published site and sign in with the same email/password.
4. The account is looked up by the Render API, not by Device A's localStorage.

The current API stores users in `backend/data/users.json` on the service filesystem. This is suitable for development/testing, but a production deployment should move user records to a managed database because ephemeral service filesystems are not a durable production datastore.
