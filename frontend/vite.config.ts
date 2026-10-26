import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '.jobinjames.in',
      '.localhost',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:18000',
        changeOrigin: false,
      },
    },
  },
  preview: {
    allowedHosts: [
      '.jobinjames.in',
      '.localhost',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:18000',
        changeOrigin: false,
      },
    },
  },
})

