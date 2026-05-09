import { useEffect, useState } from 'react'
import type { Habit, Checkin } from '../types'
import { getHabits, getCheckins } from '../api/habits'
import { toJSTDateString } from '../utils/date'
import HabitCard from '../components/HabitCard'

export default function HomePage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [checkinMap, setCheckinMap] = useState<Record<number, Checkin[]>>({})
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">今日の習慣</h1>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-16 text-gray-400">読み込み中...</div>
        ) : habits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🌱</p>
            <p className="text-gray-500 font-medium">習慣がまだありません</p>
            <p className="text-sm text-gray-400 mt-1">習慣を追加して始めましょう</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                checkins={checkinMap[habit.id] ?? []}
                onCheckinChange={handleCheckinChange}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
