import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/actuator': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
})
