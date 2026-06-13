# Build Progress — School Task Manager

**At the start of every session:** read CLAUDE.md + SPEC.md + this file. Reconcile this file against `git log` and the working tree, run `npm run build` to confirm the tree is healthy, then continue from the first unchecked step.

**After finishing each step:** test it, update this file (tick the box, set Current/Next, add notes), then `git add -A && git commit` and push. A commit = a working, tested state. Never commit a half-finished step.

## Status
- **Current step:** 8 — ICS Edge Function *(not started)*
- **Next step:** 9 — PWA
- **Last good commit:** step 7 — Realtime (build + lint clean; **browser verification of 5–7 in progress** — see step-7 notes)
- **Build healthy (`npm run build` passes):** ☑

> 📌 **Follow-up for Kevin (not blocking):**
> 1. **Delete one new test user** from the step-4 browser smoke test:
>    `claude-smoke-1781334775@example.com` (I can't delete users without the
>    service-role key). Its cards were already cleaned up.
> 2. **Before production, re-enable "Confirm email"** — I had you turn it off
>    (`mailer_autoconfirm` is currently true) so I could auto-test the round-trip.
>    For a real deployment you probably want email confirmation back ON.

## Steps
- [x] **1. Project setup** — scaffold Vite + React (plain JS) into the current directory; Tailwind v4 via @tailwindcss/vite; install deps (@supabase/supabase-js, @dnd-kit/core + sortable + utilities, react-router-dom); write `.env.local` from the values in CLAUDE.md and confirm it's gitignored; create folders (components, pages, hooks, lib); placeholder page "School Tasks — coming soon"; confirm `npm run dev`. Then `git init`, initial commit, and push to GITHUB_REPO_URL.
- [x] **2. Lib modules** — `supabase.js`, `dates.js`, `labels.js`, `sorting.js` (see SPEC.md).
- [x] **3. Auth** — `auth.jsx` (AuthContext/useAuth), `AuthProvider` in `main.jsx`, `LoginPage`, route guards, sticky header. Test sign-up / sign-in / sign-out against the live project. *(Verified live: sign-up 200 + instant session, sign-in 200, sign-out 204, re-sign-in 200.)*
- [x] **4. Core board** — `useBoard.js` (no Realtime yet), `BoardPage`, `Column`, `Card`, @dnd-kit between-columns drag, add-task input.
- [x] **5. Custom due dates + title editing** — cols 1/5 date picker + clear; inline title edit with live label update.
- [x] **6. Completion + dismissal UI** — checkbox, completed style, col-2 fade-out, "Show completed" toggle.
- [x] **7. Realtime** — add the `cards` subscription to `useBoard.js` (INSERT/UPDATE/DELETE, filtered to me, re-sort, cleanup).
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
  - `position` is left null on insert — sorting is fully client-side, so the column is unused for ordering.
  - **Browser-verified (Playwright, live project) — PASS.** Created a fresh user, seeded two dated cards via REST (the step-5 date picker doesn't exist yet, so this is the only way to test a *non-null* custom date). Confirmed: 5 columns render in order with correct auto-dates (Today/Due = today even on a weekend; Next/Subsequent = next weekdays); add-task auto-detects the label (added "Spanish vocab quiz" → indigo Spanish chip + left border #6366f1); **drag clear** — "AP Chem Quiz" col1→col2 cleared due_date 2026-06-20 → null in the DB and dropped its per-card date badge; **drag keep** — "Physics reading" col5→col1 kept due_date 2026-06-25 in the DB and still shows the "Thu 25 Jun" badge. No console errors. Test cards deleted afterward; the test user remains for Kevin to delete (see Status box).
- **Step 5:** Added optimistic `updateCard(cardId, patch)` to `useBoard` (same rollback pattern as `moveCard`); exported alongside `addCard`/`moveCard`. Threaded `onUpdateCard` through `BoardPage → Column → DraggableCard → Card`.
  - **Title edit:** click the title `<p>` → controlled inline `<input>`; commit on blur, Enter blurs to commit, Escape sets a `cancelledRef` then blurs (so the blur-commit no-ops). Empty/unchanged titles don't write. The class chip + left border update live for free because `detectLabel(card.title)` runs at render and the label is never stored.
  - **Date (cols 1/5 only):** the badge is now a button → opens an inline native `<input type="date">` (autofocus + `showPicker()` in an effect, wrapped in try/catch for browsers without it); commit on change, blur closes. A separate "×" clears to null. `commitDate('')` also maps to null.
  - **dnd-kit vs. inline editors:** every editor (title input, date input, date/clear buttons) has `onPointerDown={(e) => e.stopPropagation()}` so the wrapping DraggableCard's drag listeners don't hijack typing or the picker. The existing PointerSensor `distance:6` constraint already lets a plain click through to open an editor. Removed the now-dead `dragHandleProps` param from `Card` (drag has always lived on the DraggableCard wrapper).
  - Build + lint clean. **Browser verification batched to end of session (5–7 together).**
- **Step 6:** Completion via `onUpdateCard(id, { completed_at })` (optimistic; same rollback path). Checkbox top-right of each card (`onPointerDown` stop so dnd-kit ignores it). Completed style: card `opacity-70`, title `line-through text-slate-500`, label chip + left border drop to neutral gray (`#475569`) — colour returns on uncheck since the label is render-derived.
  - **Layout/animation interpretation (documented deviation):** `Column` splits its sorted cards into `active` (no `completed_at`) on top and `completed` at the bottom, rendered in ONE keyed list (`[...active, ...completed]`) so a card moving between groups keeps its DOM node and the collapse transition can play. Each card is wrapped in a `Collapsible` using the grid `1fr→0fr` trick (700ms) — the spacing padding lives *inside* the collapsing region, so a hidden card leaves no gap (replaced the old `gap-2` with per-card `pb-2`).
  - `showCompleted` is per-column state defaulting to `!isCol2`: **col 2 hides completed by default** (so checking a card there fades + slides it out, ~700ms), **all other columns show completed by default** in muted style ("keep it visible"). The "Show completed (N)" / "Hide completed" toggle (rendered whenever a column has ≥1 completed card) collapses/re-reveals that group — this is the "re-revealing faded col-2 cards" behaviour. *SPEC says the toggle is "hidden by default"; I read that as describing col 2 (the highlighted case) and made the toggle uniform across columns with a per-column default, rather than hiding completed cards in the non-col-2 columns where SPEC also says to keep them visible.*
  - Cards aren't deleted on completion — they stay in the DB for the 02:15 `dismiss_completed_cards` cron; DELETE will surface via Realtime (step 7).
  - Build + lint clean. **Browser verification batched to end of session (5–7 together).**
- **Step 7:** Single `cards-changes` channel in `useBoard`, `event: '*'`, `filter: user_id=eq.<me>`, `removeChannel` on unmount. Handler updates the flat list by id (INSERT adds w/ existence guard, UPDATE replaces, DELETE removes by `old.id`); the board memo re-sorts affected columns for free. `addCard` now drops the temp row **and** any realtime echo of the real row before re-adding the canonical row, so a fast self-echo can't duplicate.
  - `set-state-in-effect` lint rule does NOT fire here — the `setCards` lives in the realtime callback (an external subscription handler), not in the effect body, so it's the legitimate pattern.
  - **DELETE filter caveat:** the `user_id=eq` filter on DELETE events only works if `cards` has `REPLICA IDENTITY FULL` (otherwise the old record carries just the PK and the filter can't match). DB is "already created — don't migrate", and RLS already scopes realtime to the owner, so I left the filter as SPEC asks; if cron DELETEs don't appear live in the browser test, that's the likely cause (a DB-side setting, out of frontend scope) — noted for Kevin.
  - **Verify-harness notes (not app issues):** (1) the board is wider than a 1280px viewport (5×w-72 columns), so a drag onto the off-screen rightmost column silently no-ops in automation — widen the viewport (used 1680px) to drag across the whole board. (2) zsh has a reserved read-only integer `$UID`; don't name a shell var `UID` when scripting REST calls (assigning a uuid string to it throws "bad math expression"). Playwright was installed only for this test and uninstalled after; the working tree is unchanged.
