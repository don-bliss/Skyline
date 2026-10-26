SkyLine v25 — UI and profile routing refinements
=================================================

Included changes:
1. Wallet navigation remains highly visible when inactive and keeps a distinct active state.
2. Removed the duplicate Account Name / Account Number / Available Balance cards from wallet.html.
   The wallet hero remains the single compact identity/balance summary.
3. Fixed public-profile routing display: profile.html no longer lets the global session renderer
   overwrite the selected user's name/account information.
4. Public profiles no longer expose the registered user's private account/wallet cards.
5. Refined the Timeline community entry, feed spacing, post surfaces, composer and wallet navigation.

Deployment:
- This is a static frontend package plus the existing backend folder.
- Keep the backend configuration/secrets in Render environment variables.
- If using the backend service, Start Command should be: npm start
- Do not use: node npm start
