import { defineConfig } from 'vitest/config'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Only include test files from tests directory
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    // Only treat shared utilities as source (prevents scanning server code)
    includeSource: ['src/shared/**/*.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/src/app/**', // Exclude all Next.js app directory files (routes, layouts, etc.)
      '**/prisma/**',
      '**/public/**',
    ],
  },
  plugins: [
    // Enable TypeScript path mapping resolution in Vitest
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
  ],
  resolve: {
    alias: {
      // Explicit alias for shared utilities (wins over barrels)
      '@shared': path.resolve(__dirname, 'src/shared'),
      // Keep the main @ alias but prefer @shared in tests
      '@': path.resolve(__dirname, './src'),
      // Force Next.js modules to stubs (guard-rail against accidental imports)
      'next/server': path.resolve(__dirname, './tests/__mocks__/next-server.ts'),
      'next-auth': path.resolve(__dirname, './tests/__mocks__/next-auth.ts'),
      'next/headers': path.resolve(__dirname, './tests/__mocks__/next-headers.ts'),
    },
  },
})
