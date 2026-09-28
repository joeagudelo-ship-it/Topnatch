# Topnatch Script Rehearsal

Top-down rehearsal and timing tool for Topnatch's 30th anniversary program. Joe and Kenneth can follow the host script, scrub the clock, rehearse stage movement, and edit proposed positions and routes.

## Run locally

Requirements: Node.js 20 or newer. No packages need installing.

```sh
npm run check
npm run build
python3 -m http.server 8000 -d dist
```

Open http://localhost:8000. The Python HTTP server is only for local preview. The live Vercel build uses `node build.mjs` and serves `dist`.

## Edit

| File | Purpose |
| --- | --- |
| `source/script.json` | Script text and program sections |
| `source/app.js` | Spoken timing, 20-winner expansion, playback and sections |
| `source/simulator.js` | Cue actions, SR queue, people, map and plan editor |
| `source/layout.json` | Map fixture geometry |
| `source/index.html`, `source/styles.css` | Interface |
| `source/assets/` | Floor plan and licensed font |
| `build.mjs` | Vercel/static build; `build.py` produces equivalent output for the existing Sites workflow |

Edit `source/`, then run `npm run check`. `dist/` is generated and ignored by Git. See [event context](docs/PRODUCTION_CONTEXT.md) and [working rules](AGENTS.md).

## Deployment

The repository is connected to a Vercel project: branches produce previews; `main` publishes production after review and merge. Joe approved this repository being public. `vercel.json` declares the build and output settings. Keep the existing [ChatGPT Site](https://topnatch-script-rehearsal.joe-agudelo.chatgpt.site/) available as a fallback. It is a separate deployment and does not automatically sync from GitHub.

Configuration and account steps are in [SETUP.md](SETUP.md). The source snapshot matches ChatGPT Sites version 14, deployed on 2026-09-28.

## Data behavior

The editor stores plans, holds, and local photos in **browser localStorage**. Joe and Kenneth exchange changes using Export plan / Import plan; GitHub and Vercel do not make those browser edits shared. The site is currently public, so do not put guest photos or private seating data into committed defaults.
