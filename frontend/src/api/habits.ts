import client from './client'
import type { Habit, Checkin } from '../types'

export const getHabits = () =>
  client.get<{ habits: Habit[] }>('/api/v1/habits')

export const createHabit = (name: string, emoji: string) =>
  client.post<{ habit: Habit }>('/api/v1/habits', { habit: { name, emoji } })

export const updateHabit = (id: number, name: string, emoji: string) =>
  client.patch<{ habit: Habit }>(`/api/v1/habits/${id}`, { habit: { name, emoji } })

export const deleteHabit = (id: number) =>
  client.delete(`/api/v1/habits/${id}`)

export const getCheckins = (habitId: number) =>
  client.get<{ checkins: Checkin[] }>(`/api/v1/habits/${habitId}/checkins`)

export const createCheckin = (habitId: number) =>
  client.post<{ checkin: Checkin; streak: number }>(`/api/v1/habits/${habitId}/checkins`)

export const deleteCheckinToday = (habitId: number) =>
  client.delete<{ streak: number }>(`/api/v1/habits/${habitId}/checkins/today`)
