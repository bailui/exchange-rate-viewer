import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/rates': {
        target: 'https://api.exchangerate.fun',
        changeOrigin: true,
        rewrite: () => '/latest?base=CNY',
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
  },
})
