import { useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import DraggableCard from './DraggableCard.jsx'
import { formatDisplayDate } from '../lib/dates.js'

// One board column: title, its calculated due date in muted text (auto-date
// columns only), the sorted card list, and an inline "Add task" input.
//
// Completion: active cards sit on top (domain-sorted), completed cards collect
// at the bottom. Column 2 ("Today / Due") is the active-work column — a card
// completed there fades + slides out of view (the 02:15 cron later removes it
// from the DB); every other column keeps completed cards visible in the muted
// completed style. A per-column "Show completed" toggle (col 2 starts hidden,
// the rest start shown) collapses/re-reveals that completed group.
export default function Column({ column, onAddCard, onUpdateCard }) {
  const isCustomDateColumn = column.id === 1 || column.id === 5
  const isCol2 = column.id === 2
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [showCompleted, setShowCompleted] = useState(!isCol2)
  const inputRef = useRef(null)
  // Drop target = the whole column (id = the column's numeric id, matching the
  // value moveCard expects). Highlights while a card hovers over it.
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const active = column.cards.filter((c) => !c.completed_at)
  const completed = column.cards.filter((c) => c.completed_at)
  // Keyed by id and rendered in one list so a card that moves between the active
  // and completed groups keeps its DOM node — letting the collapse transition
  // play (the col-2 fade-out) instead of snapping.
  const ordered = [...active, ...completed]

  async function commit() {
    const trimmed = title.trim()
    setAdding(false)
    setTitle('')
    if (trimmed) await onAddCard(column.id, trimmed)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      setAdding(false)
      setTitle('')
    }
  }

  return (
    <section className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-900/60 p-3">
      <header className="mb-3 px-1">
        <h2 className="text-sm font-semibold text-slate-100">{column.name}</h2>
        {!isCustomDateColumn && column.dueDate && (
          <p className="text-xs text-slate-500">
            {formatDisplayDate(column.dueDate)}
          </p>
        )}
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col rounded-lg transition-colors ${
          isOver ? 'bg-slate-800/40 outline outline-1 outline-slate-600' : ''
        }`}
      >
        {ordered.map((card) => (
          <Collapsible
            key={card.id}
            collapsed={!!card.completed_at && !showCompleted}
          >
            <DraggableCard
              card={card}
              isCustomDateColumn={isCustomDateColumn}
              onUpdateCard={onUpdateCard}
            />
          </Collapsible>
        ))}
      </div>

      {completed.length > 0 && (
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          className="mt-2 rounded-md px-2 py-1 text-left text-xs text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
        >
          {showCompleted
            ? 'Hide completed'
            : `Show completed (${completed.length})`}
        </button>
      )}

      {adding ? (
        <input
          ref={inputRef}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder="Task title…"
          className="mt-2 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-500"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
        >
          + Add task
        </button>
      )}
    </section>
  )
}

// Smooth height+fade collapse via the grid 1fr→0fr trick (the spacing padding
// lives inside the collapsing region, so a hidden card leaves no gap). The
// ~700ms transition is the col-2 "fade + slide out of view" on completion.
function Collapsible({ collapsed, children }) {
  return (
    <div
      className="grid transition-all duration-700 ease-in-out"
      style={{
        gridTemplateRows: collapsed ? '0fr' : '1fr',
        opacity: collapsed ? 0 : 1,
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="pb-2">{children}</div>
      </div>
    </div>
  )
}
