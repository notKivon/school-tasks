import { useSyncExternalStore } from 'react'

// True at phone widths (below Tailwind's `sm`, 640px). Header popovers become
// bottom sheets there, and the header collapses to icon buttons.
const QUERY = '(max-width: 639.98px)'

function subscribe(onChange) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches
const getServerSnapshot = () => false

export function useIsPhone() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
