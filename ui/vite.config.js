import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/ocrux': {
        target: process.env.OPENCR_BACKEND || 'https://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  base: '/crux/',
  build: {
    outDir: '../server/gui',
    emptyOutDir: true
  }
})
