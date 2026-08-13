import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@landmap/scraper': resolve(__dirname, './packages/scraper/src'),
      '@landmap/api': resolve(__dirname, './packages/api/src'),
      '@landmap/llm': resolve(__dirname, './packages/llm/src'),
      '@landmap/db': resolve(__dirname, './packages/db/src'),
      '@landmap/config': resolve(__dirname, './packages/config/src'),
      '@landmap/sales': resolve(__dirname, './packages/sales/src'),
      '@landmap/billing': resolve(__dirname, './packages/billing/src'),
      '@landmap/geo': resolve(__dirname, './packages/geo/src'),
      '@landmap/integrations': resolve(__dirname, './packages/integrations/src'),
      '@landmap/invest': resolve(__dirname, './packages/invest/src'),
      '@landmap/gamification': resolve(__dirname, './packages/gamification/src'),
      '@landmap/automation': resolve(__dirname, './packages/automation/src'),
    }
  },
  esbuild: {
    // Match Next.js automatic JSX runtime so app components (which do not
    // import React) compile correctly under vitest/esbuild.
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})

