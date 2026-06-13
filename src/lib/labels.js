// Class labels are derived from the title at render time and NEVER stored.
// Order here is the canonical class priority order (CLAUDE.md):
//   1 AP Chem, 2 Individual Pursuits, 3 Spanish, 4 Seminar,
//   5 AP Lang, 6 AP Econ, 7 HPC, 8 Physics, 9 unrecognised.
// Cool colors: AP Chem, Individual Pursuits, Spanish, Seminar.
// Warm colors: AP Lang, AP Econ, HPC, Physics.

export const CLASSES = [
  { name: 'AP Chem', temp: 'cool', color: '#06b6d4' }, // cyan
  { name: 'Individual Pursuits', temp: 'cool', color: '#3b82f6' }, // blue
  { name: 'Spanish', temp: 'cool', color: '#6366f1' }, // indigo
  { name: 'Seminar', temp: 'cool', color: '#14b8a6' }, // teal
  { name: 'AP Lang', temp: 'warm', color: '#ef4444' }, // red
  { name: 'AP Econ', temp: 'warm', color: '#f97316' }, // orange
  { name: 'HPC', temp: 'warm', color: '#f59e0b' }, // amber
  { name: 'Physics', temp: 'warm', color: '#ec4899' }, // pink
]

// Ordered list of class names = priority order.
export const CLASS_PRIORITY = CLASSES.map((c) => c.name)

// Detect a class from the START of the title (case-insensitive). The match must
// end on a word boundary so "AP Chemistry" doesn't get tagged as "AP Chem".
// Returns the class object, or null if the title starts with no known class.
export function detectLabel(title) {
  if (!title) return null
  const lower = title.trim().toLowerCase()
  for (const cls of CLASSES) {
    const name = cls.name.toLowerCase()
    if (lower.startsWith(name)) {
      const next = lower[name.length]
      if (next === undefined || !/[a-z0-9]/.test(next)) return cls
    }
  }
  return null
}

// Priority index for sorting: 0–7 for a known class, 8 for unrecognised/none.
export function getPriorityIndex(label) {
  if (!label) return CLASS_PRIORITY.length
  const i = CLASS_PRIORITY.indexOf(label.name)
  return i === -1 ? CLASS_PRIORITY.length : i
}
