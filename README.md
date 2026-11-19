# gta6-cover-art-01 — Vice Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Krisnaa19/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Krisnaa19/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Coast Cover Studio** turns any photo and caption into GTA 6-style multi-panel cover art — the poster look with bold lettering and a Vice City sunset or neon grade — and exports it as a PNG to share. It runs offline in a desktop browser from its own static files: photos never leave the machine.

## What it does

- **6 poster layouts** — Hero Grid, Nine Panel, Slash (slanted panels), Full Bleed, Tilted Snaps, Split Duo
- **6 colour grades** — Sunset, Neon Vice, Golden Hour, Midnight, Heatwave, Mono Noir (gradient-map wash + halftone + film grain + vignette)
- **Any photo** — load the four sample photos or upload your own; click a panel to select it, drag to reposition, scroll to zoom, crop per panel with several photos or one photo across panels
- **Poster lettering** — big gradient title in Anton with heavy outline and drop shadow, neon script subtitle in Pacifico, quote line, 5-star heat meter, starburst "ORIGINAL" seal, VOL. badge, collector's ribbon, panel caption chips, palm-strip tagline bar and barcode
- **Fast and easy** — photo to PNG in a few clicks, with Undo/Redo and a "Surprise me" randomiser
- **3 export sizes** — 1080 × 1080, 1080 × 1350, 1920 × 1080 PNG, one click each

## Run it

Serve `app/` with any static server and open `index.html` in desktop Chrome, for example:

```sh
cd app && python3 -m http.server 8080
```

Or use the kit's server if you have the kit: `node serve.ts` serves `app/` at http://localhost:8080.

Everything is original: no Rockstar Games logo, artwork or font. Anton and Pacifico are licensed under the SIL Open Font License (see `app/fonts/OFL.txt`). Two sample photos come from the make.fun kit (free to use); the other two were made with an image model.

## Enter it (make.fun)

`main.ts` (Node 22) copies `app/` and `screenshots/` into `/output` and writes `/output/dossier.json` with the kit's `vendor/makefun-app.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=k9ejmyk6&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
