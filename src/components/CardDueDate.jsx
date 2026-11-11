import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { formatDisplayDate } from '../lib/dates.js'
import { stopDrag } from './stopDrag.js'

// The per-card due-date badge for the custom-date columns (1 and 5): the date
// with a clear "×", or a dashed "Set date" when null. Clicking swaps in the
// native date input and pops its picker open. Completed cards keep the date
// but drop the clear button (the template's muted completed style).
export default function CardDueDate({ card, completed, onUpdateCard }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  // Pop the native date picker open as soon as the input mounts.
  useEffect(() => {
    if (editing && inputRef.current) {
      try {
        inputRef.current.showPicker()
      } catch {
        /* showPicker unsupported — the input is still clickable */
      }
    }
  }, [editing])

  function commit(value) {
    setEditing(false)
    const next = value || null
    if (next !== card.due_date) {
      onUpdateCard?.(card.id, { due_date: next }, {
        successMessage: next ? 'Due date set' : 'Due date cleared',
      })
    }
  }

  function clear(e) {
    e.stopPropagation()
    if (card.due_date !== null) {
      onUpdateCard?.(card.id, { due_date: null }, {
        successMessage: 'Due date cleared',
      })
    }
  }

  if (editing) {
    return (
      <div className="card-meta">
        <input
          ref={inputRef}
          type="date"
          autoFocus
          defaultValue={card.due_date ?? ''}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setEditing(false)}
          {...stopDrag}
          aria-label="Due date"
          className="due-input"
        />
      </div>
    )
  }

  const label = formatDisplayDate(card.due_date)
  return (
    <div className="card-meta">
      <span className={`due ${label ? '' : 'is-unset'}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setEditing(true)
          }}
          {...stopDrag}
          aria-label={label ? `Due ${label}, change date` : undefined}
          className="due-date"
        >
          <Icon name="cal" />
          {label || 'Set date'}
        </button>
        {card.due_date && !completed && (
          <button
            type="button"
            onClick={clear}
            {...stopDrag}
            aria-label="Clear due date"
            className="due-clear"
          >
            <Icon name="x" />
          </button>
        )}
      </span>
    </div>
  )
}
