import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// base 使用相对路径，便于部署到任意子目录（含静态托管 / 本地静态服务器）
export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: false
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 底图 GeoJSON 体积较大，单独分包后体积告警阈值适当放宽
    chunkSizeWarningLimit: 2000
  }
})
