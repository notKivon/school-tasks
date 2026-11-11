import { useRef, useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { useToast } from '../lib/toast.jsx'
import { passkeysSupported, passkeyErrorMessage } from '../lib/supabase.js'
import HeaderPopover from './HeaderPopover.jsx'
import Icon from './Icon.jsx'

// Avatar button (first letter of the email) + the account menu behind it:
// who is signed in, Add passkey (only where the browser supports passkeys),
// and Sign out. Enrolment state lives here, outside the panel, so closing and
// reopening the menu mid-prompt still shows "Adding passkey…".
export default function AccountMenu({ open, onToggle, onClose }) {
  const { user, signOut, registerPasskey } = useAuth()
  const toast = useToast()
  const triggerRef = useRef(null)
  const [enrolling, setEnrolling] = useState(false)

  const email = user?.email ?? ''
  const initial = email.charAt(0) || '?'

  const addPasskey = async () => {
    setEnrolling(true)
    try {
      const { error } = await registerPasskey()
      if (error) throw error
      toast.success('Passkey added — use it to sign in next time')
    } catch (err) {
      toast.error(passkeyErrorMessage(err, 'Add passkey'))
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'hdr-account' : undefined}
        aria-label="Account"
        className={`avatar-btn${open ? ' is-open' : ''}`}
      >
        <span className="avatar" aria-hidden="true">{initial}</span>
        <Icon name="chev-down" className="chev" />
      </button>
      <HeaderPopover
        id="hdr-account"
        open={open}
        onClose={onClose}
        triggerRef={triggerRef}
        label="Account"
        variant="menu"
      >
        <div className="menu-who">
          <span className="avatar" aria-hidden="true">{initial}</span>
          <div className="min-w-0">
            <small>Signed in as</small>
            <strong title={email}>{email}</strong>
          </div>
        </div>
        <div className="menu-sep" />
        {passkeysSupported && (
          <button
            type="button"
            className="menu-item"
            onClick={addPasskey}
            disabled={enrolling}
          >
            <Icon name="key" />
            <span>
              {enrolling ? 'Adding passkey…' : 'Add passkey'}
              <small>
                {enrolling
                  ? "Follow your browser's prompt"
                  : 'Sign in with Face ID or Touch ID'}
              </small>
            </span>
          </button>
        )}
        <button type="button" className="menu-item" onClick={() => signOut()}>
          <Icon name="out" />
          <span>Sign out</span>
        </button>
      </HeaderPopover>
    </>
  )
}
