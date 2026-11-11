import Icon from './Icon.jsx'
import { stopDrag } from './stopDrag.js'

// The card's complete toggle: a real <input type="checkbox"> (keyboard and
// screen-reader native) stretched invisibly over the drawn box. Pointer-down
// (and touch-start) is stopped so the card's drag listeners don't hijack it.
export default function CardCheckbox({ checked, onChange }) {
  return (
    <span className={`check ${checked ? 'is-on' : ''}`}>
      <input
        type="checkbox"
        className="check-input"
        checked={checked}
        onChange={onChange}
        {...stopDrag}
        aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
      />
      <Icon name="check" />
    </span>
  )
}
