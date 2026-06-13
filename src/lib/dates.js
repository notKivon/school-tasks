// All dates are handled as "YYYY-MM-DD" calendar strings (matching the
// Postgres `date` column). Day-of-week math uses UTC getters on a UTC-midnight
// Date so there is never any local-timezone drift. "Today" is computed in HKT
// (UTC+8, no DST) per the project rules.

const HKT_OFFSET_MS = 8 * 60 * 60 * 1000

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Build a "YYYY-MM-DD" string from a Date's UTC fields.
function toDateString(d) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Parse "YYYY-MM-DD" into a Date at UTC midnight.
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function addDays(d, n) {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000)
}

// Mon–Fri only (getUTCDay: 0 = Sun … 6 = Sat). Public holidays ignored.
function isWeekday(d) {
  const day = d.getUTCDay()
  return day >= 1 && day <= 5
}

// Today's calendar date in HKT, as "YYYY-MM-DD".
export function getTodayHKT() {
  return toDateString(new Date(Date.now() + HKT_OFFSET_MS))
}

// Next Mon–Fri strictly after `fromDate` ("YYYY-MM-DD").
export function getNextSchoolDay(fromDate) {
  let d = parseDate(fromDate)
  do {
    d = addDays(d, 1)
  } while (!isWeekday(d))
  return toDateString(d)
}

// The weekday after the next weekday (i.e. two school days out).
export function getSubsequentSchoolDay(fromDate) {
  return getNextSchoolDay(getNextSchoolDay(fromDate))
}

// "Mon 9 Jun" — accepts a "YYYY-MM-DD" string; null/empty → null.
export function formatDisplayDate(dateStr) {
  if (!dateStr) return null
  const d = parseDate(dateStr)
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

// Auto-calculated due date for the auto-date columns; null for custom columns.
//   2 Today/Due, 3 Next School Day, 4 Subsequent School Day
//   1 Upcoming Tests, 5 Later → null (user-set)
export function getColumnDueDate(columnId) {
  const today = getTodayHKT()
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
