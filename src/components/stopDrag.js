// Spread onto every interactive control inside a card (checkbox, trash, title
// editor, date input, date + clear buttons) so the card's drag listeners on the
// wrapping DraggableCard never see the press: pointer-down for the mouse/pen
// sensor, touch-start for the long-press touch sensor.
const stop = (e) => e.stopPropagation()

export const stopDrag = { onPointerDown: stop, onTouchStart: stop }
