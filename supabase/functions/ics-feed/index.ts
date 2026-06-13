// ICS calendar feed for School Tasks.
//
// Public endpoint (calendar apps send no Supabase token) — deployed with
// `--no-verify-jwt` and `verify_jwt = false` in config.toml.
//
// GET /functions/v1/ics-feed?uid=<user.id>
//   → text/calendar feed of that user's cards that have a due_date and are
//     not completed. One VEVENT per card, all-day-ish reminder at 23:59 on
//     the day BEFORE the due date.
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from Deno.env (auto-injected
// by Supabase — never set these manually).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

  const { data: cards, error: cardErr } = await supabase
    .from('cards')
    .select('id, title, column_id, due_date')
    .eq('user_id', uid)
    .not('due_date', 'is', null)
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

  for (const card of cards ?? []) {
    const stamp = dayBeforeStamp(card.due_date)
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
