import { useDraggable } from '@dnd-kit/core'
import Card from './Card.jsx'

// Wraps a Card as a dnd-kit draggable. The whole card is the drag handle; a
// PointerSensor distance constraint (set on the DndContext) keeps plain clicks
// working for the inline editors added in later steps. While dragging, the
// source dims and the moving copy is rendered by the board's DragOverlay (which
// lives in a portal, so the horizontal-scroll overflow never clips it).
export default function DraggableCard({
  card,
  today,
  isCustomDateColumn,
  onUpdateCard,
  onDeleteCard,
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab touch-none ${isDragging ? 'opacity-40' : ''}`}
    >
      <Card
        card={card}
        today={today}
        isCustomDateColumn={isCustomDateColumn}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
      />
    </div>
  )
}
