import Header from '../components/Header.jsx'
import Column from '../components/Column.jsx'
import { useBoard } from '../hooks/useBoard.js'

// The 5-column board: horizontal-scrolling layout, loading + error states.
// Drag & drop is added in the next step.
export default function BoardPage() {
  const { board, loading, error, addCard } = useBoard()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Loading board…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-red-400">
            {error}
          </div>
        ) : (
          <div className="flex h-full gap-4 overflow-x-auto p-4">
            {board.map((column) => (
              <Column key={column.id} column={column} onAddCard={addCard} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
