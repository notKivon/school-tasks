import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

// Must match the phone breakpoint in src/styles/board.css.
const PHONE_QUERY = '(max-width: 639px)'
const TODAY_INDEX = 1 // Today / Due, where the phone board opens

function subscribe(onChange) {
  const mq = window.matchMedia(PHONE_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
const getIsPhone = () => window.matchMedia(PHONE_QUERY).matches

// Left offset of a column inside the board's scroll area, less the gutter the
// snap padding keeps clear.
function columnLeft(board, col) {
  const gutter = parseFloat(getComputedStyle(board).paddingLeft) || 0
  return (
    col.getBoundingClientRect().left -
    board.getBoundingClientRect().left +
    board.scrollLeft -
    gutter
  )
}

// Phone layout: the board scrolls one snapped column at a time. Tracks which
// column is in view (for the tab strip), jumps to a column on request, and
// opens on Today / Due once the board has rendered.
export function useColumnSnap(boardRef, ready) {
  const isPhone = useSyncExternalStore(subscribe, getIsPhone, () => false)
  const [active, setActive] = useState(TODAY_INDEX)
  const openedRef = useRef(false)

  useEffect(() => {
    const board = boardRef.current
    if (!board || !ready || !isPhone) return
    const cols = () => Array.from(board.children)
    function onScroll() {
      let best = 0
      let bestDist = Infinity
      cols().forEach((col, i) => {
        const d = Math.abs(columnLeft(board, col) - board.scrollLeft)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      setActive(best)
    }
    if (!openedRef.current) {
      openedRef.current = true
      const today = cols()[TODAY_INDEX]
      if (today) board.scrollLeft = columnLeft(board, today)
    }
    onScroll()
    board.addEventListener('scroll', onScroll, { passive: true })
    return () => board.removeEventListener('scroll', onScroll)
  }, [boardRef, ready, isPhone])

  const scrollToColumn = useCallback(
    (i) => {
      const board = boardRef.current
      const col = board?.children[i]
      if (!col) return
      setActive(i)
      board.scrollTo({ left: columnLeft(board, col), behavior: 'smooth' })
    },
    [boardRef],
  )

  return { isPhone, active, scrollToColumn }
}
