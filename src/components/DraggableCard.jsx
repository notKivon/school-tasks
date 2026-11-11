import { useDraggable } from '@dnd-kit/core'
import Card from './Card.jsx'

// Wraps a Card as a dnd-kit draggable. The whole card is the drag handle; the
// sensors on the DndContext (mouse/pen after 6px, touch after a 250ms long
// press) keep plain clicks and swipes working. While dragging, the card stays
// in place as a faint dashed slot of exactly its size, and the moving copy is
// rendered by the board's DragOverlay (position: fixed, so the scrolling
// columns never clip it). The source column id rides along as drag data so a
// column can tell a card hovering over it from one that came from it.
export default function DraggableCard({
  card,
  today,
  isCustomDateColumn,
  onUpdateCard,
  onDeleteCard,
  onRequestNewCard,
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { columnId: card.column_id },
  })

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="card-drag">
      <Card
        card={card}
        today={today}
        isCustomDateColumn={isCustomDateColumn}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
        onRequestNewCard={onRequestNewCard}
        variant={isDragging ? 'ghost' : undefined}
      />
    </div>
  )
}
