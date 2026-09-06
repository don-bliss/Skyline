# SkyLine backend v19 — persistent cross-device authentication

The frontend is hosted on GitHub Pages and the API is hosted on Render over HTTPS.

## Required Render environment variables

Set these in the Render Web Service → Environment:

- `NODE_ENV` = `production`
- `WEB_ORIGIN` = `https://don-bliss.github.io`
- `SKYLINE_JWT_SECRET` = a long random secret (32+ characters)
- `DATABASE_URL` = the connection string from the Render PostgreSQL database

The previous JSON file backend is retained as a local-development fallback. When `DATABASE_URL` is present, users are stored in PostgreSQL and survive restarts/redeploys, which is what makes cross-device login persistent.

## Render service settings

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

After changing the files, commit/push them to GitHub and redeploy the Render service.

## Health check

Open:
`https://skyline-gmut.onrender.com/api/v1/health`

A healthy production response should show `ok: true` and `database: "postgres"`.
