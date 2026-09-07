import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

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
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken, isAuthenticated: true }),
      
      setToken: (token, refreshToken) => set((state) => ({ 
        token, 
        refreshToken: refreshToken || state.refreshToken 
      })),
      
      logout: async () => {
        const { refreshToken } = get();
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        if (refreshToken) {
          try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:18000';
            await axios.post(`${baseURL}/api/v1/auth/logout`, {
              refresh_token: refreshToken
            });
          } catch (error) {
            console.error('Logout API failed', error);
          }
        }
      }
    }),
    {
      name: 'insure-iq-auth', // localStorage key
    }
  )
)
