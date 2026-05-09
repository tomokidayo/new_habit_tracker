export type User = {
  id: number
  name: string
  email: string
}

export type Habit = {
  id: number
  name: string
  emoji: string
  position: number
  streak: number
  checked_today: boolean
}

export type Checkin = {
  id: number
  habit_id: number
  checked_on: string
}
