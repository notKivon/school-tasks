import { useEffect, useRef, useState } from 'react'
import { CLASSES, LABEL_ESCAPE } from '../lib/labels.js'

// "Classes" header popover: the full label reference — every class, its chip
// color, every spelling that triggers it, and the force-unlabel escape.
// Everything is derived from CLASSES/LABEL_ESCAPE, so this can never drift from
// what the matcher actually does. Unnamed placeholder slots are skipped (they
// match nothing by design). List order is the sort order used in columns 2/3/4.
const NAMED = CLASSES.filter((cls) => cls.name)

export default function ClassGuide() {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef(null)

  // Close on outside-click or Escape (same behaviour as the Calendar popover).
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800"
      >
        Classes
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 max-h-[70vh] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm shadow-xl">
          <p className="mb-1 font-medium text-slate-100">Class labels</p>
          <p className="mb-3 text-xs text-slate-400">
            A card is labelled when its title <em>starts</em> with one of these
            names — capitalisation doesn&apos;t matter. The matched name becomes
            the chip and is dropped from the card text, so{' '}
            <span className="text-slate-300">“Stats worksheet”</span> shows an{' '}
            <span className="text-slate-300">AP Statistics</span> chip and reads
            “worksheet”. Numbers are the sort order in Today / Next / Subsequent.
          </p>

          <ol className="space-y-2.5">
            {NAMED.map((cls, i) => (
              <li key={cls.name} className="flex items-start gap-2">
                <span className="w-4 shrink-0 pt-0.5 text-right text-xs tabular-nums text-slate-500">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: cls.color }}
                  >
                    {cls.name}
                  </span>
                  <p className="mt-0.5 text-xs break-words text-slate-400">
                    {cls.aliases.length ? (
                      <>
                        <span className="text-slate-500">also: </span>
                        {cls.aliases.join(', ')}
                      </>
                    ) : (
                      <span className="text-slate-500">
                        name only — no other spellings
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 border-t border-slate-800 pt-3">
            <p className="mb-1 font-medium text-slate-100">
              Force a card to stay unlabelled
            </p>
            <p className="text-xs text-slate-400">
              Start the title with a backslash. It&apos;s kept in the title (so
              you can see and remove it when editing) but never shown on the
              card, and the card sorts last in its column.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              <code className="rounded bg-slate-800 px-1 py-0.5 text-slate-200">
                {LABEL_ESCAPE}Calc trick
              </code>{' '}
              → reads “Calc trick”, no chip
            </p>
          </div>

          <p className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
            A title that doesn&apos;t start with any of these gets a plain gray
            border and sorts after every labelled card.
          </p>
        </div>
      )}
    </div>
  )
}
