import { useState } from 'react'
import type { Habit, Checkin } from '../types'
import { createCheckin, deleteCheckinToday } from '../api/habits'
import WeeklyGrid from './WeeklyGrid'

type Props = {
  habit: Habit
  checkins: Checkin[]
  onCheckinChange: (habitId: number, checked: boolean, newStreak: number, checkin?: Checkin) => void
}

export default function HabitCard({ habit, checkins, onCheckinChange }: Props) {
  const [submitting, setSubmitting] = useState(false)

  const handleToggle = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      if (habit.checked_today) {
        const res = await deleteCheckinToday(habit.id)
        onCheckinChange(habit.id, false, res.data.streak)
      } else {
        const res = await createCheckin(habit.id)
        onCheckinChange(habit.id, true, res.data.streak, res.data.checkin)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{habit.emoji}</span>
          <div>
            <p className="font-medium text-gray-900">{habit.name}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {habit.streak > 0 ? `🔥 ${habit.streak}日連続` : '今日からスタート'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={submitting}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all
            ${habit.checked_today
              ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
              : 'border-2 border-gray-200 text-gray-300 hover:border-indigo-300 hover:text-indigo-300'
            }
            disabled:opacity-50`}
        >
          ✓
        </button>
      </div>
      <WeeklyGrid checkins={checkins} />
    </div>
  )
}
