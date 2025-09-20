import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://live-polling-system-okl9.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/socket.io': {
        target: 'https://live-polling-system-okl9.onrender.com',
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
})
