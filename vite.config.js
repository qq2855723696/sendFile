import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

const backendTarget = process.env.VITE_DEV_API_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/files': backendTarget,
      '/upload': backendTarget,
      '/upload-chunk': backendTarget,
      '/upload-status': backendTarget,
      '/upload-complete': backendTarget,
      '/begin-folder-batch': backendTarget,
      '/batch-download-zip': backendTarget,
      '/download-folder-zip': backendTarget,
      '/delete-file': backendTarget,
      '/rename-file': backendTarget,
      '/preview': backendTarget,
      '/qrcode': backendTarget,
      '/favicon.ico': backendTarget
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue'],
          'element-plus': ['element-plus'],
          axios: ['axios']
        }
      }
    }
  }
})
