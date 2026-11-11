import Icon from './Icon.jsx'
import { formatDisplayDate } from '../lib/dates.js'

// Smooth height+fade collapse via the grid 1fr→0fr trick. The slot's padding
// (the card gap + room for focus rings) lives inside the collapsing region, so
// a hidden card leaves no gap. The 700ms transition is the col-2 "fade + slide
// out of view" on completion. A collapsed card is inert (not focusable).
export function CardSlot({ collapsed, children }) {
  return (
    <div className={`card-slot ${collapsed ? 'is-collapsed' : ''}`} inert={collapsed}>
      <div>
        <div>{children}</div>
      </div>
    </div>
  )
}

const AUTO_DATE = new Set([2, 3, 4])

// Full weekday name of a "YYYY-MM-DD" date ("Friday").
function weekdayName(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    timeZone: 'UTC',
  })
}

// What an empty column says: auto-date columns name the day they cover.
export function EmptyColumn({ column }) {
  let lead = 'Nothing saved for later'
  if (column.id === 1) lead = 'No tests coming up'
  else if (AUTO_DATE.has(column.id) && column.dueDate) {
    lead = `Nothing due ${weekdayName(column.dueDate)}`
  }
  return (
    <div className="empty">
      <div>
        <p>{lead}</p>
        <p>Add a task or drag one here</p>
      </div>
    </div>
  )
}

// Shown in the column a card is hovering over: where it lands and what its
// date becomes. Auto-date columns re-date the card; custom-date columns keep
// whatever date it already has.
export function DropHint({ column, card }) {
  let text
  if (AUTO_DATE.has(column.id)) {
    text = `It will be due ${formatDisplayDate(column.dueDate)}.`
  } else if (card?.due_date) {
    text = `It keeps its date, ${formatDisplayDate(card.due_date)}.`
  } else {
    text = "You can set its date once it's here."
  }
  return (
    <div className="drop-hint">
      <Icon name="move" />
      <span>Drop to move here. {text}</span>
    </div>
  )
}

// "Show completed (N)" / "Hide completed", with the rotating chevron.
export function CompletedToggle({ open, count, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`toggle-done ${open ? 'is-open' : ''}`}
    >
      <Icon name="chev-right" />
      {open ? 'Hide completed' : `Show completed (${count})`}
    </button>
  )
}
