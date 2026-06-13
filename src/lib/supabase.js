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
