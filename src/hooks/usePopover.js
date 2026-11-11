import { useEffect, useLayoutEffect, useRef } from 'react'

// Shared behaviour for a header popover while it is open:
//   - outside-click closes it (clicks on its own trigger are left to the
//     trigger's toggle, so clicking the button again closes rather than
//     close-then-reopen)
//   - Escape closes it and hands focus back to the trigger
//   - on open, focus moves into the panel so Tab continues inside it
// Returns the ref to put on the panel (or the sheet wrapper on phone).
export function usePopover({ open, onClose, triggerRef }) {
  const panelRef = useRef(null)

  useLayoutEffect(() => {
    if (open) panelRef.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      const inPanel = panelRef.current?.contains(e.target)
      const onTrigger = triggerRef.current?.contains(e.target)
      if (!inPanel && !onTrigger) onClose()
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      onClose()
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, triggerRef])

  return panelRef
}
