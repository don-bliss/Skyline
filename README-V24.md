# SkyLine V24 — Timeline Visual Refresh

## Timeline
- Redesigned the timeline with a richer dark visual system, media-first post cards, tags, spacing, gradients and hover states.
- Added local demo photo assets so the demo feed is visually rich without depending on third-party image hosts.
- Added Stories and Reels discovery cards above the feed.
- Kept the existing search icon and expandable search behavior.
- Added colored interaction treatments:
  - Like: pink/red, with a stronger active state and tap animation.
  - Comment: warm gold.
  - Share: cyan/blue, with a visible shared state.

## Profile routing
- Timeline post avatars and names continue to route using the post's own username.
- `profile.html?user=<username>` now loads the requested profile instead of always showing the logged-in user.
- Added a public backend profile endpoint for registered accounts.
- Added demo-profile fallbacks for the timeline's built-in demo accounts.

## Deployment
This is a static frontend plus the existing Node/Express backend. The backend still uses the existing Render configuration and API base URL.
