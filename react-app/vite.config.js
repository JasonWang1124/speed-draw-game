import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    port: 5173,
    host: true,
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/components/Setup.jsx',
        './src/components/QuestionPhase.jsx',
        './src/components/AnswerPhase.jsx',
      ],
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'framer-motion',
      'canvas-confetti',
    ],
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('canvas-confetti')) return 'confetti'
          if (id.includes('react-dom')) return 'react-dom'
          if (id.includes('react/') || id.endsWith('/react')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
