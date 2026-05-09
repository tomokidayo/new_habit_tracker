import client from './client'
import type { User } from '../types'

export const signup = (name: string, email: string, password: string) =>
  client.post<{ user: User }>('/auth/signup', { user: { name, email, password } })

export const login = (email: string, password: string) =>
  client.post<{ user: User }>('/auth/login', { user: { email, password } })

export const logout = () =>
  client.delete('/auth/logout')

export const getMe = () =>
  client.get<{ user: User }>('/api/v1/users/me')

export const updateMe = (name: string, email: string) =>
  client.patch<{ user: User }>('/api/v1/users/me', { user: { name, email } })
