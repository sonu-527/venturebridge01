import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.VITE_BACKEND_PORT || env.BACKEND_PORT || process.env.VITE_BACKEND_PORT || process.env.BACKEND_PORT || '8000'
  const backendTarget = env.VITE_BACKEND_URL || env.BACKEND_URL || process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || `http://127.0.0.1:${backendPort}`

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        }
      }
    }
  }
})
