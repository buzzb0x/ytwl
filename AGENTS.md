# AGENTS.md

## Project Overview

**YTWL** (YouTube Watch Later) is a React web app for managing your YouTube Watch Later playlist offline. It pairs with a Tampermonkey browser extension that exports playlist data as CSV.

## Stack

- **React 19** with functional components and hooks
- **Vite** for build/dev server
- **No CSS files** — all styles are inline JSX objects
- **No external UI or state management libraries** — vanilla React only
- **LocalStorage** for persistence (`ytwl_videos`, `ytwl_sortBy`, etc.)

## Project Structure

```
src/
  App.jsx          # Entire app — state, logic, and all components (~1000+ lines)
  main.jsx         # React root entry point
  utils.js         # Pure utility functions (getVideoId, parseDuration, parseCSV, etc.)
  test/
    setup.js       # Vitest setup (jest-dom matchers)
    utils.test.js  # Unit tests for utility functions
    VideoCard.test.jsx  # Component tests for VideoCard hover/interaction
    App.test.jsx   # Integration tests for search, sort, fill, select, group, swap
scripts/
  tampermonkey-export.user.js  # Browser userscript for exporting from YouTube
index.html
vite.config.js
```

The app lives almost entirely in `src/App.jsx`. Components are defined inline in that file. Pure utility functions live in `src/utils.js`.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server with HMR
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint
npm run format    # Prettier
npm run test      # Run tests in watch mode (Vitest)
npm run test:run  # Run tests once (CI)
npm run test:ui   # Open Vitest browser UI
```

## Testing

**Stack:** Vitest + React Testing Library + jsdom

**Test files** (all under `src/test/`):

- `utils.test.js` — unit tests for `getVideoId`, `parseDuration`, `formatDuration`, `parseCSV`, `serializeCSV`
- `VideoCard.test.jsx` — hover shows/hides remove and swap buttons; checkbox behavior; callback invocation
- `App.test.jsx` — integration tests: search/filter, sort, fill algorithm, select/unselect, group by channel (collapse/expand), fill swap

**Notes:**

- `VideoCard` is exported from `App.jsx` for isolated component testing
- Group header divs have `data-testid="group-header-{name}"` for reliable targeting
- App tests seed `localStorage` with a fixed 5-video dataset before each test
- Fill and swap tests account for randomness by asserting constraints (total ≤ budget) rather than exact values

## Architecture & Conventions

### Components

All components are in `src/App.jsx`:

- `App` — top-level state and layout
- `UploadScreen` — CSV import UI shown before data is loaded
- `VideoCard` — renders a single video in grid or list view
- `Thumbnail` — lazy-loaded image with fallback

### Styling

- All styles are plain JS objects passed to the `style` prop — no CSS files, no CSS-in-JS libraries
- Dark theme: background `#0a0a0a`, accent `#ff5050`
- Fonts: DM Mono (monospace) and Syne (sans-serif) from Google Fonts

### Data Model

Each video object:

```js
{
  title: string,
  video_url: string,
  duration: string,        // "HH:MM:SS"
  thumbnail_url: string,
  channel_name: string,
  channel_url: string,
  relative_date: string,
  estimated_date: string   // "YYYY-MM-DD"
}
```

### Key Features

- **Import/Export** — CSV-based; import merges with existing data
- **Search** — real-time, title + channel
- **Sort** — date, duration, alphabetical
- **Group** — by channel or month (collapsible)
- **View** — grid or list
- **Fill mode** — auto-select videos to fill a time budget (5–60 min)
- **Swap mode** — replace selected videos while respecting budget
- **Playlist export** — builds a YouTube playlist URL from selected videos

### Tampermonkey Script

`scripts/tampermonkey-export.user.js` runs on `youtube.com/playlist?list=WL*`. It:

- Injects "Export All" / "Export Selected" buttons into the YouTube UI
- Extracts video metadata from YouTube's React component internals
- Estimates absolute dates from relative strings ("2 days ago" → ISO date)
- Outputs a timestamped CSV file

## Contribution Notes

- Keep the app in `src/App.jsx` unless there's a strong reason to split it out
- Inline styles only — do not introduce CSS files or style libraries
- Avoid adding new dependencies; the project is intentionally minimal
- Run `npm run test:run` to verify nothing is broken after changes
