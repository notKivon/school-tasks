import { useEffect, useRef, useState } from 'react'

// Short names for the strip only; the column header keeps the full name.
const SHORT = { 1: 'Tests', 2: 'Today', 3: 'Next', 4: 'Subsequent', 5: 'Later' }
const REVEAL_PAD = 48 // keep the active tab clear of the edge fade

// Phone tab strip under the header: one tab per column with its active-card
// count. Tapping a tab snaps the board to that column; the active tab follows
// the swipe and the strip scrolls to keep it fully in view. Whichever edge has
// tabs hidden past it fades out (.can-left / .can-right).
export default function ColumnTabs({ columns, active, onSelect }) {
  const stripRef = useRef(null)
  const [fade, setFade] = useState({ left: false, right: false })

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    function update() {
      const max = strip.scrollWidth - strip.clientWidth
      setFade({ left: strip.scrollLeft > 1, right: strip.scrollLeft < max - 1 })
    }
    const frame = requestAnimationFrame(update)
    strip.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      strip.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    const tab = strip?.children[active]
    if (!tab) return
    const left = tab.offsetLeft
    const right = left + tab.offsetWidth
    let target = strip.scrollLeft
    if (left - REVEAL_PAD < strip.scrollLeft) target = left - REVEAL_PAD
    else if (right + REVEAL_PAD > strip.scrollLeft + strip.clientWidth) {
      target = right + REVEAL_PAD - strip.clientWidth
    }
    target = Math.max(0, Math.min(target, strip.scrollWidth - strip.clientWidth))
    if (target !== strip.scrollLeft) strip.scrollTo({ left: target, behavior: 'smooth' })
  }, [active])

  const classes = ['tabs', fade.left && 'can-left', fade.right && 'can-right']
    .filter(Boolean)
    .join(' ')

  return (
    <nav ref={stripRef} className={classes} aria-label="Columns">
      {columns.map((col, i) => (
        <button
          key={col.id}
          type="button"
          onClick={() => onSelect(i)}
          aria-current={i === active ? 'true' : undefined}
          aria-label={`${col.name}, ${col.count} active`}
          className={`tab ${i === active ? 'is-on' : ''}`}
        >
          {SHORT[col.id] ?? col.name} <b>{col.count}</b>
        </button>
      ))}
    </nav>
  )
}
