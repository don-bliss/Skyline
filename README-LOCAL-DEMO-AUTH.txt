SkyLine GitHub Pages — Local Demo Authentication
=================================================

This package intentionally disables the deleted Render API and any Supabase cloud
authentication. The existing auth.js local fallback will be used instead.

How it works:
- Sign-up and sign-in work in the same browser profile on the same site origin.
- User records are stored in browser localStorage. The verification code for local
  testing is displayed by the existing verification flow.
- This does NOT sync accounts across phones/computers, survive browser storage
  clearing, or provide secure production authentication.
- Do not use real/reused passwords, real bank account details, or real financial data.
- A new GitHub repository URL on the same github.io domain may keep the same origin
  if the hostname is unchanged; localStorage is origin-scoped, not repository-scoped.
- If a user previously registered while the old API was active, that account may not
  exist in localStorage. Create a new demo account after deploying this package.

Deployment:
1. Extract the ZIP and upload its contents to the root of your GitHub Pages repository.
2. Ensure GitHub Pages publishes from the same branch/folder as these files.
3. Open the published signup page and hard-refresh (Ctrl+Shift+R).
4. Create an account, finish the local verification step, then sign in with the same
   browser/device. Keep the tab on the deployed GitHub Pages site.
5. When ready for cross-device accounts, deploy a backend and database, then restore
   the API URL in cloud-config.js. Never put database credentials or JWT secrets in
   frontend files.
