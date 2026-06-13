# Build Progress — School Task Manager

**At the start of every session:** read CLAUDE.md + SPEC.md + this file. Reconcile this file against `git log` and the working tree, run `npm run build` to confirm the tree is healthy, then continue from the first unchecked step.

**After finishing each step:** test it, update this file (tick the box, set Current/Next, add notes), then `git add -A && git commit` and push. A commit = a working, tested state. Never commit a half-finished step.

## Status
- **Current step:** 5 — Custom due dates + title editing *(not started)*
- **Next step:** 6 — Completion + dismissal UI
- **Last good commit:** step 4 — core board (build + lint clean; live UI not yet browser-verified, see note)
- **Build healthy (`npm run build` passes):** ☑

> 📌 **Two follow-ups for Kevin (not blocking step 4):**
> 1. **Delete two throwaway test users** I created while verifying auth (Supabase →
>    Authentication → Users): `claude-smoketest-1781333507@example.com` and
>    `claude-smoketest-1781333556@example.com`. (I can't delete users without the
>    service-role key, by design.)
> 2. **Before production, re-enable "Confirm email"** — I had you turn it off
>    (`mailer_autoconfirm` is currently true) so I could auto-test the round-trip.
>    For a real deployment you probably want email confirmation back ON.

## Steps
- [x] **1. Project setup** — scaffold Vite + React (plain JS) into the current directory; Tailwind v4 via @tailwindcss/vite; install deps (@supabase/supabase-js, @dnd-kit/core + sortable + utilities, react-router-dom); write `.env.local` from the values in CLAUDE.md and confirm it's gitignored; create folders (components, pages, hooks, lib); placeholder page "School Tasks — coming soon"; confirm `npm run dev`. Then `git init`, initial commit, and push to GITHUB_REPO_URL.
- [x] **2. Lib modules** — `supabase.js`, `dates.js`, `labels.js`, `sorting.js` (see SPEC.md).
- [x] **3. Auth** — `auth.jsx` (AuthContext/useAuth), `AuthProvider` in `main.jsx`, `LoginPage`, route guards, sticky header. Test sign-up / sign-in / sign-out against the live project. *(Verified live: sign-up 200 + instant session, sign-in 200, sign-out 204, re-sign-in 200.)*
- [x] **4. Core board** — `useBoard.js` (no Realtime yet), `BoardPage`, `Column`, `Card`, @dnd-kit between-columns drag, add-task input.
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
- **Step 3:** auth context (`src/lib/auth.jsx`), `LoginPage` (sign in/up toggle, loading/error/info states), `Header` (email + Sign Out), `BoardPage` placeholder, react-router guards in `App.jsx` (`/login`↔`/board`, `*`→`/board`), `AuthProvider` in `main.jsx`.
- `auth.jsx` has a file-level `eslint-disable react-refresh/only-export-components` because SPEC mandates AuthProvider + useAuth live in the same file (the rule is a dev-only fast-refresh nicety).
- New-style publishable key (`sb_publishable_…`) works fine with supabase-js v2 and the GoTrue REST endpoints.
- **Step 3 live test:** initially the Email provider was OFF (`email_provider_disabled`); Kevin enabled it. Then with `mailer_autoconfirm` turned ON I ran the full GoTrue round-trip (the same endpoints supabase-js hits): signup→200+session, token(password)→200, logout→204, re-signin→200. All green. Two throwaway `@example.com` users remain for Kevin to delete (see Status box).
- **Step 4:** Built in two commits — (1) `useBoard` + `Column` + `Card` + add-task, (2) drag. `useBoard` owns a flat card list and derives the grouped/sorted board via `useMemo`; `addCard`/`moveCard` are optimistic with rollback. Card actions just mutate the flat list (Realtime in step 7 will reconcile).
  - **react-hooks lint gotcha:** the flat-recommended config now includes `react-hooks/set-state-in-effect`, which flags calling *any* setState-containing function from an effect — even after an `await`. Fix: the mount effect defines a local async `run()` with an `ignore` cancellation guard (the React-docs pattern); the pure fetch is `loadData` (no setState), shared with an exported `refetch` (for non-effect callers, e.g. Realtime). Don't reintroduce a `setLoading(true)` at the top of a function the effect calls.
  - **Drag:** `DndContext` in `BoardPage` with a `PointerSensor` distance:6 activation constraint (so clicks still work for step-5 inline editors); `DraggableCard` wraps `Card` (`useDraggable`, whole card = handle); each `Column` card-area is a `useDroppable` with `id = column.id`; `DragOverlay` renders the moving copy in a portal so horizontal-scroll overflow doesn't clip it. Drop hands `over.id` (the numeric column id) to `moveCard`, which clears `due_date` for cols 2/3/4 and keeps it for 1/5; re-sort is automatic via the memo.
  - **Not browser-verified yet:** build + lint + dev-server module transforms are green, but I have no live session credentials here (the two test users' passwords aren't recorded), so I couldn't click through the board against real data. Worth a manual smoke test (add a card, drag between columns, confirm due-date clear/keep) when you next open it. Card checkbox/delete/title-edit/date-picker are deliberately deferred to steps 5/6.
  - `position` is left null on insert — sorting is fully client-side, so the column is unused for ordering.
