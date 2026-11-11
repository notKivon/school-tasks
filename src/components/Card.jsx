import { useState } from 'react'
import Icon from './Icon.jsx'
import CardCheckbox from './CardCheckbox.jsx'
import CardTitle from './CardTitle.jsx'
import CardDueDate from './CardDueDate.jsx'
import { detectLabel, LABEL_NONE_COLOR } from '../lib/labels.js'
import { stopDrag } from './stopDrag.js'

// A single task card. The class label is derived from the title at render time
// (never stored): a labelled card gets a colored chip + left edge in the class
// color, an unlabelled one the neutral edge. Re-running detectLabel on an
// edited title updates both live.
//   Row 1: chip (+ Overdue), trash at the row's right end
//   Row 2: checkbox + title (click to edit in place)
//   Row 3: due-date badge, custom-date columns (1/5) only
// `variant` is the drag state: "ghost" = the faint origin slot left behind,
// "lifted" = the copy floating in the DragOverlay. Every control inside stops
// pointer/touch-down so the wrapping DraggableCard's listeners don't hijack it.
export default function Card({
  card,
  today,
  isCustomDateColumn,
  onUpdateCard,
  onDeleteCard,
  onRequestNewCard,
  variant,
}) {
  const [editing, setEditing] = useState(false)
  const label = detectLabel(card.title)
  const completed = !!card.completed_at
  // "Today / Due" (col 2) cards carrying a due_date earlier than today are late.
  const overdue =
    card.column_id === 2 && card.due_date && today && card.due_date < today
  const showOverdue = overdue && !completed
  // Completed cards are muted: board.css drops the edge + chip to the neutral
  // and strikes the title through (the color returns the moment it's
  // unchecked, since the label is always re-derived from the title).
  const color = label ? label.color : LABEL_NONE_COLOR

  function toggleComplete(e) {
    onUpdateCard?.(card.id, {
      completed_at: e.target.checked ? new Date().toISOString() : null,
    })
  }

  const classes = [
    'card',
    completed && 'is-done',
    editing && 'is-editing',
    variant === 'ghost' && 'is-ghost',
    variant === 'lifted' && 'is-lifted',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={classes} style={{ '--c': color }}>
      {(label || showOverdue) && (
        <div className="chips">
          {label && <span className="chip">{label.name}</span>}
          {showOverdue && (
            <span className="badge-overdue">
              <Icon name="clock" />
              Overdue
            </span>
          )}
        </div>
      )}

      <CardCheckbox checked={completed} onChange={toggleComplete} />

      <CardTitle
        card={card}
        editing={editing}
        onEditingChange={setEditing}
        onUpdateCard={onUpdateCard}
        onRequestNewCard={onRequestNewCard}
      />

      {isCustomDateColumn && (
        <CardDueDate
          card={card}
          completed={completed}
          onUpdateCard={onUpdateCard}
        />
      )}

      {onDeleteCard && !editing && (
        <button
          type="button"
          onClick={() => onDeleteCard(card.id)}
          {...stopDrag}
          aria-label="Delete task"
          className="card-del"
        >
          <Icon name="trash" />
        </button>
      )}
    </article>
  )
}
