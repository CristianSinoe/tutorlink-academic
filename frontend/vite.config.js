import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",   // permite acceder desde la red local
    port: 5173,        // puerto fijo
    strictPort: true,  // si está ocupado, marca error en vez de cambiarlo
    cors: true         // habilita CORS por si haces llamadas desde móviles
  }
})
