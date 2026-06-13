import { useEffect, useRef, useState } from 'react'
import { detectLabel } from '../lib/labels.js'
import { formatDisplayDate } from '../lib/dates.js'

// A single task card. The class label is derived from the title at render time
// (never stored): a labelled card gets a colored chip + left border, an
// unlabelled one a neutral gray border. Custom-date columns (1/5) show an
// editable per-card due-date badge ("Set date" when null); auto-date columns
// (2/3/4) don't. The title is click-to-edit inline — re-running detectLabel on
// the new title updates the chip + border live, since the label is never stored.
// Pointer-down on the inline editors is stopped so dnd-kit's drag listeners (on
// the wrapping DraggableCard) don't hijack typing or the date picker.
export default function Card({ card, isCustomDateColumn, onUpdateCard }) {
  const label = detectLabel(card.title)
  const borderColor = label ? label.color : '#475569' // slate-600

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(card.title)
  const cancelledRef = useRef(false)

  const [editingDate, setEditingDate] = useState(false)
  const dateRef = useRef(null)

  // Pop the native date picker open as soon as the input mounts.
  useEffect(() => {
    if (editingDate && dateRef.current) {
      try {
        dateRef.current.showPicker()
      } catch {
        /* showPicker unsupported — the input is still clickable */
      }
    }
  }, [editingDate])

  function startTitleEdit() {
    setTitleDraft(card.title)
    setEditingTitle(true)
  }

  // Commit on blur (Enter blurs the input, Escape sets the cancel flag first).
  function commitTitle() {
    setEditingTitle(false)
    if (cancelledRef.current) {
      cancelledRef.current = false
      return
    }
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== card.title) {
      onUpdateCard?.(card.id, { title: trimmed })
    }
  }

  function handleTitleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.target.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelledRef.current = true
      e.target.blur()
    }
  }

  function commitDate(value) {
    setEditingDate(false)
    const next = value || null
    if (next !== card.due_date) onUpdateCard?.(card.id, { due_date: next })
  }

  function clearDate(e) {
    e.stopPropagation()
    if (card.due_date !== null) onUpdateCard?.(card.id, { due_date: null })
  }

  return (
    <div
      className="rounded-lg border-l-4 bg-slate-800 p-3 shadow-sm"
      style={{ borderLeftColor: borderColor }}
    >
      {label && (
        <span
          className="mb-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
          style={{ backgroundColor: label.color }}
        >
          {label.name}
        </span>
      )}

      {editingTitle ? (
        <input
          autoFocus
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onKeyDown={handleTitleKey}
          onBlur={commitTitle}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-sm text-slate-100 outline-none focus:border-slate-400"
        />
      ) : (
        <p
          onClick={startTitleEdit}
          className="cursor-text text-sm text-slate-100"
        >
          {card.title}
        </p>
      )}

      {isCustomDateColumn &&
        (editingDate ? (
          <input
            ref={dateRef}
            type="date"
            autoFocus
            defaultValue={card.due_date ?? ''}
            onChange={(e) => commitDate(e.target.value)}
            onBlur={() => setEditingDate(false)}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-2 rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-200 outline-none focus:border-slate-400"
          />
        ) : (
          <span className="mt-2 inline-flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setEditingDate(true)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700"
            >
              {formatDisplayDate(card.due_date) || 'Set date'}
            </button>
            {card.due_date && (
              <button
                type="button"
                onClick={clearDate}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Clear due date"
                className="rounded px-1 text-[11px] text-slate-500 hover:text-slate-300"
              >
                ×
              </button>
            )}
          </span>
        ))}
    </div>
  )
}
