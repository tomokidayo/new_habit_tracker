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

export const updatePassword = (currentPassword: string, password: string, passwordConfirmation: string) =>
  client.patch<{ message: string }>('/api/v1/users/password', {
    user: { current_password: currentPassword, password, password_confirmation: passwordConfirmation }
  })

export const requestPasswordReset = (email: string) =>
  client.post<{ message: string }>('/auth/password', { user: { email } })

export const resetPassword = (token: string, password: string, passwordConfirmation: string) =>
  client.patch<{ message: string }>('/auth/password', {
    user: { reset_password_token: token, password, password_confirmation: passwordConfirmation }
  })
