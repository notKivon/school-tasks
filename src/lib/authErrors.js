// Friendly copy for email + password auth errors (sign in / sign up).
// Matches Supabase's error `code` first, then falls back to the message text
// (older servers and network failures carry no code). `password: true` means
// the password field should be outlined as invalid.
const RULES = [
  {
    codes: ['invalid_credentials'],
    text: /invalid login credentials/i,
    message: "That email and password don't match. Check both and try again.",
    password: true,
  },
  {
    codes: ['user_already_exists', 'email_exists'],
    text: /already (registered|exists)/i,
    message: 'An account with this email already exists. Use Sign in instead.',
  },
  {
    codes: ['email_not_confirmed'],
    text: /email not confirmed/i,
    message: 'Confirm your email first: open the link we sent you, then sign in.',
  },
  {
    codes: ['weak_password'],
    text: /password should|weak password|password is too/i,
    message:
      'That password is too weak. Use at least 6 characters, and avoid common passwords.',
    password: true,
  },
  {
    codes: [],
    text: /failed to fetch|network|load failed|fetch failed/i,
    message: "Couldn't reach the server. Check your connection and try again.",
    network: true,
  },
]

export function authErrorInfo(err) {
  const code = err?.code
  const text = err?.message || ''
  const rule =
    RULES.find((r) => code && r.codes.includes(code)) ??
    RULES.find((r) => r.text.test(text) || (r.network && err?.name === 'AuthRetryableFetchError'))
  if (rule) return { message: rule.message, password: !!rule.password }
  return { message: text || 'Something went wrong', password: false }
}
