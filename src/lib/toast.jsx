/* eslint-disable react-refresh/only-export-components -- ToastProvider + useToast
   are intentionally co-located in this module (same pattern as auth.jsx). */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

let nextId = 0

const STYLES = {
  success: 'border-emerald-700 bg-emerald-950/90 text-emerald-100',
  error: 'border-red-700 bg-red-950/90 text-red-100',
  info: 'border-slate-600 bg-slate-800/95 text-slate-100',
}

// Minimal toast system (no library): a bottom-right stack of auto-dismissing
// messages. `useToast()` returns { success, error, info }, each auto-dismissing
// after 3s. Used for card saved/deleted, date set, ICS link copied, sync errors.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (type, message) => {
      const id = ++nextId
      setToasts((list) => [...list, { id, type, message }])
      setTimeout(() => dismiss(id), 3000)
    },
    [dismiss],
  )

  const toast = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto max-w-xs rounded-lg border px-3 py-2 text-left text-sm shadow-xl ${STYLES[t.type]}`}
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
