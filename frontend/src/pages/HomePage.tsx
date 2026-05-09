import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Habit, Checkin } from '../types'
import { getHabits, getCheckins, createHabit, updateHabit, deleteHabit } from '../api/habits'
import { logout } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { toJSTDateString } from '../utils/date'
import HabitCard from '../components/HabitCard'
import HabitFormModal from '../components/HabitFormModal'

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; habit: Habit }
  | null

export default function HomePage() {
  const { clearAuth } = useAuth()
  const navigate = useNavigate()
  const [habits, setHabits] = useState<Habit[]>([])
  const [checkinMap, setCheckinMap] = useState<Record<number, Checkin[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getHabits()
        const habits = res.data.habits
        setHabits(habits)
        const results = await Promise.all(habits.map((h) => getCheckins(h.id)))
        const map: Record<number, Checkin[]> = {}
        habits.forEach((h, i) => { map[h.id] = results[i].data.checkins })
        setCheckinMap(map)
      } catch {
        setError('データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCheckinChange = (
    habitId: number,
    checked: boolean,
    newStreak: number,
    newCheckin?: Checkin,
  ) => {
    setHabits((prev) =>
      prev.map((h) => h.id === habitId ? { ...h, checked_today: checked, streak: newStreak } : h)
    )
    setCheckinMap((prev) => {
      const current = prev[habitId] ?? []
      if (checked && newCheckin) {
        return { ...prev, [habitId]: [...current, newCheckin] }
      } else {
        const today = toJSTDateString()
        return { ...prev, [habitId]: current.filter((c) => c.checked_on !== today) }
      }
    })
  }

  const handleCreate = async (name: string, emoji: string) => {
    const res = await createHabit(name, emoji)
    const newHabit = res.data.habit
    setHabits((prev) => [...prev, newHabit])
    setCheckinMap((prev) => ({ ...prev, [newHabit.id]: [] }))
  }

  const handleUpdate = async (name: string, emoji: string) => {
    if (modal?.mode !== 'edit') return
    const res = await updateHabit(modal.habit.id, name, emoji)
    const updated = res.data.habit
    setHabits((prev) => prev.map((h) => h.id === updated.id ? { ...h, ...updated } : h))
  }

  const handleDelete = async () => {
    if (modal?.mode !== 'edit') return
    await deleteHabit(modal.habit.id)
    const id = modal.habit.id
    setHabits((prev) => prev.filter((h) => h.id !== id))
    setCheckinMap((prev) => { const next = { ...prev }; delete next[id]; return next })
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-gray-900">今日の習慣</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal({ mode: 'create' })}
              className="w-9 h-9 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xl hover:bg-indigo-600 transition-colors"
              aria-label="習慣を追加"
            >
              +
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-16 text-gray-400">読み込み中...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : habits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🌱</p>
            <p className="text-gray-500 font-medium">習慣がまだありません</p>
            <p className="text-sm text-gray-400 mt-1">＋ボタンから習慣を追加しましょう</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                checkins={checkinMap[habit.id] ?? []}
                onCheckinChange={handleCheckinChange}
                onEdit={(h) => setModal({ mode: 'edit', habit: h })}
              />
            ))}
          </div>
        )}
      </main>

      <HabitFormModal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        onSubmit={modal?.mode === 'edit' ? handleUpdate : handleCreate}
        onDelete={modal?.mode === 'edit' ? handleDelete : undefined}
        initialName={modal?.mode === 'edit' ? modal.habit.name : ''}
        initialEmoji={modal?.mode === 'edit' ? modal.habit.emoji : ''}
        title={modal?.mode === 'edit' ? '習慣を編集' : '習慣を追加'}
      />
    </div>
  )
}
