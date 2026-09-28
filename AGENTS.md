# Working rules for Codex and other coding agents

Read `README.md` and `docs/PRODUCTION_CONTEXT.md` before changing source. The source of truth for the hosted app is this GitHub repo after migration. Work on a branch and submit a pull request; do not push directly to `main` unless Joe explicitly asks.

Preserve the current rehearsal flow and the separate ChatGPT Sites fallback. Edit `source/`, run `npm run check`, and manually inspect changed interactions. Keep `build.mjs` and `build.py` behavior equivalent if you change the build. Do not commit `dist/`, local plan exports, guest photos, credentials, or the source tech sheet.

User preference: ask Joe before editing, deleting, or moving files in Google Drive or Notion. Site source edits requested in the current task can be prepared on a branch for review. Do not assert a client decision without source evidence. Label rehearsal assumptions and proposed blocking clearly.

Do not auto-merge, alter the production branch, or deploy the Vercel production site without Joe's approval for the reviewed change. A pull request preview is appropriate. Do not copy user-supplied photos into the public default app.
