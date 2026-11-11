// Loading and error states for the board area.

// The five fixed columns (CLAUDE.md), so the skeleton can show real titles
// before the columns table has loaded. Card heights mirror the template:
// custom-date columns get taller cards (they carry a date badge).
const SKELETON = [
  { id: 1, name: 'Upcoming Tests', cards: ['tall', '', 'tall'] },
  { id: 2, name: 'Today / Due', date: 76, cards: ['', '', '', ''] },
  { id: 3, name: 'Next School Day', date: 70, cards: ['', ''] },
  { id: 4, name: 'Subsequent School Day', date: 64, cards: [''] },
  { id: 5, name: 'Later', cards: ['tall', 'tall'] },
]

// Skeleton board: the five-column shape with real column titles; only cards
// and dates shimmer (the shimmer stops under reduced motion).
export function BoardSkeleton() {
  return (
    <div className="board" aria-busy="true" aria-label="Loading board">
      {SKELETON.map((col) => (
        <section
          key={col.id}
          className={`col ${col.id === 2 ? 'col--today' : ''}`}
        >
          {col.id === 2 && <span className="ribbon" aria-hidden="true" />}
          <header className="col-head">
            <div>
              <h2 className="col-title">{col.name}</h2>
              {col.date && (
                <div className="sk sk-line mt-2" style={{ width: col.date }} />
              )}
            </div>
          </header>
          <div className="flex flex-col gap-2">
            {col.cards.map((size, i) => (
              <div key={i} className={`sk sk-card ${size}`} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// Load failure, in the empty-state style, with a retry.
export function BoardError({ message, retrying, onRetry }) {
  return (
    <div className="board-error" role="alert">
      <div className="empty">
        <div>
          <p className="font-display text-lg text-text-1">Couldn't load your board</p>
          <p>Check your connection, then try again.</p>
          {message && <p className="mt-2">{message}</p>}
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="btn btn-secondary mt-4"
          >
            {retrying ? 'Trying again…' : 'Try again'}
          </button>
        </div>
      </div>
    </div>
  )
}
