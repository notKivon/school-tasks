import { useEffect, useState } from 'react'

// Thin banner shown when the browser goes offline, so the cached board reads
// as intentionally-offline rather than broken.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOffline(false)
    const goOffline = () => setOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="sticky top-0 z-30 bg-amber-600 px-4 py-1.5 text-center text-xs font-medium text-amber-50">
      Offline — showing your last loaded board. Changes will sync when you
      reconnect.
    </div>
  )
}
