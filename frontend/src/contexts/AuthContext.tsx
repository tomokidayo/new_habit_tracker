import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { getMe } from '../api/auth'

type AuthContextValue = {
  user: User | null
  token: string | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (!stored) {
      setLoading(false)
      return
    }
    getMe()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const setAuth = (t: string, u: User) => {
    localStorage.setItem('token', t)
    setToken(t)
    setUser(u)
  }

  const clearAuth = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, setAuth, clearAuth, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
