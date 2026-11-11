import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

// Banner shown when the browser goes offline, so the cached board reads
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
    <div className="offline" role="status">
      <Icon name="wifi-off" />
      <span>
        You're offline. This is your last loaded board; changes sync when you
        reconnect.
      </span>
    </div>
  )
}
