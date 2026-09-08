import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:18000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.startsWith('/api/v1')) {
      const path = config.url.startsWith('/') ? config.url : `/${config.url}`;
      config.url = `/api/v1${path}`;
    }

    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = useAuthStore.getState().refreshToken
      
      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken
        })
        
        const { access_token, refresh_token: new_refresh_token } = response.data
        useAuthStore.getState().setToken(access_token, new_refresh_token)
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)
