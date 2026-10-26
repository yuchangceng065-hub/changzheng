import { defineConfig } from 'vite'
import { createHash } from 'node:crypto'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// base 使用相对路径，便于部署到任意子目录（含静态托管 / 本地静态服务器）
export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss(), {
    name: 'local-project',
    configureServer(server) {
      const id = createHash('sha256').update(realpathSync(fileURLToPath(new URL('.', import.meta.url)))).digest('hex').slice(0, 16)
      server.middlewares.use('/__local_project', (_request, response) => {
        response.setHeader('Content-Type', 'text/plain')
        response.end(id)
      })
    }
  }],
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: false,
    strictPort: true
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 2000
  }
})
