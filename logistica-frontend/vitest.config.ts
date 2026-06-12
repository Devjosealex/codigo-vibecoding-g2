import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    exclude: ['**/node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: [
        'lib/auth.ts',
        'lib/api-client.ts',
        'lib/customers.api.ts',
        'lib/suppliers.api.ts',
        'lib/warehouses.api.ts',
        'lib/products.api.ts',
        'lib/drivers.api.ts',
        'lib/vehicles.api.ts',
        'lib/routes.api.ts',
        'lib/shipments.api.ts',
        'hooks/use-customers.ts',
        'hooks/use-suppliers.ts',
        'hooks/use-warehouses.ts',
        'hooks/use-products.ts',
        'hooks/use-drivers.ts',
        'hooks/use-vehicles.ts',
        'hooks/use-routes.ts',
        'hooks/use-shipments.ts',
        'schemas/**',
      ],
      all: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
