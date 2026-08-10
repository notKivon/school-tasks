// Class labels are derived from the title at render time and NEVER stored.
// Order here is the canonical class priority order (CLAUDE.md):
//   1 AI & Machine Learning, 2 AP Calculus BC, 3 (reserved), 4 AP Statistics,
//   5 AP Government & Politics, 6 Senior English, 7 Seminar, 8 SPEX,
//   9 AP Capstone Research, 10 unrecognised.
// Cool colors: AI & Machine Learning, AP Calculus BC, (reserved), AP Statistics.
// Warm colors: AP Government & Politics, Senior English, Seminar, SPEX,
// AP Capstone Research.
// Seminar and SPEX deliberately share amber — they're told apart by the chip
// text, not the color, so colors here are not unique per class.
//
// Slot 3 is an intentionally unnamed placeholder: it holds a priority position
// and a color for a class to be named later. Entries with an empty name are
// skipped when matching, so it can never match a title until it's filled in.
//
// `name` is the full display name — the only thing that renders on the chip.
// `aliases` are the other spellings that trigger it: the short forms actually
// typed ("Stats", "Calc", "AI", "Seng"), the AP-less long form ("Statistics",
// "Capstone Research"), and spacing variants. Matching is case-insensitive
// throughout, so a name only needs one casing here ("SPEX" catches "spex").

export const CLASSES = [
  {
    name: 'AI & Machine Learning',
    temp: 'cool',
    color: '#06b6d4', // cyan
    aliases: ['AI&ML', 'AI & ML', 'AI'],
  },
  {
    name: 'AP Calculus BC',
    temp: 'cool',
    color: '#3b82f6', // blue
    aliases: ['Calculus BC', 'AP Calc BC', 'AP Calc', 'Calc BC', 'Calc'],
  },
  { name: '', temp: 'cool', color: '#6366f1', aliases: [] }, // indigo — reserved
  {
    name: 'AP Statistics',
    temp: 'cool',
    color: '#14b8a6', // teal
    aliases: ['Statistics', 'AP Stats', 'Stats'],
  },
  {
    name: 'AP Government & Politics',
    temp: 'warm',
    color: '#ef4444', // red
    aliases: ['Government & Politics', 'AP Gov', 'Gov'],
  },
  {
    name: 'Senior English',
    temp: 'warm',
    color: '#f97316', // orange
    aliases: ['Seng'],
  },
  { name: 'Seminar', temp: 'warm', color: '#f59e0b', aliases: [] }, // amber
  { name: 'SPEX', temp: 'warm', color: '#f59e0b', aliases: [] }, // amber — shared with Seminar
  {
    name: 'AP Capstone Research',
    temp: 'warm',
    color: '#ec4899', // pink
    aliases: ['Capstone Research', 'AP Research', 'Research'],
  },
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

// Escape hatch: a title starting with a backslash is force-unlabelled, so
// "\Calc trick" gets no chip and renders as "Calc trick". Use it when a task
// genuinely starts with a class word but isn't for that class. The backslash is
// part of the stored title (and so is visible when editing) but never displayed
// on the card. Escaped cards sort as unrecognised, i.e. last within a column.
export const LABEL_ESCAPE = '\\'

export function isEscaped(title) {
  return !!title && title.trimStart().startsWith(LABEL_ESCAPE)
}

// Match a class against the START of the title (case-insensitive), returning
// both the class and how many characters it matched — callers need the length
// because an alias ("Calc") is rarely the same length as the name ("AP Calc
// BC"). The match must end on a word boundary, so "AP Statistics" isn't tagged
// as "AP Stats" and "aircraft" isn't tagged as "AI". Null if nothing matches.
export function matchClass(title) {
  if (!title || isEscaped(title)) return null
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
// a class name), keep the full title so the card never renders blank. An
// escaped title drops its backslash here and is otherwise shown verbatim.
export function getDisplayTitle(title) {
  if (isEscaped(title)) {
    const rest = title.trimStart().slice(LABEL_ESCAPE.length).trimStart()
    return rest || title
  }
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
