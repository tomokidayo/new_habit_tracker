import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { PASSWORD_MIN_LENGTH } from '../constants'

export default function LoginPage() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      const token = res.headers['authorization']?.replace('Bearer ', '')
      if (!token) throw new Error('token missing')
      setAuth(token, res.data.user)
      navigate('/')
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">ログイン</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={PASSWORD_MIN_LENGTH}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="8文字以上"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          アカウントをお持ちでない方は{' '}
          <Link to="/signup" className="text-indigo-500 font-medium">新規登録</Link>
        </p>
      </div>
    </div>
  )
}
