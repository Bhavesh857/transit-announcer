# Transit Announcer

A private, frontend-only React app for composing transit announcements, speaking populated field names and values aloud, and managing reusable values. Data and theme preferences remain in browser local storage.

## GitHub Pages

Pushes to `main` run tests, build the production site, and deploy `dist/` through GitHub Actions. In the repository settings, Pages must use **GitHub Actions** as its source.

## Commands

- `npm run dev` — start Vite
- `npm test` — run focused tests
- `npm run build` — create the static production build

Backups are versioned JSON files. Imports are validated locally and only applied after confirmation.
