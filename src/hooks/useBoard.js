import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { sortCards } from '../lib/sorting.js'
import { getColumnDueDate } from '../lib/dates.js'

// Columns 2/3/4 are auto-dated: a card there has no custom due_date and adopts
// the column's calculated date. Columns 1/5 keep the card's own due_date.
const AUTO_DATE_COLUMNS = new Set([2, 3, 4])

// Fetch the 5 fixed columns + the current user's cards, group by column_id and
// sort per the domain rules. Owns the flat card list so card actions can update
// it optimistically. Realtime is layered on in a later step.
export function useBoard() {
  const { user } = useAuth()
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pure fetch — no setState — so it can be shared by the mount effect and the
  // exported refetch without either owning the other's state updates.
  const loadData = useCallback(async () => {
    const [colRes, cardRes] = await Promise.all([
      supabase.from('columns').select('*').order('position'),
      supabase.from('cards').select('*').eq('user_id', user.id),
    ])
    if (colRes.error) throw colRes.error
    if (cardRes.error) throw cardRes.error
    return { columns: colRes.data, cards: cardRes.data }
  }, [user.id])

  // Initial load: an async function defined inside the effect with a
  // cancellation guard (the pattern the react-hooks rule expects), so all
  // setState happens after the await and is skipped if we unmount first.
  useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const data = await loadData()
        if (ignore) return
        setColumns(data.columns)
        setCards(data.cards)
        setError(null)
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load the board')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => {
      ignore = true
    }
  }, [loadData])

  // Background refetch for event-handler / Realtime callers (not effects), so
  // it doesn't flip back to a spinner.
  const refetch = useCallback(async () => {
    try {
      const data = await loadData()
      setColumns(data.columns)
      setCards(data.cards)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load the board')
    }
  }, [loadData])

  // Group + sort cards into their columns, attaching each column's calculated
  // due date. Recomputes whenever columns or the flat card list change.
  const board = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        dueDate: getColumnDueDate(col.id),
        cards: sortCards(
          cards.filter((c) => c.column_id === col.id),
          col.id,
        ),
      })),
    [columns, cards],
  )

  // Optimistic insert: show a temp card immediately, then swap in the real row
  // (or remove it on failure).
  const addCard = useCallback(
    async (columnId, title) => {
      const tempId = `temp-${crypto.randomUUID()}`
      const dueDate = AUTO_DATE_COLUMNS.has(columnId)
        ? null
        : getColumnDueDate(columnId)
      const optimistic = {
        id: tempId,
        user_id: user.id,
        column_id: columnId,
        title,
        description: null,
        due_date: dueDate,
        completed_at: null,
        position: null,
        created_at: new Date().toISOString(),
      }
      setCards((prev) => [...prev, optimistic])
      const { data, error: insertError } = await supabase
        .from('cards')
        .insert({ user_id: user.id, column_id: columnId, title, due_date: dueDate })
        .select()
        .single()
      if (insertError) {
        setCards((prev) => prev.filter((c) => c.id !== tempId))
        return { error: insertError }
      }
      setCards((prev) => prev.map((c) => (c.id === tempId ? data : c)))
      return { data }
    },
    [user.id],
  )

  // Optimistic move between columns. Dropping on an auto-date column clears the
  // custom due_date; custom-date columns keep it. Re-sort is automatic via the
  // memo. Rolls back the row on failure.
  const moveCard = useCallback(
    async (cardId, toColumnId) => {
      const prevCards = cards
      const card = cards.find((c) => c.id === cardId)
      if (!card || card.column_id === toColumnId) return { skipped: true }
      const due_date = AUTO_DATE_COLUMNS.has(toColumnId) ? null : card.due_date
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, column_id: toColumnId, due_date } : c,
        ),
      )
      const { error: updateError } = await supabase
        .from('cards')
        .update({ column_id: toColumnId, due_date })
        .eq('id', cardId)
      if (updateError) {
        setCards(prevCards)
        return { error: updateError }
      }
      return { ok: true }
    },
    [cards],
  )

  return { board, loading, error, refetch, addCard, moveCard }
}
