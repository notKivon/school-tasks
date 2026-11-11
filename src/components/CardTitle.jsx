import { useLayoutEffect, useRef, useState } from 'react'
import { getDisplayTitle } from '../lib/labels.js'
import { stopDrag } from './stopDrag.js'

// The card title, click-to-edit inline. The card shows getDisplayTitle (class
// prefix and escape backslash stripped); the editor loads the FULL stored
// title. The editor is an auto-growing textarea set in exactly the title's
// font, line box and grid cell, so the card doesn't grow or jump. Enter saves
// (and asks the column for a fresh add-task field), Escape cancels, blur saves.
export default function CardTitle({
  card,
  editing,
  onEditingChange,
  onUpdateCard,
  onRequestNewCard,
}) {
  const [draft, setDraft] = useState(card.title)
  const cancelledRef = useRef(false)
  // Set when the edit is committed via Enter (vs. a plain blur), so commit
  // knows to open a fresh blank card in this column afterwards.
  const enterRef = useRef(false)
  const inputRef = useRef(null)

  // Grow with the text, and compensate the layout box when the phone styles
  // scale the 16px editor back down to the 15px title (see board.css).
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.marginBottom = '0px'
    el.style.height = `${el.scrollHeight}px`
    const scale = el.getBoundingClientRect().height / el.offsetHeight
    if (scale && Math.abs(scale - 1) > 0.001) {
      el.style.marginBottom = `${el.offsetHeight * (scale - 1)}px`
    }
  }, [editing, draft])

  function start() {
    setDraft(card.title)
    onEditingChange(true)
  }

  // Commit on blur (Enter blurs the field, Escape sets the cancel flag first).
  function commit() {
    onEditingChange(false)
    const viaEnter = enterRef.current
    enterRef.current = false
    if (cancelledRef.current) {
      cancelledRef.current = false
      return
    }
    const trimmed = draft.trim()
    if (trimmed && trimmed !== card.title) {
      onUpdateCard?.(card.id, { title: trimmed }, { successMessage: 'Task saved' })
    }
    // Committing with Enter opens a fresh blank card in this column for rapid
    // entry (blur alone just saves and stops).
    if (viaEnter) onRequestNewCard?.()
  }

  function handleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      enterRef.current = true
      e.target.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelledRef.current = true
      e.target.blur()
    }
  }

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        autoFocus
        rows={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        onFocus={(e) => {
          const len = e.target.value.length
          e.target.setSelectionRange(len, len)
        }}
        {...stopDrag}
        aria-label="Task title"
        className="card-input"
      />
    )
  }

  return (
    <p onClick={onUpdateCard ? start : undefined} className="card-title">
      {getDisplayTitle(card.title)}
    </p>
  )
}
