// Class labels are derived from the title at render time and NEVER stored.
// Order here is the canonical class priority order (CLAUDE.md):
//   1 AI&ML, 2 AP Calc BC, 3 (reserved), 4 AP Stats, 5 AP Gov,
//   6 Seng, 7 Seminar, 8 Spex, 9 AP Research, 10 unrecognised.
// Cool colors: AI&ML, AP Calc BC, (reserved), AP Stats.
// Warm colors: AP Gov, Seng, Seminar, Spex, AP Research.
//
// Slot 3 is an intentionally unnamed placeholder: it holds a priority position
// and a color for a class to be named later. Entries with an empty name are
// skipped when matching, so it can never match a title until it's filled in.
//
// `aliases` are extra spellings that map to the same class — the AP-less form
// ("Stats", "Gov"), short forms ("Calc", "AI"), and spacing variants. Matching
// is case-insensitive throughout. The `name` is what renders on the chip.

export const CLASSES = [
  { name: 'AI&ML', temp: 'cool', color: '#06b6d4', aliases: ['AI & ML', 'AI'] }, // cyan
  { name: 'AP Calc BC', temp: 'cool', color: '#3b82f6', aliases: ['AP Calc', 'Calc BC', 'Calc'] }, // blue
  { name: '', temp: 'cool', color: '#6366f1', aliases: [] }, // indigo — reserved
  { name: 'AP Stats', temp: 'cool', color: '#14b8a6', aliases: ['Stats'] }, // teal
  { name: 'AP Gov', temp: 'warm', color: '#ef4444', aliases: ['Gov'] }, // red
  { name: 'Seng', temp: 'warm', color: '#f97316', aliases: [] }, // orange
  { name: 'Seminar', temp: 'warm', color: '#f59e0b', aliases: [] }, // amber
  { name: 'Spex', temp: 'warm', color: '#f43f5e', aliases: [] }, // rose
  { name: 'AP Research', temp: 'warm', color: '#ec4899', aliases: ['Research'] }, // pink
]

// Ordered list of class names = priority order.
export const CLASS_PRIORITY = CLASSES.map((c) => c.name)

// Every spelling of a class, lowercased once at module load and sorted
// longest-first so "AP Calc BC pset" matches the full "AP Calc BC" rather than
// stopping at the shorter "Calc". Classes stay in priority order.
const MATCHERS = CLASSES.map((cls) => ({
  cls,
  forms: [cls.name, ...cls.aliases]
    .filter(Boolean) // drops the unnamed placeholder's empty name
    .map((form) => form.toLowerCase())
    .sort((a, b) => b.length - a.length),
}))

// Match a class against the START of the title (case-insensitive), returning
// both the class and how many characters it matched — callers need the length
// because an alias ("Calc") is rarely the same length as the name ("AP Calc
// BC"). The match must end on a word boundary, so "AP Statistics" isn't tagged
// as "AP Stats" and "aircraft" isn't tagged as "AI". Null if nothing matches.
export function matchClass(title) {
  if (!title) return null
  const lower = title.trimStart().toLowerCase()
  for (const { cls, forms } of MATCHERS) {
    for (const form of forms) {
      if (!lower.startsWith(form)) continue
      const next = lower[form.length]
      if (next === undefined || !/[a-z0-9]/.test(next)) return { cls, length: form.length }
    }
  }
  return null
}

// The class a title belongs to, or null. Chip + border color come from this.
export function detectLabel(title) {
  const match = matchClass(title)
  return match ? match.cls : null
}

// The title to *display* on a card: the leading class name is stripped off
// (it's shown as the chip + border instead), so "AP Stats problems" renders as
// "problems". We strip whatever was actually matched, so "Stats problems" and
// "AP Stats problems" both render as "problems". The full title is always what's
// stored, sorted on, and edited — this only affects the read-only card text.
// After the class name we also eat a leading separator (":", "-", "–", "—", "&")
// and surrounding spaces. If stripping would leave nothing (the title is *only*
// a class name), keep the full title so the card never renders blank.
export function getDisplayTitle(title) {
  const match = matchClass(title)
  if (!match) return title
  const rest = title
    .trimStart()
    .slice(match.length)
    .replace(/^[\s:&–—-]+/, '')
  return rest || title
}

// Priority index for sorting: 0–8 for a known class, 9 for unrecognised/none.
export function getPriorityIndex(label) {
  if (!label) return CLASS_PRIORITY.length
  const i = CLASS_PRIORITY.indexOf(label.name)
  return i === -1 ? CLASS_PRIORITY.length : i
}
