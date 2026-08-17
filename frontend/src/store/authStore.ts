import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: string
  tenant_id: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken: string) => void
  setToken: (token: string, refreshToken?: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken, isAuthenticated: true }),
      
      setToken: (token, refreshToken) => set((state) => ({ 
        token, 
        refreshToken: refreshToken || state.refreshToken 
      })),
      
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
    }),
    {
      name: 'insure-iq-auth', // localStorage key
    }
  )
)
