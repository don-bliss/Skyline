# SkyLine v26 — social backend activation update

## Included
- Added PostgreSQL tables for posts, likes, comments, follows and notifications; schema is created automatically when the API starts with `DATABASE_URL`.
- Added authenticated API routes for publishing and reading timeline posts, toggling likes, adding/listing comments, deleting the current user's posts, following/unfollowing users, listing notifications and marking notifications read.
- Connected the Timeline sections composer, feed, likes and comments to the shared API when configured. Local demo behavior remains available only when no API URL is configured.
- Advanced frontend cache-busting versions to v26.
- Kept money movement, crypto orders and transfers disabled: they require regulated provider integrations and must not be simulated as real transactions.

## Deploy
1. Create a managed PostgreSQL database and a Node service using `backend/` as the root directory.
2. Set `NODE_ENV=production`, `DATABASE_URL`, `SKYLINE_JWT_SECRET` (random, 32+ chars), and `WEB_ORIGIN` to the exact deployed frontend origin(s), comma-separated if needed.
3. Build: `npm install`; Start: `npm start`.
4. Set the real API URL in `cloud-config.js` (`window.SKYLINE_API.baseUrl`).
5. Deploy the frontend folder to HTTPS hosting. Test `/api/v1/health`, signup/login, and social actions with two separate accounts on two devices.

## Important deployment boundaries
- This archive does not deploy itself or have access to the user's Render/GitHub accounts. Deployment credentials and provider configuration must be supplied in the hosting dashboards.
- Production social data requires PostgreSQL. The backend intentionally returns HTTP 503 for social API calls if PostgreSQL is not configured; it does not pretend local JSON storage is cross-device.
- Email/SMS verification requires configured providers. Set `RESEND_API_KEY` and either Twilio Verify or Termii credentials.
- Post media is currently accepted as bounded data URLs and stored in PostgreSQL. Before public/high-volume launch, move media to object storage (S3/R2/Supabase Storage) and store only signed/public object URLs in the database.
- Messaging UI, stories/reels, Marketplace transactions, wallet transfers, and crypto trading are not made production-ready by this social API patch. Wallet/financial actions remain disabled until a licensed payment partner, ledger, reconciliation and compliance controls are integrated.
- Run a security review, backups, migrations, monitoring, abuse reporting/moderation, privacy policy and terms before opening to the public.
