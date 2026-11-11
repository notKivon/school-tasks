import { ICONS } from '../lib/icons.js'

// Shared stroke icon from the design template's sprite.
//   <Icon name="trash" className="size-4 text-text-3" />
// Renders svg.i (16px, 1.8 stroke, currentColor); size/stroke via className.
// Decorative by default (aria-hidden); pass `title` to make it a labelled image.
// Names: plus trash check cal x tag key out clock wifi-off chev-down
// chev-right alert mail info copy arrow down move (see src/lib/icons.js).
export default function Icon({ name, className = '', title, ...rest }) {
  const shapes = ICONS[name]
  if (!shapes) return null
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `i ${className}` : 'i'}
      focusable="false"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      {...rest}
    >
      {title && <title>{title}</title>}
      {shapes.map(([Tag, attrs], i) => (
        <Tag key={i} {...attrs} />
      ))}
    </svg>
  )
}
