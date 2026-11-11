import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopover } from '../hooks/usePopover.js'
import { useIsPhone } from '../hooks/useIsPhone.js'

const EDGE = 8 // min gap between a popover and the viewport edge
const GAP = 8 // gap between the trigger and the popover

// The panel behind a header button. Desktop: anchored under its own trigger,
// right edges aligned, nudged back inside the viewport if it would overflow,
// and capped to the viewport height (it scrolls inside). Phone: a bottom sheet
// with a grabber over a dimmed scrim, portalled to <body> because the sticky
// header's backdrop-filter would otherwise trap position: fixed.
//   variant  'pop' (content popover) | 'menu' (account menu)
//   maxVh    extra height cap for long panels (Classes uses 70)
export default function HeaderPopover({
  open,
  onClose,
  triggerRef,
  label,
  variant = 'pop',
  width,
  maxVh,
  id,
  children,
}) {
  const isPhone = useIsPhone()
  const panelRef = usePopover({ open, onClose, triggerRef })
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    if (!open || isPhone) return
    const place = () => {
      const btn = triggerRef.current?.getBoundingClientRect()
      const panel = panelRef.current
      const parent = panel?.offsetParent?.getBoundingClientRect()
      if (!btn || !panel || !parent) return
      const w = panel.offsetWidth
      const vw = document.documentElement.clientWidth
      const left = Math.min(Math.max(btn.right - w, EDGE), vw - w - EDGE)
      const top = btn.bottom + GAP
      let maxHeight = window.innerHeight - top - EDGE
      if (maxVh) maxHeight = Math.min(maxHeight, (window.innerHeight * maxVh) / 100)
      setPos({ left: left - parent.left, top: top - parent.top, maxHeight })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, isPhone, triggerRef, panelRef, maxVh])

  if (!open) return null

  if (isPhone) {
    return createPortal(
      <div ref={panelRef} tabIndex={-1} className="hdr-panel">
        <div
          className="sheet-scrim"
          aria-hidden="true"
          onClick={() => {
            onClose()
            triggerRef.current?.focus()
          }}
        />
        <div id={id} className="sheet" role="dialog" aria-label={label}>
          <div className="grabber" aria-hidden="true" />
          {children}
        </div>
      </div>,
      document.body,
    )
  }

  return (
    <div
      ref={panelRef}
      id={id}
      tabIndex={-1}
      role="dialog"
      aria-label={label}
      className={`hdr-panel ${variant} absolute z-30 overflow-y-auto`}
      style={{
        width,
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        maxHeight: pos?.maxHeight,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  )
}
