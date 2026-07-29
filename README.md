# Flocus Clone (Tsukiyomi workspace)

Browser-based aesthetic productivity dashboard — **1:1 feature parity** with [Flocus](https://flocus.com) core experience (local clone for development).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Production checklist

1. Copy `.env.example` to `.env`.
2. Set strong secrets:
   - `JWT_SECRET` (at least 32 chars)
   - `ADMIN_USERNAME` (not `admin`)
   - `ADMIN_PASSWORD` (at least 12 chars)
3. Set `NODE_ENV=production`.
4. Build and run:

```bash
npm run build
npm run dev:server
```

Note: API now refuses to start in production if auth/admin secrets are weak.

## Bundle extraction (data pipeline)

Flocus ships as a webpack extension bundle. This repo extracts catalog data from it:

1. Place extracted assets under `scripts/` (`main.js`, `theme-map.json`, etc.).
2. Run `node scripts/extract-themes.js` / sound extraction as documented in `scripts/` (outputs `src/data/flocus-*.generated.json`).
3. Regenerate the app catalog:

```bash
node scripts/generate-data.js
```

This writes **`src/data/catalog.ts`** with **73 themes**, **43 sounds**, tallies, alert sounds, and **8 curated Spotify playlists** (`FLOCUS_PRIMARY = #7432FF` from the Flocus manifest).

## Libraries used

| Library | Purpose |
|---------|---------|
| [howler](https://howlerjs.com/) | Ambient soundscapes + layered audio |
| [@dnd-kit/core](https://dndkit.com/) + sortable | Task drag-and-drop reorder |
| [recharts](https://recharts.org/) | Stats charts (focus time, sessions) |
| [framer-motion](https://www.framer.com/motion/) | Mode transitions, onboarding |
| [react-youtube](https://www.npmjs.com/package/react-youtube) | YouTube backgrounds & custom music |
| [lucide-react](https://lucide.dev/) | UI icons |
| [date-fns](https://date-fns.org/) | Stats date ranges |
| [zustand](https://zustand.docs.pmnd.rs/) | Persistent app state |

## Feature parity

- **3 modes:** Home, Focus, Ambient
- **Timer:** Pomodoro, Countdown, Stopwatch, Animedoro, 52/17 — task ETA mode, Document PiP, static/dynamic tallies, all alert sounds from catalog
- **Tasks:** @dnd-kit reorder, emoji picker, colors, ETA, settings gear (breaks, auto-start, progress), confetti on last task; 3 tasks free / unlimited Plus
- **Themes:** Full **73-theme** picker with Type / Environment / Brightness / color filters; animated `<video>` themes; custom image + YouTube (`react-youtube`)
- **Sounds:** All **43** soundscapes, category filters, Sounds/Music tabs, **5 layers** (Plus) or **1** (free)
- **Music:** Spotify embeds for curated playlists; custom Spotify/YouTube URL parsing
- **Settings tabs:** Support, What's New (v1.7–v1.9.2), Upgrade, Account, Stats + charts, Extras, Focus Timer, Clock, Quotes, Themes
- **Onboarding:** 4-step flow (auth, role, focus area)
- **Stats & streaks** with Focus Score (Plus)
- **Clock & greetings**, quotes, notepad, clear mode, wake lock
- **Local persistence** via localStorage (export/import settings)
- **Branding:** Flocus violet `#7432FF`

## Note

Independent clone for learning and Tsukiyomi prototyping — not affiliated with Gridfiti / Flocus. Plus billing is simulated locally; real Flocus uses Stripe.
