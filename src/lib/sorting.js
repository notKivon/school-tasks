import { detectLabel, getPriorityIndex } from './labels.js'

// due_date ascending, nulls last. due_date values are "YYYY-MM-DD" strings,
// so lexicographic comparison is also chronological.
function compareDueDate(a, b) {
  if (a.due_date === b.due_date) return 0
  if (!a.due_date) return 1
  if (!b.due_date) return -1
  return a.due_date < b.due_date ? -1 : 1
}

// Deterministic final tiebreaker so the order is stable across refetches.
function tiebreak(a, b) {
  const ca = a.created_at || ''
  const cb = b.created_at || ''
  if (ca !== cb) return ca < cb ? -1 : 1
  const ia = a.id || ''
  const ib = b.id || ''
  return ia < ib ? -1 : ia > ib ? 1 : 0
}

// Sort a column's cards per CLAUDE.md. Returns a new array (no mutation).
//   Columns 1 & 5: due_date ascending, nulls last.
//   Columns 2, 3, 4: class priority, then due_date ascending within a class.
export function sortCards(cards, columnId) {
  const arr = [...cards]
  const byPriority = columnId === 2 || columnId === 3 || columnId === 4

  arr.sort((a, b) => {
    if (byPriority) {
      const pa = getPriorityIndex(detectLabel(a.title))
      const pb = getPriorityIndex(detectLabel(b.title))
      if (pa !== pb) return pa - pb
    }
    const d = compareDueDate(a, b)
    if (d !== 0) return d
    return tiebreak(a, b)
  })

  return arr
}
