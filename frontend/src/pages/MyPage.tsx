import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateMe, updatePassword, logout } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { USER_NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../constants'

export default function MyPage() {
  const { user, updateUser, clearAuth } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSubmitting(true)
    try {
      const res = await updateMe(name.trim(), email.trim())
      updateUser(res.data.user)
      setSuccess(true)
    } catch (err: unknown) {
      const messages = (err as { response?: { data?: { errors?: string[] } } }).response?.data?.errors
      setError(messages?.join(', ') ?? '更新に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードと確認用パスワードが一致しません')
      return
    }
    setPasswordSubmitting(true)
    try {
      await updatePassword(currentPassword, newPassword, confirmPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const messages = (err as { response?: { data?: { errors?: string[] } } }).response?.data?.errors
      setPasswordError(messages?.join(', ') ?? 'パスワードの変更に失敗しました')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  if (!user) return null

  const initials = user.name.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="戻る"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">マイページ</h1>
        </div>
      </header>

      <main className="px-4 py-8 max-w-lg mx-auto">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-500">
            {initials}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-indigo-500 bg-indigo-50 rounded-lg px-3 py-2">保存しました</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setSuccess(false) }}
              required
              maxLength={USER_NAME_MAX_LENGTH}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSuccess(false) }}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? '保存中...' : '保存する'}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4 mt-4">
          <h2 className="text-sm font-semibold text-gray-700">パスワード変更</h2>
          {passwordError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-indigo-500 bg-indigo-50 rounded-lg px-3 py-2">パスワードを変更しました</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordSuccess(false) }}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="現在のパスワード"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordSuccess(false) }}
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
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordSuccess(false) }}
              required
              minLength={PASSWORD_MIN_LENGTH}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="新しいパスワードを再入力"
            />
          </div>
          <button
            type="submit"
            disabled={passwordSubmitting}
            className="w-full bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {passwordSubmitting ? '変更中...' : 'パスワードを変更する'}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full mt-4 text-sm text-red-400 hover:text-red-500 py-3"
        >
          ログアウト
        </button>
      </main>
    </div>
  )
}
