import { useRef, useState } from 'react'
import Card from './Card.jsx'
import { formatDisplayDate } from '../lib/dates.js'

// One board column: title, its calculated due date in muted text (auto-date
// columns only), the sorted card list, and an inline "Add task" input. Drag &
// drop wiring is layered on in the next step.
export default function Column({ column, onAddCard }) {
  const isCustomDateColumn = column.id === 1 || column.id === 5
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef(null)

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

      <div className="flex flex-1 flex-col gap-2">
        {column.cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            isCustomDateColumn={isCustomDateColumn}
          />
        ))}
      </div>

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
