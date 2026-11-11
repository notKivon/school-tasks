import Icon from './Icon.jsx'

// Error / info block on the sign in card.
export default function AuthMessage({ kind, children }) {
  const isError = kind === 'error'
  return (
    <div
      className={`msg ${isError ? 'msg-error' : 'msg-info'}`}
      role={isError ? 'alert' : 'status'}
    >
      <Icon name={isError ? 'alert' : 'mail'} />
      <span>{children}</span>
    </div>
  )
}
