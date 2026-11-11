import { useEffect, useRef, useState } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import Header from '../components/Header.jsx'
import Column from '../components/Column.jsx'
import Card from '../components/Card.jsx'
import ColumnTabs from '../components/ColumnTabs.jsx'
import { BoardError, BoardSkeleton } from '../components/BoardStates.jsx'
import { useBoard } from '../hooks/useBoard.js'
import { useBoardSensors } from '../hooks/useBoardSensors.js'
import { useColumnSnap } from '../hooks/useColumnSnap.js'

// On phones the peeking next column sits inside dnd-kit's default edge zone,
// so a gentler auto-scroll keeps a dragged card from overshooting it.
const PHONE_AUTO_SCROLL = { acceleration: 3 }

// The 5-column board: five full-height columns under the header (horizontal
// scroll when the window is narrower; one snapped column at a time with a tab
// strip on phones), loading + error states, and drag & drop that moves cards
// between columns only (no in-column reordering — sorting is always derived).
// The drop column's id is the droppable id, so the drag-end handler hands it
// straight to moveCard, which clears/keeps the due date per the column type and
// re-sorts via the board memo.
export default function BoardPage() {
  const { board, today, loading, error, refetch, addCard, updateCard, moveCard, deleteCard } =
    useBoard()
  const [activeCard, setActiveCard] = useState(null)
  const [retrying, setRetrying] = useState(false)
  // The first column registers an "open add" function here so the `N` shortcut
  // can focus its Add-task input from anywhere on the board.
  const openFirstAddRef = useRef(null)
  const boardRef = useRef(null)
  const sensors = useBoardSensors()
  const ready = !loading && !error
  const { isPhone, active, scrollToColumn } = useColumnSnap(boardRef, ready)

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

  function handleDragStart({ active: dragged }) {
    const card = board.flatMap((c) => c.cards).find((c) => c.id === dragged.id)
    setActiveCard(card ?? null)
  }

  function handleDragEnd({ active: dragged, over }) {
    setActiveCard(null)
    if (over) moveCard(dragged.id, over.id)
  }

  // Retry after a failed load: refetch clears the error on success and keeps
  // it (with the new message) on failure, so the error view just re-renders.
  async function retry() {
    setRetrying(true)
    await refetch()
    setRetrying(false)
  }

  if (loading) {
    return (
      <Shell>
        <BoardSkeleton />
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <BoardError message={error} retrying={retrying} onRetry={retry} />
      </Shell>
    )
  }

  const tabs = board.map((col) => ({
    id: col.id,
    name: col.name,
    count: col.cards.filter((c) => !c.completed_at).length,
  }))

  return (
    <Shell>
      {isPhone && (
        <ColumnTabs columns={tabs} active={active} onSelect={scrollToColumn} />
      )}
      <DndContext
        sensors={sensors}
        autoScroll={isPhone ? PHONE_AUTO_SCROLL : undefined}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div
          ref={boardRef}
          className={`board min-h-0 flex-1 ${activeCard ? 'is-dragging' : ''}`}
        >
          {board.map((column, index) => (
            <Column
              key={column.id}
              column={column}
              today={today}
              activeCard={activeCard}
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
              today={today}
              isCustomDateColumn={
                activeCard.column_id === 1 || activeCard.column_id === 5
              }
              variant="lifted"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Shell>
  )
}

// Full-height page: the header, then the board area filling the rest of the
// viewport (each column's list scrolls inside it, never the page).
function Shell({ children }) {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
