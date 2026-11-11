import { PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'

// Mouse and pen: dnd-kit's PointerSensor, unchanged, except it ignores touch
// pointers, which the TouchSensor below owns instead.
class MousePenSensor extends PointerSensor {
  static activators = PointerSensor.activators.map((activator) => ({
    ...activator,
    handler: (event, options) =>
      event.nativeEvent.pointerType === 'touch'
        ? false
        : activator.handler(event, options),
  }))
}

// Drag sensors for the board.
//   Mouse/pen: a 6px distance constraint, so clicks on titles and controls
//   still register without starting a drag.
//   Touch: a 250ms long press (5px tolerance), so a horizontal swipe still
//   scrolls the columns and a vertical one scrolls the list.
export function useBoardSensors() {
  return useSensors(
    useSensor(MousePenSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )
}
