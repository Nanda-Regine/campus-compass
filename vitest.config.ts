import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Test harness config. happy-dom gives us `window`/`localStorage` so the XP
// engine's localStorage-backed helpers run; the `@` alias mirrors tsconfig so
// imports resolve the same way they do in the app.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
})
