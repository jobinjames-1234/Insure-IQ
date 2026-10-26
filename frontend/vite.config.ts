import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '.jobinjames.in',
    ],
  },
  preview: {
    allowedHosts: [
      '.jobinjames.in',
    ],
  },
})

