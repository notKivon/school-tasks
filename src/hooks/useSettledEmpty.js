import { useEffect, useState } from 'react'

// Matches --dur-slow, the CardSlot collapse (src/index.css).
const COLLAPSE_MS = 700

// Whether a column's empty state may show. `empty` = nothing visible is left;
// `collapsing` = cards are still in the list but collapsed (hidden completed
// cards). When a column becomes empty by collapsing its last card, the empty
// state waits for the collapse to finish; a column that is simply empty (on
// load, or after a delete/move) shows it at once.
export function useSettledEmpty(empty, collapsing) {
  const [prevEmpty, setPrevEmpty] = useState(empty)
  const [waiting, setWaiting] = useState(false)

  // Adjust state while rendering when `empty` flips (React's "storing
  // information from previous renders" pattern), so there is no one-frame flash.
  if (empty !== prevEmpty) {
    setPrevEmpty(empty)
    setWaiting(empty && collapsing)
  }

  useEffect(() => {
    if (!waiting) return
    const id = setTimeout(() => setWaiting(false), COLLAPSE_MS)
    return () => clearTimeout(id)
  }, [waiting])

  return empty && !waiting
}
