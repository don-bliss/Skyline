# SkyLine v18 — Timeline + Cross-Device Authentication Update

## Timeline
- SkyLine Community is a compact, clearly clickable button.
- Community rooms include Football, Music, Entertainment, Politics, Food and Fashion.
- Timeline controls/posts are tightened so the first two trending posts appear earlier on mobile.
- User avatars in timeline posts are clickable and route to `profile.html?user=USERNAME`.
- Like toggles, Comment opens/posts inline comments, and Share uses the device share sheet when available or copies a link.
- The post composer keeps automatic text expansion and Media/GIF/Location tools.
- Wallet remains the emphasized bottom-navigation destination without adding a wallet dashboard to Timeline.

## Navigation fix
Authenticated-page Home/brand links now return to `timeline.html`; they no longer send users back to the public landing page.

## Cross-device authentication API
The `/backend` folder now includes:
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `GET/PATCH /api/v1/profile`

Passwords are hashed server-side with Node `scrypt`. Sessions use signed access and refresh tokens. Each device can sign in independently with the same SkyLine account.

### Before production
1. Deploy `/backend` to an HTTPS server.
2. Set `SKYLINE_JWT_SECRET` to a long random secret (32+ characters).
3. Set `WEB_ORIGIN` to the GitHub Pages/custom-domain origin.
4. Put the deployed API URL in `cloud-config.js` as `window.SKYLINE_API.baseUrl`.
5. Replace the JSON user store with a real database before handling production financial data.

GitHub Pages cannot run the Node backend itself; the frontend and API therefore need separate hosting unless you later move the frontend to a platform that can serve both.


This package has been superseded by SkyLine v18, with the deployed HTTPS API URL configured in cloud-config.js.
