import { useEffect, useState } from 'react'

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
    <div className="fixed bottom-4 left-4 z-30 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm shadow-xl">
      <span className="text-slate-200">Install School Tasks?</span>
      <button
        type="button"
        onClick={install}
        className="rounded-md bg-cyan-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-cyan-500"
      >
        Install App
      </button>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:text-slate-200"
      >
        Not now
      </button>
    </div>
  )
}
