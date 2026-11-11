import { useIsPhone } from '../hooks/useIsPhone.js'
import Icon from './Icon.jsx'

// Header tool button (Classes, Calendar): icon + label on desktop, a square
// icon button on phone. `open` drives the pressed look and aria-expanded.
export default function ToolButton({ ref, icon, label, open, controls, onClick }) {
  const isPhone = useIsPhone()
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      aria-label={isPhone ? label : undefined}
      className={`tool${isPhone ? ' is-icon' : ''}${open ? ' is-open' : ''}`}
    >
      <Icon name={icon} />
      {!isPhone && label}
    </button>
  )
}
