import { useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { passkeysSupported, passkeyErrorMessage } from '../lib/supabase.js'
import { authErrorInfo } from '../lib/authErrors.js'
import Icon from '../components/Icon.jsx'
import AuthMessage from '../components/AuthMessage.jsx'
import AuthModeToggle from '../components/AuthModeToggle.jsx'

// Centered auth card with a Sign in / Sign up toggle.
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
  const [badPassword, setBadPassword] = useState(false) // outline the field

  const isSignup = mode === 'signup'

  function clearMessages() {
    setError(null)
    setInfo(null)
    setBadPassword(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    clearMessages()
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
      const { message, password } = authErrorInfo(err)
      setError(message)
      setBadPassword(password)
    } finally {
      setLoading(false)
    }
  }

  async function handlePasskey() {
    clearMessages()
    setLoading(true)
    try {
      const { error } = await signInWithPasskey()
      if (error) throw error
      // On success the session updates and the route guard sends us to /board.
    } catch (err) {
      setError(passkeyErrorMessage(err, 'Passkey sign-in'))
    } finally {
      setLoading(false)
    }
  }

  function changeMode(next) {
    if (next === mode) return
    setMode(next)
    clearMessages()
  }

  return (
    <div className="login">
      <div className="auth">
        <div className="auth-brand">
          <span className="brand-mark" />
          <h1>School Tasks</h1>
        </div>
        <form onSubmit={handleSubmit} className="auth-card">
          <AuthModeToggle mode={mode} onChange={changeMode} />

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </label>

          <label className={`field${badPassword ? ' is-invalid' : ''}`}>
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={badPassword || undefined}
              className="input"
            />
            {isSignup && (
              <small className="field-hint">At least 6 characters</small>
            )}
          </label>

          {error && <AuthMessage kind="error">{error}</AuthMessage>}
          {info && <AuthMessage kind="info">{info}</AuthMessage>}

          <button type="submit" disabled={loading} className="btn btn-primary">
            {isSignup
              ? loading ? 'Creating account…' : 'Create account'
              : loading ? 'Signing in…' : 'Sign in'}
          </button>

          {passkeysSupported && !isSignup && (
            <>
              <div className="or">or</div>
              <button
                type="button"
                onClick={handlePasskey}
                disabled={loading}
                className="btn btn-secondary"
              >
                <Icon name="key" />
                Sign in with a passkey
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
