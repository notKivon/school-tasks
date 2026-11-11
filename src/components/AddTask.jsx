import { useState } from 'react'
import Icon from './Icon.jsx'

// A column's "+ Add task" button and its inline input. The column owns the
// open state + input ref so the `N` shortcut and the title editor's Enter can
// open it. Enter with text adds the card and keeps a fresh field open and
// focused for the next one; Enter on an empty field or a plain blur closes it;
// Escape closes without adding.
export default function AddTask({ open, onOpen, onClose, inputRef, onAdd }) {
  const [title, setTitle] = useState('')

  async function commit({ keepOpen = false } = {}) {
    const trimmed = title.trim()
    setTitle('')
    if (keepOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      onClose()
    }
    if (trimmed) await onAdd(trimmed)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Enter on an empty input means "done" → close; otherwise add + stay open.
      commit({ keepOpen: title.trim().length > 0 })
    } else if (e.key === 'Escape') {
      onClose()
      setTitle('')
    }
  }

  if (open) {
    return (
      <div className="add-field">
        <input
          ref={inputRef}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit()}
          placeholder="Title, e.g. Stats quiz 6.2"
          aria-label="New task title"
          className="add-input"
        />
      </div>
    )
  }

  return (
    <button type="button" onClick={onOpen} className="add-btn">
      <Icon name="plus" />
      Add task
    </button>
  )
}
