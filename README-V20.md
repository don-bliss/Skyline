# SkyLine v20 — persistent cross-device authentication

This build keeps the existing SkyLine frontend and uses the HTTPS Render API with PostgreSQL for persistent account storage.

## Required Render settings
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- `DATABASE_URL`: Render Postgres **Internal Database URL**
- `SKYLINE_JWT_SECRET`: random secret, at least 32 characters
- `WEB_ORIGIN`: `https://don-bliss.github.io`
- `NODE_ENV`: `production`

The production backend intentionally refuses to start without PostgreSQL so accounts cannot silently fall back to temporary local storage.
