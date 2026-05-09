import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import HomePage from './pages/HomePage'
import MyPage from './pages/MyPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中...</div>
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中...</div>
  return token ? <Navigate to="/" replace /> : <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
