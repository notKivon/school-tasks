// Sign in / Sign up segmented toggle. Plain buttons with aria-pressed, so
// Tab + Enter/Space work without any custom key handling.
export default function AuthModeToggle({ mode, onChange }) {
  const options = [
    ['signin', 'Sign in'],
    ['signup', 'Sign up'],
  ]
  return (
    <div className="seg" role="group" aria-label="Account">
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          className={mode === value ? 'is-on' : ''}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
