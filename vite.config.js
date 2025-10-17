import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/api/postcode': {
        target: 'https://api.postcode.tech',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/postcode/, '')
      }
    }
  }
})


