# Project: School Task Manager

Personal kanban board for school tasks across 5 fixed columns. Tasks are auto-labelled by class, sorted by priority, shift between columns automatically as due dates approach, and are subscribable as a read-only calendar feed. One user per account, dark theme, installable PWA.

This file loads every session. The full implementation breakdown is in **SPEC.md**; the live build checklist and "where to resume" is in **PROGRESS.md**. **Read all three at the start of every session.**

## Tech stack
- React + Vite + plain JavaScript (no TypeScript) + Tailwind CSS v4 via the @tailwindcss/vite plugin (plugin in `vite.config.js` + `@import "tailwindcss";` in the main CSS file; no `tailwind.config.js`, no PostCSS, no autoprefixer).
- Drag & drop: @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities. Routing: react-router-dom. Client: @supabase/supabase-js.
- Backend (already provisioned): Supabase — Postgres + RLS + Realtime + Edge Functions (Deno/TypeScript) + pg_cron.
- Deployment: Vercel (frontend), Supabase (Edge Function).

## Code rules
- Plain JS on the frontend (the Edge Function is the only TypeScript, on Deno).
- Functional components + hooks; ~150 lines/file max, split when larger.
- Loading + error states on every data-fetching component.
- Optimistic UI for all card actions, with rollback + an error toast on failure.
- Times stored as UTC; displayed in HKT (UTC+8, no DST).
- Ask before deleting any file.

## Core domain logic (must match exactly — do not drift)

### The 5 fixed columns (never created/deleted by users)
1. Upcoming Tests — custom due date, user-set
2. Today / Due — due date always = today (auto)
3. Next School Day — due date always = next Mon–Fri (auto)
4. Subsequent School Day — due date always = the weekday after the next weekday (auto)
5. Later — custom due date, user-set

School day = Mon–Fri only; public holidays ignored.

### Class labels (auto-detected from the START of the title, case-insensitive)
- Cool colors: AP Chem, Individual Pursuits, Spanish, Seminar
- Warm colors: AP Lang, AP Econ, HPC, Physics
- No label if the title doesn't start with a recognised class name.

The label is derived from the title at render time — **never stored** — so editing a title updates the chip + border live. Labelled cards show a colored chip + a left border in the label color; unlabelled cards get a neutral gray border.

### Sorting (client-side; no manual reordering within a column)
- Columns 1 & 5: by `due_date` ascending; nulls last.
- Columns 2, 3, 4: by class priority, then `due_date` ascending within a class. Priority: 1 AP Chem, 2 Individual Pursuits, 3 Spanish, 4 Seminar, 5 AP Lang, 6 AP Econ, 7 HPC, 8 Physics, 9 unrecognised.

Drag & drop moves cards between columns only.

### Due-date behaviour on drag
- Dropped on columns 2/3/4 (auto-date): clear `due_date` (store null); the card adopts the column's calculated date.
- Dropped on columns 1/5 (custom-date): keep `due_date` (null shows "Set date").
- Re-sort affected columns after every drop.

## Secrets (strict)
- `.env.local` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (= the publishable key). Confirm `.env.local` is gitignored.
- The Edge Function reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env` (both auto-injected by Supabase). Never hard-code a key; never create a secret whose name starts with the reserved `SUPABASE_` prefix; never put any secret key in the repo or the browser bundle. Verify the production bundle contains no secret.

## Database (already created — build to match; never recreate or migrate)
- `columns(id int PK, name text, position int)` — 5 fixed rows as above.
- `cards(id uuid PK default gen_random_uuid(), user_id uuid → auth.users not null, column_id int → columns not null, title text not null, description text, due_date date, completed_at timestamptz, position int, created_at timestamptz default now())`.
- RLS: `columns` readable by authenticated; `cards` owner-only CRUD (`auth.uid() = user_id`). Realtime is enabled on `cards`. `shift_cards()`, `dismiss_completed_cards()`, the school-day functions, and the two cron jobs already run server-side — the frontend just reacts to the resulting Realtime changes.

## Project values
```
PROJECT_REF     = qrtlyvdfqoorjfisflrl
SUPABASE_URL    = https://qrtlyvdfqoorjfisflrl.supabase.co
PUBLISHABLE_KEY = sb_publishable_Ugjc98koSAvvRuJceBiR6g_gMg7jxPp
GITHUB_REPO_URL = https://github.com/notKivon/school-tasks.git
```
These are non-secret — the publishable key ships to the browser regardless. If you'd rather not commit them, delete this block and paste the values in your first-session prompt instead. **Never put the secret key here.**

## Working agreement (multi-session build)
- Build in the order in PROGRESS.md, one step at a time.
- **After finishing each step:** test it, update PROGRESS.md (tick the box, set Current/Next, note any decisions or gotchas), then `git add -A && git commit` and push. A commit must always be a working, tested state — never commit a half-finished step.
- **At the start of every session:** read CLAUDE.md + SPEC.md + PROGRESS.md; reconcile PROGRESS.md against `git log` and the actual files; run `npm run build` (and `npm run dev`) to confirm the tree is healthy before continuing. If they disagree, trust git + the working tree over PROGRESS.md.
- Only stop to ask me when: a command needs approval, you hit an error you can't resolve after a real attempt, or you reach the final hand-back step (Vercel + domain).
