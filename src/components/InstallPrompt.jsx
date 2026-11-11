import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

const DISMISS_KEY = 'school-tasks-install-dismissed'

// "Install App" button that appears when the browser fires
// `beforeinstallprompt`. Dismissal is remembered in localStorage so it
// doesn't keep nagging.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!deferred) return null

  const install = async () => {
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDeferred(null)
  }

  return (
    <div className="install" role="dialog" aria-label="Install School Tasks">
      <span className="install-ico">
        <span className="brand-mark" />
      </span>
      <div>
        <strong>Install School Tasks</strong>
        <small>Opens in its own window and works offline</small>
      </div>
      <div className="install-actions">
        <button type="button" onClick={install} className="btn btn-primary btn-sm">
          <Icon name="down" />
          Install App
        </button>
        <button type="button" onClick={dismiss} className="btn btn-quiet btn-sm">
          Not now
        </button>
      </div>
    </div>
  )
}
