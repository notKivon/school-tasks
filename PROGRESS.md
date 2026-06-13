# Build Progress — School Task Manager

**At the start of every session:** read CLAUDE.md + SPEC.md + this file. Reconcile this file against `git log` and the working tree, run `npm run build` to confirm the tree is healthy, then continue from the first unchecked step.

**After finishing each step:** test it, update this file (tick the box, set Current/Next, add notes), then `git add -A && git commit` and push. A commit = a working, tested state. Never commit a half-finished step.

## Status
- **Current step:** 3 — Auth *(not started)*
- **Next step:** 4 — Core board
- **Last good commit:** step 2 — lib modules
- **Build healthy (`npm run build` passes):** ☑

## Steps
- [x] **1. Project setup** — scaffold Vite + React (plain JS) into the current directory; Tailwind v4 via @tailwindcss/vite; install deps (@supabase/supabase-js, @dnd-kit/core + sortable + utilities, react-router-dom); write `.env.local` from the values in CLAUDE.md and confirm it's gitignored; create folders (components, pages, hooks, lib); placeholder page "School Tasks — coming soon"; confirm `npm run dev`. Then `git init`, initial commit, and push to GITHUB_REPO_URL.
- [x] **2. Lib modules** — `supabase.js`, `dates.js`, `labels.js`, `sorting.js` (see SPEC.md).
- [ ] **3. Auth** — `auth.jsx` (AuthContext/useAuth), `AuthProvider` in `main.jsx`, `LoginPage`, route guards, sticky header. Test sign-up / sign-in / sign-out against the live project.
- [ ] **4. Core board** — `useBoard.js` (no Realtime yet), `BoardPage`, `Column`, `Card`, @dnd-kit between-columns drag, add-task input.
- [ ] **5. Custom due dates + title editing** — cols 1/5 date picker + clear; inline title edit with live label update.
- [ ] **6. Completion + dismissal UI** — checkbox, completed style, col-2 fade-out, "Show completed" toggle.
- [ ] **7. Realtime** — add the `cards` subscription to `useBoard.js` (INSERT/UPDATE/DELETE, filtered to me, re-sort, cleanup).
- [ ] **8. ICS Edge Function** — `index.ts`, `verify_jwt = false` in `config.toml`, deploy with `--no-verify-jwt`, Calendar header button + popover.
- [ ] **9. PWA** — vite-plugin-pwa, manifest, icons, workbox, install prompt, offline banner.
- [ ] **10. Polish + build** — optimistic-UI audit (instant update + rollback toast everywhere), toast system, midnight re-sort, overdue badge, keyboard shortcuts; `npm run build` clean; `npm run preview` works; verify no secret key in the bundle.
- [ ] **11. Hand back to me (manual)** — Vercel import + env vars + deploy; Supabase Auth URL config; custom domain + DNS. **Stop and give me the runbook — don't attempt these yourself.**

## Notes / decisions / gotchas
*(Record anything future-you needs: deviations from SPEC.md, tricky bits, anything left half-done and why, commands that needed approval, etc.)*
- **Step 1:** `.env.local` and `supabase/config.toml` already existed in the repo before scaffolding — left them as-is. Scaffolded Vite into `_scaffold/`, moved contents to root, removed temp folder.
- Vite 8 / React 19 / Tailwind v4.3 / @tailwindcss/vite. No `tailwind.config.js`, no PostCSS (per CLAUDE.md). Tailwind imported via `@import "tailwindcss";` in `src/index.css`.
- `.gitignore`: `*.local` already covers `.env.local`. Added `.claude/settings.local.json` (local permissions — not committed).
- Empty `src/{components,pages,hooks,lib}` folders kept in git via `.gitkeep`.
- Dev server: port 5173 was occupied on this machine during testing; vite auto-bumped to 5174. App verified on a fixed port (200 + correct `<title>`).
- README.md is still the default Vite scaffold readme (harmless; can replace during polish).
- **Step 2:** All four lib modules built and unit-smoke-tested (25 assertions, all pass) for school-day math, label detection (with word-boundary guard so "AP Chemistry" ≠ "AP Chem"), priority, and sorting.
- Date convention: everything is "YYYY-MM-DD" calendar strings (matches the Postgres `date` column); day-of-week math via UTC getters on UTC-midnight Dates → no local-tz drift; "today" computed in HKT (UTC+8).
- `getSubsequentSchoolDay = getNextSchoolDay(getNextSchoolDay(x))` ("weekday after the next weekday").
- `sortCards` is pure (returns a new array) and has a deterministic created_at→id tiebreaker so order is stable across refetches.
- Class colors chosen now (cool=cyan/blue/indigo/teal, warm=red/orange/amber/pink); stored as hex on each CLASSES entry for chip + left border in later steps.
- lib modules aren't imported anywhere yet, so they're tree-shaken out of the build — they enter the bundle from step 3+.
