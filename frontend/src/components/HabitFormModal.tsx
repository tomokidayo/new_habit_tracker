import { useEffect, useState } from 'react'

const PRESET_EMOJIS = [
  '🏃', '🚴', '🧘', '🏋️', '🤸', '🏊', '🚶', '⛹️',
  '📚', '✍️', '🎵', '🎨', '💻', '🗣️', '🧩', '📝',
  '🥗', '💊', '🍵', '🥤', '😴', '🛁', '🦷', '🧴',
  '🧹', '🐕', '💰', '🌱', '🙏', '❤️', '😊', '⭐',
]

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, emoji: string) => Promise<void>
  onDelete?: () => Promise<void>
  initialName?: string
  initialEmoji?: string
  title: string
}

export default function HabitFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialName = '',
  initialEmoji = '',
  title,
}: Props) {
  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initialEmoji)
  const [customEmoji, setCustomEmoji] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setEmoji(initialEmoji)
      setCustomEmoji(PRESET_EMOJIS.includes(initialEmoji) ? '' : initialEmoji)
      setError('')
      setConfirmDelete(false)
    }
  }, [isOpen, initialName, initialEmoji])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onSubmit(name.trim(), emoji.trim())
      onClose()
    } catch (err: unknown) {
      const messages = (err as { response?: { data?: { errors?: string[] } } }).response?.data?.errors
      setError(messages?.join(', ') ?? '保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
      onClose()
    } catch {
      setError('削除に失敗しました')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={submitting || deleting ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">絵文字</label>
            <div className="grid grid-cols-8 gap-1 mb-3">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setEmoji(e); setCustomEmoji('') }}
                  className={`text-xl py-1 rounded-lg transition-colors ${
                    emoji === e && customEmoji === ''
                      ? 'bg-indigo-100 ring-2 ring-indigo-400'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">その他</span>
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => {
                  const val = e.target.value
                  setCustomEmoji(val)
                  if (val.trim()) setEmoji(val.trim())
                }}
                maxLength={2}
                className={`w-16 border rounded-xl px-2 py-1.5 text-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${
                  customEmoji ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                }`}
                placeholder="✏️"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">習慣名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="例: ランニング"
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

        {onDelete && (
          <div className="mt-3">
            {confirmDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? '削除中...' : '削除する'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-red-400 text-sm py-2 hover:text-red-500"
              >
                この習慣を削除
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
