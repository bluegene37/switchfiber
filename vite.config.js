import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      vue(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('primevue') || id.includes('@primevue')) {
                return 'vendor-primevue'
              }
              if (id.includes('echarts') || id.includes('vue-echarts')) {
                return 'vendor-echarts'
              }
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('purify')) {
                return 'vendor-pdf'
              }
              if (id.includes('bootstrap')) {
                return 'vendor-bootstrap'
              }
              return 'vendor-core'
            }
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://103.249.198.43:8090',
          changeOrigin: true,
          secure: false // ignores self-signed cert in dev mode
        }
      }
    }
  }
})
