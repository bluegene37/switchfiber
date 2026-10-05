import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    base: env.VITE_BASE_PATH || '/switchfiberadmin/',
    plugins: [
      vue(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    // Strip development chatter from production bundles. console.error and
    // console.warn are kept so real failures still surface in the field.
    esbuild: {
      pure: mode === 'production' ? ['console.log', 'console.debug', 'console.info'] : []
    },
    build: {
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
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
        // Trailing slash on purpose: vite matches proxy keys by prefix, so a
        // bare '/api' also swallowed the app's own /api-management/* and
        // /api-services routes, and a direct load or refresh of those pages
        // was forwarded to the backend and answered 404 with a blank screen.
        /*
        '/api/': {
          target: env.VITE_API_URL || 'https://103.249.198.50:8090',
          changeOrigin: true,
          secure: false // ignores self-signed cert in dev mode
        },
        // Lets the Models page pull the live OpenAPI document same-origin.
        // The trailing slash matters: vite matches proxy keys by prefix, so a
        // bare '/openapi' would also swallow the bundled /openapi.json asset.
        '/openapi/': {
          target: env.VITE_API_URL || 'https://103.249.198.50:8090',
          changeOrigin: true,
          secure: false // ignores self-signed cert in dev mode
        }
        */
        // Gene - Oct 5, 2026: Updated dev proxy targets to use the production domain https://admin.switchfiber.ph with valid CA SSL
        '/api/': {
          target: env.VITE_API_URL || 'https://admin.switchfiber.ph',
          changeOrigin: true,
          secure: true
        },
        '/openapi/': {
          target: env.VITE_API_URL || 'https://admin.switchfiber.ph',
          changeOrigin: true,
          secure: true
        }
      }
    }
  }
})
