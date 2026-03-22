# YTWL — YouTube Watch Later, offline

Manage your YouTube Watch Later playlist without opening YouTube. Import your queue as a CSV, search, filter, sort, and open a playlist — all in your browser, with no backend.

![Screenshot placeholder](https://github.com/buzzb0x/ytwl/raw/main/public/icon.svg)

---

## How it works

1. **Export** your Watch Later playlist using the included Tampermonkey userscript → [install instructions](scripts/INSTALL.md)
2. **Import** the downloaded CSV into the web app
3. **Manage** your queue: search, filter, sort, group, and pick what to watch

Your data lives entirely in `localStorage` — nothing is sent anywhere.

---

## Features

### Import & sync
- Drag-and-drop or click-to-browse CSV upload
- Merge imports — re-import an updated CSV and only new videos are added (duplicates skipped)
- Compare mode in the userscript: load a previously-exported CSV and it highlights videos you've since deleted from the app; auto-delete mode removes them from YouTube's Watch Later in one go

### Search
- **Text search** — filters by title and channel name as you type
- **Semantic search** — toggle AI-powered search using an on-device embedding model ([`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)) for fuzzy, meaning-based matching; embeddings are cached locally

### Sort & group
- Sort by date added (newest/oldest), duration (longest/shortest), or title
- Sort by selection order — videos surface in the order you picked them
- Group by channel or by month added, with collapsible sections

### Views
- **Grid view** — compact thumbnail grid
- **List view** — dense single-column list for large queues

### Fill mode
- Set a time budget (5–60 min) and let the app auto-select videos to fill it exactly
- Swap mode: replace a selected video with another that fits within the remaining budget

### Playlist export
- Select any videos and open them as a YouTube playlist in one click
- Builds a `youtube.com/watch_videos?video_ids=…` URL — no API key needed

### PWA & offline
- Installable as a Progressive Web App
- Thumbnails cached for offline browsing (up to 500, 30-day expiry)

---

## Getting started

### Web app

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

### Userscript

See [scripts/INSTALL.md](scripts/INSTALL.md) for step-by-step instructions on installing the Tampermonkey export script.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| CSV parsing | papaparse |
| Semantic search | @huggingface/transformers — [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) (on-device) |
| PWA | vite-plugin-pwa |
| Testing | Vitest + React Testing Library |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to report bugs, request features, and submit pull requests.

---

## License

MIT
