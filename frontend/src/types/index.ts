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

export type FollowStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

export type UserSearchResult = {
  id: number
  name: string
  follow_status: FollowStatus
}

export type FollowEntry = {
  id: number
  user: { id: number; name: string }
}

export type FollowsData = {
  following: FollowEntry[]
  followers: FollowEntry[]
  pending_sent: FollowEntry[]
  pending_received: FollowEntry[]
}

export type FollowedUserHabit = {
  id: number
  name: string
  emoji: string
  streak: number
  checked_today: boolean
  recent_checkins: Checkin[]
}
