# Account setup and handoff

The source package is ready for `joeagudelo-ship-it/Topnatch`. Joe approved using the existing **public** repository. The connected Vercel team has no Topnatch rehearsal project yet. Do not import the unrelated `topnatch-30-raffle` project. Keep guest photos, seating, private contacts, and other sensitive client details out of committed defaults.

## 1. GitHub

1. Open the existing public `joeagudelo-ship-it/Topnatch` repository. The connected ChatGPT GitHub account can add these files. If doing the initial push yourself, extract this package to a computer with Git, then in that folder run:

   ```sh
   git init
   git branch -M main
   git add .
   git commit -m "Import Topnatch rehearsal site v14"
   git remote add origin https://github.com/joeagudelo-ship-it/Topnatch.git
   git push -u origin main
   ```

   GitHub authentication is handled by your Git credential manager or browser; do not paste a token into Claude or ChatGPT.
2. Confirm the pushed tree contains `source/`, `build.mjs`, `vercel.json`, `AGENTS.md`, and `CLAUDE.md`. Invite Kenneth with the appropriate repo role if he will review or merge changes. Add branch protection or a ruleset requiring a pull request before changes reach `main`.

## 2. Vercel

1. Switch to Applod's Vercel team, then **Add New → Project → Import Git Repository**. If the repo is absent, grant the Vercel GitHub app access to this repository.
2. Select `joeagudelo-ship-it/Topnatch`. Keep **Root Directory** as repository root. The committed `vercel.json` sets Framework to Other, Build Command `node build.mjs`, Output Directory `dist`; verify those values in the import screen.
3. Deploy the initial `main` snapshot. This creates a separate Vercel URL; keep the ChatGPT Site link in use until the new one is checked.
4. Test the script, timing controls, section navigation, map, editing, export/import, and a mobile layout. Review the production Vercel URL and the current GPT Site side by side before sharing the new link. If the Vercel team is on Hobby, check plan eligibility for this Applod commercial project.
5. Git integration should create a preview for each feature branch / pull request; merge to `main` only after reviewing that preview.

## 3. ChatGPT / Codex

1. Connect the GitHub repo to Codex and authorize its repository access. Use Codex for branch edits and pull requests.
2. Start a Codex task with: `Read AGENTS.md and docs/PRODUCTION_CONTEXT.md. Work on a branch, run npm run check, show a PR and Vercel preview, and preserve confirmed client decisions.`
3. For changes on Claude's branch, ask Codex to review that PR rather than starting a competing change on `main`.

## 4. Claude Code with Opus 5.5

1. Connect the same GitHub repo to Claude Code on the web, or clone it locally and open the folder in Claude Code. Select **Opus 5.5** in Claude's model picker if your plan/account offers it.
2. Prompt: `Use the repository instructions in CLAUDE.md. Read docs/PRODUCTION_CONTEXT.md, make a new branch for the requested change, run npm run check, inspect the Vercel preview, and create a pull request. Show assumptions and timing impact. Do not edit Drive/Notion or merge to main.`
3. Refresh Claude's GitHub project knowledge if using the regular Claude project integration; that knowledge is context, while Claude Code performs edits.

## 5. GPT Sites fallback

The current ChatGPT Site remains unchanged at https://topnatch-script-rehearsal.joe-agudelo.chatgpt.site/. Its project metadata is retained in `.openai/hosting.json` for reference. GitHub→Vercel deploys do **not** automatically update GPT Sites. If the fallback needs the same later changes, ask ChatGPT to sync the reviewed GitHub version through the authenticated Sites publishing workflow.

## Release rule

One repository is the code source of truth. Claude and Codex propose branches; Joe reviews a Vercel preview; a merge publishes Vercel production. Keep the GPT Site available until Joe explicitly retires it.
