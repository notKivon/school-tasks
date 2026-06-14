# School Task Manager — Build Spec

Implementation detail for each part. The core domain rules (columns, labels, sorting, drag behaviour, secrets, schema) live in **CLAUDE.md** — follow those exactly; this file doesn't restate them. The step order and live status are in **PROGRESS.md**.

## Frontend modules
- `src/lib/supabase.js` — initialise + export the client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/lib/dates.js` — `getTodayHKT()`, `getNextSchoolDay(fromDate)`, `getSubsequentSchoolDay(fromDate)`, `formatDisplayDate(date)` (e.g. "Mon 9 Jun"), `getColumnDueDate(columnId)` (auto date for cols 2/3/4; null for cols 1/5). Mirror the server-side school-day logic (next Mon–Fri; weekday after next).
- `src/lib/labels.js` — `CLASSES` (all 8: name, color, warmOrCool); `detectLabel(title)` (matches the start of the title, case-insensitive; returns the class object or null); `CLASS_PRIORITY`; `getPriorityIndex(label)` (0–7, or 8 for none).
- `src/lib/sorting.js` — `sortCards(cards, columnId)` per the rules in CLAUDE.md.
- `src/lib/auth.jsx` — `AuthContext` + `useAuth` exposing `user`, `session`, `signIn`, `signUp`, `signOut`.
- `src/hooks/useBoard.js` — fetch the 5 columns + the current user's cards; group by `column_id`; apply `sortCards()`; return columns (each with sorted cards + calculated due date), `loading`, `error`. (Realtime is added in its own step.)
- Components/pages — `LoginPage` (`/login`, centered dark form, sign in + sign up), `BoardPage` (`/board`, horizontal-scrolling 5-column layout), `Column` (title, calculated due date below it in muted text, card list, "Add task" button), `Card` (label border + chip, title, due-date badge on cols 1/5 with "Set date" when null, completion checkbox, delete-on-hover trash), sticky header with my email + Sign Out.
- Folders: `src/components`, `src/pages`, `src/hooks`, `src/lib`.

## Feature behaviours
- **Auth + guards:** unauthenticated → `/login`; authenticated on `/login` → `/board`. Wrap the app in `AuthProvider` in `main.jsx`.
- **Add task:** inline input; on Enter/blur save + auto-detect label. Cols 2/3/4 set `due_date` to the calculated date; cols 1/5 leave null. Escape cancels.
- **Custom due dates (cols 1/5 only):** clicking "Set date"/the badge opens an inline native date picker; on confirm save + re-sort; "×" clears it (null). Cols 2/3/4 dates aren't editable and show no per-card date.
- **Title editing:** click a title to edit inline; save on Enter/blur, re-run `detectLabel`, update chip + border immediately; Escape cancels.
- **Completion:** checking sets `completed_at = now()` + completed style (strikethrough, reduced opacity, muted label). **Column 2 only:** after ~700ms fade + slide out of view (stays in the DB until the nightly dismiss cron — 00:01 HKT). Other columns keep it visible in the completed style. A per-column "Show completed" toggle (hidden by default) reveals completed cards at the bottom in muted style (re-revealing faded col-2 cards). Unchecking restores full style.
- **Realtime (its own step):** subscribe to INSERT/UPDATE/DELETE on `cards` filtered to the current user; update state and re-sort affected columns; clean up on unmount. DELETE makes the nightly dismiss cron (00:01 HKT) dismissal appear without a refresh.
- **Live niceties:** column due-date labels recalculate + re-sort at the next HKT midnight without refresh (a `useEffect` timer). "Overdue" red badge on col-2 cards whose `due_date` is before today. Keyboard: `N` focuses "Add task" in the first column; `Escape` cancels open inputs.
- **Toasts:** minimal, no library — bottom-right, success/error/info, auto-dismiss after 3s. For card saved, deleted, date set, ICS link copied, sync error.

## ICS calendar feed (Edge Function)
Create `supabase/functions/ics-feed/index.ts` (Deno/TypeScript). Accept a `uid` query param; read `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env` (auto-injected — don't set these); query that user's `completed_at IS NULL` cards, then compute each card's **effective due date** and return a valid ICS feed:
- **Effective due date** (mirror `src/lib/dates.js`, kept in lockstep): auto-date columns 2/3/4 store `due_date = null`, so compute it server-side — col 2 → today (HKT), col 3 → next school day, col 4 → subsequent school day. Custom columns 1/5 use the stored `due_date`; a card with no effective date (cols 1/5 with null) is skipped. This is why cards in the auto-date columns now appear in the feed even though their `due_date` row is null.
- One `VEVENT` per card. Event date = the **day before** the due date (`due_date - 1 day`) at **23:59**: `DTSTART` and `DTEND` both `[due_date - 1 day]T235900`.
- `SUMMARY` = card title. `DESCRIPTION` = current column name. `UID` = card uuid + `@school-tasks`.
- `VCALENDAR` headers: `PRODID`, `VERSION:2.0`, `CALSCALE:GREGORIAN`, `REFRESH-INTERVAL;VALUE=DURATION:PT1H`. Response header `Content-Type: text/calendar; charset=utf-8`.

Public endpoint (calendar apps send no Supabase token): set `verify_jwt = false` in `supabase/config.toml` and deploy with the flag:

`supabase functions deploy ics-feed --project-ref <PROJECT_REF> --no-verify-jwt`

(Run `supabase init` first if the project structure doesn't exist; `supabase login` is already done.) Without `--no-verify-jwt` the feed returns 401. *If I tell you I've disabled Supabase's legacy keys, switch the function to read a custom secret named `SB_SECRET_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`, and tell me to set it with `supabase secrets set SB_SECRET_KEY=<my secret key> --project-ref <PROJECT_REF>`.*

In the app: a "Calendar" button in the header opens a popover with the ICS URL (`<SUPABASE_URL>/functions/v1/ics-feed?uid=<user.id>`), a "Copy link" button with a "Copied!" confirmation, and subscribe instructions for Google Calendar (Other calendars → From URL) and Apple Calendar (File → New Calendar Subscription).

## PWA
Install `vite-plugin-pwa`; configure in `vite.config.js`. Manifest: name "School Tasks", short name "Tasks", dark theme/background, `display: standalone`, start URL `/board`. SVG-based 192×192 and 512×512 icons (dark background, white checklist icon). Workbox: cache-first app shell, network-first for Supabase calls. A subtle "Install App" button when `beforeinstallprompt` fires, remembering dismissal in `localStorage`. Offline shows the cached board with an "Offline" banner, not a blank screen.

## Manual finish (the final step — I do this, not you)
Import the repo into Vercel (one click since GitHub is connected); add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel → Settings → Environment Variables; deploy. Then once live, set Supabase **Authentication → URL Configuration** (Site URL + `https://<my-domain>/**` redirect). If adding a custom domain: Vercel domain + DNS records.
