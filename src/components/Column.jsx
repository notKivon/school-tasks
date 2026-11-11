import { useCallback, useEffect, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import DraggableCard from './DraggableCard.jsx'
import AddTask from './AddTask.jsx'
import {
  CardSlot,
  CompletedToggle,
  DropHint,
  EmptyColumn,
} from './ColumnParts.jsx'
import { formatDisplayDate } from '../lib/dates.js'
import { useSettledEmpty } from '../hooks/useSettledEmpty.js'

// One board column: display-font title, active-card count, its calculated due
// date (auto-date columns only), the sorted card list scrolling inside the
// column, the completed toggle and "Add task". Today / Due (col 2) is lifted
// with the paper edge, accent title and the ribbon.
//
// Completion: active cards sit on top (domain-sorted), completed cards collect
// at the bottom. Column 2 is the active-work column — a card completed there
// fades + slides out of view (the 02:15 cron later removes it from the DB);
// every other column keeps completed cards visible in the muted completed
// style. A per-column "Show completed" toggle (col 2 starts hidden, the rest
// start shown) collapses/re-reveals that completed group.
export default function Column({
  column,
  today,
  activeCard,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  addOpenerRef,
}) {
  const isCustomDateColumn = column.id === 1 || column.id === 5
  const isCol2 = column.id === 2
  const [adding, setAdding] = useState(false)
  const [showCompleted, setShowCompleted] = useState(!isCol2)
  const inputRef = useRef(null)

  // Open the Add-task input and focus it; registered with the parent so the `N`
  // shortcut can trigger it on the first column. setAdding here runs from a key
  // event (not an effect), so the set-state-in-effect rule doesn't apply.
  const openAdd = useCallback(() => {
    setAdding(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!addOpenerRef) return
    addOpenerRef.current = openAdd
    return () => {
      addOpenerRef.current = null
    }
  }, [addOpenerRef, openAdd])

  // Drop target = the whole column (id = the column's numeric id, matching the
  // value moveCard expects). It only lights up for a card from another column.
  const { setNodeRef, isOver, active: dragging } = useDroppable({ id: column.id })
  const isTarget = isOver && dragging?.data.current?.columnId !== column.id

  const active = column.cards.filter((c) => !c.completed_at)
  const completed = column.cards.filter((c) => c.completed_at)
  // Keyed by id and rendered in one list so a card that moves between the active
  // and completed groups keeps its DOM node — letting the collapse transition
  // play (the col-2 fade-out) instead of snapping.
  const ordered = [...active, ...completed]
  const nothingVisible =
    active.length === 0 && (completed.length === 0 || !showCompleted)
  // The 700ms collapse only applies when an active card has just turned
  // completed (it is in `completed` now but was active on the previous render).
  // Deletes, drags out and plain empty columns show the empty state at once.
  const [prevActiveIds, setPrevActiveIds] = useState([])
  const justCompleted = completed.some((c) => prevActiveIds.includes(c.id))
  const activeKey = active.map((c) => c.id).join()
  if (activeKey !== prevActiveIds.join()) setPrevActiveIds(active.map((c) => c.id))
  const settledEmpty = useSettledEmpty(nothingVisible, justCompleted)
  const showEmpty = !isTarget && settledEmpty

  const classes = ['col', isCol2 && 'col--today', isTarget && 'col--over']
    .filter(Boolean)
    .join(' ')

  return (
    <section ref={setNodeRef} className={classes} aria-label={column.name}>
      {isCol2 && <span className="ribbon" aria-hidden="true" />}
      <header className="col-head">
        <div>
          <h2 className="col-title">{column.name}</h2>
          {!isCustomDateColumn && column.dueDate && (
            <p className="col-date">{formatDisplayDate(column.dueDate)}</p>
          )}
        </div>
        <span
          className={`col-count ${active.length === 0 ? 'is-zero' : ''}`}
          aria-label={`${active.length} active ${active.length === 1 ? 'task' : 'tasks'}`}
        >
          {active.length}
        </span>
      </header>

      <div className="col-list">
        {ordered.map((card) => (
          <CardSlot key={card.id} collapsed={!!card.completed_at && !showCompleted}>
            <DraggableCard
              card={card}
              today={today}
              isCustomDateColumn={isCustomDateColumn}
              onUpdateCard={onUpdateCard}
              onDeleteCard={onDeleteCard}
              onRequestNewCard={openAdd}
            />
          </CardSlot>
        ))}
        {showEmpty && <EmptyColumn column={column} />}
        {isTarget && <DropHint column={column} card={activeCard} />}
      </div>

      {completed.length > 0 && (
        <CompletedToggle
          open={showCompleted}
          count={completed.length}
          onToggle={() => setShowCompleted((v) => !v)}
        />
      )}

      <AddTask
        open={adding}
        onOpen={openAdd}
        onClose={() => setAdding(false)}
        inputRef={inputRef}
        onAdd={(title) => onAddCard(column.id, title)}
      />
    </section>
  )
}
