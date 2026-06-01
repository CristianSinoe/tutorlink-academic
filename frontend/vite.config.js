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
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true,
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "cypress/**",
        "dist/**",
        "node_modules/**",
        "src/test/**",
        "src/**/__tests__/**",
        "**/*.test.jsx",
        "**/*.spec.jsx",
        "vite.config.js",
        "eslint.config.js",
        "postcss.config.js",
        "tailwind.config.js",
      ],
    },
  },
})
