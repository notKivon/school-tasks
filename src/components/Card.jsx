import { detectLabel } from '../lib/labels.js'
import { formatDisplayDate } from '../lib/dates.js'

// A single task card. The class label is derived from the title at render time
// (never stored): a labelled card gets a colored chip + left border, an
// unlabelled one a neutral gray border. Custom-date columns (1/5) show a
// per-card due-date badge ("Set date" when null); auto-date columns (2/3/4)
// don't. Completion, title editing and the date picker arrive in later steps.
export default function Card({ card, isCustomDateColumn, dragHandleProps }) {
  const label = detectLabel(card.title)
  const borderColor = label ? label.color : '#475569' // slate-600

  return (
    <div
      className="rounded-lg border-l-4 bg-slate-800 p-3 shadow-sm"
      style={{ borderLeftColor: borderColor }}
      {...dragHandleProps}
    >
      {label && (
        <span
          className="mb-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
          style={{ backgroundColor: label.color }}
        >
          {label.name}
        </span>
      )}
      <p className="text-sm text-slate-100">{card.title}</p>
      {isCustomDateColumn && (
        <span className="mt-2 inline-block rounded bg-slate-700/60 px-1.5 py-0.5 text-[11px] text-slate-300">
          {formatDisplayDate(card.due_date) || 'Set date'}
        </span>
      )}
    </div>
  )
}
