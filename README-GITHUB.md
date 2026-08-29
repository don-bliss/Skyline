# SkyLine — GitHub Pages mobile-ready bundle

Use these files in the root of your GitHub Pages repository:

- index.html
- login.html
- signup.html
- home.html
- inbox.html
- features.html
- skyinfo.html
- base.css
- Sky.js
- auth.js
- inbox.js

Keep the existing `img` folder from the project beside these files. The current homepage/inbox reference `img/dondire.jpeg` and `img/olaadu.jpeg`.

## Important GitHub Pages fixes included

1. Root-absolute asset paths such as `/base.css`, `/Sky.js`, `/home.html`, and `/img/...` were changed to relative paths. This is important when the site is served from a GitHub Pages repository path rather than the domain root.
2. Mobile layout rules were strengthened for small screens, including the home feed, wallet, market panel, authentication cards, and Inbox.
3. The home page keeps the live crypto market visible when the desktop three-column layout collapses.
4. Inbox and message scrolling remain independent on mobile.
5. The JavaScript files pass syntax validation.

## Deployment

Upload/replace the files while preserving the existing `img` directory. In GitHub Pages, use the repository root as the publishing source. After deployment, open the exact GitHub Pages URL in a phone browser and do a hard refresh if an older CSS/JS version is cached.

The market panel uses the existing live-market code. It requires an internet connection and the public market endpoint may impose rate limits.
