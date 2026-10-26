# SkyLine v13

This package updates the SkyLine social-fintech front end with:

- X-style side drawer navigation on mobile and desktop.
- Home, Timeline, Profile, Messages, Wallet, Features, About, Support and Settings navigation.
- Functional front-end timeline: create posts, photos, likes, comments, share and delete your own posts.
- Theme-consistent line icons instead of colorful emoji in navigation and core controls.
- Protected authenticated pages.
- Real email/password authentication support through Supabase when configured.
- Local hashed-password fallback for front-end testing when cloud auth is not configured.
- Existing inbox and live crypto market modules retained.

## Important: cross-device authentication

A static GitHub Pages site cannot share browser `localStorage` between an iPhone and Android phone. Therefore the local fallback is intentionally device-local.

For true cross-device accounts, configure Supabase Auth:

1. Create a Supabase project.
2. Enable Email/Password authentication.
3. Open `cloud-config.js`.
4. Set `enabled: true`.
5. Add the project's Supabase URL and anon/public key.
6. Deploy the whole folder to GitHub Pages.

The app will then use Supabase Auth for signup/login/session persistence instead of local demo storage.

Do **not** put a Supabase service-role key in this project. Only the public anon key belongs in browser code.

## Existing accounts from the old build

Accounts created before cloud authentication was enabled were stored only in that browser's local storage. They cannot automatically appear on another phone. Those users must either create their account in the configured cloud system or be migrated by a backend process.

## Production financial features

Wallet balances, transfers and withdrawals are interface prototypes until a secure backend and licensed payment provider are connected. Never store real banking credentials, payment secrets or raw passwords in browser code.


## v3 registration changes
- New accounts start with a **₦0.00** wallet balance.
- The authenticated user's **full name** is displayed on the Home wallet card under the balance.
- Registration now enters a **one-time 6-digit email verification** step before login.
- Local demo mode generates a temporary code for testing; production delivery must use `verificationEndpoint` with a secure server/email provider.
- Cloud mode remains Supabase-ready for cross-device authentication. Enable it only after adding the public Supabase URL/key in `cloud-config.js`.
- Do not place Supabase service-role keys or email-provider secrets in client-side files.


## v4 hotfix
- Fixed the signup page missing `auth.js`. This was the cause of the signup failure in the previous package: `skylineSignUp` was unavailable when the form submitted.
- Standardized authentication script loading order.
- New local-mode accounts still start with a ₦0.00 balance and require one-time email verification before login.

## v5 signup reliability fix
- Added a signup authentication bootstrap that loads `auth.js` if the browser has a stale/missing script.
- Added cache-busting query versions to SkyLine application scripts so GitHub Pages does not keep serving an older JavaScript bundle.
- Signup now waits for the authentication API before calling `skylineSignUp`.
- This fixes the `window.skylineSignUp is not a function` error seen on the deployed signup page.

## v6 navigation update

The authenticated area now uses an X-style quick-navigation bar with exactly four primary actions: **Home, Inbox, Notifications, Wallet**. The authenticated side drawer no longer contains those four actions. On `timeline.html`, Home reloads the current timeline; on other authenticated pages, Home opens the timeline. Notifications currently has a front-end placeholder and is ready for the backend notification service.

Cross-device account login still requires the production cloud authentication backend to be enabled. The static GitHub Pages demo cannot share browser-local accounts between devices.


## v9 UI fixes
- Added functional Dark mode switch directly below Features in the side drawer.
- Side drawer profile header is clickable and opens the signed-in user's profile.
- Current-user profile cards/icons route to profile.html.
- Theme preference persists in localStorage across refreshes.


## v13 repack
- Repackaged the complete v12 Timeline Composer update as a fresh Version 13 archive after the previous download artifact became unavailable.
- Preserves the compact timeline layout, expandable create-post composer, header search, four timeline sections, Skyline Community popup/rooms, and Marketplace Pay prototype.
- Cache-busting application script versions were advanced to v13.
