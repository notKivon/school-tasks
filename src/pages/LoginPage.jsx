import { useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { passkeysSupported } from '../lib/supabase.js'

// Centered dark auth form with a Sign in / Sign up toggle.
// On successful sign-in the session updates and the route guard sends us to
// /board automatically; sign-up may require email confirmation.
export default function LoginPage() {
  const { signIn, signUp, signInWithPasskey } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const isSignup = mode === 'signup'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      if (isSignup) {
        const { data, error } = await signUp(email, password)
        if (error) throw error
        // Email confirmation on → a user but no session yet.
        if (data.user && !data.session) {
          setInfo('Check your email to confirm your account, then sign in.')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasskey() {
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const { error } = await signInWithPasskey()
      if (error) throw error
      // On success the session updates and the route guard sends us to /board.
    } catch (err) {
      // The user dismissing the OS passkey prompt surfaces as an abort/NotAllowed.
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        setError('Passkey sign-in was cancelled.')
      } else {
        setError(err.message || 'Passkey sign-in failed')
      }
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode(isSignup ? 'signin' : 'signup')
    setError(null)
    setInfo(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      >
        <h1 className="mb-1 text-lg font-semibold text-slate-100">
          School Tasks
        </h1>
        <p className="mb-5 text-sm text-slate-400">
          {isSignup ? 'Create your account' : 'Sign in to your account'}
        </p>

        <label className="mb-1 block text-xs font-medium text-slate-400">
          Email
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
        />

        <label className="mb-1 block text-xs font-medium text-slate-400">
          Password
        </label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
        />

        {error && (
          <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {info && (
          <p className="mb-3 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? 'Please wait…' : isSignup ? 'Sign Up' : 'Sign In'}
        </button>

        {passkeysSupported && !isSignup && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              or
              <span className="h-px flex-1 bg-slate-800" />
            </div>
            <button
              type="button"
              onClick={handlePasskey}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-60"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="8" r="4" />
                <path d="M9 14c-3.3 0-6 1.8-6 4v2h8" />
                <circle cx="17" cy="14" r="3" />
                <path d="M17 17v4l1.5-1 1.5 1v-4" />
              </svg>
              Sign in with a passkey
            </button>
          </>
        )}

        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-200"
        >
          {isSignup
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </form>
    </div>
  )
}
