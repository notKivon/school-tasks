import { useRef } from 'react'
import { CLASSES, LABEL_ESCAPE } from '../lib/labels.js'
import HeaderPopover from './HeaderPopover.jsx'
import ToolButton from './ToolButton.jsx'
import Icon from './Icon.jsx'

// "Classes" header popover: the full label reference — every class, its chip
// color, every spelling that triggers it, and the force-unlabel escape.
// Everything is derived from CLASSES/LABEL_ESCAPE, so this can never drift from
// what the matcher actually does. Unnamed placeholder slots are skipped (they
// match nothing by design). List order is the sort order used in columns 2/3/4.
const NAMED = CLASSES.filter((cls) => cls.name)
const EXAMPLE = CLASSES.find((cls) => cls.name === 'AP Statistics')

export default function ClassGuide({ open, onToggle, onClose }) {
  const triggerRef = useRef(null)

  return (
    <>
      <ToolButton
        ref={triggerRef}
        icon="tag"
        label="Classes"
        open={open}
        controls="hdr-classes"
        onClick={onToggle}
      />
      <HeaderPopover
        id="hdr-classes"
        open={open}
        onClose={onClose}
        triggerRef={triggerRef}
        label="Class labels"
        width={380}
        maxVh={70}
      >
        <h2 className="pop-title">Class labels</h2>
        <p className="pop-lede">
          Start a title with a class name and the card gets that class&apos;s chip
          and color. Capitals don&apos;t matter, and the class name is dropped from
          the card text.
        </p>
        {EXAMPLE && (
          <div className="example" style={{ '--c': EXAMPLE.color }}>
            <span className="typed">
              <em>Stats</em> worksheet 6.2
            </span>
            <Icon name="arrow" />
            <span className="result">
              <span className="chip">{EXAMPLE.name}</span>worksheet 6.2
            </span>
          </div>
        )}
        <p className="pop-p pop-quiet">
          Numbers are the order cards sort in Today / Due, Next School Day and
          Subsequent School Day.
        </p>

        <ol className="class-list">
          {NAMED.map((cls, i) => (
            <li key={cls.name}>
              <span className="n">{i + 1}</span>
              <div className="min-w-0">
                <span className="chip" style={{ '--c': cls.color }}>
                  {cls.name}
                </span>
                <p className="aka break-words">
                  {cls.aliases.length ? (
                    <>
                      <span>Also </span>
                      {cls.aliases.join(', ')}
                    </>
                  ) : (
                    <span>No short forms</span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="pop-rule" />
        <p className="pop-h">Keep a card unlabelled</p>
        <p className="pop-p">
          Start the title with a backslash: <code>{LABEL_ESCAPE}Calc trick</code>{' '}
          reads “Calc trick” with no chip. You&apos;ll see the backslash while
          editing, never on the card, and the card sorts last.
        </p>
        <div className="pop-rule" />
        <p className="pop-foot">
          <span className="swatch-bar" aria-hidden="true" />
          Titles that don&apos;t start with a class get a plain gray edge and sort
          after every labelled card.
        </p>
      </HeaderPopover>
    </>
  )
}
