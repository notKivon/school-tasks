import { useAuth } from '../lib/auth.jsx'

// Sticky top bar: app name, the signed-in email, and Sign Out.
// (Calendar button + popover are added in a later step.)
export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur">
      <h1 className="text-sm font-semibold tracking-wide text-slate-100">
        School Tasks
      </h1>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-400 sm:inline">
          {user?.email}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
