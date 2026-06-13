import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import Header from '../components/Header.jsx'
import Column from '../components/Column.jsx'
import Card from '../components/Card.jsx'
import { useBoard } from '../hooks/useBoard.js'

// The 5-column board: horizontal-scrolling layout, loading + error states, and
// drag & drop that moves cards between columns only (no in-column reordering —
// sorting is always derived). The drop column's id is the droppable id, so the
// drag-end handler hands it straight to moveCard, which clears/keeps the due
// date per the column type and re-sorts via the board memo.
export default function BoardPage() {
  const { board, today, loading, error, addCard, updateCard, moveCard, deleteCard } =
    useBoard()
  const [activeCard, setActiveCard] = useState(null)
  // The first column registers an "open add" function here so the `N` shortcut
  // can focus its Add-task input from anywhere on the board.
  const openFirstAddRef = useRef(null)

  // A small distance constraint so clicks (and the inline editors added later)
  // still register without starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  // Keyboard: `N` focuses "Add task" in the first column (ignored while typing).
  useEffect(() => {
    function onKey(e) {
      const t = e.target
      const typing =
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        openFirstAddRef.current?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleDragStart({ active }) {
    const card = board.flatMap((c) => c.cards).find((c) => c.id === active.id)
    setActiveCard(card ?? null)
  }

  function handleDragEnd({ active, over }) {
    setActiveCard(null)
    if (over) moveCard(active.id, over.id)
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex h-full items-center justify-center text-slate-500">
          Loading board…
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex h-full items-center justify-center text-red-400">
          {error}
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className="flex h-full gap-4 overflow-x-auto p-4">
          {board.map((column, index) => (
            <Column
              key={column.id}
              column={column}
              today={today}
              onAddCard={addCard}
              onUpdateCard={updateCard}
              onDeleteCard={deleteCard}
              addOpenerRef={index === 0 ? openFirstAddRef : undefined}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <Card
              card={activeCard}
              isCustomDateColumn={
                activeCard.column_id === 1 || activeCard.column_id === 5
              }
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
