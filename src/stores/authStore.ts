import { create } from 'zustand'

export interface User {
  id: string
  username: string
  email: string
  is_active: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: (user, token) => {
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user) => {
    set({ user })
  },

  setToken: (token) => {
    set({ token, isAuthenticated: !!token })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },
}))
