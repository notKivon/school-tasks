import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { useToast } from '../lib/toast.jsx'
import { sortCards } from '../lib/sorting.js'
import {
  getColumnDueDate,
  getTodayHKT,
  msUntilNextHKTMidnight,
} from '../lib/dates.js'

// Columns 2/3/4 are auto-dated: a card there has no custom due_date and adopts
// the column's calculated date. Columns 1/5 keep the card's own due_date.
const AUTO_DATE_COLUMNS = new Set([2, 3, 4])

// Cards still being inserted carry a "temp-" id (not a real uuid). Any DB write
// keyed on one would 400, so card actions skip the server round-trip for them.
const isTempId = (id) => String(id).startsWith('temp-')

// Fetch the 5 fixed columns + the current user's cards, group by column_id and
// sort per the domain rules. Owns the flat card list so card actions can update
// it optimistically. Realtime is layered on in a later step.
export function useBoard() {
  const { user } = useAuth()
  const toast = useToast()
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Bumped at each HKT midnight so the board re-derives column dates + re-sorts.
  const [today, setToday] = useState(getTodayHKT())

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

  // Realtime: keep the flat card list in sync with the server. The board memo
  // re-sorts affected columns automatically whenever this list changes, so the
  // handler only has to add/replace/remove by id. Filtered to the current user;
  // INSERT dedupes by id so our own optimistic rows don't double up when the
  // self-echo arrives, and DELETE makes the 02:15 cron dismissal appear live.
  useEffect(() => {
    const channel = supabase
      .channel('cards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCards((prev) => {
            if (payload.eventType === 'INSERT') {
              return prev.some((c) => c.id === payload.new.id)
                ? prev
                : [...prev, payload.new]
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((c) =>
                c.id === payload.new.id ? payload.new : c,
              )
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((c) => c.id !== payload.old.id)
            }
            return prev
          })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  // Roll the board over at HKT midnight without a refresh: schedule a timer to
  // the next midnight, bump `today` (which the board memo + overdue badges
  // depend on), then reschedule. setState lives in the timeout callback (not the
  // effect body), so the set-state-in-effect rule doesn't fire.
  useEffect(() => {
    let timer
    function schedule() {
      timer = setTimeout(() => {
        setToday(getTodayHKT())
        schedule()
      }, msUntilNextHKTMidnight() + 1000)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])

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
        dueDate: getColumnDueDate(col.id, today),
        cards: sortCards(
          cards.filter((c) => c.column_id === col.id),
          col.id,
        ),
      })),
    // `today` feeds getColumnDueDate, so the board recomputes (re-dates +
    // re-sorts) when the day rolls over at HKT midnight.
    [columns, cards, today],
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
        toast.error("Couldn't add task — try again")
        return { error: insertError }
      }
      // Drop the temp row and any Realtime echo of the real row, then add the
      // canonical row once — so a fast self-echo can't leave a duplicate.
      setCards((prev) => [
        ...prev.filter((c) => c.id !== tempId && c.id !== data.id),
        data,
      ])
      toast.success('Task added')
      return { data }
    },
    [user.id, toast],
  )

  // Optimistic field update (title, due_date, …). Merges the patch into the flat
  // list immediately, re-sort is automatic via the memo. On failure it reverts
  // only this card (by id) to its prior value — not a full-list snapshot, which
  // could clobber a concurrent insert-swap or realtime change and duplicate rows.
  const updateCard = useCallback(
    async (cardId, patch, opts = {}) => {
      const prevCard = cards.find((c) => c.id === cardId)
      if (!prevCard) return { skipped: true }
      // Apply optimistically even for an in-flight (temp) card, but don't write
      // a temp id to the DB — that row doesn't exist server-side yet.
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
      )
      if (isTempId(cardId)) return { skipped: true }
      const { error: updateError } = await supabase
        .from('cards')
        .update(patch)
        .eq('id', cardId)
      if (updateError) {
        setCards((prev) => prev.map((c) => (c.id === cardId ? prevCard : c)))
        toast.error(opts.errorMessage || 'Sync failed — change reverted')
        return { error: updateError }
      }
      if (opts.successMessage) toast.success(opts.successMessage)
      return { ok: true }
    },
    [cards, toast],
  )

  // Optimistic delete (the per-card trash). Removes the row immediately; on
  // failure it re-adds the card and toasts. Skips the DB call for temp ids.
  const deleteCard = useCallback(
    async (cardId) => {
      const prevCard = cards.find((c) => c.id === cardId)
      if (!prevCard) return { skipped: true }
      setCards((prev) => prev.filter((c) => c.id !== cardId))
      if (isTempId(cardId)) return { skipped: true }
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)
      if (deleteError) {
        setCards((prev) =>
          prev.some((c) => c.id === cardId) ? prev : [...prev, prevCard],
        )
        toast.error("Couldn't delete task — restored")
        return { error: deleteError }
      }
      toast.success('Task deleted')
      return { ok: true }
    },
    [cards, toast],
  )

  // Optimistic move between columns. Dropping on an auto-date column clears the
  // custom due_date; custom-date columns keep it. Re-sort is automatic via the
  // memo. Rolls back the row on failure.
  const moveCard = useCallback(
    async (cardId, toColumnId) => {
      const card = cards.find((c) => c.id === cardId)
      if (!card || card.column_id === toColumnId) return { skipped: true }
      const due_date = AUTO_DATE_COLUMNS.has(toColumnId) ? null : card.due_date
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, column_id: toColumnId, due_date } : c,
        ),
      )
      if (isTempId(cardId)) return { skipped: true }
      const { error: updateError } = await supabase
        .from('cards')
        .update({ column_id: toColumnId, due_date })
        .eq('id', cardId)
      if (updateError) {
        // Revert only this card (see updateCard) so a concurrent change isn't lost.
        setCards((prev) => prev.map((c) => (c.id === cardId ? card : c)))
        toast.error("Couldn't move card — reverted")
        return { error: updateError }
      }
      return { ok: true }
    },
    [cards, toast],
  )

  return {
    board,
    today,
    loading,
    error,
    refetch,
    addCard,
    updateCard,
    moveCard,
    deleteCard,
  }
}
