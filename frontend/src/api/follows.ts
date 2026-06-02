import client from './client'
import type { UserSearchResult, FollowsData, FollowedUserHabit } from '../types'

export const searchUsers = (name: string) =>
  client.get<{ users: UserSearchResult[] }>('/api/v1/users/search', { params: { name } })

export const getFollows = () =>
  client.get<FollowsData>('/api/v1/follows')

export const createFollow = (followeeId: number) =>
  client.post<{ follow: { id: number; status: string } }>('/api/v1/follows', { follow: { followee_id: followeeId } })

export const acceptFollow = (id: number) =>
  client.patch<{ follow: { id: number; status: string } }>(`/api/v1/follows/${id}/accept`)

export const deleteFollow = (id: number) =>
  client.delete(`/api/v1/follows/${id}`)

export const getFollowedUserHabits = (userId: number) =>
  client.get<{ user: { id: number; name: string }; habits: FollowedUserHabit[] }>(`/api/v1/users/${userId}/habits`)
