import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { PASSWORD_MIN_LENGTH } from '../constants'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('reset_password_token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 text-center space-y-4">
          <p className="text-sm text-red-500">無効なリンクです。再設定メールを再送してください。</p>
          <Link to="/forgot-password" className="block text-sm text-indigo-500 font-medium">
            再設定メールを送る
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('パスワードと確認用パスワードが一致しません')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password, confirmPassword)
      navigate('/login', { state: { notice: 'パスワードを再設定しました。ログインしてください。' } })
    } catch (err: unknown) {
      const messages = (err as { response?: { data?: { errors?: string[] } } }).response?.data?.errors
      setError(messages?.join(', ') ?? 'パスワードの再設定に失敗しました。リンクが期限切れの可能性があります。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">パスワード再設定</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">確認用パスワード</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={PASSWORD_MIN_LENGTH}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="新しいパスワードを再入力"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '再設定中...' : 'パスワードを再設定する'}
          </button>
        </form>
      </div>
    </div>
  )
}
