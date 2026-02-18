import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/bmtc': {
        target: 'https://bmtcmobileapi.karnataka.gov.in',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/bmtc/, '/WebAPI'),
      },
    },
  },
})
