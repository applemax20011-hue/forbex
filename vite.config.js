import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Эта настройка работает как vercel.json, но только для localhost
      '/cmc-api': {
        target: 'https://pro-api.coinmarketcap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cmc-api/, ''),
        headers: {
          // Иногда нужно явно передавать заголовок, но ваш App.jsx это уже делает
          'Connection': 'keep-alive'
        }
      }
    }
  }
})