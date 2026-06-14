// ICS calendar feed for School Tasks.
//
// Public endpoint (calendar apps send no Supabase token) — deployed with
// `--no-verify-jwt` and `verify_jwt = false` in config.toml.
//
// GET /functions/v1/ics-feed?uid=<user.id>
//   → text/calendar feed of that user's not-completed cards that have an
//     effective due date. One VEVENT per card, all-day-ish reminder at 23:59
//     on the day BEFORE the due date.
//
// Effective due date (mirrors src/lib/dates.js — keep in lockstep):
//   • Auto-date columns 2/3/4 store due_date = null; the date is computed here
//     (2 Today/Due → today HKT, 3 Next School Day, 4 Subsequent School Day).
//   • Custom-date columns 1/5 use the stored due_date; null → no event.
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from Deno.env (auto-injected
// by Supabase — never set these manually).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- School-day date logic (mirror of src/lib/dates.js) ---------------------
// All dates are "YYYY-MM-DD" calendar strings. Day-of-week math uses UTC
// getters on a UTC-midnight Date so there is no local-tz drift. "Today" is HKT
// (UTC+8, no DST). School day = Mon–Fri; public holidays ignored.

const HKT_OFFSET_MS = 8 * 60 * 60 * 1000

function toDateString(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000)
}

function isWeekday(d: Date): boolean {
  const day = d.getUTCDay()
  return day >= 1 && day <= 5
}

function getTodayHKT(): string {
  return toDateString(new Date(Date.now() + HKT_OFFSET_MS))
}

function getNextSchoolDay(fromDate: string): string {
  let d = parseDate(fromDate)
  do {
    d = addDays(d, 1)
  } while (!isWeekday(d))
  return toDateString(d)
}

function getSubsequentSchoolDay(fromDate: string): string {
  return getNextSchoolDay(getNextSchoolDay(fromDate))
}

// Effective due date for a card: stored due_date if set, else the calculated
// date for auto-date columns 2/3/4, else null (cols 1/5 with no date).
function effectiveDueDate(
  columnId: number,
  dueDate: string | null,
  today: string,
): string | null {
  if (dueDate) return dueDate
  switch (columnId) {
    case 2:
      return today
    case 3:
      return getNextSchoolDay(today)
    case 4:
      return getSubsequentSchoolDay(today)
    default:
      return null
  }
}

// RFC 5545 text escaping for SUMMARY / DESCRIPTION values.
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n')
}

// "YYYY-MM-DD" → the day before, as "YYYYMMDD" (UTC calendar math, no tz drift).
function dayBeforeStamp(dueDate: string): string {
  const [y, m, d] = dueDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  const yyyy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

// Fold a content line at 75 octets per RFC 5545 (continuation lines start
// with a single space).
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let rest = line
  chunks.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length > 74) {
    chunks.push(' ' + rest.slice(0, 74))
    rest = rest.slice(74)
  }
  if (rest.length) chunks.push(' ' + rest)
  return chunks.join('\r\n')
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const uid = url.searchParams.get('uid')

  if (!uid) {
    return new Response('Missing uid query parameter', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Column names for DESCRIPTION (current column of each card).
  const { data: columns, error: colErr } = await supabase
    .from('columns')
    .select('id, name')

  if (colErr) {
    return new Response('Failed to load columns', { status: 500 })
  }
  const columnName = new Map<number, string>(
    (columns ?? []).map((c) => [c.id, c.name]),
  )

  // Auto-date columns (2/3/4) store a null due_date — their date is computed
  // below — so we can't filter on due_date here. Filter only on completion.
  const { data: cards, error: cardErr } = await supabase
    .from('cards')
    .select('id, title, column_id, due_date')
    .eq('user_id', uid)
    .is('completed_at', null)

  if (cardErr) {
    return new Response('Failed to load cards', { status: 500 })
  }

  const dtstamp =
    new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'PRODID:-//School Tasks//ICS Feed//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    'NAME:School Tasks',
    'X-WR-CALNAME:School Tasks',
  ]

  const today = getTodayHKT()

  for (const card of cards ?? []) {
    const dueDate = effectiveDueDate(card.column_id, card.due_date, today)
    if (!dueDate) continue // cols 1/5 with no date set → no event
    const stamp = dayBeforeStamp(dueDate)
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${card.id}@school-tasks`)
    lines.push(`DTSTAMP:${dtstamp}`)
    lines.push(`DTSTART:${stamp}T235900`)
    lines.push(`DTEND:${stamp}T235900`)
    lines.push(foldLine(`SUMMARY:${escapeText(card.title)}`))
    lines.push(
      foldLine(
        `DESCRIPTION:${escapeText(columnName.get(card.column_id) ?? '')}`,
      ),
    )
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  const body = lines.join('\r\n') + '\r\n'

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
})
