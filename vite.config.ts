import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Ajusta el valor en kB
    chunkSizeWarningLimit: 1000
  }
})
