import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { authApiPlugin } from './server/vitePlugin'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    authApiPlugin(),
  ],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-react'
            }
            if (id.includes('motion')) {
              return 'vendor-motion'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('leaflet')) {
              return 'vendor-leaflet'
            }
            return 'vendor-libs'
          }
        },
      },
    },
  },
})