# AGENTS.md

## Project Overview

**YTWL** (YouTube Watch Later) is a React web app for managing your YouTube Watch Later playlist offline. It pairs with a Tampermonkey browser extension that exports playlist data as CSV.

## Stack

- **React 19** with functional components and hooks
- **TypeScript** (strict mode, `moduleResolution: bundler`)
- **Vite 8** for build/dev server
- **Tailwind CSS v4** (`@tailwindcss/vite` plugin — no `tailwind.config.js`, config lives in `src/index.css` via `@theme {}`)
- **clsx + tailwind-merge** via `cn()` helper in `src/lib/utils.ts`
- **class-variance-authority (cva)** for component variant logic
- **Lucide React** for icons
- **papaparse** for CSV parsing/serialization
- **LocalStorage** for persistence (`ytwl_videos`, `ytwl_sortBy`, etc.)

## Project Structure

```
src/
  App.tsx                 # Root orchestrator — thin, wires hooks and components
  main.tsx                # React entry point
  index.css               # Tailwind entry (@import "tailwindcss") + @theme tokens + global resets
  types/
    index.ts              # Shared types: Video, SortBy, GroupBy, ViewMode, VideoGroups
  lib/
    utils.ts              # cn() = twMerge(clsx(...))
    duration.ts           # parseDuration, formatDuration
    youtube.ts            # getVideoId
    csv.ts                # parseCSV, serializeCSV (papaparse)
  hooks/
    useLocalStorage.ts    # Generic localStorage-backed state
    useVideos.ts          # Video list CRUD and CSV export
    useFill.ts            # Fill/swap/select logic and playlist URL
  components/
    ui/
      Button.tsx          # Ghost / danger / accent variants (cva)
      Input.tsx           # Styled text input
      Select.tsx          # Styled select
    Thumbnail.tsx         # Video thumbnail with duration badge
    VideoCard.tsx         # Single video card (cva for card/checkbox variants)
    UploadScreen.tsx      # CSV drag-and-drop upload
    Header.tsx            # Sticky app header with all controls
    PlaylistBar.tsx       # Fixed bottom bar for playlist selection
    VideoGrid.tsx         # Grouped/ungrouped video list
  test/
    setup.ts              # Vitest setup (jest-dom matchers)
    utils.test.ts         # Unit tests for lib utilities
    VideoCard.test.tsx    # Component tests for VideoCard hover/interaction
    App.test.tsx          # Integration tests: search, sort, fill, select, group, swap
scripts/
  tampermonkey-export.user.js  # Browser userscript for exporting from YouTube
index.html
vite.config.ts
tsconfig.json
```

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

- `utils.test.ts` — unit tests for `getVideoId`, `parseDuration`, `formatDuration`, `parseCSV`, `serializeCSV`
- `VideoCard.test.tsx` — hover shows/hides remove and swap buttons; checkbox behavior; callback invocation
- `App.test.tsx` — integration tests: search/filter, sort, fill algorithm, select/unselect, group by channel (collapse/expand), fill swap

**Notes:**

- `VideoCard` is exported from `src/components/VideoCard.tsx` for isolated testing
- Group header divs have `data-testid="group-header-{name}"` for reliable targeting
- App tests seed `localStorage` with a fixed 5-video dataset before each test
- Fill and swap tests account for randomness by asserting constraints (total ≤ budget) rather than exact values
- Vitest globals (`describe`, `it`, `expect`, `vi`) are available without imports via `"types": ["vitest/globals"]` in `tsconfig.json`

## Architecture & Conventions

### Path Alias

Use `@/` for all imports from `src/`:

```ts
import { cn } from "@/lib/utils";
import type { Video } from "@/types";
```

### Styling

- Tailwind CSS v4 — utility classes via `cn()` for all component styles
- Custom design tokens in `src/index.css` `@theme {}` block:
  - `--color-accent: #ff5050` → `text-accent`, `bg-accent`, `border-accent`
  - `--color-bg: #0a0a0a` → `bg-bg`
  - `--color-muted: #888`, `--color-dimmed: #555`
  - `--font-syne`, `--font-mono`
- Semi-transparent values use Tailwind's built-in opacity modifiers: `bg-white/5`, `border-accent/40`
- Use `cn()` for conditional classes; use `cva()` when a component has discrete variant states

### Component Variants

Use `cva` (class-variance-authority) when a component has named variant states:

```ts
const buttonVariants = cva("base-classes", {
  variants: { variant: { ghost: "...", danger: "...", accent: "..." } },
  defaultVariants: { variant: "ghost" },
});
```

Pair with `VariantProps<typeof buttonVariants>` in the props interface.

### Hover-Driven Rendering

`VideoCard` uses `useState(hovered)` to conditionally render action buttons. This is intentional — `group-hover:` cannot toggle DOM node existence and would leave buttons keyboard-accessible but invisible. Do not replace with CSS-only hover.

### Data Model

```ts
interface Video {
  title: string;
  video_url: string;
  duration: string; // "HH:MM:SS" or "MM:SS"
  thumbnail_url: string;
  channel_name: string;
  estimated_date: string; // "YYYY-MM-DD"
  relative_date: string;
}
```

### Key Features

- **Import/Export** — CSV-based; import merges with existing data (deduplicates by `video_url`)
- **Search** — real-time, title + channel
- **Sort** — date (newest/oldest), duration (longest/shortest), alphabetical
- **Group** — by channel or month (collapsible sections)
- **View** — grid or list
- **Fill mode** — auto-select videos to fill a time budget (5–60 min)
- **Swap mode** — replace a selected video while respecting the budget
- **Playlist export** — builds a `youtube.com/watch_videos?video_ids=...` URL from selected videos

### Tampermonkey Script

`scripts/tampermonkey-export.user.js` runs on `youtube.com/playlist?list=WL*`. It:

- Injects "Export All" / "Export Selected" buttons into the YouTube UI
- Extracts video metadata from YouTube's React component internals
- Estimates absolute dates from relative strings ("2 days ago" → ISO date)
- Outputs a timestamped CSV file

## Contribution Notes

- Before finishing any change, run `npm run lint`, `npx prettier --check .`, and `npm run test:run` to verify nothing is broken. Fix any issues before considering the task done.
- All new components should use Tailwind classes (no inline styles)
- Use `cn()` for conditional class composition; use `cva()` for discrete variants
- Keep `App.tsx` thin — business logic belongs in hooks, layout in components
