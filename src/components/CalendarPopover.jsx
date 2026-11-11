import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { useToast } from '../lib/toast.jsx'
import HeaderPopover from './HeaderPopover.jsx'
import ToolButton from './ToolButton.jsx'
import Icon from './Icon.jsx'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// "Calendar" header popover: the read-only ICS feed URL, a Copy link button
// (shows "Copied!" for 2 seconds) and how to subscribe in Google / Apple.
export default function CalendarPopover({ open, onToggle, onClose }) {
  const { user } = useAuth()
  const toast = useToast()
  const triggerRef = useRef(null)
  const timerRef = useRef(null)
  const [copied, setCopied] = useState(false)

  const icsUrl = user ? `${SUPABASE_URL}/functions/v1/ics-feed?uid=${user.id}` : ''

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl)
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
      toast.info('Calendar link copied')
    } catch {
      setCopied(false)
      toast.error("Couldn't copy — select and copy the link manually")
    }
  }

  return (
    <>
      <ToolButton
        ref={triggerRef}
        icon="cal"
        label="Calendar"
        open={open}
        controls="hdr-calendar"
        onClick={onToggle}
      />
      <HeaderPopover
        id="hdr-calendar"
        open={open}
        onClose={onClose}
        triggerRef={triggerRef}
        label="Subscribe to your tasks"
        width={372}
      >
        <h2 className="pop-title">Subscribe to your tasks</h2>
        <p className="pop-lede">
          A read-only calendar of every task with a due date. Your calendar app
          keeps it up to date.
        </p>
        <div className="url-row">
          <input
            className="url"
            type="text"
            readOnly
            value={icsUrl}
            aria-label="Calendar link"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={copyLink}
            className={`btn btn-sm ${copied ? 'btn-copied' : 'btn-primary'}`}
          >
            <Icon name={copied ? 'check' : 'copy'} />
            <span aria-live="polite">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
        <div className="steps">
          <div className="step">
            <span className="app-ico" aria-hidden="true">G</span>
            <div>
              <b>Google Calendar</b>
              <p>Other calendars, then From URL. Paste the link and choose Add calendar.</p>
            </div>
          </div>
          <div className="step">
            <span className="app-ico" aria-hidden="true">
              <Icon name="cal" />
            </span>
            <div>
              <b>Apple Calendar</b>
              <p>File, then New Calendar Subscription. Paste the link and choose Subscribe.</p>
            </div>
          </div>
        </div>
      </HeaderPopover>
    </>
  )
}
