import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await requestPasswordReset(email.trim())
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">パスワードをお忘れの方</h1>

        {submitted ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-4">
            <p className="text-sm text-gray-600">
              登録済みのメールアドレスの場合、再設定用リンクを送信しました。
            </p>
            <Link to="/login" className="block text-sm text-indigo-500 font-medium">
              ログインに戻る
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <p className="text-sm text-gray-500">
              登録済みのメールアドレスを入力してください。再設定用のリンクをお送りします。
            </p>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '送信中...' : '再設定メールを送信'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/login" className="text-indigo-500 font-medium">ログインに戻る</Link>
        </p>
      </div>
    </div>
  )
}
