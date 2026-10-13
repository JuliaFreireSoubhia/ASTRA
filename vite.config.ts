import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // host: true permite abrir no celular pela rede local (http://IP:5173) durante o dev
  server: { host: true },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Separa o three/R3F do código da aplicação: cache melhor e primeira pintura mais rápida
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
        },
      },
    },
  },
})
