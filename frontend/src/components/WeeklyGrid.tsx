import type { Checkin } from '../types'
import { toJSTDateString, jstWeekDays } from '../utils/date'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

type Props = {
  checkins: Checkin[]
}

export default function WeeklyGrid({ checkins }: Props) {
  const today = toJSTDateString()
  const checkedDates = new Set(checkins.map((c) => c.checked_on))
  const days = jstWeekDays()

  return (
    <div className="flex gap-1 mt-3">
      {days.map((day) => {
        const dateStr = toJSTDateString(day)
        const checked = checkedDates.has(dateStr)
        const isToday = dateStr === today

        return (
          <div key={dateStr} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                ${checked ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-300'}
                ${isToday ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}
              `}
            >
              {checked ? '✓' : ''}
            </div>
            <span className={`text-[10px] ${isToday ? 'text-indigo-500 font-semibold' : 'text-gray-400'}`}>
              {DAY_LABELS[day.getDay()]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
