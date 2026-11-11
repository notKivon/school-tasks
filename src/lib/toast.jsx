/* eslint-disable react-refresh/only-export-components -- ToastProvider + useToast
   are intentionally co-located in this module (same pattern as auth.jsx). */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import Icon from '../components/Icon.jsx'

const ToastContext = createContext(null)

let nextId = 0

// Status glyph per toast type (styles: .toast in src/styles/auth.css).
const ICONS = { success: 'check', error: 'x', info: 'info' }

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
      <div className="toasts">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            onClick={() => dismiss(t.id)}
            className={`toast toast--${t.type}`}
          >
            <span className="toast-ico">
              <Icon name={ICONS[t.type]} />
            </span>
            <span>{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              className="toast-x"
              onClick={(e) => {
                e.stopPropagation()
                dismiss(t.id)
              }}
            >
              <Icon name="x" />
            </button>
          </div>
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
