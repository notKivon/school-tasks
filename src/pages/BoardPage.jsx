import { useState } from 'react'
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
  const { board, loading, error, addCard, moveCard } = useBoard()
  const [activeCard, setActiveCard] = useState(null)

  // A small distance constraint so clicks (and the inline editors added later)
  // still register without starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

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
          {board.map((column) => (
            <Column key={column.id} column={column} onAddCard={addCard} />
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
