# SkyLine v14

This update preserves the working SkyLine v10 theme/navigation base and focuses only on the requested Timeline improvements.

## Timeline updates
- Replaced the large Discover presentation with a compact Create Post bar so the first post remains visible higher on the screen.
- Kept Trends, Mutuals, Explore and Marketplace as the four timeline sections.
- Added a working Publish action that places a new post at the top of Trends and persists it locally for the front-end demo.
- Removed the Timeline search field from the page.
- Added a search icon beside the menu button in the header. It opens a compact search overlay and filters the current section.
- Converted SKYLINE COMMUNITY into a clickable control.
- Added Football, Music, Entertainment and Politics community choices in a popup.
- Added community room pages with room-specific descriptions and a front-end chat composer for each interest.
- Marketplace Pay behavior remains the existing front-end-only payment placeholder; no money is moved.

## Backend note
The community chat, posts, search and marketplace payment are still front-end/demo behavior. They are intentionally ready to be connected to the secure backend later.

## Publishing
Use this package as the clean replacement for the current GitHub Pages repository, as with the previous SkyLine packages.


## v14 final timeline cleanup
- Removed the wallet card/dashboard preview from Home; users access the wallet through the dedicated bottom Wallet button.
- Made the bottom Wallet button visually prominent for easier access.
- Removed the create-post expand arrow and implemented automatic textarea growth while typing.
- Removed the search expand arrow and implemented automatic search textarea growth.
- Updated the service-worker cache name to v14 to reduce stale-cache issues.
