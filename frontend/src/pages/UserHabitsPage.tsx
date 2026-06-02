import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { FollowedUserHabit, Checkin, Habit } from '../types'
import { getFollowedUserHabits } from '../api/follows'
import HabitCard from '../components/HabitCard'

export default function UserHabitsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [habits, setHabits] = useState<FollowedUserHabit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getFollowedUserHabits(Number(id))
      .then(res => {
        setUserName(res.data.user.name)
        setHabits(res.data.habits)
      })
      .catch(err => {
        if (err.response?.status === 403) {
          setError('この習慣を閲覧するにはフォロー承認が必要です')
        } else {
          setError('読み込みに失敗しました')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const toHabit = (h: FollowedUserHabit): Habit => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    position: 0,
    streak: h.streak,
    checked_today: h.checked_today,
  })

  const noop = () => {}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {userName ? `${userName}の習慣` : '習慣'}
          </h1>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center py-8">{error}</p>
        )}

        {!loading && !error && habits.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">習慣がまだありません</p>
        )}

        <ul className="space-y-3">
          {habits.map(h => (
            <li key={h.id}>
              <HabitCard
                habit={toHabit(h)}
                checkins={h.recent_checkins as Checkin[]}
                onCheckinChange={noop}
                onEdit={noop}
                readonly
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
