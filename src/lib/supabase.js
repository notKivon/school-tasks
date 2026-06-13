import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check .env.local',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Opt into the auth-js passkey (WebAuthn) methods. Without this flag,
  // signInWithPasskey()/registerPasskey() throw at call time.
  auth: { experimental: { passkey: true } },
})

// Passkeys need WebAuthn + a secure context (https or localhost). Used to
// hide the passkey UI in browsers that can't do the ceremony.
export const passkeysSupported =
  typeof window !== 'undefined' && !!window.PublicKeyCredential

// auth-js wraps an unrecognised ceremony failure as the unhelpful
// "a Non-Webauthn related error has occurred" and stashes the real DOM
// exception on `err.cause`. Dig that out for a message worth showing/logging.
export function passkeyErrorMessage(err, action = 'Passkey') {
  console.error('[passkey]', action, err, '\ncause:', err?.cause)
  const cause = err?.cause
  const name = cause?.name || err?.name
  if (name === 'NotAllowedError' || name === 'AbortError') {
    return `${action} was cancelled or timed out.`
  }
  if (name === 'InvalidStateError') {
    return 'A passkey for this account already exists on this device.'
  }
  if (name === 'SecurityError') {
    return `${action} failed: this page's origin isn't allowed for passkeys (needs HTTPS or localhost, and a matching domain).`
  }
  // auth-js only maps ConstraintError when the legacy `requireResidentKey`
  // flag is set; the server uses the modern `residentKey: "required"`, so a
  // ConstraintError slips through as the generic "Non-Webauthn" message.
  // Firefox in particular throws this when no available authenticator can
  // store a discoverable (resident) passkey.
  if (
    name === 'ConstraintError' ||
    name === 'NotSupportedError' ||
    err?.code === 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY'
  ) {
    return `${action} failed: this device/browser couldn't create a passkey. Try a built-in authenticator (Touch ID / Windows Hello), a security key, or your phone — or use Chrome/Safari, which have fuller passkey support than Firefox.`
  }
  const detail = cause?.message || err?.message
  return detail ? `${action} failed: ${detail}` : `${action} failed.`
}
