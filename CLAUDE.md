# Claude Code handoff

Joe wants to use **Opus 5.5** for new Topnatch versions. Select that model in Claude before starting; repository files do not select a model. Read `README.md`, `SETUP.md`, and `docs/PRODUCTION_CONTEXT.md`.

Work on a new branch and open a pull request for Joe's review. Source files are in `source/`; run `npm run check` after changes. If possible, open the Vercel preview for visual and interaction checks. Report the preview URL, changed behavior, test results, remaining assumptions, and any timing impact.

The GitHub repository is the common codebase for Claude and ChatGPT Codex. The old ChatGPT Site stays live as fallback and does not receive GitHub changes automatically. Do not edit the linked Google Drive tech sheet or Notion without asking Joe first. Do not invent winner names, seating positions, or raffle hardware.

Initial task suggestion: audit the current UI and animation workflow, then propose small, reviewable improvements to the editable stage movement, SR standby board, and rehearsal controls. Preserve all confirmed script beats.
