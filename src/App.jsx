import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth.jsx'
import LoginPage from './pages/LoginPage.jsx'
import BoardPage from './pages/BoardPage.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-500">
      Loading…
    </div>
  )
}

// Unauthenticated visitors are bounced to /login.
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Already signed in? Skip /login and go to the board.
function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to="/board" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <InstallPrompt />
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <LoginPage />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/board"
          element={
            <RequireAuth>
              <BoardPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
