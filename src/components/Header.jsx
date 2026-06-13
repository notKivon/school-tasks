import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { useToast } from '../lib/toast.jsx'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// Sticky top bar: app name, Calendar subscribe popover, the signed-in email,
// and Sign Out.
export default function Header() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [calOpen, setCalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const popoverRef = useRef(null)

  const icsUrl = user
    ? `${SUPABASE_URL}/functions/v1/ics-feed?uid=${user.id}`
    : ''

  // Close the popover on outside-click or Escape.
  useEffect(() => {
    if (!calOpen) return
    const onClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setCalOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setCalOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [calOpen])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.info('Calendar link copied')
    } catch {
      setCopied(false)
      toast.error("Couldn't copy — select and copy the link manually")
    }
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur">
      <h1 className="text-sm font-semibold tracking-wide text-slate-100">
        School Tasks
      </h1>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-400 sm:inline">
          {user?.email}
        </span>

        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setCalOpen((o) => !o)}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800"
          >
            Calendar
          </button>

          {calOpen && (
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm shadow-xl">
              <p className="mb-2 font-medium text-slate-100">
                Subscribe to your tasks
              </p>
              <p className="mb-3 text-xs text-slate-400">
                A read-only calendar feed of every task with a due date. It
                refreshes automatically in your calendar app.
              </p>

              <div className="mb-2 flex items-stretch gap-2">
                <input
                  type="text"
                  readOnly
                  value={icsUrl}
                  onFocus={(e) => e.target.select()}
                  className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-300"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-500"
                >
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-400">
                <p>
                  <span className="text-slate-300">Google Calendar:</span> Other
                  calendars → From URL → paste the link.
                </p>
                <p>
                  <span className="text-slate-300">Apple Calendar:</span> File →
                  New Calendar Subscription → paste the link.
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
